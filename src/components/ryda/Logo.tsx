import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LogoProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  onDark?: boolean;
}

const SIZE_DIM: Record<NonNullable<LogoProps['size']>, { mark: number; text: string }> = {
  sm: { mark: 28, text: 'text-base' },
  md: { mark: 40, text: 'text-xl' },
  lg: { mark: 56, text: 'text-2xl' },
  xl: { mark: 80, text: 'text-4xl' },
};

export function Logo({
  size = 'md',
  showWordmark = false,
  onDark = false,
  className,
  ...props
}: LogoProps): React.ReactElement {
  const dims = SIZE_DIM[size];
  return (
    <span
      className={cn('inline-flex items-center gap-2.5 select-none', className)}
      data-slot="ryda-logo"
    >
      <svg
        viewBox="0 0 40 40"
        width={dims.mark}
        height={dims.mark}
        role="img"
        aria-label="Ryda"
        {...props}
      >
        <defs>
          <linearGradient id="ryda-tile" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0F1F17" />
            <stop offset="1" stopColor="#1B3A2A" />
          </linearGradient>
          <linearGradient id="ryda-stroke" x1="10" y1="10" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#34E29A" />
            <stop offset="1" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="url(#ryda-tile)" />
        <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
        <path
          d="M13 29 V11 H20.5 a5.2 5.2 0 0 1 0 10.4 H13 M21.5 22 L27 29"
          fill="none"
          stroke="url(#ryda-stroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="29.5" cy="10.5" r="2.6" fill="#F5C542" />
      </svg>
      {showWordmark && (
        <span className={cn(
          'font-display font-extrabold tracking-tight',
          onDark ? 'text-white' : 'text-ryda-text',
          dims.text,
        )}>
          Ryda
        </span>
      )}
    </span>
  );
}
