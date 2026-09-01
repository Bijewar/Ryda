import { env } from '@/lib/env';
import { isDemoMode } from '@/lib/demo-mode';
import { logger } from '@/lib/observability/logger';
import type { Point } from '@/lib/db/postgis';

/**
 * Mapbox API client — directions, geocoding, reverse geocoding.
 *
 * In demo mode (or if no token is set), we fall back to:
 *   - OSRM demo server for routing
 *   - Nominatim (OpenStreetMap) for geocoding + reverse geocoding
 *
 * Both Nominatim and OSRM have generous free tiers suitable for the demo.
 */

const MAPBOX_BASE = 'https://api.mapbox.com';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

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
  bbox?: [number, number, number, number];
}

function hasMapbox(): boolean {
  return !isDemoMode && !!(env as Record<string, unknown>).MAPBOX_TOKEN;
}

/**
 * Get a driving route between two points.
 * Falls back to OSRM if no Mapbox token is configured.
 */
export async function getDirections(pickup: Point, dropoff: Point): Promise<DirectionsResult> {
  if (hasMapbox()) {
    return getDirectionsMapbox(pickup, dropoff);
  }
  return getDirectionsOsrm(pickup, dropoff);
}

async function getDirectionsMapbox(pickup: Point, dropoff: Point): Promise<DirectionsResult> {
  const token = ((env as Record<string, unknown>).MAPBOX_TOKEN as string | undefined) ?? '';
  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `${MAPBOX_BASE}/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox directions failed: ${res.status}`);
  const json = (await res.json()) as {
    routes: Array<{ geometry: { type: 'LineString'; coordinates: number[][] }; distance: number; duration: number }>;
  };
  const route = json.routes[0];
  if (!route) throw new Error('No route found');
  return {
    geometry: route.geometry,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
  };
}

async function getDirectionsOsrm(pickup: Point, dropoff: Point): Promise<DirectionsResult> {
  const coords = `${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?geometries=geojson&overview=full`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM directions failed: ${res.status}`);
  const json = (await res.json()) as {
    routes: Array<{ geometry: { type: 'LineString'; coordinates: number[][] }; distance: number; duration: number }>;
  };
  const route = json.routes[0];
  if (!route) throw new Error('No OSRM route found');
  return {
    geometry: route.geometry,
    distanceMeters: Math.round(route.distance),
    durationSeconds: Math.round(route.duration),
  };
}

/**
 * Forward geocode an address string → coordinates.
 * Falls back to Nominatim if no Mapbox token is configured.
 */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  if (hasMapbox()) {
    return geocodeMapbox(query);
  }
  return geocodeNominatim(query);
}

async function geocodeMapbox(query: string): Promise<GeocodeResult[]> {
  const token = ((env as Record<string, unknown>).MAPBOX_TOKEN as string | undefined) ?? '';
  const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=in&proximity=77.43,23.24&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocode failed: ${res.status}`);
  const json = (await res.json()) as {
    features: Array<{
      place_name: string;
      center: [number, number];
      bbox?: [number, number, number, number];
    }>;
  };
  return (json.features ?? []).map((f) => ({
    address: f.place_name,
    point: { lng: f.center[0], lat: f.center[1] },
    bbox: f.bbox,
  }));
}

async function geocodeNominatim(query: string): Promise<GeocodeResult[]> {
  const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&viewbox=77.16,23.07,77.65,23.90&bounded=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ryda-v2/2.0 (https://github.com/ryda/ryda-v2)' },
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
  return json.map((f) => ({
    address: f.display_name,
    point: { lat: Number(f.lat), lng: Number(f.lon) },
  }));
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
