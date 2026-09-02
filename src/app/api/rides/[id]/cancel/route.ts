import { requirePassenger } from '@/lib/auth/session';
import { rideCancelSchema } from '@/lib/validation/ride';
import { cancelRide } from '@/server/services/ride-service';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * POST /api/rides/[id]/cancel
 *
 * Cancels a ride. Allowed from any non-terminal state.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  let user;
  try {
    user = await requirePassenger();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = rideCancelSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid cancel body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  try {
    await cancelRide(id, parsed.data.reason, user.id);
    return NextResponse.json(ok({ id, status: 'CANCELED' }));
  } catch (err) {
    const res = error(
      'INVALID_STATE_TRANSITION',
      err instanceof Error ? err.message : 'Cannot cancel this ride',
    );
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
