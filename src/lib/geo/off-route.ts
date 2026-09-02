import type { Point } from '@/lib/db/postgis';

/**
 * Off-route detection — polyline snapping with a perpendicular distance check.
 *
 * Given the planned route (a GeoJSON LineString of [lng, lat] pairs) and the
 * driver's current location, this returns:
 *   - `onRoute: boolean` — true if the driver is within `thresholdMeters` of
 *     any segment of the route.
 *   - `snappedPoint: Point | null` — the closest point on the route (for
 *     re-centering the navigation view).
 *   - `distanceFromRoute: number` — perpendicular distance in meters.
 *
 * The math is the standard "point-to-segment distance" in planar coordinates.
 * For Bhopal (~500 km²) the equirectangular approximation is good enough at
 * sub-100m precision; we don't need full spherical geodesics.
 */

export interface OffRouteResult {
  onRoute: boolean;
  snappedPoint: Point | null;
  distanceFromRoute: number; // meters
  /** Index of the segment the driver is currently on. */
  segmentIndex: number;
  /** Progress along the route, 0..1. */
  progress: number;
}

const EARTH_RADIUS_M = 6_371_000;
const LAT_PER_DEG_M = 111_320; // ~meters per degree latitude at the equator

function metersPerDegLng(lat: number): number {
  return LAT_PER_DEG_M * Math.cos((lat * Math.PI) / 180);
}

function pointToSegmentDistance(
  p: Point,
  a: Point,
  b: Point,
): {
  distance: number;
  closest: Point;
  t: number;
} {
  // Project into a local planar coordinate system in meters, anchored at p.
  const ax = (a.lng - p.lng) * metersPerDegLng(p.lat);
  const ay = (a.lat - p.lat) * LAT_PER_DEG_M;
  const bx = (b.lng - p.lng) * metersPerDegLng(p.lat);
  const by = (b.lat - p.lat) * LAT_PER_DEG_M;
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((0 - ax) * dx + (0 - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  const distance = Math.sqrt(closestX * closestX + closestY * closestY);
  // Convert back to lat/lng by reversing the projection.
  const closest: Point = {
    lng: p.lng + closestX / metersPerDegLng(p.lat),
    lat: p.lat + closestY / LAT_PER_DEG_M,
  };
  return { distance, closest, t };
}

export function checkOffRoute(
  route: Point[],
  current: Point,
  thresholdMeters = 80,
): OffRouteResult {
  if (route.length < 2) {
    return {
      onRoute: true,
      snappedPoint: null,
      distanceFromRoute: 0,
      segmentIndex: 0,
      progress: 0,
    };
  }
  let best = {
    distance: Number.POSITIVE_INFINITY,
    closest: null as Point | null,
    t: 0,
    segmentIndex: 0,
  };
  let cumulativeLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!;
    const b = route[i]!;
    const segLenM = haversineMeters(a, b);
    segmentLengths.push(segLenM);
    cumulativeLength += segLenM;
  }
  const totalLength = cumulativeLength;
  let traversed = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!;
    const b = route[i]!;
    const { distance, closest, t } = pointToSegmentDistance(current, a, b);
    if (distance < best.distance) {
      const segLen = segmentLengths[i - 1] ?? 0;
      best = { distance, closest, t, segmentIndex: i - 1 };
      // Approximate progress: traversed + t * segmentLength / totalLength
      best.t = (traversed + t * segLen) / (totalLength || 1);
    }
    traversed += segmentLengths[i - 1] ?? 0;
  }
  return {
    onRoute: best.distance <= thresholdMeters,
    snappedPoint: best.closest,
    distanceFromRoute: best.distance,
    segmentIndex: best.segmentIndex,
    progress: best.t,
  };
}

function haversineMeters(a: Point, b: Point): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
