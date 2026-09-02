'use client';
import { motion } from 'framer-motion';
import {
  Bell,
  Clock,
  CreditCard,
  Headphones,
  type LucideIcon,
  Route,
  ShieldCheck,
  UserCheck,
  Wifi,
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  size: 'lg' | 'sm';
  accent: 'emerald' | 'amber' | 'sky' | 'rose';
}

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: '24/7 SOS & live tracking',
    desc: 'Share your live trip with up to 5 contacts. Trigger an in-app SOS that connects you to a real human within 30 seconds, anywhere in Bhopal.',
    size: 'lg',
    accent: 'emerald',
  },
  {
    icon: UserCheck,
    title: 'Verified drivers only',
    desc: 'Every driver is background-checked, trained, and rated after each ride.',
    size: 'sm',
    accent: 'emerald',
  },
  {
    icon: Route,
    title: 'Smart routing',
    desc: 'Real-time traffic-aware routes across Bhopal save up to 18% on fare.',
    size: 'sm',
    accent: 'sky',
  },
  {
    icon: CreditCard,
    title: 'Every payment, every time',
    desc: 'UPI, cards, wallets, cash, Ryda Postpaid. Pick one at the start, change it at the end. Your fare is held in escrow until you arrive.',
    size: 'lg',
    accent: 'amber',
  },
  {
    icon: Bell,
    title: 'Arrival nudges',
    desc: 'Drivers are notified before you arrive, not after.',
    size: 'sm',
    accent: 'amber',
  },
  {
    icon: Wifi,
    title: 'In-cab Wi-Fi',
    desc: 'Free 4G Wi-Fi on every Premium and SUV ride.',
    size: 'sm',
    accent: 'rose',
  },
  {
    icon: Clock,
    title: 'On-time guarantee',
    desc: 'If your cab is more than 3 minutes late, your next ride is on us — automatically. No forms, no support tickets, just credited to your wallet.',
    size: 'lg',
    accent: 'sky',
  },
  {
    icon: Headphones,
    title: 'Human support',
    desc: 'No bots. Reach a real person in under a minute, 24/7.',
    size: 'sm',
    accent: 'emerald',
  },
];

const ACCENT_MAP: Record<Feature['accent'], { icon: string; ring: string; text: string }> = {
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    ring: 'group-hover:ring-emerald-200',
    text: 'text-emerald-600',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    ring: 'group-hover:ring-amber-200',
    text: 'text-amber-600',
  },
  sky: { icon: 'bg-sky-100 text-sky-700', ring: 'group-hover:ring-sky-200', text: 'text-sky-600' },
  rose: {
    icon: 'bg-rose-100 text-rose-700',
    ring: 'group-hover:ring-rose-200',
    text: 'text-rose-600',
  },
};

export function FeaturesSection() {
  return (
    <section id="safety" className="relative py-20 lg:py-28 scroll-mt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-ryda-surface to-ryda-bg" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Safety first
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text"
          >
            Built around <span className="ryda-text-gradient">your safety.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-base sm:text-lg text-ryda-muted"
          >
            Every Ryda ride is wrapped in eight layers of protection — quietly, without you ever
            needing to think about them.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            const colors = ACCENT_MAP[f.accent];
            const isLg = f.size === 'lg';
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                className={cnLg(isLg)}
              >
                <div
                  className={`group h-full ryda-card-hover rounded-3xl border border-ryda-border bg-ryda-surface p-6 lg:p-7 ring-2 ring-transparent ${colors.ring} transition-all`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${colors.icon}`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.8} />
                  </div>
                  <h3 className="mt-5 font-display font-bold text-xl text-ryda-text">{f.title}</h3>
                  <p className="mt-2 text-sm sm:text-base text-ryda-muted leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Span 2 columns on large screens when size === 'lg'. */
function cnLg(isLg: boolean) {
  return isLg ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-1';
}
