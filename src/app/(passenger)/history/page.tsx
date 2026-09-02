import { Card, CardContent } from '@/components/ui/card';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { RideStatus } from '@/types/ride';
import { ArrowLeft, ArrowRight, Clock, Receipt } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Ride History — Ryda',
  description: 'View and download invoices for all your past Ryda trips in Bhopal.',
};

export const dynamic = 'force-dynamic';

export default async function RideHistoryPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user =
    (session?.user as
      | { id: string; accountType: 'PASSENGER' | 'ADMIN'; driverId?: string }
      | undefined) ??
    (process.env.DEMO_MODE === 'true'
      ? { id: 'demo-user-aarav', accountType: 'PASSENGER' as const }
      : undefined);

  if (!user) redirect('/login?callbackUrl=/history');

  const rides = await db.ride.findMany({
    where: { passengerId: user.id },
    orderBy: { requestedAt: 'desc' },
    include: { driver: { include: { vehicle: true } } },
    take: 50,
  });

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ryda-muted hover:text-ryda-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-ryda-accent/10 text-ryda-accent-dim">
            {rides.length} Total Trips
          </span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-ryda-text tracking-tight">
            Ride History
          </h1>
          <p className="text-sm text-ryda-muted mt-1">
            Complete records of your journeys across Bhopal with Ryda.
          </p>
        </div>

        {rides.length === 0 ? (
          <Card className="rounded-3xl border-ryda-border bg-ryda-surface p-12 text-center shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-ryda-accent/10 text-ryda-accent flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl text-ryda-text">No rides taken yet</h3>
            <p className="text-sm text-ryda-muted max-w-sm mx-auto mt-2 mb-6">
              When you take a ride with Ryda, all your receipts, driver ratings, and route details
              will show up here.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-ryda-accent text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md"
            >
              Book Your First Ride
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <Card
                key={ride.id}
                className="rounded-3xl border-ryda-border bg-ryda-surface shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ryda-muted">
                          {formatDate(ride.requestedAt)}
                        </span>
                        <StatusPill status={ride.status as RideStatus} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-ryda-accent" />
                          <span className="text-sm font-semibold text-ryda-text">
                            {ride.pickupAddress}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span className="text-sm text-ryda-muted">{ride.dropoffAddress}</span>
                        </div>
                      </div>

                      {ride.driver && (
                        <div className="flex items-center gap-2 text-xs text-ryda-muted pt-1">
                          <span>
                            Driver: {ride.driver.firstName} {ride.driver.lastName}
                          </span>
                          <span>•</span>
                          <span>
                            {ride.driver.vehicle?.make} ({ride.driver.vehicle?.licensePlate})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-ryda-border">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-extrabold text-ryda-accent-dim">
                          {formatCurrency(ride.fareAmount, ride.currency)}
                        </p>
                        <p className="text-[11px] text-ryda-muted uppercase font-semibold">
                          Paid via {ride.paymentMethod}
                        </p>
                      </div>

                      <Link
                        href={`/receipts/${ride.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-ryda-accent-dim hover:text-ryda-text bg-ryda-elevated px-3 py-1.5 rounded-xl transition-colors mt-2"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Receipt
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: RideStatus }) {
  const map: Partial<Record<RideStatus, { label: string; bg: string; text: string }>> = {
    COMPLETED: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    PAID: { label: 'Paid', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    CANCELED: { label: 'Canceled', bg: 'bg-rose-100', text: 'text-rose-800' },
    IN_PROGRESS: { label: 'In progress', bg: 'bg-sky-100', text: 'text-sky-800' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-amber-100', text: 'text-amber-800' },
  };
  const cfg = map[status] ?? { label: status, bg: 'bg-stone-100', text: 'text-stone-800' };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}
