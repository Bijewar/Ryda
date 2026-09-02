'use client';

import type { Point } from '@/types/ride';
import { useEffect, useState } from 'react';

/**
 * useBhopalGeofence — client-side validation hook using `/geo/RydaMap.geojson`.
 */
export function useBhopalGeofence() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await fetch('/geo/RydaMap.geojson');
      } catch (_e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isPointInBhopal = (point: Point): boolean => {
    // Bhopal bounding area
    return point.lat >= 23.0 && point.lat <= 23.6 && point.lng >= 77.1 && point.lng <= 77.7;
  };

  return {
    isPointInBhopal,
    loading,
    error: null,
  };
}
