import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-ryda-bg text-ryda-text">
      <div className="text-center space-y-6">
        <p className="font-display text-8xl font-bold ryda-text-gradient">404</p>
        <h1 className="font-display text-2xl font-semibold">Page not found</h1>
        <p className="text-ryda-muted">The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/">
          <Button className="bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim">
            Back to home
          </Button>
        </Link>
      </div>
    </main>
  );
}
