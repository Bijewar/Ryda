'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userRegisterSchema, type UserRegisterInput } from '@/lib/validation/user';
import { isDemoMode } from '@/lib/demo-mode';

/**
 * RegisterForm — passenger signup.
 *
 * Flow:
 *   1. Validate with Zod (`userRegisterSchema`).
 *   2. `POST /api/auth/register` (server route creates the User row + sends
 *      a welcome email + an OTP if email verification is enabled).
 *   3. On success: redirect to `/verify-otp?email=...` so the user can
 *      confirm their email.
 *
 * In demo mode, the API stub returns immediately and the user is taken to
 * the OTP page where any 6-digit code is accepted.
 */
export function RegisterForm(): React.ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserRegisterInput>({
    resolver: zodResolver(userRegisterSchema),
    defaultValues: {
      accountType: 'PASSENGER',
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (values: UserRegisterInput): Promise<void> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
        toast.error('Registration failed', {
          description: err?.error?.message ?? 'Please try a different email.',
        });
        return;
      }
      toast.success('Account created!', {
        description: 'Check your email for a verification code.',
      });
      router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      toast.error('Network error', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Account Type Selector */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-ryda-surface border border-ryda-border">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-ryda-accent text-ryda-bg transition-all"
        >
          Passenger
        </button>
        <button
          type="button"
          onClick={() => router.push('/driver/register')}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-ryda-muted hover:text-ryda-text hover:bg-ryda-elevated transition-all"
        >
          Driver Partner →
        </button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Aarav Sharma"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive" role="alert">{errors.name.message}</p>
        )}
      </div>

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
          <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+919876543210"
          aria-invalid={!!errors.phone}
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-xs text-destructive" role="alert">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 chars, 1 letter, 1 number"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive" role="alert">{errors.password.message}</p>
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
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  );
}
