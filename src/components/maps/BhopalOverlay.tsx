'use client';

import * as React from 'react';
import { Source, Layer, type LayerProps } from 'react-map-gl/maplibre';
import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

/**
 * BhopalOverlay — renders the Bhopal municipal boundary as a styled
 * GeoJSON layer on top of the parent `<MapView>`.
 *
 * Fetches `/geo/bhopal-boundary-simplified.geojson` (the 465-vertex simplified
 * polygon shipped as a static asset) on mount, then renders:
 *   - A line layer: 2px electric-green at 60% opacity (the outline)
 *   - A fill layer: dark fill at 5% opacity (the service-area tint)
 *
 * Both layers sit above the base map but below markers so pins/routes drawn
 * later remain visible.
 *
 * The fetch is cached on a module-level ref so multiple map views on the same
 * page share a single network request.
 */
type BhopalFeatureCollection = FeatureCollection<Polygon | MultiPolygon>;

interface BhopalProperties {
  name: string;
  bbox: number[];
  centroid: number[];
  areaKm2?: number;
}

let cached: Promise<BhopalFeatureCollection | null> | null = null;

function fetchBhopal(): Promise<BhopalFeatureCollection | null> {
  if (cached) return cached;
  cached = fetch('/geo/bhopal-boundary-simplified.geojson')
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<BhopalFeatureCollection>;
    })
    .catch((err) => {
      console.error('Failed to load Bhopal boundary', err);
      cached = null;
      return null;
    });
  return cached;
}

const LINE_STYLE: LayerProps = {
  id: 'bhopal-boundary-line',
  type: 'line',
  paint: {
    'line-color': '#00FF87',
    'line-width': 2,
    'line-opacity': 0.6,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
};

const FILL_STYLE: LayerProps = {
  id: 'bhopal-boundary-fill',
  type: 'fill',
  paint: {
    'fill-color': '#0A0A0B',
    'fill-opacity': 0.05,
  },
};

export interface BhopalOverlayProps {
  /** Toggle the fill layer (default: on). */
  showFill?: boolean;
  /** Toggle the line layer (default: on). */
  showLine?: boolean;
}

export function BhopalOverlay({
  showFill = true,
  showLine = true,
}: BhopalOverlayProps): React.ReactElement | null {
  const [data, setData] = React.useState<BhopalFeatureCollection | null>(null);

  React.useEffect(() => {
    let mounted = true;
    void fetchBhopal().then((fc) => {
      if (mounted && fc) setData(fc);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return null;

  return (
    <Source id="bhopal-boundary" type="geojson" data={data}>
      {showFill && <Layer {...FILL_STYLE} />}
      {showLine && <Layer {...LINE_STYLE} />}
    </Source>
  );
}

/** Centroid + bbox of the Bhopal polygon — useful for setting the initial viewport. */
export function useBhopalViewport():
  | { longitude: number; latitude: number; zoom: number }
  | null {
  const [viewport, setViewport] = React.useState<{
    longitude: number;
    latitude: number;
    zoom: number;
  } | null>(null);

  React.useEffect(() => {
    void fetchBhopal().then((fc) => {
      if (!fc || fc.features.length === 0) return;
      const props = fc.features[0]?.properties as BhopalProperties | undefined;
      if (!props?.centroid || props.centroid.length < 2) return;
      setViewport({
        longitude: props.centroid[0] ?? 77.4321,
        latitude: props.centroid[1] ?? 23.2419,
        zoom: 11,
      });
    });
  }, []);

  return viewport;
}
