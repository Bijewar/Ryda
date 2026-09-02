import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/ryda/Logo';
import Link from 'next/link';

export const metadata = { title: 'Sign in — Ryda' };

export default function LoginPage() {
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
            <h1 className="font-display text-2xl font-extrabold text-ryda-text">Welcome back</h1>
            <p className="text-sm text-ryda-muted">
              Sign in to book or manage your rides in Bhopal.
            </p>
          </div>

          <LoginForm />

          <div className="pt-4 border-t border-ryda-border/60 text-center space-y-2 text-xs">
            <p className="text-ryda-muted">
              Don’t have an account?{' '}
              <Link href="/register" className="text-ryda-accent-dim font-bold hover:underline">
                Create passenger account
              </Link>
            </p>
            <p className="text-ryda-muted">
              Want to drive &amp; earn?{' '}
              <Link href="/driver/register" className="text-amber-600 font-bold hover:underline">
                Register as Captain Partner →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
