import { db } from '@/lib/db/client';
import { logger } from '@/lib/observability/logger';
import type { PaymentStatus } from '@/types/ride';
import { ALLOWED_PAYMENT_TRANSITIONS } from '@/types/payment';

/**
 * Atomic Payment state machine.
 *
 * Payments can only move forward through the allowed transitions:
 *   PENDING → AUTHORIZED → CAPTURED → REFUNDED
 *   PENDING → FAILED (terminal)
 *   AUTHORIZED → FAILED (terminal)
 *
 * All transitions use a `WHERE` clause with the current status — this is the
 * optimistic-concurrency pattern: if the row was already transitioned by a
 * concurrent webhook, the UPDATE affects 0 rows and we throw
 * `PAYMENT_ALREADY_PROCESSED`.
 */
export class PaymentStateError extends Error {
  constructor(
    public code: 'INVALID_TRANSITION' | 'PAYMENT_ALREADY_PROCESSED' | 'NOT_FOUND',
    message: string,
  ) {
    super(message);
    this.name = 'PaymentStateError';
  }
}

export async function transitionPayment(
  paymentId: string,
  to: PaymentStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const current = await db.payment.findUnique({ where: { id: paymentId }, select: { status: true } });
  if (!current) throw new PaymentStateError('NOT_FOUND', `Payment ${paymentId} not found`);

  const allowed = ALLOWED_PAYMENT_TRANSITIONS[current.status];
  if (!allowed || !allowed.includes(to)) {
    throw new PaymentStateError(
      'INVALID_TRANSITION',
      `Cannot transition payment ${paymentId} from ${current.status} to ${to}`,
    );
  }

  // Optimistic-concurrency UPDATE — only succeeds if status is still `current`.
  const result = await db.payment.updateMany({
    where: { id: paymentId, status: current.status },
    data: { status: to, ...extra, updatedAt: new Date() },
  });

  if (result.count === 0) {
    throw new PaymentStateError(
      'PAYMENT_ALREADY_PROCESSED',
      `Payment ${paymentId} was transitioned concurrently; current status may differ`,
    );
  }

  logger.info({ paymentId, from: current.status, to }, 'Payment state transition');
}
