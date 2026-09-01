"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  /** Animation duration in seconds (default 6). */
  duration?: number;
  /** When true, animate the gradient (background-position shift). When
   *  false, render a static 90deg gradient. */
  animate?: boolean;
  /** If true, runs the gradient shift on mount (no inView wait). */
  immediate?: boolean;
}

/**
 * Animated gradient text. The gradient cycles through orange → pink → teal →
 * purple → orange via `background-position` animation. Used in the hero H1
 * for the word "future".
 *
 * The actual animation is a CSS keyframe `ryda-gradient-shift` defined in
 * globals.css, applied via the `.ryda-text-gradient-anim` class. We wrap it
 * in a Framer Motion `motion.span` only so callers can compose it with other
 * Framer animations (e.g. fade-in on scroll).
 */
export function GradientText({
  children,
  className,
  duration = 6,
  animate = true,
  immediate = true,
}: GradientTextProps) {
  return (
    <motion.span
      initial={immediate ? undefined : { opacity: 0 }}
      whileInView={immediate ? undefined : { opacity: 1 }}
      viewport={immediate ? undefined : { once: true }}
      className={cn(
        animate ? "ryda-text-gradient-anim" : "ryda-text-gradient",
        "inline-block",
        className,
      )}
      style={
        animate
          ? { animationDuration: `${duration}s` }
          : undefined
      }
    >
      {children}
    </motion.span>
  );
}
