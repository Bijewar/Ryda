'use client';

import * as React from 'react';
import { motion, useInView, useMotionValue, animate, useTransform } from 'framer-motion';
import { Users, MapPin, Star, Clock } from 'lucide-react';

interface Stat {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
}

const STATS: Stat[] = [
  { icon: Users, label: 'Riders served', value: 2.4, suffix: 'M+', decimals: 1 },
  { icon: MapPin, label: 'Cities live', value: 124, suffix: '+' },
  { icon: Star, label: 'Avg. rating', value: 4.9, suffix: '/5', decimals: 1 },
  { icon: Clock, label: 'Seconds to pickup', value: 8, suffix: 's' },
];

export function StatsSection() {
  return (
    <section className="relative py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] overflow-hidden">
          {/* Premium dark tile */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900" aria-hidden />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, oklch(0.7 0.18 152 / 0.3) 0px, transparent 40%), radial-gradient(circle at 80% 80%, oklch(0.78 0.18 70 / 0.3) 0px, transparent 40%)`,
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
            aria-hidden
          />

          <div className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mb-12"
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-ryda-accent mb-3">
                Trusted by millions
              </p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                India rides with Ryda. <br />
                <span className="text-ryda-accent">A little calmer, every day.</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
              {STATS.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center gap-2 mb-3 text-ryda-accent">
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                        {stat.label}
                      </span>
                    </div>
                    <Counter
                      value={stat.value}
                      suffix={stat.suffix}
                      prefix={stat.prefix}
                      decimals={stat.decimals}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({
  value,
  suffix,
  prefix,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) =>
    latest.toFixed(decimals)
  );

  React.useEffect(() => {
    if (inView) {
      const controls = animate(motionVal, value, {
        duration: 1.6,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [inView, value, motionVal]);

  return (
    <p ref={ref} className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
      {prefix}
      <motion.span>{rounded}</motion.span>
      <span className="text-ryda-accent">{suffix}</span>
    </p>
  );
}
