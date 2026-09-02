'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Loader2, LogIn, LogOut, Menu, UserPlus, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { Logo } from './Logo';

const NAV_LINKS = [
  { label: 'Rides', href: '#rides' },
  { label: 'Services', href: '#services' },
  { label: 'For Drivers', href: '#drivers' },
  { label: 'Safety', href: '#safety' },
  { label: 'About', href: '#about' },
];

export interface NavBarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    accountType?: 'PASSENGER' | 'ADMIN' | string;
    driverId?: string | null;
  } | null;
}

export function NavBar({ user }: NavBarProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      toast.info('Signing out…');
      await signOut({ callbackUrl: '/login' });
    } catch {
      window.location.href = '/login';
    } finally {
      setIsSigningOut(false);
    }
  };

  const isAdmin =
    user?.accountType === 'ADMIN' || user?.email?.toLowerCase() === 'bijewarmanas1@gmail.com';
  const isDriver = !!user?.driverId;

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'py-2.5 bg-ryda-surface/90 backdrop-blur-md shadow-md border-b border-ryda-border'
            : 'py-4 bg-ryda-bg/80 backdrop-blur-sm',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size="md" showWordmark />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3.5 py-2 text-sm font-semibold text-ryda-text/80 hover:text-ryda-text transition-colors rounded-xl hover:bg-ryda-elevated/70"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth Buttons / Logged-in User Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* User Profile Pill */}
                  <div className="flex items-center gap-2 bg-ryda-surface border border-ryda-border px-3 py-1.5 rounded-2xl shadow-xs">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                      {userInitial}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-ryda-text leading-tight">{user.name}</p>
                      <p className="text-[10px] text-ryda-muted font-medium capitalize">
                        {isAdmin ? 'Admin' : isDriver ? 'Captain' : 'Passenger'}
                      </p>
                    </div>
                  </div>

                  {/* Role Specific Action Portal */}
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-purple-700 transition-all shadow-md cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Admin Panel</span>
                    </Link>
                  ) : isDriver ? (
                    <Link
                      href="/driver-dashboard"
                      className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-amber-600 transition-all shadow-md cursor-pointer"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Captain Portal</span>
                    </Link>
                  ) : (
                    <a
                      href="#booking"
                      className="inline-flex items-center gap-1.5 bg-ryda-accent text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-ryda-accent-dim transition-all shadow-md ryda-accent-glow"
                    >
                      <span>Book Ride</span>
                    </a>
                  )}

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    title="Sign Out"
                    className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {isSigningOut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  {/* Sign In Button */}
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-ryda-text bg-ryda-surface hover:bg-ryda-elevated border border-ryda-border px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-ryda-accent" />
                    <span>Sign In</span>
                  </Link>

                  {/* Sign Up Button */}
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-white bg-ryda-accent hover:bg-ryda-accent-dim px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl shadow-md transition-all ryda-accent-glow cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Trigger */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                className="md:hidden p-2 text-ryda-text hover:bg-ryda-elevated rounded-xl transition-colors border border-ryda-border"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 z-40 md:hidden"
          >
            <div className="ryda-glass-strong rounded-3xl p-6 shadow-2xl border border-ryda-border">
              {/* User badge on mobile if logged in */}
              {user && (
                <div className="mb-4 pb-4 border-b border-ryda-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ryda-accent to-ryda-accent-dim text-white font-extrabold flex items-center justify-center text-sm shadow-md">
                      {userInitial}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-ryda-text">{user.name}</p>
                      <p className="text-xs text-ryda-muted">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-ryda-elevated border border-ryda-border text-ryda-text uppercase">
                    {isAdmin ? 'Admin' : isDriver ? 'Captain' : 'Rider'}
                  </span>
                </div>
              )}

              <nav className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 text-base font-bold text-ryda-text hover:bg-ryda-elevated rounded-xl transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-5 pt-5 border-t border-ryda-border/60 flex flex-col gap-3">
                {user ? (
                  <>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-center bg-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md"
                      >
                        Admin Panel
                      </Link>
                    ) : isDriver ? (
                      <Link
                        href="/driver-dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-center bg-amber-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-md"
                      >
                        Captain Portal
                      </Link>
                    ) : (
                      <a
                        href="#booking"
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-center bg-ryda-accent text-white py-3.5 rounded-2xl font-bold text-sm shadow-md"
                      >
                        Book a Ride
                      </a>
                    )}

                    {/* Sign Out Button in Mobile Menu */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        void handleSignOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 py-3 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-center bg-ryda-surface border border-ryda-border py-3 rounded-2xl font-bold text-sm text-ryda-text shadow-xs"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="text-center bg-ryda-accent text-white py-3 rounded-2xl font-bold text-sm shadow-md"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}

                <Link
                  href="/driver/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center bg-amber-50 border border-amber-200 text-amber-800 py-3 rounded-2xl font-bold text-xs"
                >
                  Register as Captain Partner →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
