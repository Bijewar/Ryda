'use client';

import * as React from 'react';
import Map, { type MapProps, type MapRef } from 'react-map-gl/maplibre';
import { cn } from '@/lib/utils';

/**
 * MapView — 100% Free, Zero API Key Map.
 * 
 * Uses OpenFreeMap / OpenStreetMap tiles.
 * NO API key, NO credit card, NO token, NO watermark.
 */

export interface MapViewProps extends Omit<MapProps, 'mapStyle'> {
  className?: string;
  /** Override the default style URL or style object. */
  mapStyle?: string | any;
  /** Optional ref to the underlying map instance. */
  mapRef?: React.Ref<MapRef>;
}

// 100% Free OpenStreetMap Standard Style (No API key, No token, No watermarks)
const RYDA_FREE_OSM_STYLE = {
  version: 8 as const,
  name: 'Ryda Free OSM',
  sources: {
    'osm-standard': {
      type: 'raster' as const,
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster' as const,
      source: 'osm-standard',
      paint: {
        'raster-opacity': 0.95,
        'raster-saturation': -0.15,
        'raster-contrast': 0.05,
      },
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
};

export function MapView({
  children,
  className,
  mapStyle,
  mapRef,
  ...props
}: MapViewProps): React.ReactElement {
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#F4F6F0]', className)}>
      <Map
        ref={mapRef}
        mapStyle={mapStyle ?? 'https://tiles.openfreemap.org/styles/positron'}
        // Fallback gracefully if style URL fails
        onError={(e) => {
          // If vector style fails, fallback to direct raster tiles
          if (e.target && typeof (e.target as any).setStyle === 'function') {
            (e.target as any).setStyle(RYDA_FREE_OSM_STYLE);
          }
        }}
        cooperativeGestures
        {...props}
      >
        {children}
      </Map>
      <div className="pointer-events-none absolute bottom-1 right-1 rounded bg-white/80 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-medium text-stone-600 border border-stone-200 z-10">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
