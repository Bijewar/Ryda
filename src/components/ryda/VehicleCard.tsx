"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VehicleCardProps {
  name: string;
  description: string;
  price: string;
  accent: string;
  accentSoft: string;
  /** The vehicle SVG illustration — should fill the card. */
  illustration: React.ReactNode;
  index?: number;
  className?: string;
}

/**
 * Vehicle showcase card. The illustration has a subtle floating animation
 * (bob up/down by 3px). On hover, the card lifts and the vehicle does a
 * quick "drive" animation (translateX + rotate), and the border glows in
 * the vehicle's accent color.
 */
export function VehicleCard({
  name,
  description,
  price,
  accent,
  accentSoft,
  illustration,
  index = 0,
  className,
}: VehicleCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.45,
        delay: (index % 5) * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -8, scale: 1.02 }}
      style={{
        // CSS custom props so the card can reference its accent color.
        ["--v-accent" as string]: accent,
        ["--v-accent-soft" as string]: accentSoft,
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-3",
        "ryda-glass transition-shadow duration-300",
        "hover:shadow-[0_18px_40px_-12px_var(--v-accent)]",
        className,
      )}
    >
      {/* Top accent bar — fills the card's accent color */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent} 35%, ${accent} 65%, transparent 100%)`,
          opacity: 0.85,
        }}
      />
      {/* Soft accent glow behind the vehicle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-8 bottom-20 rounded-2xl blur-2xl opacity-50 transition-opacity duration-500"
        style={{ background: accentSoft }}
      />

      {/* The vehicle illustration — floats, then drives on hover */}
      <motion.div
        className="relative w-full max-w-[200px] aspect-[2/1] mt-2"
        animate={
          hovered
            ? { x: [0, 18, 0], rotate: [0, 2, -2, 0], y: [0, -2, 0] }
            : { y: [-3, 3, -3], x: 0, rotate: 0 }
        }
        transition={
          hovered
            ? { duration: 0.85, ease: "easeInOut" }
            : {
                duration: 3 + (index % 5) * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (index % 5) * 0.3,
              }
        }
      >
        {illustration}
      </motion.div>

      {/* Name */}
      <h3
        className="relative text-base sm:text-lg font-bold tracking-tight text-ryda-text mt-1"
      >
        {name}
      </h3>

      {/* Description */}
      <p className="relative text-xs sm:text-sm text-ryda-muted text-center leading-snug">
        {description}
      </p>

      {/* Price badge */}
      <div className="relative mt-1">
        <span
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: accentSoft,
            color: accent,
            boxShadow: `inset 0 0 0 1px ${accent}33`,
          }}
        >
          {price}
        </span>
      </div>
    </motion.div>
  );
}
