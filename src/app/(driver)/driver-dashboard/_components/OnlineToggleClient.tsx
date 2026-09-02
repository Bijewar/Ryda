'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [online, setOnline] = React.useState(initialOnline);
  const [busy, setBusy] = React.useState(false);
  const watchIdRef = React.useRef<number | null>(null);

  // Sync with prop updates
  React.useEffect(() => {
    setOnline(initialOnline);
  }, [initialOnline]);

  // Helper to obtain current driver GPS coordinates
  const getCurrentCoordinates = (): Promise<{ lat: number; lng: number; heading?: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
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
          resolve({ lat: 23.2419, lng: 77.4321, heading: 0 });
        },
        { timeout: 3000, enableHighAccuracy: true },
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

    // Notify all components immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('driver-online-toggle', { detail: { isOnline: next } }));
    }

    try {
      let location: { lat: number; lng: number } = { lat: 23.2419, lng: 77.4321 };
      try {
        if (next) {
          location = await getCurrentCoordinates();
        }
      } catch (_e) {
        location = { lat: 23.2419, lng: 77.4321 };
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
          description: 'Nearby passengers in Bhopal can now request rides.',
        });
      } else {
        stopLocationStreaming();
        toast.success('You are now Offline', {
          description: 'You will not receive new ride requests.',
        });
      }

      router.refresh();
    } catch (err) {
      setOnline(previous); // rollback
      stopLocationStreaming();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('driver-online-toggle', { detail: { isOnline: previous } }));
      }
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
      className={
        online
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-5 py-2.5 rounded-2xl shadow-md cursor-pointer transition-all'
          : 'border-2 border-ryda-border hover:bg-ryda-surface text-ryda-muted font-bold gap-2 px-5 py-2.5 rounded-2xl cursor-pointer transition-all'
      }
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Power className={`w-4 h-4 ${online ? 'text-white' : 'text-ryda-muted'}`} />
      )}
      <span>{online ? 'Online (Accepting Rides)' : 'Go Online'}</span>
    </Button>
  );
}
