'use client';

import * as React from 'react';
import { Source, Layer, type LayerProps } from 'react-map-gl/maplibre';

/**
 * BhopalOverlay — renders the Bhopal municipal boundary from `/geo/RydaMap.geojson`.
 */

let cached: Promise<GeoJSON.FeatureCollection | null> | null = null;

function fetchBhopalGeoJSON(): Promise<GeoJSON.FeatureCollection | null> {
  if (cached) return cached;
  cached = fetch('/geo/RydaMap.geojson')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .catch((err) => {
      console.warn('Failed to load /geo/RydaMap.geojson:', err);
      cached = null;
      return null;
    });
  return cached;
}

const LINE_LAYER: LayerProps = {
  id: 'bhopal-boundary-line',
  type: 'line',
  paint: {
    'line-color': '#10B981',
    'line-width': 2,
    'line-opacity': 0.7,
    'line-dasharray': [3, 2],
  },
};

const FILL_LAYER: LayerProps = {
  id: 'bhopal-boundary-fill',
  type: 'fill',
  paint: {
    'fill-color': '#10B981',
    'fill-opacity': 0.05,
  },
};

export function BhopalOverlay(): React.ReactElement | null {
  const [data, setData] = React.useState<GeoJSON.FeatureCollection | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchBhopalGeoJSON().then((geojson) => {
      if (mounted && geojson) setData(geojson);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!data) return null;

  return (
    <Source id="bhopal-boundary" type="geojson" data={data}>
      <Layer {...FILL_LAYER} />
      <Layer {...LINE_LAYER} />
    </Source>
  );
}

export function useBhopalViewport(): {
  longitude: number;
  latitude: number;
  zoom: number;
} {
  return {
    longitude: 77.4126,
    latitude: 23.2599,
    zoom: 12.2,
  };
}
