import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Logo } from '@/components/brand/Logo';

export const metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-ryda-bg text-ryda-text">
      <div className="w-full max-w-md space-y-8">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Logo className="w-10 h-10" />
          <span className="font-display text-2xl font-bold">Ryda</span>
        </Link>
        <div className="ryda-glass rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold">Create your passenger account</h1>
            <p className="text-sm text-ryda-muted">Book rides across Bhopal in seconds.</p>
          </div>
          <RegisterForm />
          <div className="pt-2 border-t border-ryda-border/40 text-center space-y-2 text-xs">
            <p className="text-ryda-muted">
              Already have an account?{' '}
              <Link href="/login" className="text-ryda-accent hover:underline">
                Sign in
              </Link>
            </p>
            <div className="rounded-xl border border-ryda-border bg-ryda-surface/70 p-3 text-center space-y-1.5">
              <p className="text-xs font-medium text-ryda-text">Want to earn driving in Bhopal?</p>
              <Link
                href="/driver/register"
                className="inline-flex items-center justify-center w-full gap-1.5 rounded-lg border border-ryda-accent/40 bg-ryda-accent/10 px-3 py-2 text-xs font-semibold text-ryda-accent hover:bg-ryda-accent hover:text-ryda-bg transition-colors"
              >
                Register as a Driver Partner →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
