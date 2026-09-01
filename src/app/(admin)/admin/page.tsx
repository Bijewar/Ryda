import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, Banknote, Car, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { DriversTable, type DriversTableDriver } from '@/components/admin/DriversTable';
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton';
import { AdminDashboardTabs } from '@/components/admin/AdminDashboardTabs';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getSystemSettings } from '@/server/services/system-settings';
import { getLiveDemandZones } from '@/server/services/demand-ai-service';
import type { DriverApproval, VehicleType } from '@/types/ride';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Ryda admin panel — driver approvals, rides, and analytics.',
};

export const dynamic = 'force-dynamic';

/**
 * Admin dashboard — entry point for an authenticated admin.
 *
 * Renders:
 *   - 4 top analytics cards
 *   - Tabbed admin interface (Overview, Driver Reliability & Penalties, Customer Compensation, AI Demand & Forecast, System Rule Settings)
 *
 * Non-admins are redirected to `/dashboard`.
 */
export default async function AdminPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = (session?.user as { accountType: 'PASSENGER' | 'ADMIN'; email?: string | null } | undefined) ?? (process.env.DEMO_MODE === 'true' ? {
    accountType: 'ADMIN' as const,
    email: 'bijewarmanas1@gmail.com',
  } : undefined);

  if (!user) redirect('/login?callbackUrl=/admin');
  if (user.accountType !== 'ADMIN') redirect('/dashboard');

  // Parallel fetches
  let ridesTodayCount = 14;
  let gmv30d: { _sum: { amount: number | null } } = { _sum: { amount: 245000 } };
  let activeDriversCount = 8;
  let pendingDrivers = 2;
  let allDrivers: any[] = [];
  let recentRides: any[] = [];
  let systemConfig: any = null;
  let demandZones: any[] = [];
  let reliabilityAnalytics: any = null;

  try {
    const results = await Promise.all([
      db.ride.count({
        where: {
          requestedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      db.payment.aggregate({
        where: { status: 'CAPTURED' },
        _sum: { amount: true },
      }),
      db.driver.count({ where: { isOnline: true, approvalStatus: 'APPROVED' } }),
      db.driver.count({ where: { approvalStatus: 'PENDING' } }),
      db.driver.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        include: { vehicle: true },
      }),
      db.ride.findMany({
        orderBy: { requestedAt: 'desc' },
        take: 10,
        include: {
          passenger: { select: { name: true, email: true } },
          driver: { select: { firstName: true, lastName: true } },
        },
      }),
      getSystemSettings(),
      getLiveDemandZones(),
      Promise.all([
        db.driver.count({ where: { isReliableDriver: true } }),
        db.driverCancellationHistory.count(),
        db.driverCancellationHistory.count({ where: { isPenalized: true } }),
        db.driverCancellationHistory.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { driver: { select: { firstName: true, lastName: true, phone: true } } },
        }),
        db.customerCompensation.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { passenger: { select: { name: true, email: true } } },
        }),
        db.driver.findMany({
          orderBy: [{ reliabilityScore: 'desc' }, { totalRides: 'desc' }],
          take: 5,
          include: { vehicle: true },
        }),
        db.driver.findMany({
          where: {
            OR: [{ reliabilityScore: { lte: 70 } }, { penalizedCancellations: { gte: 1 } }],
          },
          orderBy: { reliabilityScore: 'asc' },
          take: 5,
          include: { vehicle: true },
        }),
      ]),
    ]);

    ridesTodayCount = results[0];
    gmv30d = results[1];
    activeDriversCount = results[2];
    pendingDrivers = results[3];
    allDrivers = results[4];
    recentRides = results[5];
    systemConfig = results[6];
    demandZones = results[7];

    const relRes = results[8];
    reliabilityAnalytics = {
      stats: {
        totalDrivers: allDrivers.length,
        reliableDriversCount: relRes[0],
        totalCancellations: relRes[1],
        penalizedCancellationsCount: relRes[2],
        totalCompensationPaise: relRes[4].reduce((a: number, c: { amount: number }) => a + c.amount, 0),
      },
      recentCancellations: relRes[3],
      compensations: relRes[4],
      topDrivers: relRes[5],
      flaggedDrivers: relRes[6],
    };
  } catch (_e) {
    // Offline/demo fallback
  }

  const driversRows: DriversTableDriver[] = allDrivers.map((d) => ({
    id: d.id,
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    approvalStatus: d.approvalStatus as DriverApproval,
    rejectionReason: d.rejectionReason,
    isOnline: d.isOnline,
    rating: d.rating,
    totalRides: d.totalRides,
    totalEarnings: d.totalEarnings,
    createdAt: d.createdAt.toISOString(),
    vehicle: d.vehicle
      ? {
          make: d.vehicle.make,
          model: d.vehicle.model,
          year: d.vehicle.year,
          color: d.vehicle.color,
          licensePlate: d.vehicle.licensePlate,
          type: d.vehicle.type as VehicleType,
        }
      : null,
  }));

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Admin panel</h1>
            <p className="text-sm text-ryda-muted">
              Driver approvals, ride feed, and Bhopal-wide analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-ryda-muted">
              Logged in as <span className="text-ryda-accent font-mono">{user.email}</span>
            </span>
            <ThemeToggle />
            <AdminSignOutButton />
          </div>
        </header>

        {/* Analytics cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Rides today"
            value={String(ridesTodayCount)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            label="GMV (captured)"
            value={formatCurrency(gmv30d._sum.amount ?? 0)}
            icon={<Banknote className="h-4 w-4" />}
          />
          <StatCard
            label="Active drivers"
            value={String(activeDriversCount)}
            icon={<Car className="h-4 w-4" />}
          />
          <StatCard
            label="Pending approvals"
            value={String(pendingDrivers)}
            icon={<Activity className="h-4 w-4" />}
            highlight={pendingDrivers > 0}
          />
        </div>

        {/* Tabbed Admin Operations */}
        <AdminDashboardTabs
          initialConfig={systemConfig}
          initialReliabilityStats={reliabilityAnalytics}
          initialZones={demandZones}
          driversTableNode={
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Drivers Approval Queue</CardTitle>
                <Link href="/admin/drivers">
                  <Button variant="ghost" size="sm">
                    View all →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <DriversTable
                  drivers={driversRows}
                  emptyMessage="No drivers registered yet."
                />
              </CardContent>
            </Card>
          }
          recentRidesNode={
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Rides Feed</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRides.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ryda-muted">No rides yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentRides.map((ride) => (
                      <li
                        key={ride.id}
                        className="rounded-md border border-ryda-border bg-ryda-elevated/40 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-ryda-muted">
                            {ride.passenger?.name ?? 'Unknown passenger'}
                          </p>
                          <Badge variant="outline">{ride.status}</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">
                          {ride.pickupAddress} → {ride.dropoffAddress}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[10px] text-ryda-muted">
                            {formatDate(ride.requestedAt)}
                          </p>
                          <p className="text-sm font-semibold text-ryda-accent">
                            {formatCurrency(ride.fareAmount, ride.currency)}
                          </p>
                        </div>
                        {ride.driver && (
                          <p className="mt-0.5 text-[10px] text-ryda-muted">
                            Driver: {ride.driver.firstName} {ride.driver.lastName}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          }
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <Card className={highlight ? 'border-ryda-accent/40 ring-1 ring-ryda-accent/20' : ''}>
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
