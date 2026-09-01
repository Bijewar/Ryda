import { VerifyOtpForm } from '@/components/auth/VerifyOtpForm';
import { Logo } from '@/components/brand/Logo';

export const metadata = { title: 'Verify your email' };

export default function VerifyOtpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-ryda-bg text-ryda-text">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Logo className="w-10 h-10" />
          <span className="font-display text-2xl font-bold">Ryda</span>
        </div>
        <div className="ryda-glass rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-2xl font-semibold">Verify your email</h1>
          <p className="text-sm text-ryda-muted">
            We sent a 6-digit code to your email. Enter it below to continue.
          </p>
          <VerifyOtpForm />
        </div>
      </div>
    </main>
  );
}
