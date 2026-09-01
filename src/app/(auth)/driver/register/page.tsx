import Link from 'next/link';
import { DriverRegisterForm } from '@/components/auth/DriverRegisterForm';
import { Logo } from '@/components/brand/Logo';
import { Shield, Sparkles, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Register as Driver',
  description: 'Join Ryda as a driver partner in Bhopal. Low commissions, flexible hours, fast payouts.',
};

export default function DriverRegisterPage() {
  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text py-12 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-10 h-10" />
            <span className="font-display text-2xl font-bold">Ryda Partner</span>
          </Link>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Drive with Ryda in Bhopal</h1>
          <p className="text-sm text-ryda-muted max-w-md">
            Earn more with instant payouts, transparent fares, and dedicated Bhopal city support.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-ryda-accent">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> 0% Platform Fee on First 50 Rides
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> Surge Multipliers
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Verified Passengers
            </span>
          </div>
        </div>

        <div className="ryda-glass rounded-2xl p-6 sm:p-8 space-y-6">
          <DriverRegisterForm />

          <p className="text-xs text-center text-ryda-muted">
            Already have a driver account?{' '}
            <Link href="/login" className="text-ryda-accent hover:underline font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
