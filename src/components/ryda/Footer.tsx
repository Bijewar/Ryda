'use client';
import { Facebook, Instagram, Linkedin, Mail, Twitter } from 'lucide-react';
import { Logo } from './Logo';

const FOOTER_LINKS = [
  {
    title: 'Company',
    links: [
      { label: 'About Ryda', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Investors', href: '#' },
    ],
  },
  {
    title: 'Rides',
    links: [
      { label: 'Bike Taxi', href: '#booking' },
      { label: 'Auto Rickshaw', href: '#booking' },
      { label: 'Cab Economy', href: '#booking' },
      { label: 'Premium Sedan', href: '#booking' },
      { label: 'Outstation', href: '#booking' },
    ],
  },
  {
    title: 'Drive',
    links: [
      { label: 'Sign up to drive', href: '/driver/register' },
      { label: 'Driver app', href: '/driver/login' },
      { label: 'Earnings calculator', href: '#drivers' },
      { label: 'Driver FAQ', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Safety', href: '#safety' },
      { label: 'Contact us', href: '#' },
      { label: 'Lost & found', href: '#' },
      { label: 'SOS', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer id="about" className="relative mt-12 bg-ryda-text text-white scroll-mt-24">
      {/* Top accent line */}
      <div
        className="h-1 bg-gradient-to-r from-ryda-accent via-amber-300 to-ryda-accent"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2">
              <Logo size="md" showWordmark onDark />
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed max-w-sm">
              Ryda is India&apos;s premium ride-hailing app. Bikes, autos, cabs, and outstation —
              one tap, transparent fares, calmer rides.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {[Twitter, Linkedin, Instagram, Facebook, Mail].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-ryda-accent hover:text-white transition-all flex items-center justify-center text-white/80 hover:scale-105"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            <div className="mt-6 inline-flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ryda-accent opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ryda-accent" />
              </span>
              <span className="text-xs font-medium text-white/80">
                All systems operational · Bhopal Network Active
              </span>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {FOOTER_LINKS.map((col) => (
              <div key={col.title}>
                <h4 className="font-display font-bold text-sm text-white mb-4 uppercase tracking-wider">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Ryda Technologies Pvt. Ltd. · Made for Bhopal &amp; India.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/50">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Cookies
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
