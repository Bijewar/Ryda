'use client';

import type { Point } from '@/types/ride';
import { useEffect, useState } from 'react';

/**
 * useGeolocation — wraps `navigator.geolocation.watchPosition` with React state.
 *
 * Returns:
 *   - `location`: the latest lat/lng (or null while loading)
 *   - `error`: a human-readable error string
 *   - `loading`: true until the first reading arrives
 */
export function useGeolocation(options?: PositionOptions): {
  location: Point | null;
  heading: number | null;
  error: string | null;
  loading: boolean;
} {
  const [location, setLocation] = useState<Point | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      setLoading(false);
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setHeading(pos.coords.heading ?? null);
        setError(null);
        setLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please enable location services.',
          2: 'Location unavailable. Check your GPS / network.',
          3: 'Location request timed out. Try again.',
        };
        setError(messages[err.code] ?? err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5_000,
        timeout: 15_000,
        ...options,
      },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [options]);

  return { location, heading, error, loading };
}
