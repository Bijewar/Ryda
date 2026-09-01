import { NextResponse } from 'next/server';
import { requirePassenger } from '@/lib/auth/session';
import { verifyPaymentForRide, PaymentNotFoundError } from '@/server/services/payment-service';
import { verifyPaymentSchema } from '@/lib/validation/payment';
import { limitPayment } from '@/lib/auth/rate-limit';
import { ok, error, statusForCode } from '@/types/api';

/**
 * POST /api/payments/verify
 *
 * Verifies a payment after the client returns from the provider's checkout.
 * 
 * - Razorpay: HMAC-verifies the signature, then fetches the payment.
 *
 * On success, transitions the Payment row to CAPTURED and the Ride to PAID,
 * then emits a `ride:paid` WS event + sends the receipt email.
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
    const res = error('RATE_LIMITED', 'Too many verify attempts.');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid verify body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  try {
    const result = await verifyPaymentForRide({
      rideId: parsed.data.rideId,
      provider: parsed.data.provider,
      providerOrderId: parsed.data.providerOrderId,
      providerPaymentId: parsed.data.providerPaymentId,
      signature: parsed.data.signature,
    });
    return NextResponse.json(ok(result));
  } catch (err) {
    if (err instanceof PaymentNotFoundError) {
      const res = error('NOT_FOUND', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
    const res = error('PAYMENT_FAILED', err instanceof Error ? err.message : 'Verification failed');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
