'use client';

import * as React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { cn } from '@/lib/utils';

/**
 * PassengerMarker — Uber/Ola-style passenger human & mobile location marker.
 *
 * Renders:
 * - Concentric pulsing radar aura (cyan/emerald glow)
 * - Premium human avatar icon holding mobile / beacon pin
 * - "You Are Here" / "Pickup" micro-badge
 * - Smooth transition when coordinates update
 */
export interface PassengerMarkerProps {
  lng: number;
  lat: number;
  label?: string;
  onClick?: (e: maplibregl.MapMouseEvent) => void;
  className?: string;
}

export function PassengerMarker({
  lng,
  lat,
  label = 'You',
  onClick,
  className,
}: PassengerMarkerProps): React.ReactElement {
  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="center"
      onClick={onClick as any}
      aria-label={`Passenger location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
    >
      <div className={cn('relative flex flex-col items-center justify-center', className)}>
        {/* Outer concentric pulsing beacon rings */}
        <span
          aria-hidden="true"
          className="absolute h-14 w-14 rounded-full bg-cyan-400/20 animate-ping"
          style={{ animationDuration: '2.5s' }}
        />
        <span
          aria-hidden="true"
          className="absolute h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 animate-pulse"
        />

        {/* Floating "You / Pickup" badge */}
        <div className="absolute -top-6 rounded-full bg-ryda-bg/95 border border-cyan-400/50 px-2 py-0.5 text-[9px] font-bold text-cyan-300 shadow-md whitespace-nowrap backdrop-blur-sm pointer-events-none">
          {label}
        </div>

        {/* Passenger Avatar & Mobile Icon Container */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-emerald-400 to-teal-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.6)] border-2 border-ryda-bg">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0A0A0E]">
            {/* Human / Rider Walking Silhouette SVG with Mobile Phone */}
            <svg
              viewBox="0 0 24 24"
              className="h-4.5 w-4.5 text-cyan-300"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Head */}
              <circle cx="12" cy="5" r="2.8" />
              {/* Torso & Arms */}
              <path d="M12 9c-2.2 0-4 1.8-4 4v3.5a1 1 0 0 0 2 0V13c0-1.1.9-2 2-2s2 .9 2 2v3.5a1 1 0 0 0 2 0V13c0-2.2-1.8-4-4-4z" />
              {/* Legs / Stance */}
              <path d="M10 16.5v4a1 1 0 0 0 2 0v-3.5h0v3.5a1 1 0 0 0 2 0v-4c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1z" />
              {/* Mobile device indicator dot in hand */}
              <circle cx="16.5" cy="12" r="1" fill="#00FF87" />
            </svg>
          </div>
        </div>

        {/* Small pin pointer dot below */}
        <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
      </div>
    </Marker>
  );
}
