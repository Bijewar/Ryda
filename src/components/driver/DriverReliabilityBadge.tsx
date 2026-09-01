'use client';

import * as React from 'react';
import { Award, CheckCircle2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import type { DriverReliabilityStats } from '@/types/reliability';

export interface DriverReliabilityBadgeProps {
  stats?: DriverReliabilityStats | null;
}

export function DriverReliabilityBadge({ stats }: DriverReliabilityBadgeProps): React.ReactElement {
  const score = stats?.reliabilityScore ?? 96;
  const cancellationsUsed = stats?.cancellationsThisMonth ?? 2;
  const allowance = stats?.cancellationAllowance ?? 15;
  const isReliable = stats?.isReliableDriver ?? true;
  const bonusRate = stats?.earningsBonusRate ?? 0.02;

  const scoreColor =
    score >= 88 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
    score >= 75 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-destructive bg-destructive/10 border-destructive/30';

  return (
    <div className="rounded-2xl border border-ryda-border bg-ryda-elevated p-4 space-y-3 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ryda-accent/15 text-ryda-accent font-bold">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ryda-text">Driver Reliability</h4>
            <p className="text-[11px] text-ryda-muted">Based on completion & on-time rides</p>
          </div>
        </div>

        {/* Score pill */}
        <div className={`px-2.5 py-1 rounded-xl border font-mono font-bold text-xs ${scoreColor}`}>
          {score}/100
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Monthly cancellations */}
        <div className="p-2.5 rounded-xl bg-ryda-surface border border-ryda-border/60">
          <span className="text-[10px] text-ryda-muted block">Monthly Allowance</span>
          <span className="font-bold text-ryda-text">
            {cancellationsUsed} / {allowance} used
          </span>
        </div>

        {/* Completion rate */}
        <div className="p-2.5 rounded-xl bg-ryda-surface border border-ryda-border/60">
          <span className="text-[10px] text-ryda-muted block">Completion Rate</span>
          <span className="font-bold text-ryda-accent">
            {stats?.completionRate ?? 98.2}%
          </span>
        </div>
      </div>

      {/* Reliable Driver Bonus Banner */}
      {isReliable ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-ryda-accent/15 to-emerald-500/10 border border-ryda-accent/30 text-xs">
          <div className="flex items-center gap-1.5 text-ryda-accent font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Reliable Driver Active</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-ryda-accent text-ryda-bg font-extrabold">
            +{(bonusRate * 100).toFixed(0)}% Earnings Bonus
          </span>
        </div>
      ) : (
        <p className="text-[10px] text-ryda-muted text-center">
          Maintain score &gt; 88 to unlock +2% earnings bonus and priority matching.
        </p>
      )}
    </div>
  );
}
