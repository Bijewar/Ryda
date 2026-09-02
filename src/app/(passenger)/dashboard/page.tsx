import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Clock, MapPin, Sparkles } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { BookingFlow } from '@/components/ride/BookingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatDistance, cn } from '@/lib/utils';
import type { RideStatus } from '@/types/ride';
import BhopalDashboardMap from './_components/BhopalDashboardMap';

export const metadata: Metadata = {
  title: 'Book a ride — Ryda',
  description: 'Book a ride across Bhopal — pickup, dropoff, fare estimate in seconds.',
};

export const dynamic = 'force-dynamic';

export default async function PassengerDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = (session?.user as {
    id: string;
    accountType: 'PASSENGER' | 'ADMIN';
    driverId?: string;
  } | undefined) ?? {
    id: 'demo-user-aarav',
    accountType: 'PASSENGER' as const,
  };

  if (user.accountType === 'ADMIN') redirect('/admin');
  if (user.driverId) redirect('/driver-dashboard');

  // Active ongoing ride for this passenger (restored on refresh)
  let activeRide: any = null;
  let recentRides: any[] = [];
  try {
    const [ongoing, recent] = await Promise.all([
      db.ride.findFirst({
        where: {
          passengerId: user.id,
          status: { in: ['REQUESTED', 'MATCHING', 'OFFERED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] },
        },
        orderBy: { requestedAt: 'desc' },
        include: { driver: { include: { vehicle: true } } },
      }),
      db.ride.findMany({
        where: { passengerId: user.id },
        orderBy: { requestedAt: 'desc' },
        take: 5,
        include: { driver: { include: { vehicle: true } } },
      }),
    ]);
    activeRide = ongoing;
    recentRides = recent;
  } catch (_e) {
    activeRide = null;
    recentRides = [];
  }

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ryda-accent/10 text-ryda-accent-dim text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Bhopal Active Radar
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ryda-text">
              Where to today?
            </h1>
            <p className="text-sm text-ryda-muted mt-1">
              Real-time matching across Bhopal with zero cancellation hassle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ryda-accent-dim hover:text-ryda-text transition-colors bg-ryda-surface border border-ryda-border px-4 py-2 rounded-xl shadow-xs"
            >
              <Clock className="h-4 w-4 text-ryda-accent" />
              Ride History <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
          {/* Booking flow column */}
          <div className="space-y-6">
            <BookingFlow
              initialActiveRide={
                activeRide
                  ? {
                      id: activeRide.id,
                      fareAmount: activeRide.fareAmount,
                      pickupAddress: activeRide.pickupAddress,
                      dropoffAddress: activeRide.dropoffAddress,
                      paymentMethod: activeRide.paymentMethod,
                      distanceMeters: activeRide.distanceMeters,
                      durationSeconds: activeRide.durationSeconds,
                      status: activeRide.status,
                      driver: activeRide.driver
                        ? {
                            id: activeRide.driver.id,
                            name: `${activeRide.driver.firstName} ${activeRide.driver.lastName}`,
                            phone: activeRide.driver.phone,
                            vehicle: `${activeRide.driver.vehicle?.make ?? 'Car'} ${activeRide.driver.vehicle?.model ?? ''}`,
                            licensePlate: activeRide.driver.vehicle?.licensePlate ?? 'MP 04 AB 1234',
                            rating: activeRide.driver.rating,
                          }
                        : null,
                    }
                  : null
              }
            />

            {/* Recent rides */}
            <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md overflow-hidden">
              <CardHeader className="pb-3 border-b border-ryda-border/60">
                <CardTitle className="flex items-center gap-2 text-base font-display font-bold text-ryda-text">
                  <Clock className="h-4 w-4 text-ryda-accent" aria-hidden="true" />
                  Recent rides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {recentRides.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ryda-muted">
                    No rides yet — book your first one above.
                  </p>
                ) : (
                  <ul className="divide-y divide-ryda-border/60">
                    {recentRides.map((ride) => (
                      <li key={ride.id}>
                        <Link
                          href={`/rides/${ride.id}`}
                          className="flex items-center justify-between gap-3 py-3 hover:bg-ryda-elevated/40 rounded-xl px-2 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0 text-ryda-accent" aria-hidden="true" />
                              <span className="truncate text-sm font-semibold text-ryda-text">
                                {ride.pickupAddress}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-ryda-muted mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0 text-destructive" aria-hidden="true" />
                              <span className="truncate text-xs">{ride.dropoffAddress}</span>
                            </div>
                            <p className="mt-1 text-[11px] text-ryda-muted font-medium">
                              {formatDate(ride.requestedAt)}
                              {ride.distanceMeters > 0 && (
                                <> · {formatDistance(ride.distanceMeters)}</>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-ryda-accent-dim">
                              {formatCurrency(ride.fareAmount, ride.currency)}
                            </p>
                            <RideStatusBadge status={ride.status as RideStatus} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map column */}
          <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-ryda-border/60 bg-ryda-elevated/20">
              <CardTitle className="text-base font-display font-bold text-ryda-text flex items-center justify-between">
                <span>Bhopal Service Area &amp; Drivers</span>
                <span className="text-xs font-normal text-ryda-accent-dim flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-ryda-accent animate-ping inline-block" />
                  Live GPS
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[480px] sm:h-[680px]">
                <BhopalDashboardMap />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function RideStatusBadge({ status }: { status: RideStatus }): React.ReactElement {
  const map: Partial<Record<RideStatus, { label: string; className: string }>> = {
    COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
    PAID: { label: 'Paid', className: 'bg-emerald-100 text-emerald-800' },
    CANCELED: { label: 'Canceled', className: 'bg-rose-100 text-rose-800' },
    IN_PROGRESS: { label: 'In progress', className: 'bg-sky-100 text-sky-800' },
    ACCEPTED: { label: 'Driver en route', className: 'bg-amber-100 text-amber-800' },
    REQUESTED: { label: 'Searching…', className: 'bg-stone-100 text-stone-800' },
    NO_DRIVERS: { label: 'No drivers', className: 'bg-rose-100 text-rose-800' },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-stone-100 text-stone-800' };
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1', cfg.className)}>{cfg.label}</span>;
}
