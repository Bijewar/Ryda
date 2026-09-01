"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
  /** Tailwind gradient classes for the icon chip background. */
  gradient?: string;
  /** CSS color used for the glow on hover. */
  glow?: string;
  className?: string;
}

/**
 * Light glassmorphism pillar card with a gradient icon chip and a colored
 * glow on hover. The card lifts slightly on hover and reveals an accent
 * radial gradient behind the icon.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  index = 0,
  gradient = "from-ryda-primary to-ryda-pink",
  glow = "#FF5722",
  className,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.45,
        delay: (index % 4) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      style={{ ["--p-glow" as string]: glow }}
      className={cn(
        "ryda-glass rounded-xl p-5 sm:p-6 group relative overflow-hidden transition-shadow duration-300",
        "hover:shadow-[0_18px_40px_-12px_var(--p-glow)]",
        className,
      )}
    >
      {/* Subtle accent glow on hover — behind the icon */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{ background: `${glow}30` }}
      />
      <div className="relative flex flex-col gap-3">
        <div
          className={cn(
            "flex items-center justify-center size-10 rounded-xl text-white shadow-md bg-gradient-to-br",
            gradient,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-ryda-text">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-ryda-muted">{description}</p>
      </div>
    </motion.div>
  );
}
