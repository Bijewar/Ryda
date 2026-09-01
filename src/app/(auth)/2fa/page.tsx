import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
import { Logo } from '@/components/brand/Logo';

export const metadata = { title: 'Two-factor authentication' };

export default function TwoFactorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-ryda-bg text-ryda-text">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Logo className="w-10 h-10" />
          <span className="font-display text-2xl font-bold">Ryda</span>
        </div>
        <div className="ryda-glass rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-2xl font-semibold">Two-factor authentication</h1>
          <p className="text-sm text-ryda-muted">
            Open your authenticator app and enter the 6-digit code.
          </p>
          <TwoFactorForm />
        </div>
      </div>
    </main>
  );
}
