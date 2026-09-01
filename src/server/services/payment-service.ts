import { db } from '@/lib/db/client';
import { getPaymentProvider } from '@/lib/payments';
import { transitionPayment, PaymentStateError } from '@/lib/payments/state-machine';
import { logger } from '@/lib/observability/logger';
import { emitToRide } from '@/lib/realtime/server';
import { RideEvents } from '@/lib/realtime/events';
import { sendRideReceiptEmail } from '@/lib/notifications/email';
import type { PaymentProvider, PaymentStatus } from '@/types/ride';

/**
 * PaymentService — orchestrates create-order, verify, and refund flows.
 *
 * It coordinates between the PaymentProvider abstraction (Razorpay/Mock)
 * and the Payment row in the DB. The state machine in
 * `lib/payments/state-machine.ts` guarantees no double-charges — the
 * `transitionPayment` call uses an optimistic-concurrency WHERE clause.
 */
export class PaymentNotFoundError extends Error {
  constructor(public rideId: string) {
    super(`No payment record for ride ${rideId}`);
    this.name = 'PaymentNotFoundError';
  }
}

export async function createOrderForRide(opts: {
  rideId: string;
  userId: string;
  provider: PaymentProvider;
  description: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{
  providerOrderId: string;
  checkoutUrl: string | null;
  clientSecret: string | null;
  amount: number;
  currency: string;
}> {
  const ride = await db.ride.findUnique({
    where: { id: opts.rideId },
    select: { id: true, fareAmount: true, currency: true, passengerId: true },
  });
  if (!ride) throw new Error(`Ride ${opts.rideId} not found`);
  if (ride.passengerId !== opts.userId) {
    throw new Error('User does not own this ride');
  }

  // Create or fetch existing Payment row (idempotent on rideId).
  const payment = await db.payment.upsert({
    where: { rideId: opts.rideId },
    create: {
      rideId: opts.rideId,
      userId: opts.userId,
      provider: opts.provider,
      amount: ride.fareAmount,
      currency: ride.currency,
      status: 'PENDING',
      idempotencyKey: `ryda_${opts.rideId}_${Date.now()}`,
    },
    update: {},
  });

  const provider = getPaymentProvider(opts.provider);
  const result = await provider.createOrder({
    rideId: opts.rideId,
    amount: ride.fareAmount,
    currency: ride.currency,
    userId: opts.userId,
    description: opts.description,
    successUrl: opts.successUrl,
    cancelUrl: opts.cancelUrl,
  });

  await db.payment.update({
    where: { id: payment.id },
    data: { providerOrderId: result.providerOrderId },
  });

  logger.info({ rideId: opts.rideId, orderId: result.providerOrderId }, 'Payment order created');
  return {
    providerOrderId: result.providerOrderId,
    checkoutUrl: result.checkoutUrl,
    clientSecret: result.clientSecret,
    amount: result.amount,
    currency: result.currency,
  };
}

export async function verifyPaymentForRide(opts: {
  rideId: string;
  provider: PaymentProvider;
  providerOrderId: string;
  providerPaymentId: string;
  signature?: string | undefined;
}): Promise<{ status: PaymentStatus }> {
  const payment = await db.payment.findUnique({ where: { rideId: opts.rideId } });
  if (!payment) throw new PaymentNotFoundError(opts.rideId);

  const provider = getPaymentProvider(opts.provider);
  const result = await provider.verifyPayment({
    providerOrderId: opts.providerOrderId,
    providerPaymentId: opts.providerPaymentId,
    signature: opts.signature,
  });

  try {
    await transitionPayment(payment.id, result.status, {
      providerPaymentId: result.providerPaymentId,
      providerOrderId: opts.providerOrderId,
    });
  } catch (err) {
    if (err instanceof PaymentStateError && err.code === 'PAYMENT_ALREADY_PROCESSED') {
      logger.info({ rideId: opts.rideId }, 'Payment already processed — returning cached status');
      return { status: result.status };
    }
    throw err;
  }

  if (result.status === 'CAPTURED') {
    // Mark the ride as PAID + emit WS event + send receipt email.
    await db.ride.update({ where: { id: opts.rideId }, data: { status: 'PAID' } });
    emitToRide(opts.rideId, RideEvents.Paid, {
      rideId: opts.rideId,
      status: 'PAID',
      timestamp: new Date().toISOString(),
    });

    const ride = await db.ride.findUnique({
      where: { id: opts.rideId },
      include: { passenger: true },
    });
    if (ride?.passenger) {
      await sendRideReceiptEmail({
        email: ride.passenger.email,
        passengerName: ride.passenger.name,
        rideId: ride.id,
        farePaise: ride.fareAmount,
        currency: ride.currency,
        pickupAddress: ride.pickupAddress,
        dropoffAddress: ride.dropoffAddress,
        completedAt: ride.completedAt?.toISOString() ?? new Date().toISOString(),
      }).catch((err) => logger.warn({ err }, 'Receipt email failed'));
    }
  }

  return { status: result.status };
}

export async function refundRide(opts: {
  rideId: string;
  reason: string;
  amount?: number; // paise; full refund if undefined
}): Promise<{ refundId: string; status: 'PENDING' | 'SUCCEEDED' | 'FAILED'; amount: number }> {
  const payment = await db.payment.findUnique({ where: { rideId: opts.rideId } });
  if (!payment) throw new PaymentNotFoundError(opts.rideId);
  if (!payment.providerPaymentId) {
    throw new Error('Cannot refund — payment has no provider payment id');
  }

  const provider = getPaymentProvider(payment.provider);
  const refundAmount = opts.amount ?? payment.amount;
  const result = await provider.refund({
    providerPaymentId: payment.providerPaymentId,
    amount: refundAmount,
    reason: opts.reason,
  });

  await transitionPayment(payment.id, 'REFUNDED', {
    refundId: result.refundId,
    refundAmount: result.amount,
    refundReason: opts.reason,
    refundedAt: new Date(),
  });

  logger.info({ rideId: opts.rideId, refundId: result.refundId }, 'Refund processed');
  return { refundId: result.refundId, status: result.status, amount: result.amount };
}
