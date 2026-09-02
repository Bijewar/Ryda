'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MarqueeProps {
  children: React.ReactNode;
  /** Speed in seconds for one full translate cycle. Lower = faster. */
  duration?: number;
  /** Direction of travel. */
  direction?: 'left' | 'right';
  /** Reverse — duplicates children once and shifts by -50% instead of -100%. */
  className?: string;
  /** Pause the animation on hover. */
  pauseOnHover?: boolean;
  /** Gap between repeats, in Tailwind spacing units (default 8). */
  gapClassName?: string;
}

/**
 * Infinite horizontal marquee. The content is duplicated once and the inner
 * row translates from 0% → -50% (or +50% for reverse) on an infinite loop,
 * giving the illusion of endless scroll. Framer Motion's `animate` prop
 * drives the transform with a linear easing.
 *
 * For visual seamlessness, the children should be horizontally symmetrical
 * or repeat-friendly (e.g. a row of vehicle illustrations or pills).
 */
export function Marquee({
  children,
  duration = 22,
  direction = 'left',
  className,
  pauseOnHover = true,
  gapClassName = 'gap-8',
}: MarqueeProps) {
  // Two copies of the children, side by side, so we can shift by -50% and
  // have the second copy line up perfectly.
  return (
    <div
      className={cn(
        'group relative overflow-hidden w-full',
        pauseOnHover && 'hover:[&_.ryda-marquee-track]:[animation-play-state:paused]',
        className,
      )}
    >
      <motion.div
        className={cn('ryda-marquee-track flex w-max will-change-transform', gapClassName)}
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      >
        {/* First copy */}
        <div className={cn('flex shrink-0', gapClassName)} aria-hidden="false">
          {children}
        </div>
        {/* Second copy — hidden from AT since it's a duplicate */}
        <div className={cn('flex shrink-0', gapClassName)} aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
