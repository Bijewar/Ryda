import { requireAdmin } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * GET /api/drivers — admin-only list of all drivers.
 *
 * Supports `?status=APPROVED` filter for the approval queue.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get('status') ?? undefined;
  const drivers = await db.driver.findMany({
    where: status ? { approvalStatus: status as never } : undefined,
    include: { vehicle: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(ok(drivers));
}
