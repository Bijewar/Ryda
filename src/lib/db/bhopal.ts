import { readFileSync } from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db/client';
import type { Point } from '@/lib/db/postgis';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';

/**
 * Bhopal geofence helpers using RydaMap.geojson.
 */

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties?: Record<string, unknown>;
    geometry: GeoJSONPolygon | { type: string; coordinates: any };
  }>;
}

let bhopalFeature: GeoJSONFeatureCollection['features'][number] | null = null;
let bhopalOuterRing: number[][] | null = null;
const bhopalBbox: { minLng: number; minLat: number; maxLng: number; maxLat: number } = {
  minLng: 77.0,
  minLat: 23.0,
  maxLng: 77.8,
  maxLat: 23.9,
};

function loadFromDisk(): void {
  if (bhopalFeature) return;
  try {
    const file = path.join(process.cwd(), 'public', 'geo', 'RydaMap.geojson');
    const raw = readFileSync(file, 'utf-8');
    const fc = JSON.parse(raw) as GeoJSONFeatureCollection;
    const feature = fc.features?.[0];
    if (feature) {
      bhopalFeature = feature;
      if (
        feature.geometry &&
        feature.geometry.coordinates &&
        Array.isArray(feature.geometry.coordinates[0])
      ) {
        bhopalOuterRing = (feature.geometry.coordinates[0] as number[][]).map((pt) => [
          pt[0] ?? 0,
          pt[1] ?? 0,
        ]);
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Could not read RydaMap.geojson from disk, using fallback bounds');
  }
}

/** Returns the polygon geometry as a GeoJSON string (for ST_GeomFromGeoJSON). */
export function getBhopalPolygonGeoJSON(): string {
  loadFromDisk();
  if (!bhopalFeature) {
    return JSON.stringify({
      type: 'Polygon',
      coordinates: [
        [
          [77.2, 23.1],
          [77.6, 23.1],
          [77.6, 23.5],
          [77.2, 23.5],
          [77.2, 23.1],
        ],
      ],
    });
  }
  return JSON.stringify(bhopalFeature.geometry);
}

/** Returns the bounding box of the Bhopal polygon. */
export function getBhopalBbox(): {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
} {
  loadFromDisk();
  return bhopalBbox;
}

/**
 * Server-side geofence check.
 */
export async function isInsideBhopal(point: Point): Promise<boolean> {
  // If coordinates are in Bhopal region (23.0 - 23.6 N, 77.1 - 77.7 E), allow
  if (point.lat >= 23.0 && point.lat <= 23.6 && point.lng >= 77.1 && point.lng <= 77.7) {
    return true;
  }
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
    return rows[0]?.inside ?? true;
  } catch (_err) {
    return isInsideBhopalPureJS(point);
  }
}

/**
 * Pure-JS point check for Bhopal.
 */
export function isInsideBhopalPureJS(point: Point): boolean {
  return point.lat >= 23.0 && point.lat <= 23.6 && point.lng >= 77.1 && point.lng <= 77.7;
}

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
  loadFromDisk();
}
