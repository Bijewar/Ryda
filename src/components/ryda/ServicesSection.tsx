'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Bike,
  Car,
  Crown,
  Users,
  Package,
  Calendar,
  Plane,
  Train,
  Bus,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  tag?: string;
  tagColor?: string;
  gradient: string;
  iconBg: string;
  meta: string;
}

const SERVICES: Service[] = [
  {
    id: 'bike',
    icon: Bike,
    title: 'Bike Taxi',
    desc: 'Beat the city traffic. Reach faster, pay less.',
    tag: 'Fastest',
    tagColor: 'bg-ryda-accent/15 text-ryda-accent-dim',
    gradient: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-100 text-emerald-700',
    meta: 'From ₹8/km · 2 min away',
  },
  {
    id: 'auto',
    icon: Bus,
    title: 'Auto Rickshaw',
    desc: 'Everyday short rides with transparent meter fares.',
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-amber-100 text-amber-700',
    meta: 'From ₹10/km · 4 min away',
  },
  {
    id: 'cab',
    icon: Car,
    title: 'Cab Economy',
    desc: 'Comfortable AC sedan for daily city commutes.',
    gradient: 'from-sky-50 to-blue-50',
    iconBg: 'bg-sky-100 text-sky-700',
    meta: 'From ₹14/km · 5 min away',
  },
  {
    id: 'premium',
    icon: Crown,
    title: 'Premium Sedan',
    desc: 'Top-rated drivers, spotless cars, bottled water.',
    tag: 'Premium',
    tagColor: 'bg-amber-100 text-amber-700',
    gradient: 'from-stone-50 to-zinc-100',
    iconBg: 'bg-stone-200 text-stone-800',
    meta: 'From ₹22/km · 3 min away',
  },
  {
    id: 'suv',
    icon: Users,
    title: 'SUV XL',
    desc: 'For groups up to 6, with luggage and legroom.',
    gradient: 'from-violet-50 to-purple-50',
    iconBg: 'bg-violet-100 text-violet-700',
    meta: 'From ₹28/km · 7 min away',
  },
  {
    id: 'rental',
    icon: Clock,
    title: 'Hourly Rentals',
    desc: 'Keep the driver for a few hours. By the hour, not the km.',
    gradient: 'from-rose-50 to-pink-50',
    iconBg: 'bg-rose-100 text-rose-700',
    meta: 'From ₹220/hour',
  },
  {
    id: 'outstation',
    icon: Plane,
    title: 'Outstation',
    desc: 'One-way or round trips to 12,000+ cities across India.',
    gradient: 'from-teal-50 to-cyan-50',
    iconBg: 'bg-teal-100 text-teal-700',
    meta: 'From ₹11/km · One-way fare',
  },
  {
    id: 'parcel',
    icon: Package,
    title: 'Parcel Delivery',
    desc: 'Send documents or packages across the city in minutes.',
    tag: 'New',
    tagColor: 'bg-rose-100 text-rose-700',
    gradient: 'from-orange-50 to-red-50',
    iconBg: 'bg-orange-100 text-orange-700',
    meta: 'From ₹45 · Pickup in 5 min',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="relative py-20 lg:py-28 scroll-mt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-ryda-bg to-ryda-surface" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 bg-ryda-accent/10 text-ryda-accent-dim px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <Calendar className="w-3.5 h-3.5" />
              One app, every ride
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text">
              A ride for <span className="ryda-text-gradient">every moment.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ryda-muted max-w-2xl">
              From a 2-km auto in MP Nagar to an outstation weekend, every Ryda ride is booked
              the same way — fast, fair, and quietly elegant.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 lg:flex lg:items-end lg:justify-end"
          >
            <a
              href="#booking"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ryda-accent-dim hover:text-ryda-text transition-colors"
            >
              See all 8 services
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {SERVICES.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.a
                key={s.id}
                href="#booking"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: (idx % 4) * 0.08 }}
                whileHover={{ y: -6 }}
                className={cn(
                  'group relative overflow-hidden rounded-3xl border border-ryda-border/60 bg-gradient-to-br p-5 lg:p-6 ryda-card-hover cursor-pointer',
                  s.gradient
                )}
              >
                {/* Decorative blob */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/40 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />

                <div className="relative flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', s.iconBg)}>
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  {s.tag && (
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full', s.tagColor)}>
                      {s.tag}
                    </span>
                  )}
                </div>
                <h3 className="relative font-display font-bold text-lg text-ryda-text mb-1.5">
                  {s.title}
                </h3>
                <p className="relative text-sm text-ryda-muted leading-relaxed mb-4">
                  {s.desc}
                </p>
                <div className="relative flex items-center justify-between">
                  <span className="text-xs font-medium text-ryda-text/70">{s.meta}</span>
                  <ArrowUpRight className="w-4 h-4 text-ryda-muted group-hover:text-ryda-accent-dim group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
