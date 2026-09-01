'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userLoginSchema, type UserLoginInput } from '@/lib/validation/user';
import { isDemoMode } from '@/lib/demo-mode';

/**
 * LoginForm — email + password credentials login.
 *
 * Flow:
 *   1. Validate with Zod (`userLoginSchema`).
 *   2. `signIn('credentials', ...)` via NextAuth v5.
 *   3. On success: redirect to the `callbackUrl` query param or `/dashboard`.
 *   4. On error: show a toast + inline field errors.
 *
 * The form pre-fills the demo credentials when `DEMO_MODE=true` so a recruiter
 * can sign in with a single click.
 */
export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserLoginInput>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const emailParam = params.get('email');
  React.useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (values: UserLoginInput): Promise<void> => {
    try {
      const { signIn } = await import('next-auth/react');
      const res = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error('Sign in failed', {
          description: 'Please check your email and password.',
        });
        return;
      }
      toast.success('Welcome back!');
      window.location.href = callbackUrl;
    } catch (err) {
      toast.error('Sign in error', {
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

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
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
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}
