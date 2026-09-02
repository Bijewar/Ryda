import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Banknote, Car, Clock, Star, TrendingUp, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { findDriverByEmailOrId } from '@/lib/db/driverStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import ActiveOfferCardClient from './_components/ActiveOfferCardClient';
import OnlineToggleClient from './_components/OnlineToggleClient';
import { PendingApprovalClient } from './_components/PendingApprovalClient';
import { DriverShiftHistoryClient } from './_components/DriverShiftHistoryClient';

export const metadata: Metadata = {
  title: 'Driver Dashboard — Ryda',
  description: 'Your live ride requests, earnings, and real daily ride history in Bhopal.',
};

export const dynamic = 'force-dynamic';

export default async function DriverDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = session?.user as {
    id: string;
    email?: string | null;
    accountType?: 'PASSENGER' | 'ADMIN';
    driverId?: string;
  } | undefined;

  if (!user) redirect('/login?callbackUrl=/driver-dashboard');

  // Look up driver in driverStore or DB
  const searchKey = user.driverId || user.email || '';
  let driver = await findDriverByEmailOrId(searchKey);

  if (!driver && user.email) {
    driver = await findDriverByEmailOrId(user.email);
  }

  // Fallback: If driver record not found, construct record for logged in user
  if (!driver) {
    const rawName = (session?.user as any)?.name || 'Captain Partner';
    const parts = rawName.split(' ');
    const firstName = parts[0] || 'Captain';
    const lastName = parts.slice(1).join(' ') || 'Partner';

    driver = {
      id: user.driverId || `driver_${user.id}`,
      email: user.email || 'captain@ryda.in',
      phone: '+91 98260 00000',
      firstName,
      lastName,
      licenseNumber: 'MP04-2024-DOCS-SUBMITTED',
      approvalStatus: 'PENDING',
      isOnline: false,
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      ridesHistory: [],
      vehicle: {
        make: 'Hero / Bajaj',
        model: 'Registered Vehicle',
        year: 2023,
        color: 'Black',
        licensePlate: 'MP 04 BC 8899',
        type: 'BIKE',
      },
    };
  }

  // Check Approval Status: If PENDING or REJECTED, show approval status card!
  if (driver.approvalStatus !== 'APPROVED') {
    return <PendingApprovalClient driver={driver} />;
  }

  let activeOffer: any = null;
  let activeOngoingTrip: any = null;

  try {
    const [notif, ongoingTrip] = await Promise.all([
      db.notification.findFirst({
        where: {
          driverId: driver.id,
          type: 'RIDE_REQUEST',
          readAt: null,
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => null),
      db.ride.findFirst({
        where: {
          driverId: driver.id,
          status: { in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] },
        },
        include: { passenger: true },
        orderBy: { requestedAt: 'desc' },
      }).catch(() => null),
    ]);

    if (notif?.data && typeof notif.data === 'object' && (notif.data as any).rideId) {
      activeOffer = notif.data;
    }
    activeOngoingTrip = ongoingTrip;
  } catch (_e) {
    // Resilient offline fallback
  }

  // REAL Daily Shift & Total History Calculation
  const allRides = driver.ridesHistory || [];
  const ridesToday = allRides.filter((r: any) => isToday(r.completedAt));
  const earningsToday = ridesToday.reduce((acc: number, r: any) => acc + (r.fareAmount ?? 0), 0);
  const totalEarnings = allRides.reduce((acc: number, r: any) => acc + (r.fareAmount ?? 0), 0);
  const totalRidesCount = allRides.length;

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header with Captain Identity & Status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ryda-glass rounded-3xl p-6 shadow-xl border border-ryda-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim flex items-center justify-center text-white font-extrabold text-xl shadow-md">
              {driver.firstName[0]}
              {driver.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ryda-text">
                  Captain {driver.firstName} {driver.lastName}
                </h1>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-bold">
                  Verified Captain
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-ryda-muted mt-1">
                <span className="flex items-center gap-1 font-semibold text-amber-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {driver.rating ? driver.rating.toFixed(1) : '5.0'} Rating
                </span>
                <span>•</span>
                <span>{driver.vehicle?.make} {driver.vehicle?.model} ({driver.vehicle?.licensePlate})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <OnlineToggleClient driverId={driver.id} initialOnline={driver.isOnline} />
          </div>
        </div>

        {/* Live Ongoing Trip or New Offer */}
        {activeOngoingTrip ? (
          <div className="rounded-3xl p-6 bg-ryda-surface border-2 border-ryda-accent shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-ryda-border">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider animate-pulse">
                Active Ongoing Ride
              </span>
              <span className="text-sm font-bold text-ryda-accent-dim">
                {activeOngoingTrip.status}
              </span>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ryda-muted font-semibold">PASSENGER</p>
                <p className="text-base font-bold text-ryda-text mt-0.5">{activeOngoingTrip.passenger?.name || 'Passenger'}</p>
                <p className="text-xs text-ryda-muted">{activeOngoingTrip.passenger?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-ryda-muted font-semibold">TRIP FARE</p>
                <p className="text-xl font-extrabold text-ryda-accent-dim mt-0.5">
                  {formatCurrency(activeOngoingTrip.fareAmount || 18000)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ActiveOfferCardClient driverId={driver.id} initialOffer={activeOffer} isOnline={driver.isOnline} />
        )}

        {/* 4 REAL Stat KPIs for the Day & Overall */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Banknote className="h-4 w-4 text-emerald-600" />}
            label="Today's Earnings"
            value={formatCurrency(earningsToday)}
          />
          <StatCard
            icon={<Car className="h-4 w-4 text-blue-600" />}
            label="Today's Rides"
            value={String(ridesToday.length)}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
            label="Total Earnings"
            value={formatCurrency(totalEarnings)}
          />
          <StatCard
            icon={<Clock className="h-4 w-4 text-amber-600" />}
            label="Total Rides"
            value={String(totalRidesCount)}
          />
        </div>

        {/* Real Daily Shift History Ledger */}
        <DriverShiftHistoryClient
          driverId={driver.id}
          initialRides={allRides}
        />

        {/* Vehicle & Documents Info */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="rounded-3xl border-ryda-border bg-ryda-surface p-6 shadow-sm">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Car className="w-4 h-4 text-ryda-accent" />
                Registered Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ryda-border/60 text-sm">
                <span className="text-ryda-muted font-medium">Vehicle Make &amp; Model</span>
                <span className="font-bold text-ryda-text">{driver.vehicle?.make} {driver.vehicle?.model}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ryda-border/60 text-sm">
                <span className="text-ryda-muted font-medium">License Number Plate</span>
                <span className="font-mono font-bold text-ryda-accent-dim">{driver.vehicle?.licensePlate}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ryda-border/60 text-sm">
                <span className="text-ryda-muted font-medium">Vehicle Tier</span>
                <span className="font-bold text-ryda-text uppercase">{driver.vehicle?.type}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-ryda-muted font-medium">Vehicle Color &amp; Year</span>
                <span className="font-bold text-ryda-text">{driver.vehicle?.color} ({driver.vehicle?.year})</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-ryda-border bg-ryda-surface p-6 shadow-sm">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Captain Credentials &amp; Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-ryda-border/60 text-sm">
                <span className="text-ryda-muted font-medium">Driving License</span>
                <span className="font-mono font-bold text-ryda-text">{driver.licenseNumber}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ryda-border/60 text-sm">
                <span className="text-ryda-muted font-medium">Operational Zone</span>
                <span className="font-bold text-emerald-700">Bhopal Municipal Area</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-ryda-muted font-medium">Auto-Payouts</span>
                <span className="font-bold text-ryda-text">Daily at 8:00 PM (UPI)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <Card className="rounded-2xl border-ryda-border bg-ryda-surface shadow-xs p-4">
      <CardContent className="p-0">
        <div className="flex items-center gap-1.5 text-ryda-muted">
          {icon}
          <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
        </div>
        <p className="mt-2 text-lg font-display font-extrabold text-ryda-text tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function isToday(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
