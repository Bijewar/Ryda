'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { RideOfferPayload } from '@/lib/realtime/events';
import { cn, formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import { Check, MapPin, Navigation, Timer, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

/**
 * RideRequestCard — incoming ride request for the driver dashboard.
 *
 * Renders a card showing the ride details (pickup, dropoff, fare, distance)
 * with a 10-second countdown timer. Accept/Reject buttons call back to the
 * parent, which dispatches the corresponding WS events to the server.
 *
 * If the timer hits zero, the parent's `onReject` is called with reason
 * `'TIMEOUT'` so the server can escalate to the next driver in the round.
 */
export interface RideRequestCardProps {
  offer: RideOfferPayload;
  onAccept: (rideId: string) => void | Promise<void>;
  onReject: (rideId: string, reason: 'REJECTED' | 'TIMEOUT') => void | Promise<void>;
  /** Override the countdown (default: 10 seconds). */
  durationSeconds?: number;
  className?: string;
}

export function RideRequestCard({
  offer,
  onAccept,
  onReject,
  durationSeconds = 10,
  className,
}: RideRequestCardProps): React.ReactElement {
  const [remaining, setRemaining] = React.useState(durationSeconds);
  const [busy, setBusy] = React.useState<'accept' | 'reject' | null>(null);

  React.useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          void handleReject('TIMEOUT');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAccept(): Promise<void> {
    setBusy('accept');
    try {
      await onAccept(offer.rideId);
      toast.success('Ride accepted', {
        description: `Heading to ${offer.pickupAddress}…`,
      });
    } catch (err) {
      toast.error('Could not accept ride', {
        description: err instanceof Error ? err.message : 'Try again.',
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(reason: 'REJECTED' | 'TIMEOUT'): Promise<void> {
    setBusy('reject');
    try {
      await onReject(offer.rideId, reason);
    } finally {
      setBusy(null);
    }
  }

  const pct = (remaining / durationSeconds) * 100;
  const isUrgent = remaining <= 3;

  return (
    <Card
      className={cn('w-full border-ryda-accent/40 ring-2 ring-ryda-accent/20', className)}
      data-slot="ride-request-card"
      role="alertdialog"
      aria-labelledby="ride-request-title"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              id="ride-request-title"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ryda-accent/15 text-ryda-accent"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">New ride request</p>
              <p className="text-[11px] text-muted-foreground">
                {offer.passengerName} · {formatDistance(offer.distanceMeters)} ·{' '}
                {formatDuration(offer.durationSeconds)}
              </p>
            </div>
          </div>
          <Badge
            variant={isUrgent ? 'destructive' : 'outline'}
            className="tabular-nums"
            aria-live="polite"
            aria-label={`${remaining} seconds remaining to accept`}
          >
            <Timer className="mr-1 h-3 w-3" aria-hidden="true" />
            {remaining}s
          </Badge>
        </div>
        {/* Countdown bar */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded bg-muted">
          <div
            className={cn(
              'h-full transition-[width] duration-1000 ease-linear',
              isUrgent ? 'bg-destructive' : 'bg-ryda-accent',
            )}
            style={{ width: `${pct}%` }}
            aria-hidden="true"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-3 py-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ryda-accent" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</p>
            <p className="truncate text-sm font-medium" title={offer.pickupAddress}>
              {offer.pickupAddress}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dropoff</p>
            <p className="truncate text-sm font-medium" title={offer.dropoffAddress}>
              {offer.dropoffAddress}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fare</p>
            <p className="text-lg font-bold text-ryda-accent">{formatCurrency(offer.fareAmount)}</p>
          </div>
          {offer.surgeMultiplier > 1 && (
            <Badge variant="secondary" className="text-ryda-accent">
              {offer.surgeMultiplier.toFixed(1)}x surge
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={busy !== null}
          onClick={() => void handleReject('REJECTED')}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Reject
        </Button>
        <Button
          type="button"
          className="flex-1 bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim"
          disabled={busy !== null}
          onClick={() => void handleAccept()}
        >
          {busy === 'accept' ? (
            <Timer className="h-4 w-4 animate-pulse" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
}
