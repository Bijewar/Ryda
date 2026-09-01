import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { BookingFlow } from '@/components/ride/BookingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { formatCurrency, formatDate, formatDistance } from '@/lib/utils';
import type { RideStatus } from '@/types/ride';

export const metadata: Metadata = {
  title: 'Book a ride',
  description: 'Book a ride across Bhopal — pickup, dropoff, fare estimate in seconds.',
};

export const dynamic = 'force-dynamic';

/**
 * Passenger dashboard — entry point for an authenticated passenger.
 *
 * Renders:
 *   - The booking flow card (left column on desktop, top on mobile)
 *   - A live Bhopal map (loaded lazily — adds 0 KB to initial JS if the user
 *     never scrolls to it)
 *   - Recent rides list (last 5)
 *
 * Drivers are redirected to `/driver-dashboard` (their dashboard is a
 * different surface). Admins are redirected to `/admin`.
 */
export default async function PassengerDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = (session?.user as {
    id: string;
    accountType: 'PASSENGER' | 'ADMIN';
    driverId?: string;
  } | undefined) ?? (process.env.DEMO_MODE === 'true' ? {
    id: 'demo-user-aarav',
    accountType: 'PASSENGER' as const,
  } : undefined);

  if (!user) redirect('/login?callbackUrl=/dashboard');

  if (user.accountType === 'ADMIN') redirect('/admin');
  if (user.driverId) redirect('/driver-dashboard');

  // Active ongoing ride for this passenger (restored on refresh)
  let activeRide: any = null;
  // Last 5 rides for this passenger — used to render the "recent rides" list.
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Book a ride</h1>
            <p className="text-sm text-ryda-muted">
              Where in Bhopal are you headed today?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="/history"
              className="inline-flex items-center gap-1 text-sm text-ryda-accent hover:underline"
            >
              View ride history <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* Booking flow column */}
          <div className="space-y-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-ryda-accent" aria-hidden="true" />
                  Recent rides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentRides.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ryda-muted">
                    No rides yet — book your first one above.
                  </p>
                ) : (
                  <ul className="divide-y divide-ryda-border">
                    {recentRides.map((ride) => (
                      <li key={ride.id}>
                        <Link
                          href={`/rides/${ride.id}`}
                          className="flex items-center justify-between gap-3 py-2.5 hover:bg-ryda-elevated/40"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0 text-ryda-accent" aria-hidden="true" />
                              <span className="truncate text-sm font-medium">
                                {ride.pickupAddress}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-ryda-muted">
                              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="truncate text-xs">{ride.dropoffAddress}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-ryda-muted">
                              {formatDate(ride.requestedAt)}
                              {ride.distanceMeters > 0 && (
                                <> · {formatDistance(ride.distanceMeters)}</>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-ryda-accent">
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
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bhopal service area</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[420px] sm:h-[560px]">
                <LazyBhopalMap />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function RideStatusBadge({ status }: { status: RideStatus }): React.ReactElement {
  const map: Partial<Record<RideStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>> = {
    COMPLETED: { label: 'Completed', variant: 'secondary' },
    PAID: { label: 'Paid', variant: 'default' },
    CANCELED: { label: 'Canceled', variant: 'destructive' },
    IN_PROGRESS: { label: 'In progress', variant: 'default' },
    ACCEPTED: { label: 'Driver en route', variant: 'default' },
    REQUESTED: { label: 'Searching…', variant: 'outline' },
    NO_DRIVERS: { label: 'No drivers', variant: 'destructive' },
  };
  const cfg = map[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

import BhopalDashboardMap from './_components/BhopalDashboardMap';
const LazyBhopalMap = BhopalDashboardMap;
