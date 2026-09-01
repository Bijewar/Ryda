'use client';

import * as React from 'react';
import Map, { type MapProps, type MapRef } from 'react-map-gl/maplibre';
import { cn } from '@/lib/utils';

/**
 * MapView — wrapper around `react-map-gl`'s `<Map>` using MapLibre GL + free
 * OpenStreetMap tiles. No API key, no credit card, no signup.
 *
 * Tiles:     OpenStreetMap standard tile server (free, ~rate-limited)
 *            https://tile.openstreetmap.org/{z}/{x}/{y}.png
 * Style:     Custom JSON style defined inline — dark theme to match Ryda brand
 *
 * For a production launch with heavy traffic, you'd self-host:
 *   - tiles (using `tilemaker` + `mbtiles` — free)
 *   - geocoding (Nominatim — already in use, free, can self-host)
 *   - routing (OSRM — already in use, free, can self-host)
 *
 * Or swap to a paid provider (Mapbox, Google Maps) by changing only the
 * `mapStyle` prop — the rest of the component API stays identical.
 */

export interface MapViewProps extends Omit<MapProps, 'mapStyle'> {
  className?: string;
  /** Override the default style URL. */
  mapStyle?: string | any;
  /** Optional ref to the underlying map instance. */
  mapRef?: React.Ref<MapRef>;
}

// Dark-themed OSM style using free tile servers.
// Inspired by 'allstyle' open map styles — pure CSS filters on OSM tiles
// give us a dark theme without needing a custom tile server.
const RYDA_DARK_STYLE = {
  version: 8 as const,
  name: 'Ryda Dark (OSM)',
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-layer',
      type: 'raster' as const,
      source: 'osm-tiles',
      // Dark filter — makes the standard OSM tiles look dark/purple-tinted
      paint: {
        'raster-opacity': 0.85,
        'raster-saturation': -0.6,
        'raster-contrast': 0.1,
        'raster-brightness-min': 0.1,
        'raster-brightness-max': 0.9,
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
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <Map
        ref={mapRef}
        mapStyle={mapStyle ?? RYDA_DARK_STYLE}
        // No mapboxAccessToken needed — we're using free OSM tiles via MapLibre
        cooperativeGestures
        {...props}
      >
        {children}
      </Map>
      <div className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/70">
        © OpenStreetMap
      </div>
    </div>
  );
}
