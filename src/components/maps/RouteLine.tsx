'use client';

import type { Feature, LineString } from 'geojson';
import * as React from 'react';
import { Layer, type LayerProps, Source } from 'react-map-gl/maplibre';

/**
 * RouteLine — renders a route as a GeoJSON LineString on the parent map.
 *
 * Used for the pickup→dropoff route on the booking screen, and the live
 * driver trajectory on the tracking screen.
 *
 * Line style: 3px electric-green. Glows via a 6px underlay at 30% opacity
 * for that "neon route" look — subtle, on-brand.
 */
export interface RouteLineProps {
  /** Array of `[lng, lat]` tuples in GeoJSON order. */
  coordinates: [number, number][];
  /** Override the line color (defaults to Ryda accent green). */
  color?: string;
  /** Override the line width in pixels. */
  width?: number;
}

const UNDERLAY_STYLE = (color: string, width: number): LayerProps => ({
  id: 'route-line-underlay',
  type: 'line',
  paint: {
    'line-color': color,
    'line-width': width * 2,
    'line-opacity': 0.25,
    'line-blur': width,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
});

const LINE_STYLE = (color: string, width: number): LayerProps => ({
  id: 'route-line',
  type: 'line',
  paint: {
    'line-color': color,
    'line-width': width,
    'line-opacity': 1,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
});

export function RouteLine({
  coordinates,
  color = '#00FF87',
  width = 3,
}: RouteLineProps): React.ReactElement | null {
  // Memoise so the GeoJSON feature object identity is stable across renders —
  // `react-map-gl` diffs the `data` prop and re-uploads on change.
  const data = React.useMemo<Feature<LineString>>(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    }),
    [coordinates],
  );

  if (coordinates.length < 2) return null;

  return (
    <Source id="route" type="geojson" data={data}>
      <Layer {...UNDERLAY_STYLE(color, width)} />
      <Layer {...LINE_STYLE(color, width)} />
    </Source>
  );
}
