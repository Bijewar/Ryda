'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { CANCELLATION_REASONS, type CancellationReasonCategory } from '@/types/reliability';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface DriverCancelReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (category: CancellationReasonCategory, reasonText: string) => Promise<void>;
  monthlyCancellationsUsed?: number;
  cancellationAllowance?: number;
}

export function DriverCancelReasonModal({
  isOpen,
  onClose,
  onConfirm,
  monthlyCancellationsUsed = 0,
  cancellationAllowance = 15,
}: DriverCancelReasonModalProps): React.ReactElement | null {
  const [selectedCategory, setSelectedCategory] = React.useState<CancellationReasonCategory>('CUSTOMER_REQUESTED');
  const [customDetails, setCustomDetails] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen) return null;

  const selectedMeta = CANCELLATION_REASONS.find((r) => r.category === selectedCategory);
  const willIncurPenalty = (selectedMeta?.isPenalizedByDefault ?? false) && monthlyCancellationsUsed >= cancellationAllowance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(selectedCategory, customDetails || (selectedMeta?.label ?? 'Cancelled by driver'));
      onClose();
    } catch {
      // handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in-50">
      <div className="relative w-full max-w-lg rounded-2xl border border-ryda-border bg-ryda-elevated shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ryda-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ryda-text">Cancel Accepted Ride</h3>
              <p className="text-xs text-ryda-muted">
                Allowance: <span className="font-semibold text-ryda-accent">{monthlyCancellationsUsed}/{cancellationAllowance}</span> used this month
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-ryda-muted hover:bg-ryda-surface hover:text-ryda-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Reasons list */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 ryda-scrollbar">
            <Label className="text-xs font-semibold text-ryda-muted uppercase tracking-wider block mb-2">
              Select Cancellation Reason
            </Label>

            {CANCELLATION_REASONS.map((r) => {
              const isSelected = selectedCategory === r.category;
              return (
                <div
                  key={r.category}
                  onClick={() => setSelectedCategory(r.category)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-ryda-accent bg-ryda-accent/10 shadow-sm'
                      : 'border-ryda-border bg-ryda-surface/60 hover:bg-ryda-surface'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellationReason"
                    checked={isSelected}
                    onChange={() => setSelectedCategory(r.category)}
                    className="mt-1 accent-emerald-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ryda-text">{r.label}</span>
                      {r.isPenalizedByDefault ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                          Counts to allowance
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" /> No penalty
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ryda-muted mt-0.5">{r.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Penalty Warning Callout */}
          {willIncurPenalty && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Cancellation fee warning</p>
                <p className="text-[11px] text-destructive/80">
                  You have reached your free monthly cancellation limit. A progressive cancellation fee will apply to avoidable cancellations.
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-ryda-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-ryda-border text-xs"
            >
              Keep Ride
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs py-5"
            >
              {isSubmitting ? 'Canceling…' : 'Confirm Cancel'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
