import { db } from '@/lib/db/client';
import { logger } from '@/lib/observability/logger';
import { getPaymentProvider } from '@/lib/payments';
import { verifyPaymentForRide } from '@/server/services/payment-service';
import { error, ok, statusForCode } from '@/types/api';
import type { WebhookEvent } from '@/types/payment';
import { NextResponse } from 'next/server';

/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook receiver. Verifies the signature, looks up the matching
 * Payment row by providerOrderId, and transitions it to CAPTURED (or FAILED
 * for `payment_failed` events).
 *
 * Replay protection: the Payment row's `webhookEvents` JSON array stores
 * every received event id — duplicate events are no-ops.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const provider = getPaymentProvider('RAZORPAY');
  let event: WebhookEvent;
  try {
    event = await provider.handleWebhook(req);
  } catch (err) {
    logger.warn({ err }, 'Stripe webhook signature verification failed');
    const res = error('WEBHOOK_INVALID', err instanceof Error ? err.message : 'Invalid signature');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  if (!event.orderId && !event.paymentId) {
    return NextResponse.json(ok({ received: true, ignored: true }));
  }

  // Find the payment by provider order id (Stripe session id).
  const payment = await db.payment.findFirst({
    where: { providerOrderId: event.orderId ?? event.paymentId },
  });
  if (!payment) {
    logger.warn({ orderId: event.orderId }, 'Stripe webhook: no matching payment row');
    return NextResponse.json(ok({ received: true, ignored: true }));
  }

  // Replay protection — store the event id in webhookEvents.
  const eventId =
    (event.rawPayload as { id?: string })?.id ?? `${event.eventType}:${event.paymentId ?? ''}`;
  const seenEvents = (payment.webhookEvents as Array<{ id: string }>) ?? [];
  if (seenEvents.some((e) => e.id === eventId)) {
    logger.info({ eventId }, 'Stripe webhook: duplicate event, ignoring');
    return NextResponse.json(ok({ received: true, duplicate: true }));
  }
  await db.payment.update({
    where: { id: payment.id },
    data: {
      webhookEvents: [
        ...seenEvents,
        { id: eventId, type: event.eventType, at: new Date().toISOString() },
      ],
    },
  });

  // Transition the payment + ride based on the event type.
  if (
    event.eventType === 'checkout.session.completed' ||
    event.eventType === 'payment_intent.succeeded'
  ) {
    if (event.paymentId) {
      await verifyPaymentForRide({
        rideId: payment.rideId,
        provider: 'RAZORPAY',
        providerOrderId: payment.providerOrderId ?? event.orderId ?? '',
        providerPaymentId: event.paymentId,
      }).catch((err) => logger.error({ err, rideId: payment.rideId }, 'Webhook verify failed'));
    }
  }

  return NextResponse.json(ok({ received: true }));
}
