'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { VehicleIllustration } from './VehicleIllustration';

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 overflow-hidden w-full max-w-full">
      {/* Mesh gradient backdrop */}
      <div className="absolute inset-0 ryda-gradient-mesh pointer-events-none" aria-hidden />
      {/* Floating blobs */}
      <div
        className="absolute top-20 -left-20 w-56 sm:w-72 h-56 sm:h-72 bg-ryda-accent/15 rounded-full blur-3xl ryda-animate-blob pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-40 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-amber-200/30 rounded-full blur-3xl ryda-animate-blob pointer-events-none"
        style={{ animationDelay: '-6s' }}
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-1/3 w-60 sm:w-80 h-60 sm:h-80 bg-sky-200/30 rounded-full blur-3xl ryda-animate-blob pointer-events-none"
        style={{ animationDelay: '-12s' }}
        aria-hidden
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 bg-ryda-surface border border-ryda-border rounded-full px-3.5 py-1.5 mb-5 sm:mb-6 shadow-sm"
            >
              <span className="flex items-center gap-1 text-xs font-semibold text-ryda-accent">
                <Sparkles className="w-3.5 h-3.5" />
                New
              </span>
              <span className="text-xs font-medium text-ryda-muted">
                India&apos;s most refined ride-hailing app
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.1] text-ryda-text break-words"
            >
              Your ride.
              <br />
              <span className="ryda-text-gradient">Reimagined</span> for India.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 sm:mt-6 text-base sm:text-xl text-ryda-muted max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Book a bike, auto, or premium cab in under 10 seconds. Transparent fares, real-time
              tracking, and 24/7 safety — wrapped in a calmer, cleaner experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center lg:justify-start gap-3 w-full"
            >
              <motion.a
                href="#booking"
                whileHover={{ scale: reduce ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center justify-center gap-2 bg-ryda-accent hover:bg-ryda-accent-dim text-white px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base shadow-xl shadow-ryda-accent/25 transition-colors"
              >
                Book a Ride
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-ryda-surface border border-ryda-border hover:border-ryda-accent/50 text-ryda-text px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-base transition-colors shadow-xs"
              >
                Sign In / Register
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3"
            >
              <TrustItem icon={<Clock className="w-4 h-4" />} label="~8s avg pickup" />
              <TrustItem icon={<ShieldCheck className="w-4 h-4" />} label="Verified drivers" />
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-medium text-ryda-text">4.9</span>
                <span className="text-sm text-ryda-muted">· 2.4M+ rides</span>
              </div>
            </motion.div>
          </div>

          {/* Right — visual */}
          <div className="lg:col-span-6 relative w-full mt-4 lg:mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full"
            >
              {/* Phone-like card */}
              <div className="relative mx-auto max-w-sm sm:max-w-md w-full">
                {/* Glass card */}
                <div className="relative ryda-glass rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-2xl shadow-ryda-text/10">
                  {/* Pickup card */}
                  <div className="bg-ryda-surface rounded-2xl border border-ryda-border/60 p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-ryda-accent ryda-pulse-dot" />
                        <span className="w-px h-6 bg-ryda-border" />
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ryda-muted">
                            From
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-ryda-text truncate">
                            MP Nagar Zone 1, Bhopal
                          </p>
                        </div>
                        <div className="h-px bg-ryda-border/60" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ryda-muted">
                            To
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-ryda-text truncate">
                            Raja Bhoj Airport, Bhopal
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle preview */}
                  <motion.div
                    animate={reduce ? {} : { y: [0, -8, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                    className="relative my-3 sm:my-4 h-28 sm:h-32"
                  >
                    <VehicleIllustration
                      type="premium"
                      className="w-full h-full"
                      color="#10B981"
                      accent="#F5C542"
                    />
                  </motion.div>

                  {/* Quote card */}
                  <div className="bg-gradient-to-br from-ryda-accent to-ryda-accent-dim rounded-2xl p-4 sm:p-5 text-white">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div>
                        <p className="text-xs opacity-80 font-medium">Premium Sedan</p>
                        <p className="font-display text-xl sm:text-2xl font-bold">₹ 384</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80 font-medium">ETA</p>
                        <p className="font-display text-xl sm:text-2xl font-bold">3 min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="opacity-90 truncate">Nearest Captain · 2 min away</span>
                    </div>
                  </div>
                </div>

                {/* Floating badges (visible on sm+ to prevent mobile layout overflow) */}
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="hidden sm:block absolute -left-4 sm:-left-8 lg:-left-12 top-24 ryda-glass rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-ryda-accent/15 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-ryda-accent" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ryda-text">SOS Ready</p>
                      <p className="text-[10px] text-ryda-muted">24×7 safety</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20, y: -20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="hidden sm:block absolute -right-4 sm:-right-8 lg:-right-10 bottom-32 ryda-glass rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ryda-text">Top rated</p>
                      <p className="text-[10px] text-ryda-muted">4.9 · 14k rides</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom running marquee banner */}
      <div className="relative mt-12 sm:mt-16 lg:mt-24 border-y border-ryda-border bg-ryda-surface/60 backdrop-blur-sm overflow-hidden w-full max-w-full">
        <div className="flex w-max ryda-animate-marquee whitespace-nowrap py-3 sm:py-4">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 text-ryda-muted shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-ryda-accent shrink-0" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const MARQUEE = [
  'Bike Taxi',
  'Auto Rickshaw',
  'Cab Economy',
  'Premium Sedan',
  'SUV XL',
  'Outstation',
  'Hourly Rentals',
  'Parcel Delivery',
];

function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-ryda-text">
      <span className="text-ryda-accent">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
