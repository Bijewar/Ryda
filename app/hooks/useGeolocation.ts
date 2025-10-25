// app/hooks/useGeolocation.ts

import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords([pos.coords.latitude, pos.coords.longitude]),
        (err) => setError(err.message)
      );
    } else {
      setError('Geolocation not supported');
    }
  }, []);

  return { coords, error };
};