import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Ryda logo — pure SVG + text wordmark, no image assets.
 *
 * Composition:
 *   - A bold "RYDA" wordmark (text, inherits the parent's font-display).
 *   - A small electric-green dot to the right of the wordmark.
 *   - A "v2" badge top-right of the dot.
 *
 * The mark itself is a rounded-square tile containing a stylised "R"
 * stroke (electric-green on the brand surface). It scales cleanly because
 * every coordinate is in viewBox units.
 */
export interface LogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show the "RYDA v2" wordmark next to the mark. Default: `false` so the
   * existing auth pages that compose their own wordmark (e.g.
   * `<Logo /> <span>Ryda</span>`) don't get a double label.
   */
  showWordmark?: boolean;
}

const SIZE_DIM: Record<NonNullable<LogoProps['size']>, { mark: number; text: string; dot: number }> = {
  sm: { mark: 28, text: 'text-base', dot: 5 },
  md: { mark: 40, text: 'text-xl', dot: 6 },
  lg: { mark: 64, text: 'text-3xl', dot: 8 },
};

export function Logo({
  size = 'md',
  showWordmark = false,
  className,
  ...props
}: LogoProps): React.ReactElement {
  const dims = SIZE_DIM[size];
  return (
    <span
      className={cn('inline-flex items-center gap-2 select-none', className)}
      data-slot="logo"
    >
      <svg
        viewBox="0 0 40 40"
        width={dims.mark}
        height={dims.mark}
        role="img"
        aria-label="Ryda"
        {...props}
      >
        {/* Outer rounded square — the "tile" */}
        <rect
          x="1.5"
          y="1.5"
          width="37"
          height="37"
          rx="10"
          className="fill-ryda-elevated"
          stroke="#26262E"
          strokeWidth="1.2"
        />
        {/* Stylised "R" — single stroke path so it scales cleanly. */}
        <path
          d="M13 29 V11 H20.5 a5.2 5.2 0 0 1 0 10.4 H13 M21.5 22 L27 29"
          fill="none"
          stroke="#00FF87"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Electric-green dot — the brand accent. */}
        <circle cx="29.5" cy="10.5" r={dims.dot / 2 + 1.4} fill="#00FF87" />
      </svg>
      {showWordmark && (
        <span className={cn('font-display font-bold tracking-tight text-ryda-text', dims.text)}>
          RYDA
          <span className="ml-1 align-super text-[0.55em] font-semibold text-ryda-accent">
            v2
          </span>
        </span>
      )}
    </span>
  );
}
