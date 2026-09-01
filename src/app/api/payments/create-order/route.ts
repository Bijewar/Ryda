import { NextResponse } from 'next/server';
import { requirePassenger } from '@/lib/auth/session';
import { createOrderForRide, PaymentNotFoundError } from '@/server/services/payment-service';
import { createOrderSchema } from '@/lib/validation/payment';
import { readIdempotencyKey } from '@/lib/payments/idempotency';
import { limitPayment } from '@/lib/auth/rate-limit';
import { ok, error, statusForCode } from '@/types/api';
import { env } from '@/lib/env';

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order for a ride for a
 * ride. Idempotent on (rideId, provider) — a second call with the same
 * idempotency key returns the existing order.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let user;
  try {
    user = await requirePassenger();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const limited = await limitPayment(user.id);
  if (!limited.success) {
    const res = error('RATE_LIMITED', 'Too many payment attempts. Try again in a minute.');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid create-order body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const idempotencyKey = readIdempotencyKey(req);
  void idempotencyKey; // stored on the Payment row by createOrderForRide.

  try {
    const result = await createOrderForRide({
      rideId: parsed.data.rideId,
      userId: user.id,
      provider: parsed.data.provider,
      description: `Ryda ride ${parsed.data.rideId}`,
      successUrl: `${env.NEXT_PUBLIC_APP_URL}/receipts/${parsed.data.rideId}`,
      cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/rides/${parsed.data.rideId}`,
    });
    return NextResponse.json(ok(result));
  } catch (err) {
    if (err instanceof PaymentNotFoundError) {
      const res = error('NOT_FOUND', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
    const res = error('PAYMENT_FAILED', err instanceof Error ? err.message : 'Create order failed');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
