import { readFileSync } from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db/client';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import type { Point } from '@/lib/db/postgis';

/**
 * Bhopal geofence helpers.
 *
 * The Bhopal boundary GeoJSON lives in `public/geo/bhopal-boundary-simplified.geojson`
 * (~12KB, 465 vertices). We:
 *   1. Load it from disk once at module init (cached in `bhopalFeature`).
 *   2. Provide `getBhopalPolygonGeoJSON()` — returns the polygon geometry string
 *      for use in PostGIS `ST_GeomFromGeoJSON()` calls.
 *   3. Provide `isInsideBhopal(point)` — server-side PostGIS `ST_Contains` check
 *      against the `service_areas` table (seeded by `prisma/seed.ts`).
 *   4. Provide `isInsideBhopalPureJS(point)` — pure-JS ray-casting fallback for
 *      client-side validation (no DB round-trip).
 *
 * The ray-casting algorithm is the standard "point in polygon" test from
 * https://rosettacode.org/wiki/Ray-casting_algorithm and runs in O(n) over the
 * polygon's outer ring (~465 edges for Bhopal — sub-millisecond).
 */

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      name: string;
      bbox: number[];
      centroid: number[];
      [k: string]: unknown;
    };
    geometry: GeoJSONPolygon | { type: string; coordinates: unknown };
  }>;
}

let bhopalFeature: GeoJSONFeatureCollection['features'][number] | null = null;
let bhopalOuterRing: number[][] | null = null;
let bhopalBbox: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null = null;

function loadFromDisk(): void {
  if (bhopalFeature) return;
  const file = path.join(process.cwd(), 'public', 'geo', 'bhopal-boundary-simplified.geojson');
  const raw = readFileSync(file, 'utf-8');
  const fc = JSON.parse(raw) as GeoJSONFeatureCollection;
  const feature = fc.features[0];
  if (!feature) {
    throw new Error('Bhopal GeoJSON has no features');
  }
  bhopalFeature = feature;
  const geom = feature.geometry as GeoJSONPolygon;
  const [minLng = 77.1656, minLat = 23.0725, maxLng = 77.6485, maxLat = 23.8953] = feature.properties.bbox ?? [];
  bhopalBbox = { minLng, minLat, maxLng, maxLat };
  logger.info({ vertices: bhopalOuterRing?.length }, 'Bhopal geofence loaded from disk');
}

/** Returns the polygon geometry as a GeoJSON string (for ST_GeomFromGeoJSON). */
export function getBhopalPolygonGeoJSON(): string {
  loadFromDisk();
  if (!bhopalFeature) throw new Error('Bhopal feature not loaded');
  return JSON.stringify(bhopalFeature.geometry);
}

/** Returns the bounding box of the Bhopal polygon. */
export function getBhopalBbox(): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  loadFromDisk();
  if (!bhopalBbox) throw new Error('Bhopal bbox not loaded');
  return bhopalBbox;
}

/**
 * Server-side geofence check using PostGIS ST_Contains against the
 * `service_areas` table. Falls back to pure JS if the DB is unreachable
 * (e.g. during unit tests).
 */
export async function isInsideBhopal(point: Point): Promise<boolean> {
  try {
    const rows = await db.$queryRaw<Array<{ inside: boolean }>>`
      SELECT ST_Contains(
        geometry,
        ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326)
      ) AS inside
      FROM "service_areas"
      WHERE name = 'Bhopal'
      LIMIT 1
    `;
    return rows[0]?.inside ?? false;
  } catch (err) {
    logger.warn({ err }, 'isInsideBhopal PostGIS query failed, falling back to pure JS');
    return isInsideBhopalPureJS(point);
  }
}

/**
 * Pure-JS ray-casting "point in polygon" check. O(n) over the outer ring.
 * Used as a fallback when the DB is unreachable, and on the client.
 */
export function isInsideBhopalPureJS(point: Point): boolean {
  loadFromDisk();
  if (!bhopalOuterRing) return false;
  // Quick bounding-box reject — saves the full ray-cast for points far away.
  if (bhopalBbox) {
    if (
      point.lng < bhopalBbox.minLng ||
      point.lng > bhopalBbox.maxLng ||
      point.lat < bhopalBbox.minLat ||
      point.lat > bhopalBbox.maxLat
    ) {
      return false;
    }
  }
  return pointInRing(point, bhopalOuterRing);
}

function pointInRing(point: Point, ring: number[][]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i]?.[0] ?? 0;
    const yi = ring[i]?.[1] ?? 0;
    const xj = ring[j]?.[0] ?? 0;
    const yj = ring[j]?.[1] ?? 0;
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * SQL fragment that yields the Bhopal polygon geometry, for use in raw
 * queries that want to filter by `ST_Contains(bhopal, point)`.
 *
 * Example:
 *   const sql = `SELECT * FROM drivers WHERE ST_Contains(${getBhopalPolygonSql()}, "currentLocation")`;
 */
export function getBhopalPolygonSql(): string {
  return `ST_GeomFromGeoJSON('${getBhopalPolygonGeoJSON().replace(/'/g, "''")}'::text)`;
}

/** Demo helper: list of Bhopal POIs for seed data and tests. */
export const BHOPAL_POIS: ReadonlyArray<{ name: string; lng: number; lat: number }> = [
  { name: 'MP Nagar', lng: 77.4321, lat: 23.2419 },
  { name: 'New Market', lng: 77.4036, lat: 23.2347 },
  { name: 'Habibganj Railway Station', lng: 77.4334, lat: 23.2701 },
  { name: 'Old City (Jahaz Mahal)', lng: 77.404, lat: 23.1667 },
  { name: 'BHEL Bhopal', lng: 77.2451, lat: 23.2766 },
  { name: 'Kolar Road', lng: 77.4858, lat: 23.2156 },
  { name: 'Arera Colony', lng: 77.4483, lat: 23.2428 },
  { name: 'Shahpura', lng: 77.4614, lat: 23.2626 },
  { name: 'Bairagarh', lng: 77.3106, lat: 23.3017 },
  { name: 'TT Nagar Stadium', lng: 77.4189, lat: 23.2284 },
  { name: 'Bhopal Junction', lng: 77.4111, lat: 23.2667 },
  { name: 'Bairagarh Chhawni', lng: 77.327, lat: 23.292 },
];

if (!env.DEMO_MODE) {
  // Eagerly load on import (server-only) so the first request isn't penalized.
  loadFromDisk();
}
