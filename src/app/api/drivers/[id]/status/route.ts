import { setDriverOnlineStatus } from '@/lib/db/driverStore';
import { driverStatusUpdateSchema } from '@/lib/validation/driver';
import { OutsideBhopalError, setDriverOnline } from '@/server/services/driver-service';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * PUT /api/drivers/[id]/status
 *
 * Toggles the driver online/offline.
 */
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = driverStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid status body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const { isOnline, location } = parsed.data;

  // Update in memory driver store
  await setDriverOnlineStatus(id, isOnline, location?.lat, location?.lng);

  try {
    await setDriverOnline(id, isOnline, location);
  } catch (err) {
    if (err instanceof OutsideBhopalError) {
      const res = error('OUTSIDE_SERVICE_AREA', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
  }

  return NextResponse.json(ok({ id, isOnline }));
}

export const PATCH = PUT;
