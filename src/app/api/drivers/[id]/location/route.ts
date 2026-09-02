import { requireDriver } from '@/lib/auth/session';
import { driverLocationUpdateSchema } from '@/lib/validation/driver';
import { updateDriverLocation } from '@/server/services/driver-service';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * PUT /api/drivers/[id]/location
 *
 * Updates the driver's current location (PostGIS POINT). Drivers can only
 * update their own location. The WS server fans out the new location to all
 * passengers watching an active ride with this driver.
 */
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    await requireDriver(id);
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = driverLocationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid location body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  await updateDriverLocation(
    id,
    { lat: parsed.data.lat, lng: parsed.data.lng },
    parsed.data.heading,
  );
  return NextResponse.json(ok({ updated: true }));
}

export const PATCH = PUT;
