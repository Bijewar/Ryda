import { getLiveDemandZones } from '@/server/services/demand-ai-service';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/demand/hotspots — returns live & forecasted demand zones in Bhopal
 */
export async function GET(): Promise<NextResponse> {
  try {
    const zones = await getLiveDemandZones();
    return NextResponse.json(ok(zones));
  } catch (err) {
    return NextResponse.json(
      error(
        'INTERNAL_ERROR',
        err instanceof Error ? err.message : 'Failed to fetch demand hotspots',
      ),
      { status: 500 },
    );
  }
}
