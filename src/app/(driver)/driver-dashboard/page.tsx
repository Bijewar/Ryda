import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Banknote, Car, Clock, Star, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { getDriverEarnings } from '@/server/services/driver-service';
import { calculateDriverReliability } from '@/server/services/reliability-service';
import { DriverReliabilityBadge } from '@/components/driver/DriverReliabilityBadge';
import { RideRequestCard } from '@/components/driver/RideRequestCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Driver dashboard',
  description: 'Your live ride requests, earnings, and ride history.',
};

export const dynamic = 'force-dynamic';

/**
 * Driver dashboard — entry point for an authenticated driver.
 *
 * Renders:
 *   - Online/offline toggle (driven by `driver.isOnline`)
 *   - Reliability score & monthly cancellation allowance badge
 *   - Live ride-request card / active trip lifecycle / AI Demand card
 *   - Earnings summary (today + 30-day total)
 *   - Recent rides list
 *   - Bhopal map (lazy)
 */
export default async function DriverDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = (session?.user as {
    id: string;
    accountType: 'PASSENGER' | 'ADMIN';
    driverId?: string;
  } | undefined) ?? (process.env.DEMO_MODE === 'true' ? {
    id: 'demo-user-imran',
    accountType: 'PASSENGER' as const,
    driverId: 'demo-driver-imran',
  } : undefined);

  if (!user) redirect('/login?callbackUrl=/driver-dashboard');

  if (user.accountType === 'ADMIN') redirect('/admin');
  if (!user.driverId) redirect('/dashboard');

  let driver: any = null;
  let activeOffer: any = null;
  let earnings: any = { total: 4250000, count: 142, rides: [], avgFare: 29900 };
  let recentRides: any[] = [];
  let reliabilityStats: any = null;

  try {
    driver = await db.driver.findUnique({
      where: { id: user.driverId },
      include: { vehicle: true },
    });
  } catch (_e) {
    // Offline fallback
  }

  if (!driver && process.env.DEMO_MODE === 'true') {
    driver = {
      id: 'demo-driver-imran',
      firstName: 'Imran',
      lastName: 'Khan',
      licenseNumber: 'MP04-20210049281',
      approvalStatus: 'APPROVED',
      isOnline: true,
      rating: 4.9,
      totalRides: 142,
      reliabilityScore: 96,
      cancellationsThisMonth: 2,
      isReliableDriver: true,
      earningsBonusRate: 0.02,
      vehicle: {
        make: 'Maruti Suzuki',
        model: 'Swift Dzire',
        color: 'White',
        licensePlate: 'MP 04 AB 1234',
        type: 'SEDAN',
      },
    };
  }

  if (!driver) redirect('/dashboard');
  if (driver.approvalStatus !== 'APPROVED') {
    return <PendingApproval firstName={driver.firstName} status={driver.approvalStatus} />;
  }

  let activeOngoingTrip: any = null;
  try {
    const [notif, ongoingTrip, earn, recent, relStats] = await Promise.all([
      db.notification.findFirst({
        where: {
          driverId: driver.id,
          type: 'RIDE_REQUEST',
          readAt: null,
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.ride.findFirst({
        where: {
          driverId: driver.id,
          status: { in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] },
        },
        orderBy: { requestedAt: 'desc' },
        include: { passenger: { select: { name: true } } },
      }),
      getDriverEarnings(driver.id, 30),
      db.ride.findMany({
        where: { driverId: driver.id },
        orderBy: { requestedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          pickupAddress: true,
          dropoffAddress: true,
          fareAmount: true,
          completedAt: true,
        },
      }),
      calculateDriverReliability(driver.id).catch(() => null),
    ]);
    activeOffer = notif;
    activeOngoingTrip = ongoingTrip;
    earnings = earn;
    recentRides = recent;
    reliabilityStats = relStats;
  } catch (_e) {
    // Demo mode fallback
  }

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">
              Hi, {driver.firstName}
            </h1>
            <p className="text-sm text-ryda-muted">
              {driver.isOnline ? 'You are online — receiving ride requests.' : 'You are offline.'}
            </p>
          </div>
          <OnlineToggle initialOnline={driver.isOnline} driverId={driver.id} />
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Left: stats + map + history */}
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Today"
                value={formatCurrency(
                  earnings.rides
                    .filter((r: { completedAt: Date | null }) => isToday(r.completedAt))
                    .reduce((s: number, r: { fareAmount: number }) => s + r.fareAmount, 0),
                )}
                icon={<Banknote className="h-4 w-4" />}
              />
              <StatCard
                label="30 days"
                value={formatCurrency(earnings.total)}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatCard
                label="Rides"
                value={String(driver.totalRides)}
                icon={<Car className="h-4 w-4" />}
              />
              <StatCard
                label="Rating"
                value={`${driver.rating.toFixed(1)} ★`}
                icon={<Star className="h-4 w-4" />}
              />
            </div>

            {/* Recent rides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-ryda-accent" aria-hidden="true" />
                  Recent rides
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRides.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ryda-muted">
                    No rides yet — go online to start receiving requests.
                  </p>
                ) : (
                  <ul className="divide-y divide-ryda-border">
                    {recentRides.map((ride) => (
                      <li key={ride.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{ride.pickupAddress}</p>
                          <p className="truncate text-xs text-ryda-muted">{ride.dropoffAddress}</p>
                          <p className="text-[10px] text-ryda-muted">
                            {formatDate(ride.requestedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-ryda-accent">
                            {formatCurrency(ride.fareAmount, ride.currency)}
                          </p>
                          <Badge variant="outline">{ride.status}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Vehicle */}
            {driver.vehicle && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your vehicle</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {driver.vehicle.make} {driver.vehicle.model}
                    </p>
                    <p className="text-xs text-ryda-muted">
                      {driver.vehicle.year} · {driver.vehicle.color}
                    </p>
                  </div>
                  <p className="font-mono text-sm text-ryda-accent">
                    {driver.vehicle.licensePlate}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: reliability + ride request + earnings detail */}
          <div className="space-y-4">
            <DriverReliabilityBadge stats={reliabilityStats} />

            <ActiveOfferCard
              driverId={driver.id}
              isOnline={driver.isOnline}
              monthlyCancellationsUsed={reliabilityStats?.cancellationsThisMonth ?? 0}
              cancellationAllowance={reliabilityStats?.cancellationAllowance ?? 15}
              initialActiveTrip={
                activeOngoingTrip
                  ? {
                      rideId: activeOngoingTrip.id,
                      passengerName: activeOngoingTrip.passenger?.name ?? 'Passenger',
                      pickupAddress: activeOngoingTrip.pickupAddress,
                      dropoffAddress: activeOngoingTrip.dropoffAddress,
                      distanceMeters: activeOngoingTrip.distanceMeters,
                      durationSeconds: activeOngoingTrip.durationSeconds,
                      fareAmount: activeOngoingTrip.fareAmount,
                      surgeMultiplier: activeOngoingTrip.surgeMultiplier,
                      status: activeOngoingTrip.status as 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS',
                      paymentMethod: activeOngoingTrip.paymentMethod,
                    }
                  : null
              }
              initialOffer={
                activeOffer
                  ? {
                      rideId: (activeOffer.data as { rideId?: string })?.rideId ?? '',
                      passengerName: (activeOffer.data as { passengerName?: string })?.passengerName ?? 'Passenger',
                      pickupAddress: (activeOffer.data as { pickupAddress?: string })?.pickupAddress ?? '',
                      dropoffAddress: (activeOffer.data as { dropoffAddress?: string })?.dropoffAddress ?? '',
                      distanceMeters: (activeOffer.data as { distanceMeters?: number })?.distanceMeters ?? 0,
                      durationSeconds: (activeOffer.data as { durationSeconds?: number })?.durationSeconds ?? 0,
                      fareAmount: (activeOffer.data as { fareAmount?: number })?.fareAmount ?? 0,
                      surgeMultiplier: (activeOffer.data as { surgeMultiplier?: number })?.surgeMultiplier ?? 1,
                      expiresAt: (activeOffer.data as { expiresAt?: string })?.expiresAt ?? new Date(Date.now() + 15_000).toISOString(),
                    }
                  : null
              }
            />

            {/* 30-day earnings detail */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Last 30 days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Row label="Total earnings" value={formatCurrency(earnings.total)} />
                <Row label="Rides completed" value={String(earnings.count)} />
                <Row label="Average fare" value={formatCurrency(earnings.avgFare)} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}): React.ReactElement {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-ryda-muted">
          {icon}
          <span className="text-[10px] uppercase tracking-wider">{label}</span>
        </div>
        <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ryda-muted">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function PendingApproval({
  firstName,
  status,
}: {
  firstName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}): React.ReactElement {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Hi {firstName},</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-ryda-muted">
          {status === 'PENDING' && (
            <p>
              Your driver account is pending approval from our admin team. You&apos;ll
              receive an email once approved (usually within 24 hours).
            </p>
          )}
          {status === 'REJECTED' && (
            <p>
              Your driver application was not approved. Please contact support for
              more information.
            </p>
          )}
          <Link href="/">
            <Button variant="outline" className="border-ryda-border text-ryda-text">
              Back to home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

// Client-side subcomponents live below — they need browser APIs (forms, WS).
import ActiveOfferCardClient from './_components/ActiveOfferCardClient';
import OnlineToggleClient from './_components/OnlineToggleClient';

const ActiveOfferCard = ActiveOfferCardClient;
const OnlineToggle = OnlineToggleClient;

// ── Helpers ─────────────────────────────────────────────────────────────────
function isToday(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}
