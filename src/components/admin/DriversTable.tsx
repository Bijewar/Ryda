'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { DriverApproval, VehicleType } from '@/types/ride';
import { Check, Loader2, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface DriversTableDriver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  approvalStatus: DriverApproval;
  rejectionReason?: string | null;
  isOnline: boolean;
  rating: number;
  totalRides: number;
  totalEarnings: number; // paise
  createdAt: string;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    type: VehicleType;
  } | null;
}

export interface DriversTableProps {
  drivers: DriversTableDriver[];
  actionBasePath?: string;
  emptyMessage?: string;
  className?: string;
}

const VEHICLE_LABELS: Record<VehicleType, string> = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  BIKE: 'Bike',
  AUTO: 'Auto',
};

function ApprovalBadge({ status }: { status: DriverApproval }): React.ReactElement {
  if (status === 'APPROVED')
    return (
      <Badge variant="secondary" className="bg-ryda-accent/15 text-ryda-accent">
        Approved
      </Badge>
    );
  if (status === 'REJECTED') return <Badge variant="destructive">Rejected</Badge>;
  return (
    <Badge variant="outline" className="border-amber-500/40 text-amber-400">
      Pending Review
    </Badge>
  );
}

export function DriversTable({
  drivers: initialDrivers,
  emptyMessage = 'No drivers registered yet.',
  className,
}: DriversTableProps): React.ReactElement {
  const [drivers, setDrivers] = React.useState<DriversTableDriver[]>(initialDrivers);
  const [busyDriverId, setBusyDriverId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDrivers(initialDrivers);
  }, [initialDrivers]);

  const handleUpdateStatus = async (
    driverId: string,
    status: 'APPROVED' | 'REJECTED',
    driverName: string,
  ) => {
    setBusyDriverId(driverId);
    let rejectionReason: string | undefined;

    if (status === 'REJECTED') {
      const input = window.prompt(
        'Please provide a rejection reason (optional):',
        'Invalid or unverified document',
      );
      if (input === null) {
        setBusyDriverId(null);
        return;
      }
      rejectionReason = input.trim() || 'Documents could not be verified.';
    }

    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: status,
          rejectionReason,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? 'Failed to update driver status');
      }

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId
            ? {
                ...d,
                approvalStatus: status,
                rejectionReason: rejectionReason ?? d.rejectionReason,
              }
            : d,
        ),
      );

      toast.success(
        status === 'APPROVED' ? `Driver ${driverName} Approved!` : `Driver ${driverName} Rejected`,
        {
          description:
            status === 'APPROVED'
              ? 'The driver can now log in, go online, and accept rides across Bhopal.'
              : `Status updated with reason: ${rejectionReason}`,
        },
      );
    } catch (err) {
      toast.error('Action Failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setBusyDriverId(null);
    }
  };

  if (drivers.length === 0) {
    return (
      <div
        className={cn(
          'flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-border p-8 text-center',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'ryda-scrollbar overflow-x-auto rounded-md border border-border bg-ryda-elevated/40',
        className,
      )}
      role="region"
      aria-label="Drivers table"
      tabIndex={0}
    >
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <caption className="sr-only">Registered drivers and their approval status</caption>
        <thead className="bg-muted/40 text-left">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Driver
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Vehicle
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Online
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Rating
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Rides
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Earnings
            </th>
            <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
              Joined
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {drivers.map((d) => {
            const isBusy = busyDriverId === d.id;
            return (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {d.firstName} {d.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{d.email}</div>
                  <div className="text-xs text-muted-foreground">{d.phone}</div>
                </td>
                <td className="px-4 py-3">
                  {d.vehicle ? (
                    <>
                      <div className="font-medium text-foreground">
                        {d.vehicle.make} {d.vehicle.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.vehicle.year} · {d.vehicle.color} · {VEHICLE_LABELS[d.vehicle.type]}
                      </div>
                      <div className="font-mono text-[11px] text-ryda-accent">
                        {d.vehicle.licensePlate}
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No vehicle</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ApprovalBadge status={d.approvalStatus} />
                  {d.approvalStatus === 'REJECTED' && d.rejectionReason && (
                    <div
                      className="mt-1 text-[11px] text-muted-foreground"
                      title={d.rejectionReason}
                    >
                      {d.rejectionReason.slice(0, 40)}
                      {d.rejectionReason.length > 40 ? '…' : ''}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {d.isOnline ? (
                    <Badge variant="secondary" className="bg-ryda-accent/15 text-ryda-accent">
                      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-ryda-accent animate-pulse" />
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline">Offline</Badge>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <span className="font-medium">{d.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground"> ★</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{d.totalRides}</td>
                <td className="px-4 py-3 tabular-nums font-medium text-ryda-accent">
                  {formatCurrency(d.totalEarnings)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(d.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {d.approvalStatus === 'PENDING' ? (
                    <div className="inline-flex gap-1.5">
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                          handleUpdateStatus(d.id, 'APPROVED', `${d.firstName} ${d.lastName}`)
                        }
                        className="bg-ryda-accent text-ryda-bg hover:bg-ryda-accent-dim h-8 px-2.5 text-xs font-semibold"
                        aria-label={`Approve ${d.firstName} ${d.lastName}`}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() =>
                          handleUpdateStatus(d.id, 'REJECTED', `${d.firstName} ${d.lastName}`)
                        }
                        className="h-8 px-2.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                        aria-label={`Reject ${d.firstName} ${d.lastName}`}
                      >
                        <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1">
                      {d.approvalStatus === 'REJECTED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() =>
                            handleUpdateStatus(d.id, 'APPROVED', `${d.firstName} ${d.lastName}`)
                          }
                          className="h-7 text-xs text-ryda-accent hover:bg-ryda-accent/10"
                        >
                          Re-Approve
                        </Button>
                      )}
                      {d.approvalStatus === 'APPROVED' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() =>
                            handleUpdateStatus(d.id, 'REJECTED', `${d.firstName} ${d.lastName}`)
                          }
                          className="h-7 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
