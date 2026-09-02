import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { AdminSignOutButton } from '@/components/admin/AdminSignOutButton';
import type { DriversTableDriver } from '@/components/admin/DriversTable';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Bhopal Transit Command Center — Ryda Admin',
  description: 'Real-time driver approvals, live fleet radar map, and Bhopal ride operations.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user = session?.user as
    | {
        id?: string;
        accountType?: 'PASSENGER' | 'ADMIN';
        email?: string | null;
      }
    | undefined;

  if (!user) redirect('/login?callbackUrl=/admin');
  if (user.accountType !== 'ADMIN' || user.email?.toLowerCase() !== 'bijewarmanas1@gmail.com') {
    redirect('/');
  }

  let allDrivers: any[] = [];
  let recentRides: any[] = [];

  try {
    const results = await Promise.all([
      db.driver
        .findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { vehicle: true },
        })
        .catch(() => []),
      db.ride
        .findMany({
          orderBy: { requestedAt: 'desc' },
          take: 20,
          include: {
            passenger: { select: { name: true, email: true } },
            driver: { select: { firstName: true, lastName: true } },
          },
        })
        .catch(() => []),
    ]);

    allDrivers = results[0] || [];
    recentRides = results[1] || [];
  } catch (_e) {
    // Offline/demo fallback
  }

  // Include runtime registered drivers from memory store (e.g. bijewaru@gmail.com, etc.)
  try {
    const { memoryDrivers } = await import('@/lib/db/driverStore');
    const memList = Array.from(memoryDrivers.values());
    for (const mem of memList) {
      if (!allDrivers.some((d) => d.email.toLowerCase() === mem.email.toLowerCase())) {
        allDrivers.unshift(mem as any);
      }
    }
  } catch (_e) {
    // Ignore
  }

  const driversRows: DriversTableDriver[] = allDrivers.map((d) => ({
    id: d.id,
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone,
    approvalStatus: d.approvalStatus,
    rejectionReason: d.rejectionReason,
    isOnline: d.isOnline ?? false,
    rating: d.rating ?? 5.0,
    totalRides: d.totalRides ?? 0,
    totalEarnings: d.totalEarnings ?? 0,
    createdAt:
      typeof d.createdAt === 'string'
        ? d.createdAt
        : d.createdAt?.toISOString?.() || new Date().toISOString(),
    vehicle: d.vehicle
      ? {
          make: d.vehicle.make,
          model: d.vehicle.model,
          year: d.vehicle.year,
          color: d.vehicle.color,
          licensePlate: d.vehicle.licensePlate,
          type: d.vehicle.type,
        }
      : null,
  }));

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text pb-16">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 ryda-glass rounded-3xl p-6 shadow-xl border border-ryda-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold uppercase tracking-wider">
                Admin Command Center
              </span>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🟢 Live &amp; Synced
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ryda-text mt-1.5">
              Bhopal Transit Operations Portal
            </h1>
            <p className="text-xs text-ryda-muted mt-0.5">
              Real-time driver approvals, live GPS fleet radar, and dispatch control across Bhopal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-ryda-text">Manas Bijewar (Admin)</p>
              <p className="text-[11px] font-mono text-purple-700 font-semibold">{user.email}</p>
            </div>
            <ThemeToggle />
            <AdminSignOutButton />
          </div>
        </header>

        {/* Real Live Dashboard Component */}
        <AdminDashboardClient
          initialDrivers={driversRows}
          initialRides={recentRides}
          adminEmail={user.email || 'bijewarmanas1@gmail.com'}
        />
      </div>
    </main>
  );
}
