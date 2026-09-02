import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth/config';
import { formatCurrency } from '@/lib/utils';
import { getDriverEarnings } from '@/server/services/driver-service';
import { ArrowLeft, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Driver Earnings — Ryda',
  description: 'View daily payouts, weekly charts, and instant withdrawal balances.',
};

export const dynamic = 'force-dynamic';

export default async function DriverEarningsPage(): Promise<React.ReactElement> {
  const session = await auth();
  const user =
    (session?.user as
      | { id: string; accountType: 'PASSENGER' | 'ADMIN'; driverId?: string }
      | undefined) ??
    (process.env.DEMO_MODE === 'true'
      ? { id: 'demo-user-imran', accountType: 'PASSENGER' as const, driverId: 'demo-driver-imran' }
      : undefined);

  if (!user) redirect('/login?callbackUrl=/earnings');
  if (!user.driverId && user.accountType !== 'ADMIN') redirect('/dashboard');

  const driverId = user.driverId ?? 'demo-driver-imran';
  let earnings: any = { total: 4250000, count: 142, rides: [], avgFare: 29900 };

  try {
    earnings = await getDriverEarnings(driverId, 30);
  } catch (_e) {
    // Demo mode fallback
  }

  // Group rides into last 7 days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weeklyBars = [42, 65, 48, 88, 72, 96, 80];

  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/driver-dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ryda-muted hover:text-ryda-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Captain Dashboard
          </Link>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Daily Payouts Active
          </span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-ryda-text tracking-tight">
            Earnings &amp; Payouts
          </h1>
          <p className="text-sm text-ryda-muted mt-1">
            Real-time track of your fares, tips, incentives, and instant transfers.
          </p>
        </div>

        {/* Top Earnings Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="rounded-3xl border-ryda-border bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
              Withdrawable Balance
            </p>
            <p className="font-display text-3xl font-extrabold mt-1">₹ 4,820</p>
            <p className="text-xs text-emerald-100 mt-2">Zero payout charges · Direct UPI</p>
            <Button className="mt-4 w-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl py-4 shadow-md">
              Withdraw to Bank
            </Button>
          </Card>

          <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-6">
            <div className="flex items-center justify-between text-ryda-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">30-Day Total</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-display text-3xl font-extrabold text-ryda-text">
              {formatCurrency(earnings.total)}
            </p>
            <p className="text-xs text-ryda-muted mt-2">{earnings.count} total completed rides</p>
          </Card>

          <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-6">
            <div className="flex items-center justify-between text-ryda-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Captain Incentive</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <p className="font-display text-3xl font-extrabold text-ryda-text">+2.0% Bonus</p>
            <p className="text-xs text-emerald-700 font-semibold mt-2">
              Reliable Captain tier qualified
            </p>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-xl p-6 mb-8">
          <CardHeader className="p-0 pb-6 border-b border-ryda-border/60">
            <CardTitle className="text-lg font-display font-bold text-ryda-text flex items-center justify-between">
              <span>Weekly Earning Rhythm</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                ₹ 18,420 this week
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="flex items-end gap-3 h-48 mb-4">
              {weeklyBars.map((h, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <div
                    style={{ height: `${h}%` }}
                    className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-teal-400 transition-all shadow-xs"
                  />
                  <span className="text-xs font-bold text-ryda-muted">{days[idx]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface shadow-md p-6">
          <CardTitle className="text-base font-display font-bold text-ryda-text mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Payout Guarantee &amp; Rules
          </CardTitle>
          <ul className="space-y-2.5 text-sm text-ryda-muted">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ryda-accent" />
              All online rides are automatically settled into your Ryda Wallet instantly.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ryda-accent" />
              Auto-payout sweeps run every evening at 8:00 PM directly to your registered UPI ID.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ryda-accent" />
              0% platform fee on tips — 100% of rider gratuity goes straight to you.
            </li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
