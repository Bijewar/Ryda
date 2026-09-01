import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/brand/Logo';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-ryda-bg text-ryda-text">
      <div className="w-full max-w-md space-y-8">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Logo className="w-10 h-10" />
          <span className="font-display text-2xl font-bold">Ryda</span>
        </Link>
        <div className="ryda-glass rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-ryda-muted">Sign in to book a ride in Bhopal.</p>
          </div>
          <LoginForm />
          <div className="pt-2 border-t border-ryda-border/40 text-center space-y-1 text-xs">
            <p className="text-ryda-muted">
              Don’t have an account?{' '}
              <Link href="/register" className="text-ryda-accent hover:underline">
                Create passenger account
              </Link>
            </p>
            <p className="text-ryda-muted">
              Want to drive?{' '}
              <Link href="/driver/register" className="text-ryda-accent font-medium hover:underline">
                Register as a Driver Partner →
              </Link>
            </p>
          </div>
        </div>
        <p className="text-xs text-center text-ryda-muted">
          Admin: <code className="text-ryda-accent">bijewarmanas1@gmail.com</code> · Driver: <code className="text-ryda-accent">imran@ryda.demo</code>
        </p>
      </div>
    </main>
  );
}
