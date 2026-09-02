'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Marker } from 'react-map-gl/maplibre';

export interface DriverMarkerProps {
  lng: number;
  lat: number;
  heading?: number;
  onClick?: (e: any) => void;
  compact?: boolean;
  variant?: 'bike' | 'auto' | 'sedan' | 'suv' | 'cab' | string;
  driverName?: string;
  rating?: number;
}

export function DriverMarker({
  lng,
  lat,
  heading = 0,
  onClick,
  compact = false,
  variant = 'sedan',
  driverName,
  rating,
}: DriverMarkerProps): React.ReactElement {
  const normType = variant.toLowerCase().includes('bike')
    ? 'bike'
    : variant.toLowerCase().includes('auto')
      ? 'auto'
      : variant.toLowerCase().includes('suv')
        ? 'suv'
        : 'cab';

  const accentColor =
    normType === 'bike'
      ? '#10B981'
      : normType === 'auto'
        ? '#F59E0B'
        : normType === 'suv'
          ? '#7C3AED'
          : '#3B82F6';

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      rotationAlignment="map"
      onClick={onClick}
      aria-label={`Driver at ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
    >
      <div className="relative group cursor-pointer">
        <div
          className={cn(
            'relative flex items-center justify-center transition-transform duration-500 ease-out',
            compact ? 'h-6 w-6' : 'h-10 w-10',
          )}
          style={{ transform: `rotate(${heading}deg)` }}
        >
          {/* Subtle pulse halo */}
          {!compact && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full animate-ping opacity-25"
              style={{ backgroundColor: accentColor }}
            />
          )}

          {/* Vehicle SVG Icon */}
          <div
            className="relative w-8 h-8 rounded-full bg-white shadow-md border flex items-center justify-center"
            style={{ borderColor: accentColor }}
          >
            {normType === 'bike' && (
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
              >
                <circle cx="5.5" cy="17.5" r="3.5" />
                <circle cx="18.5" cy="17.5" r="3.5" />
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l4.5-2L16 11h3" />
              </svg>
            )}
            {normType === 'auto' && (
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
              >
                <path d="M4 17h16M4 17l1-8h14l1 8M6 9l2-5h8l2 5" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="16.5" cy="17.5" r="2.5" />
              </svg>
            )}
            {(normType === 'cab' || normType === 'suv') && (
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
              >
                <path d="M5 17h14M5 17l1-6h12l1 6M7 11l1.5-5h7L17 11" />
                <circle cx="7.5" cy="17.5" r="2" fill={accentColor} />
                <circle cx="16.5" cy="17.5" r="2" fill={accentColor} />
              </svg>
            )}
          </div>
        </div>

        {/* Hover Tooltip */}
        {driverName && (
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg z-30">
            {driverName} {rating ? `★ ${rating.toFixed(1)}` : ''} · {normType.toUpperCase()}
          </div>
        )}
      </div>
    </Marker>
  );
}
