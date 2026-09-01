'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ThemeToggle — dark/light switch built on `next-themes`.
 *
 * SSR-safety: until the client mounts, we render a placeholder button so
 * the icon doesn't flash the wrong variant (hydration mismatch). After mount
 * the actual Sun/Moon icon appears.
 *
 * Accessibility: the button uses `aria-label` + `aria-pressed` so screen
 * readers announce "switch to dark mode, pressed: false" correctly.
 */
export interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ThemeToggle({ className, ...props }: ThemeToggleProps): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      data-slot="theme-toggle"
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background/40 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4" aria-hidden="true" />
        )
      ) : (
        // Placeholder keeps the layout stable pre-hydration.
        <span className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
