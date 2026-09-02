import { isInsideBhopal } from '@/lib/db/bhopal';
import { computeFare, getDirections } from '@/lib/geo/osm';
import { logger } from '@/lib/observability/logger';
import { getCurrentSurge } from '@/server/matching/surge';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * GET /api/geo/route?pickupLat=...&pickupLng=...&dropoffLat=...&dropoffLng=...
 *
 * Computes road directions via OSRM and calculates the live estimated fare
 * with current surge pricing.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const pLat = Number(url.searchParams.get('pickupLat'));
  const pLng = Number(url.searchParams.get('pickupLng'));
  const dLat = Number(url.searchParams.get('dropoffLat'));
  const dLng = Number(url.searchParams.get('dropoffLng'));

  if (!pLat || !pLng || !dLat || !dLng) {
    return NextResponse.json(error('VALIDATION_ERROR', 'Missing pickup or dropoff coordinates'), {
      status: 400,
    });
  }

  const pickup = { lat: pLat, lng: pLng };
  const dropoff = { lat: dLat, lng: dLng };

  try {
    const [pickupOk, dropoffOk] = await Promise.all([
      isInsideBhopal(pickup),
      isInsideBhopal(dropoff),
    ]);

    if (!pickupOk || !dropoffOk) {
      return NextResponse.json(
        error('OUTSIDE_SERVICE_AREA', 'Pickup or dropoff is outside the Bhopal service area'),
        { status: 400 },
      );
    }

    const [route, surge] = await Promise.all([
      getDirections(pickup, dropoff),
      getCurrentSurge().catch(() => 1.0),
    ]);

    const fareAmount = computeFare(route.distanceMeters, route.durationSeconds, surge);

    return NextResponse.json(
      ok({
        geometry: route.geometry,
        distanceMeters: route.distanceMeters,
        durationSeconds: route.durationSeconds,
        fareAmount,
        surgeMultiplier: surge,
        currency: 'INR',
      }),
    );
  } catch (err) {
    logger.error({ err, pickup, dropoff }, 'Failed to compute route directions');
    return NextResponse.json(
      error('INTERNAL_ERROR', 'Failed to calculate route and fare estimate'),
      {
        status: 500,
      },
    );
  }
}
