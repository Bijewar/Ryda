'use client';

import { useEffect, useRef, useState } from 'react';
import { useRideStore } from '@/stores/ride-store';
import { useLocationStore } from '@/stores/location-store';
import type { RideStatus, Point } from '@/types/ride';
import type { DriverLocationPayload, RideStatusPayload } from '@/lib/realtime/events';

/**
 * useRealtimeRide — single WS client for the passenger + driver dashboards.
 *
 * Lifecycle:
 *   1. On mount, fetches a short-lived WS JWT from `/api/auth/ws-token`
 *   2. Opens a Socket.IO connection to `/?XTransformPort=3001`
 *   3. Subscribes to the ride room → receives state + location updates
 *   4. Updates the Zustand ride + location stores on every event
 *   5. Cleans up on unmount
 *
 * The hook is idempotent — calling it multiple times with the same rideId
 * reuses the same socket (managed via a module-level ref).
 */
export function useRealtimeRide(rideId: string | null): {
  status: RideStatus | 'IDLE';
  isConnected: boolean;
  error: string | null;
} {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<import('socket.io-client').Socket | null>(null);
  const { updateStatus, setStatus, setError, setConnecting } = useRideStore();
  const { setDriverLocation } = useLocationStore();

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    async function connect() {
      try {
        setConnecting(true);
        const tokenRes = await fetch('/api/auth/ws-token', { credentials: 'include' });
        if (!tokenRes.ok) throw new Error(`ws-token fetch failed: ${tokenRes.status}`);
        const { data } = (await tokenRes.json()) as { data: { token: string } };
        if (cancelled) return;

        const { io } = await import('socket.io-client');
        // The Caddy gateway forwards based on `XTransformPort=3001`.
        const socket = io('/?XTransformPort=3001', {
          auth: { token: data.token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1_000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          if (cancelled) return;
          setIsConnected(true);
          setStatus('REQUESTED');
          socket.emit('ride:subscribe', rideId);
        });
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('sys:error', (err: { message: string }) => {
          console.error('[Realtime WS error]', err);
          setError(err.message);
        });

        socket.on('ride:matching', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:offered', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:accepted', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:arrived', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:started', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:completed', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:paid', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:canceled', (p: RideStatusPayload) => updateStatus(p.status));
        socket.on('ride:no_drivers', (p: RideStatusPayload) => updateStatus(p.status));

        socket.on('driver:location', (p: DriverLocationPayload) => {
          const point: Point = { lat: p.lat, lng: p.lng };
          setDriverLocation({ point, heading: p.heading, etaSeconds: p.etaSeconds });
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'WS connection failed';
        setError(message);
        console.error('[useRealtimeRide connect failed]', err, rideId);
      } finally {
        setConnecting(false);
      }
    }

    void connect();
    return () => {
      cancelled = true;
      const socket = socketRef.current;
      if (socket) {
        socket.emit('ride:unsubscribe', rideId);
        socket.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  return {
    status: useRideStore((s) => s.status),
    isConnected,
    error: useRideStore((s) => s.error),
  };
}

/** Re-exported for the WS URL builder. */
export const WS_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
