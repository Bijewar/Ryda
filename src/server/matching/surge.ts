import { getBhopalBbox } from '@/lib/db/bhopal';
import { db } from '@/lib/db/client';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';

/**
 * Surge pricing — compute a 1.0x–2.0x multiplier based on driver density.
 *
 * Algorithm:
 *   1. Count online + approved drivers inside the Bhopal polygon.
 *   2. Count active ride requests (status in REQUESTED, MATCHING, OFFERED).
 *   3. Demand ratio = activeRequests / max(drivers, 1).
 *   4. Surge = clamp(1.0 + 0.5 * (ratio - 1), 1.0, 2.0).
 *
 * Recomputed every 5 minutes by the BullMQ surge-pricing job
 * (`src/server/jobs/surge-pricing.ts`). Cached in Redis so the ride-create
 * flow reads it without hitting the DB.
 *
 * Without the optional Bhopal ward GeoJSON, surge is computed globally per
 * Bhopal — the per-ward version is a straightforward extension (replace the
 * single polygon with one ward at a time).
 */

const SURGE_KEY = 'ryda:surge:current';
const MIN_SURGE = 1.0;
const MAX_SURGE = 2.0;

export async function computeSurge(): Promise<{
  multiplier: number;
  drivers: number;
  requests: number;
}> {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "drivers"
    WHERE "isOnline" = true AND "approvalStatus" = 'APPROVED'
  `;
  const drivers = rows[0]?.count ?? 0n;
  const driverCount = Number(drivers);
  const requestCount = await db.ride.count({
    where: { status: { in: ['REQUESTED', 'MATCHING', 'OFFERED'] } },
  });
  const ratio = requestCount / Math.max(driverCount, 1);
  const multiplier = clamp(1.0 + 0.5 * (ratio - 1), MIN_SURGE, MAX_SURGE);
  logger.debug({ driverCount, requestCount, multiplier }, 'Surge computed');
  return { multiplier: round2(multiplier), drivers: driverCount, requests: requestCount };
}

export async function getCurrentSurge(): Promise<number> {
  // Without Redis in demo mode, just recompute on every call (cheap query).
  if (env.DEMO_MODE) {
    const { multiplier } = await computeSurge();
    return multiplier;
  }
  // Lazy import to avoid loading ioredis in tests.
  const { Redis } = await import('ioredis');
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1 });
  try {
    const cached = await redis.get(SURGE_KEY);
    if (cached) return Number(cached);
    const { multiplier } = await computeSurge();
    await redis.set(SURGE_KEY, multiplier, 'EX', 300);
    return multiplier;
  } finally {
    void redis.quit();
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Get the Bhopal bbox — used by the surge map UI to set its viewport. */
export function getSurgeViewport() {
  return getBhopalBbox();
}
