'use client';

import * as React from 'react';
import { MapView } from '@/components/maps/MapView';
import { BhopalOverlay, useBhopalViewport } from '@/components/maps/BhopalOverlay';
import { DriverMarker } from '@/components/maps/DriverMarker';
import { PassengerMarker } from '@/components/maps/PassengerMarker';
import type { ActiveDriverMarker } from '@/app/api/drivers/active/route';

/**
 * BhopalDashboardMap — passenger dashboard live map.
 *
 * Renders:
 * - Real-time Passenger / User location beacon pin ("You")
 * - Real-time markers for all currently online approved drivers in Bhopal
 * - Bhopal municipal boundary overlay
 */
export default function BhopalDashboardMap(): React.ReactElement {
  const viewport = useBhopalViewport();
  const [drivers, setDrivers] = React.useState<ActiveDriverMarker[]>([]);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number }>({
    lat: 23.2419,
    lng: 77.4321,
  });

  // Track passenger's live GPS location
  React.useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
      },
      () => {
        // Default to central Bhopal landmark if GPS is blocked
        setUserLocation({ lat: 23.2419, lng: 77.4321 });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const fetchActiveDrivers = React.useCallback(async () => {
    try {
      const res = await fetch('/api/drivers/active');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setDrivers(json.data);
        }
      }
    } catch (_e) {
      // Ignore network blips during polling
    }
  }, []);

  // Initial fetch and periodic 8-second refresh
  React.useEffect(() => {
    fetchActiveDrivers();
    const interval = setInterval(fetchActiveDrivers, 8000);
    return () => clearInterval(interval);
  }, [fetchActiveDrivers]);

  // Also listen for real-time WebSocket location events if socket is available
  React.useEffect(() => {
    let socket: any = null;
    let cancelled = false;

    async function initSocket() {
      try {
        const tokenRes = await fetch('/api/auth/ws-token', { credentials: 'include' }).catch(() => null);
        if (!tokenRes || !tokenRes.ok || cancelled) return;
        const { data } = await tokenRes.json();
        const { io } = await import('socket.io-client');
        socket = io('/?XTransformPort=3001', {
          auth: { token: data.token },
          transports: ['websocket', 'polling'],
          reconnection: true,
        });

        socket.on('driver:location', (payload: { driverId: string; lat: number; lng: number; heading?: number }) => {
          if (cancelled) return;
          setDrivers((prev) => {
            const index = prev.findIndex((d) => d.id === payload.driverId);
            const current = prev[index];
            if (index >= 0 && current) {
              const updated = [...prev];
              updated[index] = {
                ...current,
                lat: payload.lat,
                lng: payload.lng,
                heading: payload.heading ?? current.heading,
              };
              return updated;
            }
            return prev;
          });
        });

        socket.on('driver:status', () => {
          fetchActiveDrivers();
        });
      } catch (_e) {
        // Socket.IO optional fallback to polling
      }
    }

    initSocket();
    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
    };
  }, [fetchActiveDrivers]);

  return (
    <MapView
      initialViewState={
        viewport
          ? { longitude: viewport.longitude, latitude: viewport.latitude, zoom: viewport.zoom }
          : { longitude: userLocation.lng, latitude: userLocation.lat, zoom: 12 }
      }
    >
      <BhopalOverlay />

      {/* Real-time Passenger (User Stand / Pickup) Live Beacon Marker */}
      {userLocation && (
        <PassengerMarker
          lng={userLocation.lng}
          lat={userLocation.lat}
          label="You (Pickup)"
        />
      )}

      {/* Real-time Driver Cars on Map */}
      {drivers.map((d) => {
        const variant: 'sedan' | 'suv' | 'auto' =
          d.vehicleType === 'SUV' ? 'suv' :
          d.vehicleType === 'AUTO' ? 'auto' :
          'sedan';
        return (
          <DriverMarker
            key={d.id}
            lng={d.lng}
            lat={d.lat}
            heading={d.heading}
            variant={variant}
          />
        );
      })}
    </MapView>
  );
}
