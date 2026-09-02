import Link from 'next/link';
import { DriverRegisterForm } from '@/components/auth/DriverRegisterForm';
import { Logo } from '@/components/ryda/Logo';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Register as Driver Captain — Ryda',
  description: 'Join Ryda as a driver partner in Bhopal. Low commissions, flexible hours, fast payouts.',
};

export default function DriverRegisterPage() {
  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text py-12 px-4 relative overflow-hidden">
      {/* Ambient soft glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-100/40 blur-[130px]" />

      <div className="mx-auto max-w-2xl space-y-8 relative">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size="lg" showWordmark />
          </Link>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl text-ryda-text">Drive with Ryda in Bhopal</h1>
          <p className="text-sm text-ryda-muted max-w-md">
            Earn more with instant daily payouts, transparent fares, and dedicated Bhopal city operations support.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-semibold">
            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5" /> 0% Platform Fee on First 50 Rides
            </span>
            <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" /> Daily Instant Payouts
            </span>
            <span className="flex items-center gap-1 bg-sky-100 text-sky-800 px-3 py-1 rounded-full">
              <Shield className="h-3.5 w-3.5" /> Verified Passengers
            </span>
          </div>
        </div>

        <div className="ryda-glass-strong rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl border border-ryda-border/80">
          <DriverRegisterForm />

          <p className="text-xs text-center text-ryda-muted pt-4 border-t border-ryda-border/60">
            Already have a driver partner account?{' '}
            <Link href="/login" className="text-ryda-accent-dim hover:underline font-bold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
