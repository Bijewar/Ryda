'use client';

import * as React from 'react';
import { Flame, MapPin, Navigation, Sparkles, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export interface DriverDemandCardProps {
  driverId: string;
  isOnline: boolean;
}

export function DriverDemandCard({ driverId, isOnline }: DriverDemandCardProps): React.ReactElement | null {
  const [opportunity, setOpportunity] = React.useState<{
    available: boolean;
    zone?: {
      id: string;
      name: string;
      currentDemandLevel: string;
      predictedDemand10m: string;
      predictedDemand30m: string;
      repositioningIncentive: number;
    };
    distanceMeters?: number;
    incentivePaise?: number;
  } | null>(null);

  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isAccepting, setIsAccepting] = React.useState(false);

  // Poll for AI repositioning suggestions
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
    const interval = setInterval(fetchOpp, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [driverId, isOnline]);

  if (!isOnline || !opportunity?.available || !opportunity.zone || isDismissed) {
    return null;
  }

  const { zone, distanceMeters = 2400, incentivePaise = 3000 } = opportunity;
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
      const json = await res.json();

      toast.success('Repositioning Accepted! 🚀', {
        description: `Head toward ${zone.name}. +${formatCurrency(incentivePaise)} bonus reserved for you!`,
      });
      setIsDismissed(true);
    } catch (err) {
      toast.error('Could not accept', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-ryda-elevated to-ryda-elevated p-4 shadow-lg space-y-3 animate-in fade-in-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-bold">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">AI Demand Nearby</span>
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-[11px] text-ryda-muted">Predicted high ride volume in Bhopal</p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="rounded-lg p-1 text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Target Zone & Distance */}
      <div className="rounded-xl border border-amber-500/20 bg-ryda-surface/80 p-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ryda-text">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>{zone.name}</span>
          </div>
          <p className="text-[11px] text-ryda-muted">
            {distanceKm} km away · Expected: <span className="font-semibold text-amber-400">{zone.predictedDemand30m}</span>
          </p>
        </div>

        {/* Incentive amount badge */}
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-black shadow-sm font-mono">
            +{formatCurrency(incentivePaise)} Bonus
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="flex-1 border-ryda-border text-xs h-9 text-ryda-muted"
        >
          Ignore
        </Button>
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isAccepting}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 gap-1.5 shadow-md"
        >
          <Navigation className="h-3.5 w-3.5" />
          {isAccepting ? 'Confirming…' : 'Move There'}
        </Button>
      </div>
    </div>
  );
}
