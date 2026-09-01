import { NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments';
import { verifyPaymentForRide } from '@/server/services/payment-service';
import { db } from '@/lib/db/client';
import { ok, error, statusForCode } from '@/types/api';
import { logger } from '@/lib/observability/logger';
import type { WebhookEvent } from '@/types/payment';

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay webhook receiver. Verifies the HMAC-SHA256 signature with
 * `RAZORPAY_WEBHOOK_SECRET`, then transitions the matching Payment row.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const provider = getPaymentProvider('RAZORPAY');
  let event: WebhookEvent;
  try {
    event = await provider.handleWebhook(req);
  } catch (err) {
    logger.warn({ err }, 'Razorpay webhook signature verification failed');
    const res = error('WEBHOOK_INVALID', err instanceof Error ? err.message : 'Invalid signature');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  if (!event.paymentId && !event.orderId) {
    return NextResponse.json(ok({ received: true, ignored: true }));
  }

  const payment = await db.payment.findFirst({
    where: { providerOrderId: event.orderId ?? event.paymentId },
  });
  if (!payment) {
    logger.warn({ orderId: event.orderId }, 'Razorpay webhook: no matching payment row');
    return NextResponse.json(ok({ received: true, ignored: true }));
  }

  const eventId = (event.rawPayload as { id?: string })?.id ?? event.eventType;
  const seenEvents = (payment.webhookEvents as Array<{ id: string }>) ?? [];
  if (seenEvents.some((e) => e.id === eventId)) {
    return NextResponse.json(ok({ received: true, duplicate: true }));
  }
  await db.payment.update({
    where: { id: payment.id },
    data: {
      webhookEvents: [...seenEvents, { id: eventId, type: event.eventType, at: new Date().toISOString() }],
    },
  });

  if (event.eventType === 'payment.captured' && event.paymentId) {
    await verifyPaymentForRide({
      rideId: payment.rideId,
      provider: 'RAZORPAY',
      providerOrderId: payment.providerOrderId ?? event.orderId ?? '',
      providerPaymentId: event.paymentId,
    }).catch((err) => logger.error({ err }, 'Razorpay webhook verify failed'));
  }

  return NextResponse.json(ok({ received: true }));
}
