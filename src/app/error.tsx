'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Pino log via /api/health or Sentry capture — both fire from the boundary.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-ryda-bg text-ryda-text">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
        <p className="text-ryda-muted">
          {error.message || 'An unexpected error occurred. Our team has been notified.'}
        </p>
        {error.digest && (
          <p className="text-xs text-ryda-muted">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim">
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-ryda-border">
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
