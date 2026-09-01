import { NextResponse } from 'next/server';
import { requireAdmin, getCurrentUser } from '@/lib/auth/session';
import { getDriverProfile } from '@/server/services/driver-service';
import { db } from '@/lib/db/client';
import { driverApprovalUpdateSchema } from '@/lib/validation/driver';
import { ok, error, statusForCode } from '@/types/api';

/**
 * GET /api/drivers/[id] — fetch a single driver's profile.
 *
 * Drivers can fetch their own profile; admins can fetch anyone.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) {
    const res = error('UNAUTHORIZED', 'Sign in required');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const isOwner = user.driverId === id;
  const isAdmin = user.accountType === 'ADMIN';
  if (!isOwner && !isAdmin) {
    const res = error('FORBIDDEN', 'You can only view your own driver profile');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const profile = await getDriverProfile(id);
  if (!profile) {
    const res = error('NOT_FOUND', `Driver ${id} not found`);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  return NextResponse.json(ok(profile));
}

/**
 * PATCH /api/drivers/[id] — admin-only: approve/reject a driver.
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const body = await req.json().catch(() => null);
  const parsed = driverApprovalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid approval body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const updated = await db.driver.update({
    where: { id },
    data: {
      approvalStatus: parsed.data.approvalStatus,
      approvedById: admin.id,
      approvedAt: parsed.data.approvalStatus === 'APPROVED' ? new Date() : null,
      rejectionReason: parsed.data.rejectionReason ?? null,
    },
  });
  return NextResponse.json(ok(updated));
}
