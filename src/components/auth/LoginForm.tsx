'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type UserLoginInput, userLoginSchema } from '@/lib/validation/user';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();

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
      const { signIn, getSession } = await import('next-auth/react');
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

      // Retrieve session to inspect real driverId and accountType
      const session = await getSession();
      const user = session?.user as any;
      const email = values.email.toLowerCase().trim();

      let targetUrl = '/';
      if (email === 'bijewarmanas1@gmail.com' || user?.accountType === 'ADMIN') {
        targetUrl = '/admin';
      } else if (
        user?.driverId ||
        email === 'bijewaru@gmail.com' ||
        email.includes('driver') ||
        email.includes('imran') ||
        email.includes('shivam')
      ) {
        targetUrl = '/driver-dashboard';
      }

      window.location.href = targetUrl;
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
        className="w-full bg-ryda-accent hover:bg-ryda-accent-dim text-white font-bold py-3 rounded-xl shadow-md transition-all ryda-accent-glow cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
}
