'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { DriverCompletedRide } from '@/lib/db/driverStore';
import { formatCurrency } from '@/lib/utils';
import { Car, CheckCircle2, PlusCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export interface DriverShiftHistoryClientProps {
  driverId: string;
  initialRides: DriverCompletedRide[];
}

export function DriverShiftHistoryClient({
  driverId,
  initialRides,
}: DriverShiftHistoryClientProps): React.ReactElement {
  const router = useRouter();
  const [rides, setRides] = React.useState<DriverCompletedRide[]>(initialRides);
  const [isSimulating, setIsSimulating] = React.useState(false);

  // Filter today's trips
  const isToday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const todayTrips = rides.filter((r) => isToday(r.completedAt));
  const todayEarnings = todayTrips.reduce((acc, r) => acc + (r.fareAmount ?? 0), 0);

  const handleSimulateRide = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/drivers/complete-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.completedRide) {
        setRides((prev) => [json.data.completedRide, ...prev]);
        toast.success('Ride Completed & Saved to DB!', {
          description: `Earned ${formatCurrency(json.data.completedRide.fareAmount)} settled to your daily account.`,
        });
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        toast.error('Failed to record ride');
      }
    } catch (err) {
      toast.error('Network error simulating ride');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card className="rounded-3xl border-ryda-border bg-ryda-surface p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
              Daily Shift Ledger
            </span>
            <span className="text-xs text-ryda-muted">
              📅{' '}
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <h2 className="font-display text-xl font-extrabold text-ryda-text mt-1">
            Today&apos;s Trip History &amp; Settlements
          </h2>
          <p className="text-xs text-ryda-muted">
            All rides completed today with real-time meter fare calculation and instant database
            persistence.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleSimulateRide}
          disabled={isSimulating}
          className="bg-ryda-accent hover:bg-ryda-accent-dim text-white text-xs font-bold rounded-xl px-4 py-2.5 shadow-md flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isSimulating ? 'Recording Trip…' : 'Complete Test Trip (+₹180)'}</span>
        </Button>
      </div>

      {/* Today's List of Trips */}
      <div className="space-y-3">
        {todayTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ryda-border p-8 text-center space-y-2 bg-ryda-elevated/20">
            <div className="w-12 h-12 rounded-full bg-ryda-elevated mx-auto flex items-center justify-center text-ryda-muted">
              <Car className="w-6 h-6" />
            </div>
            <p className="font-bold text-sm text-ryda-text">No rides completed today yet</p>
            <p className="text-xs text-ryda-muted max-w-sm mx-auto">
              Toggle the switch above to go{' '}
              <span className="font-bold text-emerald-700">ONLINE</span> to accept live passenger
              requests, or click &ldquo;Complete Test Trip&rdquo; to test the earnings ledger!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ryda-border/60 border border-ryda-border rounded-2xl overflow-hidden bg-ryda-elevated/20">
            {todayTrips.map((trip) => {
              const timeStr = new Date(trip.completedAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={trip.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ryda-elevated/40 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ryda-text">
                          Trip #{trip.id.slice(0, 8)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 text-[10px] font-bold"
                        >
                          Settled via {trip.paymentMethod || 'UPI'}
                        </Badge>
                        <span className="text-[11px] font-mono text-ryda-muted">{timeStr}</span>
                      </div>
                      <p className="text-xs font-medium text-ryda-text">
                        📍 {trip.pickupAddress}{' '}
                        <span className="text-ryda-accent font-bold">→</span> {trip.dropoffAddress}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-ryda-muted">
                        <span>
                          Passenger:{' '}
                          <strong className="text-ryda-text">{trip.passengerName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Distance: <strong>{trip.distanceKm} km</strong>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">0% Commission</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ryda-muted block">
                      Payout Earned
                    </span>
                    <span className="font-display text-xl font-extrabold text-emerald-700 tabular-nums">
                      +{formatCurrency(trip.fareAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Daily Payouts are 100% automated to your registered UPI ID at 8:00 PM.</span>
        </div>
        <div className="text-emerald-900 font-bold">
          Today&apos;s Total:{' '}
          <span className="font-extrabold text-sm">{formatCurrency(todayEarnings)}</span> (
          {todayTrips.length} {todayTrips.length === 1 ? 'Trip' : 'Trips'})
        </div>
      </div>
    </Card>
  );
}
