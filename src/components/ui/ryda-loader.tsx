'use client';

import * as React from 'react';

/**
 * RydaLoader — Ryda's branded full-page loading skeleton.
 *
 * Features:
 * - Pulsing logo ring with emerald glow
 * - Animated progress dots
 * - Optional label text
 * - Backdrop blur glass effect
 */
export function RydaLoader({
  label = 'Loading',
  size = 'lg',
  fullScreen = true,
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}): React.ReactElement {
  const sizeMap = {
    sm: { ring: 'h-10 w-10', dot: 'h-1.5 w-1.5', text: 'text-xs' },
    md: { ring: 'h-14 w-14', dot: 'h-2 w-2', text: 'text-sm' },
    lg: { ring: 'h-20 w-20', dot: 'h-2.5 w-2.5', text: 'text-sm' },
  };
  const s = sizeMap[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-5">
      {/* Animated Logo Ring */}
      <div className="relative">
        {/* Outer glow pulse */}
        <div
          className={`absolute inset-0 ${s.ring} rounded-full bg-ryda-accent/20 animate-ping`}
          style={{ animationDuration: '2s' }}
        />
        {/* Spinning ring */}
        <div className={`${s.ring} relative`}>
          <svg className="animate-spin" style={{ animationDuration: '1.8s' }} viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="25" r="20" stroke="hsl(var(--border))" strokeWidth="3" />
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="hsl(152, 100%, 50%)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="80 45"
            />
          </svg>
          {/* Inner R logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display font-black text-ryda-accent"
              style={{ fontSize: size === 'lg' ? '1.5rem' : size === 'md' ? '1.1rem' : '0.85rem' }}
            >
              R
            </span>
          </div>
        </div>
      </div>

      {/* Label + animated dots */}
      <div className="flex items-center gap-1.5">
        <span className={`${s.text} font-medium text-ryda-muted tracking-wide`}>{label}</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`${s.dot} rounded-full bg-ryda-accent/70`}
              style={{
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ryda-bg">
      {content}
    </div>
  );
}

/**
 * RydaCardSkeleton — A skeleton placeholder for card-shaped content areas.
 */
export function RydaCardSkeleton({
  lines = 4,
  showHeader = true,
  showFooter = false,
}: {
  lines?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-ryda-border bg-ryda-elevated p-5 space-y-4 animate-pulse">
      {showHeader && (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-ryda-surface" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-2/5 rounded bg-ryda-surface" />
            <div className="h-2.5 w-1/3 rounded bg-ryda-surface/60" />
          </div>
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-ryda-surface"
            style={{ width: `${85 - i * 12}%` }}
          />
        ))}
      </div>
      {showFooter && (
        <div className="flex gap-2 pt-2">
          <div className="h-9 flex-1 rounded-lg bg-ryda-surface" />
          <div className="h-9 w-24 rounded-lg bg-ryda-surface/60" />
        </div>
      )}
    </div>
  );
}

/**
 * RydaDashboardSkeleton — Full-page skeleton for dashboard pages.
 */
export function RydaDashboardSkeleton({
  title = 'Loading dashboard',
  columns = 2,
}: {
  title?: string;
  columns?: 1 | 2;
}): React.ReactElement {
  return (
    <main className="min-h-screen bg-ryda-bg text-ryda-text">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded bg-ryda-surface" />
            <div className="h-3.5 w-64 rounded bg-ryda-surface/60" />
          </div>
          <div className="h-8 w-32 rounded bg-ryda-surface/40" />
        </div>

        {/* Content skeleton */}
        <div className={`grid gap-6 ${columns === 2 ? 'lg:grid-cols-[420px_1fr]' : ''}`}>
          <div className="space-y-4">
            <RydaCardSkeleton lines={5} showHeader showFooter />
            <RydaCardSkeleton lines={3} showHeader={false} />
          </div>
          {columns === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-ryda-border bg-ryda-elevated h-[400px] animate-pulse flex items-center justify-center">
                <RydaLoader label={title} size="md" fullScreen={false} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
