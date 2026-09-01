import { NextResponse } from 'next/server';
import { calculateDriverReliability } from '@/server/services/reliability-service';
import { ok, error } from '@/types/api';

/**
 * GET /api/drivers/[id]/reliability
 * Returns driver reliability score (0-100), monthly cancellation stats,
 * and reliable driver reward status.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const stats = await calculateDriverReliability(id);
    return NextResponse.json(ok(stats));
  } catch (err) {
    return NextResponse.json(
      error('NOT_FOUND', err instanceof Error ? err.message : 'Driver not found'),
      { status: 404 },
    );
  }
}
