import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { memoryDrivers } from '@/lib/db/driverStore';
import { ok, error } from '@/types/api';
import { logger } from '@/lib/observability/logger';

export interface ActiveDriverMarker {
  id: string;
  firstName: string;
  rating: number;
  lat: number;
  lng: number;
  heading: number;
  vehicleModel?: string;
  vehicleType: 'BIKE' | 'AUTO' | 'CAB_ECONOMY' | 'CAB_PREMIUM' | 'SUV' | string;
}

export async function GET(): Promise<NextResponse> {
  try {
    const activeMarkers: ActiveDriverMarker[] = [];

    // 1. Check runtime memory store for real online approved drivers
    const inMemList = Array.from(memoryDrivers.values());
    for (const d of inMemList) {
      if (d.isOnline && d.approvalStatus === 'APPROVED') {
        const isDuplicate = activeMarkers.some((m) => m.id === d.id);
        if (!isDuplicate) {
          activeMarkers.push({
            id: d.id,
            firstName: d.firstName,
            rating: d.rating ?? 5.0,
            lat: d.lat ?? 23.2419,
            lng: d.lng ?? 77.4321,
            heading: d.heading ?? 45,
            vehicleModel: d.vehicle ? `${d.vehicle.make} ${d.vehicle.model}` : 'Vehicle',
            vehicleType: d.vehicle?.type ?? 'BIKE',
          });
        }
      }
    }

    // 2. Query Postgres DB for active approved drivers
    try {
      const dbOnline = await db.$queryRaw<
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

      if (dbOnline && Array.isArray(dbOnline)) {
        for (const d of dbOnline) {
          if (!activeMarkers.some((m) => m.id === d.id)) {
            activeMarkers.push({
              id: d.id,
              firstName: d.firstName,
              rating: d.rating ?? 5.0,
              lat: Number(d.lat),
              lng: Number(d.lng),
              heading: Number(d.heading ?? 0),
              vehicleModel: d.vehicleModel ?? undefined,
              vehicleType: d.vehicleType ?? 'BIKE',
            });
          }
        }
      }
    } catch (_dbErr) {
      // Offline fallback
    }

    // Return ONLY real active drivers (empty [] if 0 drivers are online)
    return NextResponse.json(ok(activeMarkers));
  } catch (err) {
    logger.error({ err }, 'Error fetching active drivers');
    return NextResponse.json(error('INTERNAL_ERROR', 'Failed to fetch active drivers'), { status: 500 });
  }
}
