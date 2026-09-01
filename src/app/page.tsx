import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { auth } from '@/lib/auth/config';

/**
 * Landing route. If signed in, redirect to the role-appropriate dashboard;
 * otherwise show the marketing CTA.
 */
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    const u = session.user as { accountType: 'PASSENGER' | 'ADMIN'; driverId?: string };
    if (u.accountType === 'ADMIN') redirect('/admin');
    if (u.driverId) redirect('/dashboard');
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-6 text-center bg-ryda-bg text-ryda-text transition-colors duration-200">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
        <Logo className="w-20 h-20" />
        <div className="space-y-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Ride-hailing, <span className="ryda-text-gradient">rebuilt for Bhopal.</span>
          </h1>
          <p className="text-ryda-muted text-lg max-w-md mx-auto">
            Production-grade architecture. Real-time driver matching within the Bhopal geofence.
            Razorpay payments. 100% free stack. Zero-config demo mode.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link href="/login" className="flex-1">
            <Button className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim font-semibold">
              Sign in
            </Button>
          </Link>
          <Link href="/register" className="flex-1">
            <Button variant="outline" className="w-full border-ryda-border text-ryda-text">
              Create account
            </Button>
          </Link>
        </div>
        <p className="text-xs text-ryda-muted">
          Demo logins: <code className="text-ryda-accent">admin@ryda.demo</code> ·{' '}
          <code className="text-ryda-accent">aarav@example.com</code>
        </p>
      </div>
    </main>
  );
}
