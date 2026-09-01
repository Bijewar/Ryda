'use client';

import * as React from 'react';
import { Loader2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface OnlineToggleProps {
  driverId: string;
  initialOnline: boolean;
}

export default function OnlineToggle({
  driverId,
  initialOnline,
}: OnlineToggleProps): React.ReactElement {
  const [online, setOnline] = React.useState(initialOnline);
  const [busy, setBusy] = React.useState(false);
  const watchIdRef = React.useRef<number | null>(null);

  // Helper to obtain current driver GPS coordinates
  const getCurrentCoordinates = (): Promise<{ lat: number; lng: number; heading?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Fallback to central Bhopal coordinate
        resolve({ lat: 23.2419, lng: 77.4321, heading: 0 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            heading: pos.coords.heading ?? undefined,
          });
        },
        () => {
          // Fallback to central Bhopal coordinate if permission denied
          resolve({ lat: 23.2419, lng: 77.4321, heading: 0 });
        },
        { timeout: 7000, enableHighAccuracy: true },
      );
    });
  };

  // Start periodic GPS streaming while online
  const startLocationStreaming = () => {
    if (watchIdRef.current !== null) return;

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          try {
            await fetch(`/api/drivers/${driverId}/location`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lat: Number(pos.coords.latitude.toFixed(5)),
                lng: Number(pos.coords.longitude.toFixed(5)),
                heading: pos.coords.heading ?? 0,
              }),
            });
          } catch (_e) {
            // Ignore background network blips
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }
  };

  const stopLocationStreaming = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Clean up watcher on unmount
  React.useEffect(() => {
    if (online) {
      startLocationStreaming();
    }
    return () => {
      stopLocationStreaming();
    };
  }, [online, driverId]);

  const toggle = async (): Promise<void> => {
    const next = !online;
    setBusy(true);
    const previous = online;
    setOnline(next); // optimistic update

    try {
      let location: { lat: number; lng: number } | undefined;
      if (next) {
        location = await getCurrentCoordinates();
      }

      const res = await fetch(`/api/drivers/${driverId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: next, location }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        throw new Error(err?.error?.message ?? 'Could not change status');
      }

      if (next) {
        startLocationStreaming();
        toast.success('You are now Online', {
          description: 'Nearby passengers in Bhopal can now see your vehicle and request rides.',
        });
      } else {
        stopLocationStreaming();
        toast.success('You are now Offline', {
          description: 'You will not receive new ride requests.',
        });
      }
    } catch (err) {
      setOnline(previous); // rollback
      stopLocationStreaming();
      toast.error('Status update failed', {
        description: err instanceof Error ? err.message : 'Please check your connection and try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      variant={online ? 'default' : 'outline'}
      aria-pressed={online}
      aria-label={online ? 'Go offline' : 'Go online'}
      className={
        online
          ? 'bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-medium shadow-md'
          : 'border-ryda-border text-ryda-text hover:border-ryda-accent/40'
      }
    >
      {busy ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Power className="mr-1.5 h-4 w-4" aria-hidden="true" />
      )}
      {online ? 'Online (Accepting Rides)' : 'Offline (Tap to Go Online)'}
    </Button>
  );
}
