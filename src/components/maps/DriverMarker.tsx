'use client';

import * as React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { cn } from '@/lib/utils';

/**
 * DriverMarker — premium top-down car icon for driver's live location.
 * Inspired by Uber's map car markers with a subtle glow halo and smooth
 * rotation based on heading.
 *
 * Props:
 *   - `lng`, `lat` — driver position
 *   - `heading` — optional bearing in degrees (0 = north). Rotates the car.
 *   - `onClick` — optional click handler
 *   - `compact` — smaller variant for admin heatmap
 *   - `variant` — 'sedan' | 'suv' | 'auto' for different vehicle types
 */
export interface DriverMarkerProps {
  lng: number;
  lat: number;
  heading?: number;
  onClick?: (e: maplibregl.MapMouseEvent) => void;
  /** Compact variant — smaller icon, no pulse, used for the admin heatmap. */
  compact?: boolean;
  /** Vehicle type variant */
  variant?: 'sedan' | 'suv' | 'auto';
}

export function DriverMarker({
  lng,
  lat,
  heading = 0,
  onClick,
  compact = false,
  variant = 'sedan',
}: DriverMarkerProps): React.ReactElement {
  return (
    <Marker
      longitude={lng}
      latitude={lat}
      rotationAlignment="map"
      onClick={onClick as any}
      aria-label={`Driver at ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
    >
      <div
        className={cn(
          'relative flex items-center justify-center transition-transform duration-700 ease-out',
          compact ? 'h-5 w-5' : 'h-12 w-12',
        )}
        style={{ transform: `rotate(${heading}deg)` }}
      >
        {/* Outer glow halo (pulsing) */}
        {!compact && (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-[-4px] rounded-full bg-[#00FF87]/15"
              style={{ animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-[-1px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,255,135,0.25) 0%, transparent 70%)',
              }}
            />
          </>
        )}

        {/* Premium Top-Down Car SVG */}
        <svg
          viewBox="0 0 40 64"
          className={cn(
            'relative drop-shadow-lg',
            compact ? 'h-5 w-3' : 'h-10 w-7',
          )}
          aria-hidden="true"
          style={{ filter: compact ? 'none' : 'drop-shadow(0 2px 6px rgba(0,255,135,0.4))' }}
        >
          {variant === 'auto' ? (
            /* Auto-rickshaw top-down */
            <g>
              <rect x="8" y="12" width="24" height="40" rx="6" fill="#0A0A0B" stroke="#00FF87" strokeWidth="1.5" />
              <rect x="12" y="16" width="16" height="12" rx="3" fill="#00CC6A" opacity="0.7" />
              <rect x="10" y="44" width="8" height="5" rx="2" fill="#FFD700" />
              <rect x="22" y="44" width="8" height="5" rx="2" fill="#FFD700" />
              <circle cx="14" cy="10" r="3" fill="#333" stroke="#555" strokeWidth="1" />
              <circle cx="20" cy="6" r="2" fill="#00FF87" opacity="0.8" />
            </g>
          ) : (
            /* Sedan / SUV top-down car */
            <g>
              {/* Car body shadow */}
              <rect x="6" y="4" width="28" height="56" rx="8" ry="10" fill="#111" opacity="0.3" />

              {/* Main car body */}
              <rect x="7" y="3" width="26" height="58" rx="8" ry="10" fill="#1A1A1F" stroke="#00FF87" strokeWidth="1.2" />

              {/* Roof / cabin glass */}
              <rect x="11" y="16" width="18" height="16" rx="4" fill="#00CC6A" opacity="0.5" />
              
              {/* Windshield (front) */}
              <path d="M12 18 Q20 12 28 18 L28 22 Q20 20 12 22 Z" fill="#00FF87" opacity="0.3" />
              
              {/* Rear window */}
              <rect x="12" y="28" width="16" height="6" rx="2" fill="#00CC6A" opacity="0.25" />

              {/* Left headlight */}
              <ellipse cx="12" cy="7" rx="3" ry="2" fill="#FFFFCC" opacity="0.9" />
              {/* Right headlight */}
              <ellipse cx="28" cy="7" rx="3" ry="2" fill="#FFFFCC" opacity="0.9" />

              {/* Headlight beam glow */}
              <ellipse cx="12" cy="4" rx="2.5" ry="3" fill="#FFFF99" opacity="0.3" />
              <ellipse cx="28" cy="4" rx="2.5" ry="3" fill="#FFFF99" opacity="0.3" />

              {/* Left tail light */}
              <rect x="9" y="55" width="6" height="3" rx="1.5" fill="#FF4444" opacity="0.8" />
              {/* Right tail light */}
              <rect x="25" y="55" width="6" height="3" rx="1.5" fill="#FF4444" opacity="0.8" />

              {/* Left side mirror */}
              <ellipse cx="5" cy="20" rx="2.5" ry="1.5" fill="#1A1A1F" stroke="#00FF87" strokeWidth="0.6" />
              {/* Right side mirror */}
              <ellipse cx="35" cy="20" rx="2.5" ry="1.5" fill="#1A1A1F" stroke="#00FF87" strokeWidth="0.6" />

              {/* Left wheels */}
              <rect x="4" y="12" width="4" height="8" rx="2" fill="#333" stroke="#555" strokeWidth="0.5" />
              <rect x="4" y="42" width="4" height="8" rx="2" fill="#333" stroke="#555" strokeWidth="0.5" />
              {/* Right wheels */}
              <rect x="32" y="12" width="4" height="8" rx="2" fill="#333" stroke="#555" strokeWidth="0.5" />
              <rect x="32" y="42" width="4" height="8" rx="2" fill="#333" stroke="#555" strokeWidth="0.5" />

              {/* Center line accent (hood) */}
              <line x1="20" y1="5" x2="20" y2="14" stroke="#00FF87" strokeWidth="0.6" opacity="0.4" />

              {/* SUV extra: roof rack bars */}
              {variant === 'suv' && (
                <>
                  <line x1="13" y1="19" x2="27" y2="19" stroke="#888" strokeWidth="0.8" />
                  <line x1="13" y1="22" x2="27" y2="22" stroke="#888" strokeWidth="0.8" />
                  <line x1="13" y1="25" x2="27" y2="25" stroke="#888" strokeWidth="0.8" />
                </>
              )}
            </g>
          )}
        </svg>
      </div>
    </Marker>
  );
}
