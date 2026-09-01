'use client';

import * as React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function AdminSignOutButton(): React.ReactElement {
  const [loading, setLoading] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: '/login' });
    } catch {
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={loading}
      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign out
    </Button>
  );
}
