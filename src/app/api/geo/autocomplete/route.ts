import { geocode } from '@/lib/geo/osm';
import { BHOPAL_POIS } from '@/lib/geo/pois';
import { logger } from '@/lib/observability/logger';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';

export interface AutocompleteSuggestion {
  address: string;
  landmark?: string;
  point: { lat: number; lng: number };
}

/**
 * GET /api/geo/autocomplete?q=...
 *
 * Provides live real-time location suggestions for any keyword using:
 * 1. Curated Bhopal Landmarks matching the keyword
 * 2. Real-time OpenStreetMap Nominatim search for the exact keyword
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 1) {
    const defaultPois: AutocompleteSuggestion[] = BHOPAL_POIS.slice(0, 8).map((p) => ({
      address: `${p.name}, Bhopal`,
      landmark: p.landmark ?? 'Popular Destination',
      point: { lat: p.lat, lng: p.lng },
    }));
    return NextResponse.json(ok(defaultPois));
  }

  try {
    const suggestions: AutocompleteSuggestion[] = [];
    const lowerQ = q.toLowerCase();

    // 1. Fast match against known Bhopal POIs matching keyword
    for (const poi of BHOPAL_POIS) {
      if (
        poi.name.toLowerCase().includes(lowerQ) ||
        (poi.landmark && poi.landmark.toLowerCase().includes(lowerQ))
      ) {
        suggestions.push({
          address: `${poi.name}, Bhopal`,
          landmark: poi.landmark ?? 'Bhopal Landmark',
          point: { lat: poi.lat, lng: poi.lng },
        });
      }
    }

    // 2. Fetch live OpenStreetMap Nominatim results for this keyword
    try {
      const geoResults = await geocode(`${q}, Bhopal, Madhya Pradesh`);
      for (const res of geoResults) {
        const isDuplicate = suggestions.some(
          (s) =>
            Math.abs(s.point.lat - res.point.lat) < 0.0008 &&
            Math.abs(s.point.lng - res.point.lng) < 0.0008,
        );
        if (!isDuplicate) {
          // Format clean readable address from display_name
          const parts = res.address.split(',').map((p) => p.trim());
          const shortAddress = parts.slice(0, 3).join(', ');
          const detail = parts.slice(3, 5).join(', ');

          suggestions.push({
            address: shortAddress || res.address,
            landmark: detail || 'Bhopal Location',
            point: res.point,
          });
        }
      }
    } catch (geoErr) {
      logger.warn({ geoErr, q }, 'Nominatim autocomplete query warning');
    }

    // If still few results, try broader query without Bhopal suffix
    if (suggestions.length < 3 && q.length >= 3) {
      try {
        const broadResults = await geocode(q);
        for (const res of broadResults) {
          const isDuplicate = suggestions.some(
            (s) =>
              Math.abs(s.point.lat - res.point.lat) < 0.0008 &&
              Math.abs(s.point.lng - res.point.lng) < 0.0008,
          );
          if (!isDuplicate) {
            const parts = res.address.split(',').map((p) => p.trim());
            suggestions.push({
              address: parts.slice(0, 3).join(', ') || res.address,
              landmark: parts.slice(3, 5).join(', ') || 'Search Result',
              point: res.point,
            });
          }
        }
      } catch (_e) {
        // Ignore
      }
    }

    return NextResponse.json(ok(suggestions.slice(0, 8)));
  } catch (err) {
    logger.error({ err, q }, 'Autocomplete request failed');
    return NextResponse.json(error('INTERNAL_ERROR', 'Failed to fetch location suggestions'), {
      status: 500,
    });
  }
}
