'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  city: string;
  rating: number;
  text: string;
  initial: string;
  color: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Aarav Sharma',
    role: 'Tech Lead',
    city: 'Bhopal (Arera Colony)',
    rating: 5,
    text: "Switched to Ryda for my daily commute to MP Nagar. The UI is calmer, the fares are transparent, and I've never had a driver cancel after accepting. Felt like the app was designed for me, not the platform.",
    initial: 'AS',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    name: 'Diya Patel',
    role: 'Doctor',
    city: 'Bhopal (AIIMS)',
    rating: 5,
    text: "I book a Premium cab for my night shifts at AIIMS Bhopal. The drivers are always polite, the cars are spotless, and the SOS button gives me peace of mind when I'm exhausted at 2am.",
    initial: 'DP',
    color: 'from-amber-400 to-orange-500',
  },
  {
    name: 'Rohan Iyer',
    role: 'Student, MANIT',
    city: 'Bhopal',
    rating: 5,
    text: "Bike taxis save my life getting to campus on time. Ryda's pricing is actually the price I pay — no 'driver asked for extra cash' nonsense. The UI is honestly beautiful.",
    initial: 'RI',
    color: 'from-sky-400 to-blue-500',
  },
  {
    name: 'Kavya Reddy',
    role: 'Founder',
    city: 'Bhopal',
    rating: 5,
    text: "I switched my entire team to Ryda for client meetings across MP. Hourly rentals actually mean by-the-hour, not by-the-km. Our travel costs dropped 22% in one quarter.",
    initial: 'KR',
    color: 'from-rose-400 to-pink-500',
  },
];

export function Testimonials() {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(t);
  }, [paused]);

  const next = () => setIndex((i) => (i + 1) % TESTIMONIALS.length);
  const prev = () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  const current = TESTIMONIALS[index] ?? TESTIMONIALS[0]!;

  return (
    <section className="relative py-20 lg:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-ryda-surface to-ryda-bg" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-ryda-accent/10 text-ryda-accent-dim px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Quote className="w-3.5 h-3.5" />
            What riders say
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ryda-text">
            Loved across <span className="ryda-text-gradient">Bhopal &amp; MP.</span>
          </h2>
        </div>

        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative min-h-[280px] sm:min-h-[240px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <div className="ryda-glass rounded-3xl p-8 lg:p-10 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < current.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-ryda-border text-ryda-border'
                        )}
                      />
                    ))}
                  </div>
                  <p className="font-display text-xl sm:text-2xl font-medium text-ryda-text leading-relaxed mb-6">
                    &ldquo;{current.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br',
                        current.color
                      )}
                    >
                      {current.initial}
                    </div>
                    <div>
                      <p className="font-semibold text-ryda-text">{current.name}</p>
                      <p className="text-sm text-ryda-muted">
                        {current.role} · {current.city}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={prev}
              className="p-2.5 rounded-full bg-ryda-surface border border-ryda-border hover:border-ryda-accent/40 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-ryda-text" />
            </button>
            <div className="flex gap-1.5">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    i === index ? 'w-8 bg-ryda-accent' : 'w-2 bg-ryda-border hover:bg-ryda-muted'
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="p-2.5 rounded-full bg-ryda-surface border border-ryda-border hover:border-ryda-accent/40 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-ryda-text" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
