import { db } from '@/lib/db/client';

/**
 * PostGIS raw query helpers.
 *
 * Prisma doesn't natively know PostGIS, so geometry inserts/queries go through
 * `$queryRaw` / `$executeRaw`. These helpers wrap the common patterns:
 *  - Setting a POINT column from lat/lng (SRID 4326)
 *  - Checking ST_Contains against the Bhopal polygon
 *  - Finding drivers within a radius (ST_DWithin)
 *  - Computing distance in meters (ST_Distance on geography)
 */

export interface Point {
  lat: number;
  lng: number;
}

export interface NearbyDriver {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  vehicleModel: string | null;
  licensePlate: string | null;
  vehicleType: string | null;
  distance_meters: number;
}

/**
 * SQL fragment builder — returns a `ST_SetSRID(ST_MakePoint(lng, lat), 4326)`
 * expression safe to interpolate into a larger raw query.
 */
export function makePointSql(lng: number, lat: number): string {
  return `ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326)`;
}

/**
 * Update a driver's currentLocation + heading. Uses raw SQL because the
 * column is `Unsupported("geometry(Point, 4326)")`.
 */
export async function setDriverLocation(driverId: string, point: Point, heading?: number): Promise<void> {
  if (heading !== undefined) {
    await db.$executeRaw`
      UPDATE "drivers"
      SET "currentLocation" = ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326),
          "heading" = ${heading},
          "updatedAt" = NOW()
      WHERE id = ${driverId}
    `;
    return;
  }
  await db.$executeRaw`
    UPDATE "drivers"
    SET "currentLocation" = ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326),
        "updatedAt" = NOW()
    WHERE id = ${driverId}
  `;
}

/**
 * Get the (lat, lng) of a driver's current location.
 * Returns null if the driver has no location set.
 */
export async function getDriverLocation(driverId: string): Promise<Point | null> {
  const rows = await db.$queryRaw<Array<{ lat: number; lng: number }>>`
    SELECT
      ST_Y("currentLocation") AS lat,
      ST_X("currentLocation") AS lng
    FROM "drivers"
    WHERE id = ${driverId} AND "currentLocation" IS NOT NULL
  `;
  const row = rows[0];
  if (!row) return null;
  return { lat: row.lat, lng: row.lng };
}

/**
 * Insert a Ride with pickup/dropoff POINTs. Other fields are passed via the
 * `data` argument so we don't need to enumerate every column here.
 */
export interface RideInsertInput {
  id: string;
  passengerId: string;
  driverId: string | null;
  status: string;
  pickupAddress: string;
  pickup: Point;
  dropoffAddress: string;
  dropoff: Point;
  routeGeometry: unknown;
  distanceMeters: number;
  durationSeconds: number;
  fareAmount: number;
  surgeMultiplier: number;
  currency: string;
  paymentMethod: string;
}

export async function insertRideWithPoints(input: RideInsertInput): Promise<void> {
  await db.$executeRaw`
    INSERT INTO "rides" (
      id, "passengerId", "driverId", status,
      "pickupAddress", "pickupPoint",
      "dropoffAddress", "dropoffPoint",
      "routeGeometry", "distanceMeters", "durationSeconds",
      "fareAmount", "surgeMultiplier", currency, "paymentMethod"
    ) VALUES (
      ${input.id},
      ${input.passengerId},
      ${input.driverId},
      ${input.status}::"RideStatus",
      ${input.pickupAddress},
      ST_SetSRID(ST_MakePoint(${input.pickup.lng}, ${input.pickup.lat}), 4326),
      ${input.dropoffAddress},
      ST_SetSRID(ST_MakePoint(${input.dropoff.lng}, ${input.dropoff.lat}), 4326),
      ${JSON.stringify(input.routeGeometry)}::jsonb,
      ${input.distanceMeters},
      ${input.durationSeconds},
      ${input.fareAmount},
      ${input.surgeMultiplier},
      ${input.currency},
      ${input.paymentMethod}::"PaymentMethod"
    )
  `;
}

/**
 * Distance in meters between two POINTs (geography, spheroid).
 */
export async function distanceMeters(a: Point, b: Point): Promise<number> {
  const rows = await db.$queryRaw<Array<{ d: number }>>`
    SELECT ST_Distance(
      ST_SetSRID(ST_MakePoint(${a.lng}, ${a.lat}), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${b.lng}, ${b.lat}), 4326)::geography
    ) AS d
  `;
  return rows[0]?.d ?? 0;
}
