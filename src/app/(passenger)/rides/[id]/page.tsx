import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Receipt, ShieldCheck, Star } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Ride Details — Ryda',
};

export const dynamic = 'force-dynamic';

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();
  const user =
    (session?.user as
      | { id: string; accountType: 'PASSENGER' | 'ADMIN'; driverId?: string }
      | undefined) ??
    (process.env.DEMO_MODE === 'true'
      ? { id: 'demo-user-aarav', accountType: 'PASSENGER' as const }
      : undefined);

  if (!user) redirect(`/login?callbackUrl=/rides/${id}`);

  const ride = await db.ride.findUnique({
    where: { id },
    include: { driver: { include: { vehicle: true } } },
  });

  if (!ride || (ride.passengerId !== user.id && user.accountType !== 'ADMIN')) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ryda-muted hover:text-ryda-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link
            href={`/receipts/${ride.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ryda-accent-dim hover:text-ryda-text bg-ryda-surface border border-ryda-border px-3 py-1.5 rounded-xl shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            View Receipt
          </Link>
        </div>

        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-xl overflow-hidden mb-6">
          <CardHeader className="bg-gradient-to-r from-ryda-accent/15 via-emerald-50 to-amber-50/30 border-b border-ryda-border/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ryda-muted">
                  Trip Summary
                </p>
                <CardTitle className="text-2xl font-display font-extrabold text-ryda-text mt-1">
                  {formatCurrency(ride.fareAmount, ride.currency)}
                </CardTitle>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800">
                {ride.status}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Route */}
            <div className="space-y-4 bg-ryda-elevated/40 p-4 rounded-2xl border border-ryda-border/60">
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-ryda-accent mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-ryda-muted uppercase">Pickup</p>
                  <p className="text-sm font-semibold text-ryda-text">{ride.pickupAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-ryda-muted uppercase">Destination</p>
                  <p className="text-sm font-semibold text-ryda-text">{ride.dropoffAddress}</p>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            {ride.driver && (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-ryda-border bg-ryda-surface">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim text-white font-extrabold flex items-center justify-center text-base">
                    {ride.driver.firstName[0]}
                    {ride.driver.lastName[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ryda-text">
                      {ride.driver.firstName} {ride.driver.lastName}
                    </p>
                    <p className="text-xs text-ryda-muted">
                      {ride.driver.vehicle?.make} · {ride.driver.vehicle?.licensePlate}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {ride.driver.rating.toFixed(1)} Rating
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-ryda-elevated/40 border border-ryda-border">
                <p className="text-[10px] uppercase font-bold text-ryda-muted">Time</p>
                <p className="text-xs font-semibold text-ryda-text mt-1">
                  {formatDate(ride.requestedAt)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-ryda-elevated/40 border border-ryda-border">
                <p className="text-[10px] uppercase font-bold text-ryda-muted">Payment</p>
                <p className="text-xs font-semibold text-ryda-text mt-1">{ride.paymentMethod}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-ryda-elevated/40 border border-ryda-border">
                <p className="text-[10px] uppercase font-bold text-ryda-muted">Safety</p>
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Trip
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
