'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

/**
 * TwoFactorForm — 6-digit TOTP code from an authenticator app.
 *
 * The user lands here after submitting their password when 2FA is enabled.
 * The code is verified server-side against the user's stored TOTP secret.
 *
 * This is the email/password 2FA flow — for OAuth, NextAuth handles the
 * redirect to the provider's own 2FA.
 */
const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app'),
});
type TotpValues = z.infer<typeof totpSchema>;

export function TwoFactorForm(): React.ReactElement {
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    const parsed = totpSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid code');
      return;
    }
    setBusy(true);
    try {
      // Submit the TOTP code as part of the credentials sign-in flow.
      const { signIn } = await import('next-auth/react');
      const res = await signIn('credentials', {
        totp: parsed.data.code,
        redirect: false,
      });
      if (!res || res.error) {
        setError('Invalid 2FA code. Try again.');
        return;
      }
      toast.success('Signed in!');
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="totp">Authenticator code</Label>
        <Input
          id="totp"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="••••••"
          className="text-center font-mono text-2xl tracking-[0.5em]"
          aria-invalid={!!error}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
        />
        {error && (
          <p className="text-xs text-destructive" role="alert">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={busy || code.length !== 6}
        className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Verifying…
          </>
        ) : (
          'Verify & sign in'
        )}
      </Button>
    </form>
  );
}
