'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  /** Count-up target. */
  to?: number;
  /** Static value (used when not a number). */
  value?: string;
  /** Suffix appended to the number (e.g. " km²", "+"). */
  suffix?: string;
  /** Prefix prepended (e.g. "₹"). */
  prefix?: string;
  /** Override the displayed value once finished (e.g. "free"). */
  finishedLabel?: string;
  label: string;
  /** CSS color used for the colored border + label tint. */
  accent?: string;
  /** Number of decimals (default 0). */
  decimals?: number;
  /** Show count-up vs static string. */
  animate?: boolean;
  className?: string;
  delay?: number;
}

/**
 * Glassmorphism stat card with a colored top border + count-up animation.
 * Used in the hero. Each card has its own accent color (orange, pink, teal,
 * yellow) so the row reads as a small vibrant palette.
 */
export function StatCard({
  to,
  value,
  suffix,
  prefix,
  finishedLabel,
  label,
  accent = '#FF5722',
  decimals = 0,
  animate = false,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      style={{
        ['--s-accent' as string]: accent,
        ['--s-accent-soft' as string]: `${accent}1A`,
      }}
      className={cn(
        'ryda-glass rounded-xl p-4 sm:p-5 flex flex-col gap-1 relative overflow-hidden',
        'hover:shadow-[0_14px_36px_-14px_var(--s-accent)]',
        className,
      )}
    >
      {/* Colored top border (gradient strip) */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
        }}
      />
      {/* Soft accent glow in the corner */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full blur-2xl opacity-40"
        style={{ background: `${accent}25` }}
      />
      <div
        className="relative text-2xl sm:text-3xl font-extrabold tracking-tight text-ryda-text tabular-nums"
        style={{ color: accent }}
      >
        {animate && to !== undefined ? (
          <AnimatedCounter
            to={to}
            duration={1.5}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
            finishedLabel={finishedLabel}
            delay={delay}
          />
        ) : (
          <>
            {prefix}
            {value}
            {suffix}
          </>
        )}
      </div>
      <div className="relative text-xs sm:text-sm text-ryda-muted leading-snug">{label}</div>
    </motion.div>
  );
}
