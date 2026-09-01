import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { ok, error } from '@/types/api';
import { logger } from '@/lib/observability/logger';
import { BHOPAL_POIS } from '@/lib/geo/pois';

export interface ActiveDriverMarker {
  id: string;
  firstName: string;
  rating: number;
  lat: number;
  lng: number;
  heading: number;
  vehicleModel?: string;
  vehicleType?: string;
}

/**
 * GET /api/drivers/active
 *
 * Returns live coordinates of all currently approved & online drivers in Bhopal.
 * Used by passenger dashboard maps to render real-time vehicle markers.
 */
export async function GET(): Promise<NextResponse> {
  try {
    let onlineDrivers: any[] = [];
    try {
      onlineDrivers = await db.$queryRaw<
        Array<{
          id: string;
          firstName: string;
          rating: number;
          heading: number | null;
          vehicleModel: string | null;
          vehicleType: string | null;
          lng: number;
          lat: number;
        }>
      >`
        SELECT
          d.id,
          d."firstName",
          d.rating,
          d.heading,
          v.model AS "vehicleModel",
          v.type AS "vehicleType",
          ST_X(d."currentLocation"::geometry) AS lng,
          ST_Y(d."currentLocation"::geometry) AS lat
        FROM "drivers" d
        LEFT JOIN "vehicles" v ON v."driverId" = d.id
        WHERE d."isOnline" = true
          AND d."approvalStatus" = 'APPROVED'
          AND d."currentLocation" IS NOT NULL
        LIMIT 50;
      `;
    } catch (dbErr) {
      logger.warn({ dbErr }, 'Failed querying active drivers from PostGIS');
    }

    const markers: ActiveDriverMarker[] = (onlineDrivers || [])
      .filter((d) => d.lat && d.lng)
      .map((d) => ({
        id: d.id,
        firstName: d.firstName,
        rating: d.rating ?? 5.0,
        lat: Number(d.lat),
        lng: Number(d.lng),
        heading: Number(d.heading ?? 0),
        vehicleModel: d.vehicleModel ?? undefined,
        vehicleType: d.vehicleType ?? 'SEDAN',
      }));

    return NextResponse.json(ok(markers));
  } catch (err) {
    logger.error({ err }, 'Error fetching active drivers');
    return NextResponse.json(error('INTERNAL_ERROR', 'Failed to fetch active drivers'), { status: 500 });
  }
}
