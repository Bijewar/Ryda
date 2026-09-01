/**
 * Pure-JS lat/lon → SVG x/y projection for the landing-page map (no d3 dep).
 *
 * Uses the Bhopal bounding box to map (lng, lat) → (x, y) in [0, 1] of the
 * SVG viewBox, preserving aspect ratio.
 */

export interface Bbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export function makeProjector(bbox: Bbox) {
  const widthLng = bbox.maxLng - bbox.minLng;
  const heightLat = bbox.maxLat - bbox.minLat;
  return (lng: number, lat: number): { x: number; y: number } => {
    const x = (lng - bbox.minLng) / widthLng;
    const y = 1 - (lat - bbox.minLat) / heightLat; // flip Y for SVG
    return { x, y };
  };
}
