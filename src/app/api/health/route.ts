import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { env } from '@/lib/env';
import { ok, error, statusForCode } from '@/types/api';

/**
 * GET /api/health — liveness + readiness probe.
 *
 * Returns 200 if all of:
 *   - DB ping succeeds (a tiny SELECT 1)
 *   - (Optionally) Redis ping succeeds
 *   - The app booted
 *
 * Used by:
 *   - Docker healthcheck
 *   - Kubernetes readiness probe (if self-hosted)
 *   - Vercel cron monitoring
 */
export async function GET(): Promise<NextResponse> {
  const checks: { db: 'ok' | 'fail'; redis: 'ok' | 'fail' | 'skipped' } = {
    db: 'fail',
    redis: 'skipped',
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'fail';
  }

  if (!env.DEMO_MODE && env.REDIS_URL) {
    try {
      const { Redis } = await import('ioredis');
      const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true });
      await redis.connect();
      await redis.ping();
      await redis.quit();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'fail';
    }
  }

  const healthy = checks.db === 'ok';
  const body = ok({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    version: '2.0.0',
    demoMode: env.DEMO_MODE,
    timestamp: new Date().toISOString(),
  });

  if (!healthy) {
    const errRes = error('INTERNAL_ERROR', 'Health check failed');
    return NextResponse.json(errRes, { status: statusForCode(errRes.error.code) });
  }
  return NextResponse.json(body);
}
