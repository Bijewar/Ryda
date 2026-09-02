'use client';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Star, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';

const DRIVER_PERKS = [
  { icon: Wallet, label: 'Daily payouts', desc: 'Get paid the same day, before 8pm.' },
  { icon: TrendingUp, label: 'Earn up to ₹80k', desc: 'Per month, full-time on Premium.' },
  { icon: Clock, label: 'Flexible hours', desc: 'Drive when you want, no targets.' },
  { icon: Calendar, label: 'No joining fees', desc: 'Sign up free, KYC in 24h.' },
];

export function DriversSection() {
  return (
    <section id="drivers" className="relative py-20 lg:py-28 scroll-mt-24">
      <div className="absolute inset-0 bg-gradient-to-b from-ryda-bg to-ryda-surface" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <Wallet className="w-3.5 h-3.5" />
              For Drivers
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text">
              Drive with <span className="ryda-text-gold">Ryda.</span>
              <br />
              Earn on your terms.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ryda-muted max-w-xl">
              We keep just enough to run the platform. You keep more of every ride — paid out the
              same day, with tools that respect your time.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {DRIVER_PERKS.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-ryda-surface border border-ryda-border hover:border-ryda-accent/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-ryda-accent/10 flex items-center justify-center text-ryda-accent-dim flex-shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-ryda-text">{p.label}</p>
                      <p className="text-xs text-ryda-muted mt-0.5">{p.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-8 inline-block"
            >
              <Link
                href="/driver/register"
                className="inline-flex items-center gap-2 bg-ryda-text text-white px-7 py-4 rounded-2xl font-semibold text-base hover:bg-ryda-text/90 transition-colors shadow-lg"
              >
                Sign up to drive
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <p className="mt-3 text-xs text-ryda-muted">
              KYC in 24h · No joining fee · Cancel anytime
            </p>
          </motion.div>

          {/* Right — earnings card mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6"
          >
            <div className="relative mx-auto max-w-md">
              <div
                className="absolute -inset-4 bg-gradient-to-br from-amber-200/40 via-ryda-accent/15 to-sky-200/30 blur-3xl rounded-full"
                aria-hidden
              />
              <div className="relative ryda-glass rounded-[2rem] p-6 shadow-2xl shadow-ryda-text/10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-ryda-muted font-medium">This week&apos;s earnings</p>
                    <p className="font-display text-3xl font-extrabold text-ryda-text">₹ 18,420</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +12%
                  </span>
                </div>

                {/* Earnings bar chart */}
                <div className="flex items-end gap-2 h-24 mb-5">
                  {[42, 65, 48, 88, 72, 96, 80].map((h, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.7,
                        delay: 0.5 + idx * 0.07,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-ryda-accent/40 to-ryda-accent"
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-medium text-ryda-muted mb-5">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                {/* Trip card */}
                <div className="rounded-2xl bg-ryda-surface border border-ryda-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-ryda-text">Last trip</p>
                    <p className="text-xs font-semibold text-ryda-accent-dim">₹ 384</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ryda-muted">
                    <span className="w-2 h-2 rounded-full bg-ryda-accent" />
                    MP Nagar
                    <span className="flex-1 h-px bg-ryda-border" />
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Airport Road
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                        AK
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ryda-text">Aarav K.</p>
                        <p className="flex items-center gap-0.5 text-[10px] text-ryda-muted">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> 5.0
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/driver/register"
                      className="text-xs font-semibold text-ryda-accent-dim hover:text-ryda-text transition-colors"
                    >
                      Join as Driver
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
