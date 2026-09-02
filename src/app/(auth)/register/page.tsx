import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Logo } from '@/components/ryda/Logo';

export const metadata = { title: 'Create Account — Ryda' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-ryda-bg text-ryda-text relative overflow-hidden">
      {/* Ambient soft glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-100/40 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-100/40 blur-[130px]" />

      <div className="relative w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Link href="/" className="group flex items-center gap-2">
            <Logo size="lg" showWordmark />
          </Link>
        </div>

        <div className="ryda-glass-strong rounded-3xl p-8 space-y-6 shadow-2xl border border-ryda-border/80">
          <div className="space-y-1 text-center">
            <h1 className="font-display text-2xl font-extrabold text-ryda-text">Create Passenger Account</h1>
            <p className="text-sm text-ryda-muted">Book fast, calm rides across Bhopal in seconds.</p>
          </div>

          <RegisterForm />

          <div className="pt-4 border-t border-ryda-border/60 text-center space-y-3 text-xs">
            <p className="text-ryda-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-ryda-accent-dim font-bold hover:underline">
                Sign in
              </Link>
            </p>
            <div className="rounded-2xl border border-ryda-border bg-ryda-surface p-4 text-center space-y-2 shadow-xs">
              <p className="text-xs font-bold text-ryda-text">Want to earn driving in Bhopal?</p>
              <Link
                href="/driver/register"
                className="inline-flex items-center justify-center w-full gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                Register as Captain Partner →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
