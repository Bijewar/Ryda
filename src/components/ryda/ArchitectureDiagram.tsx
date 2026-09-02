'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Boxes,
  Cpu,
  CreditCard,
  Database,
  type LucideIcon,
  Map as MapIcon,
  Monitor,
  Radio,
  Server,
  ShieldCheck,
} from 'lucide-react';

interface ArchBox {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  col: string;
  row: string;
  tier: 'client' | 'edge' | 'data';
  accent: string; // hex color
}

const BOXES: ArchBox[] = [
  {
    id: 'client',
    title: 'Client',
    desc: 'Next.js 16 RSC + streaming. Server components for data, client islands for interactivity.',
    icon: Monitor,
    col: 'lg:col-start-4 lg:col-span-6',
    row: 'lg:row-start-1',
    tier: 'client',
    accent: '#FF5722',
  },
  {
    id: 'edge',
    title: 'Edge middleware',
    desc: 'Auth + CSRF + rate-limit on every request, before it hits a route handler.',
    icon: ShieldCheck,
    col: 'lg:col-start-1 lg:col-span-4',
    row: 'lg:row-start-2',
    tier: 'edge',
    accent: '#2DD4BF',
  },
  {
    id: 'socket',
    title: 'Socket.IO server',
    desc: 'Redis adapter for horizontal scale. Sticky-session friendly, survives restarts.',
    icon: Radio,
    col: 'lg:col-start-5 lg:col-span-4',
    row: 'lg:row-start-2',
    tier: 'edge',
    accent: '#2DD4BF',
  },
  {
    id: 'worker',
    title: 'BullMQ workers',
    desc: 'Async jobs: OTP emails, surge recalculation, payout reconciliation.',
    icon: Cpu,
    col: 'lg:col-start-9 lg:col-span-4',
    row: 'lg:row-start-2',
    tier: 'edge',
    accent: '#2DD4BF',
  },
  {
    id: 'pg',
    title: 'Postgres 16 + PostGIS',
    desc: 'Source of truth. ST_Contains / ST_DWithin for driver matching inside Bhopal.',
    icon: Database,
    col: 'lg:col-start-2 lg:col-span-4',
    row: 'lg:row-start-3',
    tier: 'data',
    accent: '#FFD300',
  },
  {
    id: 'redis',
    title: 'Redis 7',
    desc: 'Cache + pub/sub + BullMQ queue. Single binary, three responsibilities.',
    icon: Server,
    col: 'lg:col-start-6 lg:col-span-3',
    row: 'lg:row-start-3',
    tier: 'data',
    accent: '#FFD300',
  },
  {
    id: 'external',
    title: 'Razorpay · OSM · Gmail SMTP',
    desc: '100% free external services — mocked in DEMO_MODE, real in prod.',
    icon: Boxes,
    col: 'lg:col-start-9 lg:col-span-4',
    row: 'lg:row-start-3',
    tier: 'data',
    accent: '#FF4081',
  },
];

const FLOWS = [
  {
    icon: Radio,
    title: 'Realtime',
    body: 'Passenger requests a ride → Socket.IO broadcasts to drivers in a 5 km PostGIS radius → first accept wins → live location streams over Redis pub/sub, not the DB.',
    accent: '#FF5722',
  },
  {
    icon: CreditCard,
    title: 'Payments',
    body: 'Idempotent Razorpay order creation (X-Idempotency-Key header) → HMAC-verified webhooks → atomic Payment state machine → Razorpay Route payouts to drivers. 100% free — no Stripe.',
    accent: '#2DD4BF',
  },
  {
    icon: MapIcon,
    title: 'Geofence',
    body: 'Bhopal polygon from OSM → PostGIS ST_Contains on every pickup / dropoff → driver-online toggle requires ST_Contains(driver, bhopal) → surge computed per-ward density.',
    accent: '#FF4081',
  },
] as const;

const TIER_STYLES: Record<ArchBox['tier'], string> = {
  client: 'border-ryda-primary/30',
  edge: 'border-ryda-accent/30',
  data: 'border-ryda-yellow/40',
};

const TIER_ICON_STYLES: Record<ArchBox['tier'], string> = {
  client: 'border-ryda-primary/30 bg-ryda-primary/10 text-ryda-primary',
  edge: 'border-ryda-accent/30 bg-ryda-accent/10 text-ryda-accent',
  data: 'border-ryda-yellow/40 bg-ryda-yellow/10 text-ryda-yellow',
};

export function ArchitectureDiagram() {
  return (
    <section
      id="architecture"
      aria-labelledby="arch-heading"
      className="relative scroll-mt-20 border-t border-ryda-border"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-3 mb-10 sm:mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-ryda-primary">
            <Boxes className="size-3.5" aria-hidden="true" />
            System design
          </span>
          <h2
            id="arch-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text font-display"
          >
            Architecture
          </h2>
          <p className="max-w-2xl text-base sm:text-lg text-ryda-muted leading-relaxed">
            One Next.js process serves the client, the API, and the edge middleware. Socket.IO and
            BullMQ run as separate processes so they scale independently. Postgres + PostGIS is the
            only source of truth.
          </p>
        </motion.div>

        <div className="relative">
          {/* SVG connector layer — animated dashed lines (pathLength 0→1) */}
          <svg
            className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ryda-conn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5722" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#FF4081" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            {/* Animated connectors — drawn in with stagger */}
            <motion.line
              x1="50%"
              y1="0"
              x2="50%"
              y2="33%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            />
            <motion.line
              x1="50%"
              y1="33%"
              x2="20%"
              y2="33%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
            />
            <motion.line
              x1="50%"
              y1="33%"
              x2="80%"
              y2="33%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
            />
            <motion.line
              x1="20%"
              y1="50%"
              x2="80%"
              y2="50%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.45 }}
            />
            <motion.line
              x1="20%"
              y1="50%"
              x2="20%"
              y2="70%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.55 }}
            />
            <motion.line
              x1="50%"
              y1="50%"
              x2="50%"
              y2="70%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.65 }}
            />
            <motion.line
              x1="80%"
              y1="50%"
              x2="80%"
              y2="70%"
              stroke="url(#ryda-conn)"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.75 }}
            />
          </svg>

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
            {BOXES.map((box, i) => {
              const Icon = box.icon;
              return (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -6 }}
                  style={{ ['--b-accent' as string]: box.accent }}
                  className={cn(
                    'ryda-glass rounded-xl p-4 sm:p-5 flex flex-col gap-2.5 transition-shadow duration-300',
                    'hover:shadow-[0_14px_36px_-12px_var(--b-accent)]',
                    box.col,
                    box.row,
                    TIER_STYLES[box.tier],
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex items-center justify-center size-9 rounded-lg border',
                        TIER_ICON_STYLES[box.tier],
                      )}
                    >
                      <Icon className="size-4.5" aria-hidden="true" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-ryda-text">{box.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-ryda-muted">{box.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Data flow explanations */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {FLOWS.map((flow, i) => {
            const Icon = flow.icon;
            return (
              <motion.div
                key={flow.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
                style={{ ['--f-accent' as string]: flow.accent }}
                className="ryda-glass rounded-xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_36px_-12px_var(--f-accent)]"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="flex items-center justify-center size-9 rounded-lg"
                    style={{
                      background: `${flow.accent}1A`,
                      color: flow.accent,
                      border: `1px solid ${flow.accent}55`,
                    }}
                  >
                    <Icon className="size-4.5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-bold text-ryda-text">{flow.title}</h3>
                  <span className="ml-auto text-xs font-mono text-ryda-muted">0{i + 1}</span>
                </div>
                <p className="text-sm leading-relaxed text-ryda-muted">{flow.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
