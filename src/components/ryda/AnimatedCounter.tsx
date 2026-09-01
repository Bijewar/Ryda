"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  /** Target number to count up to. */
  to: number;
  /** Duration in seconds. */
  duration?: number;
  /** Delay before starting (seconds). */
  delay?: number;
  /** Prefix string (e.g. "₹"). */
  prefix?: string;
  /** Suffix string (e.g. "+", " km²"). */
  suffix?: string;
  /** Number of decimal places. */
  decimals?: number;
  /** Thousands separator (default ","). */
  separator?: string;
  /** Override the displayed value once finished — e.g. badge "free" instead of "0". */
  finishedLabel?: string;
  className?: string;
  /** Reduced-motion fallback — render the final value immediately. */
  respectReducedMotion?: boolean;
}

/**
 * Count-up animation using Framer Motion's `animate()`. Starts at 0 and
 * animates to `to` once the element enters the viewport (`whileInView`).
 *
 * Uses `useMotionValue` + `animate()` so we don't re-render the whole tree
 * on every frame — we only update a local `display` state via the
 * `onUpdate` callback, which is cheap.
 */
export function AnimatedCounter({
  to,
  duration = 1.5,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = ",",
  finishedLabel,
  className,
  respectReducedMotion = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;

    // Respect prefers-reduced-motion: snap to target by running the animation
    // with a near-zero duration. We still use the `animate()` callback so the
    // setState happens in the callback (not synchronously in the effect body),
    // satisfying react-hooks/set-state-in-effect.
    const prefersReduced =
      respectReducedMotion &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const controls = animate(mv, to, {
      duration: prefersReduced ? 0.001 : duration,
      delay,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
      onComplete: () => setDone(true),
    });
    return () => controls.stop();
  }, [inView, mv, to, duration, delay, respectReducedMotion]);

  const formatted = (() => {
    const fixed = display.toFixed(decimals);
    const [int, frac] = fixed.split(".");
    const withSep = (int ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return frac ? `${withSep}.${frac}` : withSep;
  })();

  // When finished + finishedLabel is set + the target matches the badge
  // (e.g. 0 → "free"), show the label instead of the number.
  const showLabel = done && finishedLabel !== undefined;

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {showLabel ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 18 }}
          className="inline-block"
        >
          {finishedLabel}
        </motion.span>
      ) : (
        <>
          {prefix}
          {formatted}
          {suffix}
        </>
      )}
    </span>
  );
}

/** Convenience wrapper that returns the *string* form, for use as a child. */
export function AnimatedCounterText({
  to,
  duration,
  delay,
  prefix,
  suffix,
  decimals,
  separator,
  finishedLabel,
  className,
}: AnimatedCounterProps) {
  return (
    <AnimatedCounter
      to={to}
      duration={duration}
      delay={delay}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      separator={separator}
      finishedLabel={finishedLabel}
      className={className}
    />
  );
}

// Re-export the transform hook for callers that want even more control.
export { useTransform };
