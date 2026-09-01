'use client';

import * as React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { cn } from '@/lib/utils';

/**
 * PickupPin — pickup/dropoff pin marker.
 *
 * `type="pickup"` renders a green dot with a small "P" label.
 * `type="dropoff"` renders a red dot with a "D" label.
 *
 * Both pins use a custom SVG rather than the default marker so the
 * styling matches the Ryda brand and remains readable at all zoom levels.
 */
export interface PickupPinProps {
  lng: number;
  lat: number;
  type: 'pickup' | 'dropoff';
  label?: string;
}

export function PickupPin({ lng, lat, type, label }: PickupPinProps): React.ReactElement {
  const isPickup = type === 'pickup';
  const color = isPickup ? '#00FF87' : '#FF4D4F';
  const letter = label ?? (isPickup ? 'A' : 'B');

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor="bottom"
      aria-label={`${isPickup ? 'Pickup' : 'Dropoff'} location`}
    >
      <div
        className={cn('relative flex flex-col items-center')}
        style={{ transform: 'translateY(-100%)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-lg"
          style={{
            backgroundColor: color,
            color: '#0A0A0B',
            border: '2px solid #0A0A0B',
          }}
        >
          {letter}
        </div>
        {/* Pin tail */}
        <div
          aria-hidden="true"
          className="-mt-1 h-0 w-0"
          style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `8px solid ${color}`,
          }}
        />
      </div>
    </Marker>
  );
}
