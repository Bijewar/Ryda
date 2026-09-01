import { NextResponse } from 'next/server';
import { requirePassenger } from '@/lib/auth/session';
import { rateRide } from '@/server/services/ride-service';
import { rideRateSchema } from '@/lib/validation/ride';
import { ok, error, statusForCode } from '@/types/api';

/**
 * POST /api/rides/[id]/rate
 *
 * Submit a 1-5 star rating + optional feedback for a completed ride.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    await requirePassenger();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = rideRateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid rating body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  await rateRide(id, parsed.data.rating, parsed.data.feedback);
  return NextResponse.json(ok({ id, rated: true }));
}
