import {
  acceptDriverRepositioning,
  getDriverRepositioningOpportunity,
} from '@/server/services/demand-ai-service';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const acceptSchema = z.object({
  zoneId: z.string().min(1),
});

/**
 * GET /api/drivers/[id]/repositioning — fetch nearby high-demand opportunity
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const opp = await getDriverRepositioningOpportunity(id);
    return NextResponse.json(ok(opp));
  } catch (err) {
    return NextResponse.json(
      error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to fetch repositioning'),
      { status: 500 },
    );
  }
}

/**
 * POST /api/drivers/[id]/repositioning — accept a repositioning incentive offer
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = acceptSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(error('VALIDATION_ERROR', 'Invalid zoneId'), { status: 400 });
  }

  try {
    const result = await acceptDriverRepositioning({
      driverId: id,
      zoneId: parsed.data.zoneId,
    });
    return NextResponse.json(ok(result));
  } catch (err) {
    return NextResponse.json(
      error(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Failed to accept repositioning',
      ),
      { status: 500 },
    );
  }
}
