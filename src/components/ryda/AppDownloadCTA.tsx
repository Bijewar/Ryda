'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Apple, Play, Smartphone, QrCode, ArrowRight } from 'lucide-react';
import { VehicleIllustration } from './VehicleIllustration';

export function AppDownloadCTA() {
  return (
    <section id="download" className="relative py-20 lg:py-28 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20"
        >
          {/* Decorative glows */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-ryda-accent/20 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl" aria-hidden />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
            aria-hidden
          />

          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-white/10 text-white px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Get the app
              </motion.div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
                Your next ride is <br />
                <span className="text-ryda-accent">8 seconds away.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-white/70 max-w-lg">
                Download Ryda for iOS or Android. First ride is free up to ₹150 —
                no card needed, no strings attached.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-3 bg-white text-ryda-text px-6 py-3.5 rounded-2xl font-semibold shadow-lg"
                >
                  <Apple className="w-6 h-6" />
                  <div className="text-left leading-none">
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Download on the</p>
                    <p className="text-base font-bold">App Store</p>
                  </div>
                </motion.a>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-3 bg-white text-ryda-text px-6 py-3.5 rounded-2xl font-semibold shadow-lg"
                >
                  <Play className="w-6 h-6 fill-ryda-text" />
                  <div className="text-left leading-none">
                    <p className="text-[10px] uppercase tracking-wider opacity-70">Get it on</p>
                    <p className="text-base font-bold">Google Play</p>
                  </div>
                </motion.a>
              </div>

              <div className="mt-8 flex items-center gap-4 text-white/70">
                <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Scan to install</p>
                  <p className="text-xs">Point your camera here on Android or iOS</p>
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-64 h-[480px] rounded-[2.5rem] bg-stone-900 border-4 border-white/15 shadow-2xl overflow-hidden"
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-stone-900 z-10" />
                <div className="h-full bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-8 flex flex-col">
                  <div className="flex items-center justify-between text-[10px] text-stone-700 mb-4">
                    <span className="font-bold">9:41</span>
                    <div className="flex gap-1 items-center">
                      <span>●●●</span>
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-800 to-stone-900" />
                    <div>
                      <p className="text-xs font-bold text-stone-900">Ryda</p>
                      <p className="text-[9px] text-stone-500">Good morning, Aarav</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white shadow-md p-3 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="flex-1 h-1.5 rounded-full bg-stone-100" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <div className="flex-1 h-1.5 rounded-full bg-stone-100" />
                    </div>
                  </div>
                  <div className="flex-1 rounded-2xl bg-emerald-100/40 flex items-center justify-center">
                    <VehicleIllustration
                      type="cab"
                      className="w-full h-32"
                      color="#3B82F6"
                      accent="#F5C542"
                    />
                  </div>
                  <div className="mt-3 rounded-2xl bg-stone-900 p-3">
                    <div className="flex justify-between text-white">
                      <div>
                        <p className="text-[10px] opacity-70">Cab Economy</p>
                        <p className="text-sm font-bold">₹ 184</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] opacity-70">ETA</p>
                        <p className="text-sm font-bold">5 min</p>
                      </div>
                    </div>
                  </div>
                  <button className="mt-3 bg-emerald-500 text-white text-xs font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5">
                    Book Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
