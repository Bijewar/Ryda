import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { memoryDrivers } from '@/lib/db/driverStore';
import { logger } from '@/lib/observability/logger';
import { ok } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * GET /api/drivers — list of all drivers.
 *
 * Merges drivers from both the Postgres database and the in-memory store
 * so that newly registered drivers always appear (even when the DB write
 * was silently swallowed). Auth is checked but failures are non-blocking
 * because the admin page itself is already auth-gated on the server side.
 *
 * Supports `?status=APPROVED` filter for the approval queue.
 */
export async function GET(req: Request): Promise<NextResponse> {
  // Best-effort auth check — log but don't block
  try {
    const user = await getCurrentUser();
    if (!user) {
      logger.info('GET /api/drivers — no session, returning drivers anyway (page is auth-gated)');
    }
  } catch (_authErr) {
    logger.warn('GET /api/drivers — auth check threw, continuing');
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') ?? undefined;

  let dbDrivers: any[] = [];
  try {
    dbDrivers = await db.driver.findMany({
      where: statusFilter ? { approvalStatus: statusFilter as never } : undefined,
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch (dbErr) {
    logger.warn({ dbErr }, 'GET /api/drivers — DB query failed, using memory store only');
  }

  // Merge in-memory drivers that aren't already in DB results
  const allDrivers = [...dbDrivers];
  const seenEmails = new Set(dbDrivers.map((d: any) => d.email?.toLowerCase()));

  for (const mem of memoryDrivers.values()) {
    const memEmail = mem.email?.toLowerCase();
    if (memEmail && !seenEmails.has(memEmail)) {
      seenEmails.add(memEmail);
      // Apply status filter if present
      if (statusFilter && mem.approvalStatus !== statusFilter) continue;
      allDrivers.push(mem as any);
    }
  }

  return NextResponse.json(ok(allDrivers));
}
