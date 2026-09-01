'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Toaster — wrapper around Sonner, theme-aware via next-themes.
 *
 * Mounted once in the root layout (`src/app/layout.tsx`). All `toast(...)`
 * calls anywhere in the app render here.
 *
 * The theme is read at runtime so the toaster respects the user's
 * dark/light/system preference. We avoid hydration mismatches because
 * next-themes defaults to `dark` and our `<html className="dark">` matches.
 */
export function Toaster(props: ToasterProps): React.ReactElement {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-md',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster as Sonner };
