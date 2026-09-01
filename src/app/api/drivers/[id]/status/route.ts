import { NextResponse } from 'next/server';
import { requireDriver } from '@/lib/auth/session';
import { setDriverOnline, OutsideBhopalError } from '@/server/services/driver-service';
import { driverStatusUpdateSchema } from '@/lib/validation/driver';
import { ok, error, statusForCode } from '@/types/api';

/**
 * PUT /api/drivers/[id]/status
 *
 * Toggles the driver online/offline. When going online, the caller must
 * pass their current location — the server refuses if it's outside Bhopal.
 */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    await requireDriver(id);
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = driverStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid status body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  try {
    await setDriverOnline(id, parsed.data.isOnline, parsed.data.location);
    return NextResponse.json(ok({ id, isOnline: parsed.data.isOnline }));
  } catch (err) {
    if (err instanceof OutsideBhopalError) {
      const res = error('OUTSIDE_SERVICE_AREA', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
    throw err;
  }
}

export const PATCH = PUT;
