import { NextResponse } from 'next/server';
import { geocode } from '@/lib/geo/osm';
import { BHOPAL_POIS } from '@/lib/geo/pois';
import { ok, error } from '@/types/api';
import { logger } from '@/lib/observability/logger';

export interface AutocompleteSuggestion {
  address: string;
  landmark?: string;
  point: { lat: number; lng: number };
}

/**
 * GET /api/geo/autocomplete?q=...
 *
 * Provides real-time Bhopal location suggestions combining:
 * 1. Curated Bhopal Points of Interest (POIs) matching the query
 * 2. Nominatim OpenStreetMap geocoding bounded to Bhopal municipal bounds
 */
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  if (!q || q.length < 2) {
    // Return top popular POIs if query is very short
    const defaultPois: AutocompleteSuggestion[] = BHOPAL_POIS.slice(0, 5).map((p) => ({
      address: `${p.name}, Bhopal, Madhya Pradesh`,
      landmark: p.name,
      point: { lat: p.lat, lng: p.lng },
    }));
    return NextResponse.json(ok(defaultPois));
  }

  try {
    const suggestions: AutocompleteSuggestion[] = [];
    const lowerQ = q.toLowerCase();

    // 1. Match against known Bhopal POIs
    for (const poi of BHOPAL_POIS) {
      if (poi.name.toLowerCase().includes(lowerQ)) {
        suggestions.push({
          address: `${poi.name}, Bhopal, Madhya Pradesh`,
          landmark: poi.name,
          point: { lat: poi.lat, lng: poi.lng },
        });
      }
    }

    // 2. Fetch from OSM Nominatim Geocoder (bounded to Bhopal)
    try {
      const geoResults = await geocode(q);
      for (const res of geoResults) {
        // Avoid near-duplicate coordinates
        const isDuplicate = suggestions.some(
          (s) => Math.abs(s.point.lat - res.point.lat) < 0.001 && Math.abs(s.point.lng - res.point.lng) < 0.001,
        );
        if (!isDuplicate) {
          suggestions.push({
            address: res.address,
            point: res.point,
          });
        }
      }
    } catch (geoErr) {
      logger.warn({ geoErr, q }, 'Nominatim autocomplete query error');
    }

    return NextResponse.json(ok(suggestions.slice(0, 8)));
  } catch (err) {
    logger.error({ err, q }, 'Autocomplete request failed');
    return NextResponse.json(error('INTERNAL_ERROR', 'Failed to fetch location suggestions'), { status: 500 });
  }
}
