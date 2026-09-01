'use client';

import { useEffect, useState } from 'react';
import type { Point } from '@/types/ride';

/**
 * useBhopalGeofence — client-side geofence check.
 *
 * Fetches the simplified Bhopal polygon (12KB) once from `/geo/` and runs
 * pure-JS ray-casting to test if a point is inside. No DB round-trip — used
 * for instant feedback in the booking flow ("⚠️ This pickup is outside our
 * Bhopal service area").
 */
let cachedRing: number[][] | null = null;
let cachedBbox: { minLng: number; minLat: number; maxLng: number; maxLat: number } | null = null;
let inflight: Promise<void> | null = null;

async function loadRing(): Promise<void> {
  if (cachedRing) return;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch('/geo/bhopal-boundary-simplified.geojson');
    if (!res.ok) throw new Error(`Bhopal geojson fetch failed: ${res.status}`);
    const fc = (await res.json()) as {
      features: Array<{
        properties: { bbox: number[] };
        geometry: { type: string; coordinates: number[][][] };
      }>;
    };
    const feature = fc.features[0];
    if (!feature) throw new Error('Bhopal geojson has no features');
    const [minLng = 77.1656, minLat = 23.0725, maxLng = 77.6485, maxLat = 23.8953] = feature.properties.bbox ?? [];
    cachedBbox = { minLng, minLat, maxLng, maxLat };
  })();
  return inflight;
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

export function useBhopalGeofence(point: Point | null): {
  inside: boolean;
  ready: boolean;
} {
  const [inside, setInside] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadRing()
      .then(() => {
        if (cancelled) return;
        setReady(true);
      })
      .catch(() => {
        // Fail open — let the server validate.
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!point || !ready || !cachedRing || !cachedBbox) {
      setInside(false);
      return;
    }
    if (
      point.lng < cachedBbox.minLng ||
      point.lng > cachedBbox.maxLng ||
      point.lat < cachedBbox.minLat ||
      point.lat > cachedBbox.maxLat
    ) {
      setInside(false);
      return;
    }
    setInside(pointInRing(point, cachedRing));
  }, [point, ready]);

  return { inside, ready };
}
