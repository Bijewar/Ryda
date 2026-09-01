import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/session';
import { refundRide, PaymentNotFoundError } from '@/server/services/payment-service';
import { refundSchema } from '@/lib/validation/payment';
import { ok, error, statusForCode } from '@/types/api';

/**
 * POST /api/payments/refund
 *
 * Admin-only — issues a full or partial refund for a ride's payment. Uses
 * the Razorpay refund API and records
 * the refund id on the Payment row.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = refundSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid refund body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  try {
    const result = await refundRide({
      rideId: parsed.data.rideId,
      reason: parsed.data.reason,
      amount: parsed.data.amount,
    });
    return NextResponse.json(ok(result));
  } catch (err) {
    if (err instanceof PaymentNotFoundError) {
      const res = error('NOT_FOUND', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
    const res = error('PAYMENT_FAILED', err instanceof Error ? err.message : 'Refund failed');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
