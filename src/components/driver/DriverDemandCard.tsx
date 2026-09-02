'use client';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import {
  ExternalLink,
  MapPin,
  Navigation,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface DriverDemandCardProps {
  driverId: string;
  isOnline: boolean;
}

export function DriverDemandCard({
  driverId,
  isOnline,
}: DriverDemandCardProps): React.ReactElement | null {
  const [opportunity, setOpportunity] = React.useState<{
    available: boolean;
    isOuterDropoffZone: boolean;
    dropoffAddress?: string;
    reason?: string;
    zone?: {
      id: string;
      name: string;
      currentDemandLevel: string;
      predictedDemand10m: string;
      predictedDemand30m: string;
      repositioningIncentive: number;
      centerLat?: number;
      centerLng?: number;
    };
    distanceMeters?: number;
    incentivePaise?: number;
  } | null>(null);

  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);

  // Poll for AI outer-zone repositioning suggestions
  React.useEffect(() => {
    if (!isOnline) {
      setOpportunity(null);
      return;
    }

    let isMounted = true;
    const fetchOpp = async () => {
      try {
        const res = await fetch(`/api/drivers/${driverId}/repositioning`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.data && isMounted) {
          setOpportunity(json.data);
        }
      } catch (_e) {
        // network retry
      }
    };

    void fetchOpp();
    const interval = setInterval(fetchOpp, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [driverId, isOnline]);

  if (!isOnline) {
    return null;
  }

  // ── State 1: Dropoff is in an Outer / Low-Demand Area (Dead-Mileage Protection) ──
  if (
    opportunity?.available &&
    opportunity.isOuterDropoffZone &&
    opportunity.zone &&
    !isDismissed
  ) {
    const { zone, distanceMeters = 8500, incentivePaise = 5500, dropoffAddress } = opportunity;
    const distanceKm = (distanceMeters / 1000).toFixed(1);

    const handleAccept = async () => {
      setIsAccepting(true);
      try {
        const res = await fetch(`/api/drivers/${driverId}/repositioning`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zoneId: zone.id }),
        });

        if (!res.ok) throw new Error('Failed to confirm repositioning');

        toast.success('Return Repositioning Bonus Claimed! 🚀', {
          description: `Head toward ${zone.name}. +${formatCurrency(incentivePaise)} guaranteed on your next pickup!`,
        });
        setIsDismissed(true);
      } catch (err) {
        toast.error('Could not claim bonus', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      } finally {
        setIsAccepting(false);
      }
    };

    return (
      <div className="rounded-3xl border-2 border-amber-500 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 shadow-xl space-y-4 animate-in fade-in-50">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white font-black shadow-md">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg">
                  Outer Area Detected
                </span>
                <span className="text-xs font-bold text-amber-700">Dead-Mileage Protection</span>
              </div>
              <p className="font-display font-black text-base text-ryda-text mt-0.5">
                AI Return Bonus: +{formatCurrency(incentivePaise)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-ryda-muted hover:text-ryda-text hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Outer Zone Explanation */}
        <div className="rounded-2xl bg-white border border-amber-200/80 p-3.5 text-xs space-y-2 text-left shadow-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-ryda-muted uppercase block">
                Outer Dropoff Location
              </span>
              <span className="font-bold text-ryda-text">
                {dropoffAddress || 'Outer City / Peripheral Zone'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-amber-900 font-medium pt-1 border-t border-amber-100">
            💡 Because this destination is in an outer area with fewer ride bookings, Ryda AI awards
            you a{' '}
            <strong className="text-emerald-700">+{formatCurrency(incentivePaise)} payout</strong>{' '}
            to drive back towards the central commercial core.
          </p>
        </div>

        {/* Destination Hotspot Target */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs">
            <Navigation className="w-4 h-4 text-emerald-700" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                Recommended Hotspot
              </span>
              <span className="font-bold text-emerald-950">
                {zone.name} (~{distanceKm} km)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
              +{formatCurrency(incentivePaise)} Bonus
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-xs gap-1.5 shadow-md cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Claim +{formatCurrency(incentivePaise)} Return Bonus
          </Button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(zone.name + ', Bhopal')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-3 px-3 rounded-xl border border-ryda-border bg-white hover:bg-ryda-surface text-xs font-bold text-ryda-text transition-all shadow-xs"
          >
            <Navigation className="w-3.5 h-3.5 text-ryda-accent" />
            <span>Navigate to Hotspot</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>
    );
  }

  // ── State 2: Inside City Center Core (High Demand — No Dead Mileage Bonus Needed) ──
  return (
    <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/50 p-4 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display font-bold text-xs text-emerald-950">City Core Service Zone</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            You are in a high-density area. Regular ride requests active.
          </p>
        </div>
      </div>
      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
        Active Dispatch
      </span>
    </div>
  );
}
