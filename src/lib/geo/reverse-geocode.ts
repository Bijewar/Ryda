import type { Point } from '@/lib/db/postgis';
import { isDemoMode } from '@/lib/demo-mode';
import { env } from '@/lib/env';
import { geocode } from '@/lib/geo/osm';
import { logger } from '@/lib/observability/logger';
import { Redis } from 'ioredis';

/**
 * Reverse geocode with 30-day Redis cache.
 *
 * Nominatim rate-limits their free tier heavily, so we cache
 * the result keyed by `lat,lng` rounded to 5 decimal places (~1m precision).
 *
 * In demo mode without Redis, we skip caching and call Nominatim directly.
 */

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (env.NODE_ENV === 'test') return null;
  if (redis) return redis;
  try {
    redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: false });
    redis.on('error', (err) => logger.warn({ err }, 'Redis error in reverse-geocode module'));
    return redis;
  } catch (err) {
    logger.warn({ err }, 'Redis unavailable — reverse-geocode will run uncached');
    return null;
  }
}

const CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function cacheKey(point: Point): string {
  const lat = point.lat.toFixed(5);
  const lng = point.lng.toFixed(5);
  return `ryda:rgeo:${lat},${lng}`;
}

export async function reverseGeocode(point: Point): Promise<string> {
  const cache = isDemoMode ? null : getRedis();
  const key = cacheKey(point);

  if (cache) {
    const cached = await cache.get(key);
    if (cached) return cached;
  }

  // Nominatim reverse endpoint — works in both demo and prod modes.
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.lat}&lon=${point.lng}&zoom=18`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ryda-v2/2.0 (https://github.com/ryda/ryda-v2)' },
  });
  if (!res.ok) {
    logger.warn({ status: res.status }, 'Reverse geocode failed');
    return 'Unknown location';
  }
  const json = (await res.json()) as { display_name?: string };
  const address = json.display_name ?? 'Unknown location';

  if (cache) {
    await cache.set(key, address, 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
  }
  return address;
}

/** Forward geocode wrapper — used by the booking flow autocomplete. */
export async function geocodeAddress(query: string) {
  return geocode(query);
}
