import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Download, Printer } from 'lucide-react';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';
import { formatCurrency, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Trip Receipt — Ryda',
};

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();
  const user = (session?.user as { id: string; accountType: 'PASSENGER' | 'ADMIN'; driverId?: string } | undefined) ??
    (process.env.DEMO_MODE === 'true' ? { id: 'demo-user-aarav', accountType: 'PASSENGER' as const } : undefined);

  if (!user) redirect(`/login?callbackUrl=/receipts/${id}`);

  const ride = await db.ride.findUnique({
    where: { id },
    include: { driver: { include: { vehicle: true } } },
  });

  if (!ride || (ride.passengerId !== user.id && user.accountType !== 'ADMIN')) {
    notFound();
  }

  const baseFare = Math.round(ride.fareAmount * 0.7);
  const distanceFare = Math.round(ride.fareAmount * 0.25);
  const taxes = ride.fareAmount - baseFare - distanceFare;

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ryda-muted hover:text-ryda-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rides
          </Link>
        </div>

        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-2xl overflow-hidden print:shadow-none print:border-none">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
            <div className="flex justify-center mb-2">
              <Logo size="md" />
            </div>
            <h1 className="font-display text-2xl font-extrabold">Tax Invoice &amp; Receipt</h1>
            <p className="text-xs text-emerald-100 mt-0.5">Trip ID: {ride.id.slice(0, 12).toUpperCase()}</p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-ryda-border">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ryda-muted">Total Paid</p>
                <p className="text-3xl font-extrabold text-ryda-text font-display mt-0.5">
                  {formatCurrency(ride.fareAmount, ride.currency)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid via {ride.paymentMethod}
              </span>
            </div>

            {/* Trip Details */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ryda-muted">Trip Route</p>
              <div className="space-y-3 bg-ryda-elevated/40 p-4 rounded-2xl border border-ryda-border">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ryda-accent mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-ryda-muted uppercase">Pickup</p>
                    <p className="text-sm font-medium text-ryda-text">{ride.pickupAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-ryda-muted uppercase">Dropoff</p>
                    <p className="text-sm font-medium text-ryda-text">{ride.dropoffAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fare Breakdown */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-ryda-muted">Fare Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-ryda-muted">
                  <span>Base Fare</span>
                  <span>{formatCurrency(baseFare, ride.currency)}</span>
                </div>
                <div className="flex justify-between text-ryda-muted">
                  <span>Distance &amp; Time Rate</span>
                  <span>{formatCurrency(distanceFare, ride.currency)}</span>
                </div>
                <div className="flex justify-between text-ryda-muted">
                  <span>Taxes &amp; Platform Fee</span>
                  <span>{formatCurrency(taxes, ride.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-ryda-text pt-2 border-t border-ryda-border">
                  <span>Total (INR)</span>
                  <span className="text-ryda-accent-dim">{formatCurrency(ride.fareAmount, ride.currency)}</span>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-4 border-t border-ryda-border text-center text-[11px] text-ryda-muted">
              <p>Thank you for riding with Ryda Bhopal.</p>
              <p className="mt-0.5">GSTIN: 23AABCR1234F1Z5 · Support: help@ryda.in</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
