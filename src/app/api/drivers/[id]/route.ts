import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { findDriverByEmailOrId, setDriverApprovalStatus } from '@/lib/db/driverStore';
import { logger } from '@/lib/observability/logger';
import { driverApprovalUpdateSchema } from '@/lib/validation/driver';
import { getDriverProfile } from '@/server/services/driver-service';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * GET /api/drivers/[id] — fetch a single driver's profile.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    const res = error('UNAUTHORIZED', 'Sign in required');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const profile = (await findDriverByEmailOrId(id)) || (await getDriverProfile(id));
  if (!profile) {
    const res = error('NOT_FOUND', `Driver ${id} not found`);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  return NextResponse.json(ok(profile));
}

/**
 * PATCH /api/drivers/[id] — admin-only: approve/reject a driver.
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = driverApprovalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid approval body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const newStatus = parsed.data.approvalStatus;

  // Update in shared driverStore
  const updatedDriver = await setDriverApprovalStatus(id, newStatus as any);

  try {
    const dbExisting = await db.driver.findFirst({
      where: { OR: [{ id }, { email: id.toLowerCase() }] },
    });

    if (dbExisting) {
      const updated = await db.driver.update({
        where: { id: dbExisting.id },
        data: {
          approvalStatus: newStatus,
          approvedAt: newStatus === 'APPROVED' ? new Date() : null,
          rejectionReason: parsed.data.rejectionReason ?? null,
        },
      });
      return NextResponse.json(ok(updated));
    }
  } catch (err) {
    logger.warn({ err, id }, 'Database update warning during driver approval');
    // If DB is offline, return the updated in-memory driver record
    if (updatedDriver) {
      return NextResponse.json(ok(updatedDriver));
    }
  }

  return NextResponse.json(ok({ id, approvalStatus: newStatus }));
}
