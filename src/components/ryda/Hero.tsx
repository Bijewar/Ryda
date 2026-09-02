'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MapPin, Sparkles, Clock, ShieldCheck, Star } from 'lucide-react';
import { VehicleIllustration } from './VehicleIllustration';

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Mesh gradient backdrop */}
      <div className="absolute inset-0 ryda-gradient-mesh" aria-hidden />
      {/* Floating blobs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-ryda-accent/15 rounded-full blur-3xl ryda-animate-blob" aria-hidden />
      <div className="absolute top-40 right-0 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl ryda-animate-blob" style={{ animationDelay: '-6s' }} aria-hidden />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl ryda-animate-blob" style={{ animationDelay: '-12s' }} aria-hidden />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 bg-ryda-surface border border-ryda-border rounded-full px-3 py-1.5 mb-6 shadow-sm"
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
              className="font-display text-[2.6rem] sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05] text-ryda-text"
            >
              Your ride.
              <br />
              <span className="ryda-text-gradient">Reimagined</span> for India.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-lg sm:text-xl text-ryda-muted max-w-xl leading-relaxed"
            >
              Book a bike, auto, or premium cab in under 10 seconds. Transparent
              fares, real-time tracking, and 24/7 safety — wrapped in a calmer,
              cleaner experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <motion.a
                href="#booking"
                whileHover={{ scale: reduce ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center justify-center gap-2 bg-ryda-accent hover:bg-ryda-accent-dim text-white px-7 py-4 rounded-2xl font-bold text-base shadow-xl shadow-ryda-accent/25 transition-colors"
              >
                Book a Ride
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-ryda-surface border border-ryda-border hover:border-ryda-accent/50 text-ryda-text px-7 py-4 rounded-2xl font-bold text-base transition-colors shadow-xs"
              >
                Sign In / Register
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
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
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Phone-like card */}
              <div className="relative mx-auto max-w-md">
                {/* Glass card */}
                <div className="relative ryda-glass rounded-[2.5rem] p-6 shadow-2xl shadow-ryda-text/10">
                  {/* Pickup card */}
                  <div className="bg-ryda-surface rounded-2xl border border-ryda-border/60 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-ryda-accent ryda-pulse-dot" />
                        <span className="w-px h-6 bg-ryda-border" />
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ryda-muted">
                            From
                          </p>
                          <p className="text-sm font-medium text-ryda-text">
                            MP Nagar Zone 1, Bhopal
                          </p>
                        </div>
                        <div className="h-px bg-ryda-border/60" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-ryda-muted">
                            To
                          </p>
                          <p className="text-sm font-medium text-ryda-text">
                            Raja Bhoj Airport, Bhopal
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle preview */}
                  <motion.div
                    animate={reduce ? {} : { y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative my-4 h-32"
                  >
                    <VehicleIllustration
                      type="premium"
                      className="w-full h-full"
                      color="#10B981"
                      accent="#F5C542"
                    />
                  </motion.div>

                  {/* Quote card */}
                  <div className="bg-gradient-to-br from-ryda-accent to-ryda-accent-dim rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs opacity-80 font-medium">Premium Sedan</p>
                        <p className="font-display text-2xl font-bold">₹ 384</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80 font-medium">ETA</p>
                        <p className="font-display text-2xl font-bold">3 min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="opacity-90">Nearest Captain · 2 min away</span>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, x: -20, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="absolute -left-4 sm:-left-12 top-24 ryda-glass rounded-2xl px-4 py-3 shadow-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-ryda-accent/15 flex items-center justify-center">
                      <ShieldCheck className="w-4.5 h-4.5 text-ryda-accent" />
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
                  className="absolute -right-4 sm:-right-10 bottom-32 ryda-glass rounded-2xl px-4 py-3 shadow-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-400" />
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

      {/* Bottom marquee */}
      <div className="relative mt-16 lg:mt-24 border-y border-ryda-border bg-ryda-surface/50 backdrop-blur-sm overflow-hidden">
        <div className="flex ryda-animate-marquee whitespace-nowrap py-4">
          {[...MARQUEE, ...MARQUEE].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-8 text-ryda-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-ryda-accent" />
              <span className="text-sm font-semibold uppercase tracking-wider">{item}</span>
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
