'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passwordResetConfirmSchema } from '@/lib/validation/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

/**
 * ResetPasswordForm — handles BOTH the request + the confirm step.
 *
 * Phase detection via the URL:
 *   - `/reset-password`                       → request form (asks for email)
 *   - `/reset-password?token=...`             → confirm form (asks for new password)
 *
 * The `token` is opaque — it maps to a `resetTokenHash` row in the User table
 * with a 30-minute TTL. Submitting the confirm form POSTs to
 * `/api/auth/reset-password/confirm`.
 */
const requestSchema = z.object({ email: z.string().email('Enter a valid email') });
type RequestValues = z.infer<typeof requestSchema>;

export function ResetPasswordForm(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const isConfirm = !!token;

  if (isConfirm) {
    return <ConfirmForm token={token!} onSuccess={() => router.push('/login')} />;
  }
  return <RequestForm />;
}

function RequestForm(): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: RequestValues): Promise<void> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        toast.error('Could not send reset email');
        return;
      }
      toast.success('Check your email', {
        description: `If an account exists for ${values.email}, a reset link is on its way.`,
      });
    } catch (err) {
      toast.error('Network error', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </Button>
    </form>
  );
}

function ConfirmForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordResetConfirmSchema>>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { token, password: '' },
  });

  const onSubmit = async (values: z.infer<typeof passwordResetConfirmSchema>): Promise<void> => {
    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        toast.error('Could not reset password', {
          description: err?.error?.message ?? 'The link may have expired. Request a new one.',
        });
        return;
      }
      toast.success('Password updated!', {
        description: 'Sign in with your new password.',
      });
      onSuccess();
    } catch (err) {
      toast.error('Network error', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register('token')} />
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 chars, 1 letter, 1 number"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Updating…
          </>
        ) : (
          'Update password'
        )}
      </Button>
    </form>
  );
}
