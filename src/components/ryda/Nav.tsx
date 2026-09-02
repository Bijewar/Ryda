'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ExternalLink, Github, Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '#architecture', label: 'Architecture' },
  { href: '#features', label: 'Features' },
  { href: '#vehicles', label: 'Vehicles' },
  { href: '#bhopal', label: 'Bhopal' },
  { href: '#resume', label: 'Resume' },
] as const;

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2 group" aria-label="Ryda v2 — back to top">
      <span className="text-lg sm:text-xl font-extrabold tracking-tight text-ryda-text">RYDA</span>
      {/* gradient dot — orange→pink */}
      <span
        aria-hidden="true"
        className="size-2 rounded-full"
        style={{
          background: 'linear-gradient(135deg, var(--ryda-primary) 0%, var(--ryda-pink) 100%)',
          boxShadow: '0 0 10px rgba(255, 87, 34, 0.5)',
        }}
      />
      <span
        className="text-xs font-mono px-1.5 py-0.5 rounded-md"
        style={{
          background: 'linear-gradient(135deg, var(--ryda-primary-soft) 0%, #FCE7F3 100%)',
          color: 'var(--ryda-primary)',
          border: '1px solid color-mix(in oklab, var(--ryda-primary) 30%, transparent)',
        }}
      >
        v2
      </span>
    </a>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={onNavigate}
              className="block px-3 py-2 text-sm font-medium text-ryda-muted hover:text-ryda-text hover:bg-ryda-primary-soft/60 rounded-md transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CtaButtons({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
      <Button
        variant="ghost"
        size="sm"
        asChild
        onClick={onNavigate}
        className="justify-start sm:justify-center text-ryda-muted hover:text-ryda-text hover:bg-ryda-bg-soft"
      >
        <a href="#bhopal">
          <Sparkles className="size-4 text-ryda-primary" aria-hidden="true" />
          <span>Live Demo</span>
        </a>
      </Button>
      <Button
        size="sm"
        asChild
        onClick={onNavigate}
        className="ryda-btn-gradient font-semibold border-0 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
      >
        <a href="https://github.com/ryda-v2" target="_blank" rel="noopener noreferrer">
          <Github className="size-4" aria-hidden="true" />
          <span>Get Started</span>
          <ExternalLink className="size-3 opacity-70" aria-hidden="true" />
        </a>
      </Button>
    </div>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'ryda-glass border-b border-ryda-border'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavLinks />
          </div>

          {/* Desktop CTAs + theme toggle */}
          <div className="hidden md:flex items-center gap-2">
            <CtaButtons />
            <div className="h-6 w-px bg-ryda-border mx-1" aria-hidden="true" />
            <ThemeToggle />
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="h-9 w-9 text-ryda-text hover:bg-ryda-bg-soft"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[88vw] sm:w-[380px] bg-ryda-bg border-ryda-border text-ryda-text p-0"
              >
                <div className="flex items-center justify-between px-5 h-16 border-b border-ryda-border">
                  <SheetTitle className="text-base">
                    <Logo />
                  </SheetTitle>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close menu"
                      className="h-9 w-9 text-ryda-muted hover:text-ryda-text hover:bg-ryda-bg-soft"
                    >
                      <X className="size-5" aria-hidden="true" />
                    </Button>
                  </SheetClose>
                </div>
                <div className="flex flex-col gap-6 p-5">
                  <NavLinks onNavigate={() => setOpen(false)} />
                  <div className="h-px bg-ryda-border" aria-hidden="true" />
                  <CtaButtons onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
