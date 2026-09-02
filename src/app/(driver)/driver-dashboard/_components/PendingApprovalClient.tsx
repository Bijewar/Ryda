'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export interface PendingApprovalClientProps {
  driver: {
    firstName: string;
    lastName: string;
    email: string;
    licenseNumber: string;
    approvalStatus: string;
    vehicle?: {
      make: string;
      model: string;
      licensePlate?: string;
      type?: string;
    };
  };
}

export function PendingApprovalClient({ driver }: PendingApprovalClientProps): React.ReactElement {
  const router = useRouter();
  const [checking, setChecking] = React.useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    toast.info('Checking approval status…');
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-ryda-bg">
      <div className="w-full max-w-lg space-y-6">
        <Card className="rounded-3xl border-ryda-border bg-ryda-surface p-6 sm:p-8 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
                ⏳ Pending Admin Approval
              </span>
              <h1 className="font-display text-2xl font-extrabold text-ryda-text">
                Welcome, Captain {driver.firstName}!
              </h1>
              <p className="text-xs text-ryda-muted mt-1">
                Your captain application has been submitted and is currently being reviewed by Admin{' '}
                <span className="font-bold text-ryda-text">(Manas Bijewar)</span>.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3 rounded-2xl border border-ryda-border bg-ryda-elevated/40 p-4 text-xs">
            <p className="font-bold text-ryda-text uppercase tracking-wider text-[10px]">
              Application Summary
            </p>
            <div className="flex justify-between py-1 border-b border-ryda-border/60">
              <span className="text-ryda-muted">Applicant Name:</span>
              <span className="font-bold text-ryda-text">
                {driver.firstName} {driver.lastName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-ryda-border/60">
              <span className="text-ryda-muted">Registered Email:</span>
              <span className="font-mono font-bold text-ryda-text">{driver.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ryda-border/60">
              <span className="text-ryda-muted">Vehicle Details:</span>
              <span className="font-bold text-ryda-text">
                {driver.vehicle?.make} {driver.vehicle?.model} (
                {driver.vehicle?.licensePlate || 'Plate Provided'})
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ryda-muted">Driving License:</span>
              <span className="font-mono font-bold text-ryda-text">{driver.licenseNumber}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-center text-[11px] text-ryda-muted">
              Once approved by the Admin in the Admin Panel, refresh this page to access your live
              Driver Dashboard and accept ride requests!
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/">
                <Button
                  variant="outline"
                  className="w-full rounded-xl font-bold text-xs py-3 border-ryda-border cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back to Home
                </Button>
              </Link>
              <Button
                type="button"
                onClick={handleRefresh}
                disabled={checking}
                className="w-full bg-ryda-accent hover:bg-ryda-accent-dim text-white rounded-xl font-bold text-xs py-3 shadow-md cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking…' : 'Check Status'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
