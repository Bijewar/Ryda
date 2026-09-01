import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Logo } from '@/components/brand/Logo';

export const metadata = { title: 'Reset password' };

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-ryda-bg text-ryda-text">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Logo className="w-10 h-10" />
          <span className="font-display text-2xl font-bold">Ryda</span>
        </div>
        <div className="ryda-glass rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-2xl font-semibold">Reset password</h1>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
