/**
 * Geo client — 100% free, no API keys required.
 *
 * Stack:
 *   - Routing:  OSRM public demo server (router.project-osrm.org)
 *   - Geocoding: Nominatim (openstreetmap.org) — free, 1 req/sec, requires User-Agent
 *
 * Both services are rate-limited and not for heavy production use, but they're
 * perfect for a portfolio demo. For a real launch you'd self-host OSRM +
 * Nominatim (free, just Docker) or swap to a paid provider — the interface
 * in this file wouldn't change.
 *
 * Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * OSRM demo server:      https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server
 */

import type { Point } from '@/lib/db/postgis';
import { logger } from '@/lib/observability/logger';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

// In-memory cache for geocoding and routing results
const inMemoryCache = new Map<string, { value: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const item = inMemoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    inMemoryCache.delete(key);
    return null;
  }
  return item.value as T;
}

function setCached(key: string, value: unknown, ttlSeconds: number): void {
  inMemoryCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

// Bhopal bounding box — restricts geocoding results to the service area
const BHOPAL_VIEWBOX = '77.16,23.07,77.65,23.90';
const _BHOPAL_PROXIMITY = '77.40,23.25';

export interface DirectionsResult {
  /** GeoJSON LineString geometry. */
  geometry: { type: 'LineString'; coordinates: number[][] };
  distanceMeters: number;
  durationSeconds: number;
}

export interface GeocodeResult {
  address: string;
  point: Point;
  /** Bbox of the matched feature, for viewport fitting. */
  bbox?: [number, number, number, number] | undefined;
}

/**
 * Get a driving route between two points via OSRM.
 * Free, no API key. Rate-limited (~5 req/sec on the demo server).
 */
export async function getDirections(pickup: Point, dropoff: Point): Promise<DirectionsResult> {
  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?geometries=geojson&overview=full`;

  const cacheKey = `route:${pickup.lng.toFixed(4)},${pickup.lat.toFixed(4)}:${dropoff.lng.toFixed(4)},${dropoff.lat.toFixed(4)}`;
  const cached = getCached<DirectionsResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OSRM directions failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    routes: Array<{
      geometry: { type: 'LineString'; coordinates: number[][] };
      distance: number;
      duration: number;
    }>;
  };
  const route = json.routes[0];
  if (!route) throw new Error('No route found');

  const result: DirectionsResult = {
    geometry: route.geometry,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
  };

  // Cache for 24h — routes don't change often
  setCached(cacheKey, result, 86_400);
  return result;
}

/**
 * Forward geocode an address → point + canonical address via Nominatim.
 * Free, 1 req/sec. Results restricted to Bhopal viewbox.
 */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  const cacheKey = `geocode:${query.toLowerCase().trim()}`;
  const cached = getCached<GeocodeResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=${BHOPAL_VIEWBOX}&bounded=1`;
  const res = await fetch(url, {
    headers: {
      // Nominatim usage policy REQUIRES a valid User-Agent identifying the app
      'User-Agent': 'ryda-v2/2.0 (https://github.com/ryda/ryda-v2)',
    },
  });
  if (!res.ok) {
    logger.warn({ status: res.status }, 'Nominatim geocode failed');
    return [];
  }
  const json = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    boundingbox?: [string, string, string, string];
  }>;
  const results: GeocodeResult[] = json.map((f) => ({
    address: f.display_name,
    point: { lat: Number(f.lat), lng: Number(f.lon) },
    bbox: f.boundingbox
      ? [
          Number(f.boundingbox[2]),
          Number(f.boundingbox[0]),
          Number(f.boundingbox[3]),
          Number(f.boundingbox[1]),
        ]
      : undefined,
  }));

  // Cache for 30 days — Nominatim policy asks for caching
  setCached(cacheKey, results, 2_592_000);
  return results;
}

/**
 * Reverse geocode a point → human-readable address via Nominatim.
 */
export async function reverseGeocode(point: Point): Promise<string> {
  const cacheKey = `revgeo:${point.lng.toFixed(4)},${point.lat.toFixed(4)}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=18`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ryda-v2/2.0 (https://github.com/ryda/ryda-v2)' },
  });
  if (!res.ok) {
    logger.warn({ status: res.status }, 'Nominatim reverse geocode failed');
    return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
  }
  const json = (await res.json()) as { display_name?: string };
  const address = json.display_name ?? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;

  setCached(cacheKey, address, 2_592_000);
  return address;
}

/**
 * Fare estimate — base fare + per-km + per-min, with surge multiplier.
 * Rates in paise (1 INR = 100 paise).
 *   Base fare: ₹50
 *   Per km:    ₹12
 *   Per min:   ₹1
 * Surge: 1.0x to 2.0x based on ward driver density (see matching/surge.ts).
 */
export function computeFare(distanceMeters: number, durationSeconds: number, surge = 1.0): number {
  const base = 50_00;
  const perKm = 12_00;
  const perMin = 1_00;
  const km = distanceMeters / 1000;
  const min = durationSeconds / 60;
  return Math.round((base + km * perKm + min * perMin) * surge);
}
