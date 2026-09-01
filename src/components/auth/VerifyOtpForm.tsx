'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isDemoMode } from '@/lib/demo-mode';
import { z } from 'zod';

/**
 * VerifyOtpForm — 6-digit OTP confirmation.
 *
 * Reads `?email=` from the URL, prompts for the code, and POSTs to
 * `/api/otp/verify`. On success, redirects to `/dashboard` (or the
 * `callbackUrl` query param).
 *
 * In demo mode, the OTP is logged on the server + visible at `/dev/otp`.
 * We pre-fill the input with the demo code so the recruiter can submit
 * without leaving the page.
 */
const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
type OtpValues = z.infer<typeof otpSchema>;

export function VerifyOtpForm(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    const parsed = otpSchema.safeParse({ email, code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid code');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        setError(err?.error?.message ?? 'Invalid or expired code');
        return;
      }
      toast.success('Account verified!', {
        description: 'Please sign in with your password to continue.',
      });
      router.push(`/login?email=${encodeURIComponent(email)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setBusy(false);
    }
  };

  const resend = async (): Promise<void> => {
    if (!email) return;
    try {
      await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'login' }),
      });
      toast.success('Code resent', { description: `Check ${email}.` });
    } catch {
      toast.error('Could not resend code');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="email" value={email} />
      <div className="space-y-1.5">
        <Label htmlFor="code">Verification code</Label>
        <Input
          id="code"
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
        {isDemoMode && (
          <p className="text-xs text-muted-foreground">
            Demo mode: the OTP was logged to the server console + visible at{' '}
            <a href="/dev/otp" className="text-ryda-accent hover:underline">/dev/otp</a>.
          </p>
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
          'Verify'
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => void resend()}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Didn&apos;t get a code? Resend
        </button>
      </div>
    </form>
  );
}
