import { db } from '@/lib/db/client';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import { type Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

/**
 * Ride-timeout job — cancels rides stuck in MATCHING for > 30 seconds.
 *
 * Runs every 15 seconds. A ride in MATCHING means we offered it but no driver
 * accepted — the offer.ts escalation logic should have already moved it to
 * NO_DRIVERS, but this is the safety net.
 *
 * Rides in OFFERED for > 60 seconds also get transitioned back to MATCHING
 * so the offer dispatcher can re-offer to fresh drivers.
 */
let connection: IORedis | null = null;
function getConnection(): IORedis {
  if (connection) return connection;
  connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

const MATCHING_TIMEOUT_MS = 30_000;
const OFFERED_TIMEOUT_MS = 60_000;
const RUN_INTERVAL_MS = 15_000;

export async function expireStuckRides(): Promise<{ canceled: number; reoffered: number }> {
  const now = new Date();
  const matchingCutoff = new Date(now.getTime() - MATCHING_TIMEOUT_MS);
  const offeredCutoff = new Date(now.getTime() - OFFERED_TIMEOUT_MS);

  const stuckMatching = await db.ride.findMany({
    where: { status: 'MATCHING', requestedAt: { lt: matchingCutoff } },
    select: { id: true },
  });
  for (const r of stuckMatching) {
    await db.ride.update({ where: { id: r.id }, data: { status: 'NO_DRIVERS', canceledAt: now } });
  }

  const stuckOffered = await db.ride.findMany({
    where: { status: 'OFFERED', acceptedAt: null, requestedAt: { lt: offeredCutoff } },
    select: { id: true },
  });
  for (const r of stuckOffered) {
    await db.ride.update({ where: { id: r.id }, data: { status: 'MATCHING' } });
  }

  return { canceled: stuckMatching.length, reoffered: stuckOffered.length };
}

export function startRideTimeoutWorker(): Worker<{ type: 'expire' }> {
  const queue = new Queue<{ type: 'expire' }>('ryda:ride-timeout', { connection: getConnection() });
  const worker = new Worker<{ type: 'expire' }>(
    'ryda:ride-timeout',
    async (_job: Job<{ type: 'expire' }>) => {
      const result = await expireStuckRides();
      if (result.canceled > 0 || result.reoffered > 0) {
        logger.info(result, 'Ride timeout sweep');
      }
    },
    { connection: getConnection() },
  );
  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Ride-timeout job failed');
  });
  void queue.add('expire', { type: 'expire' }, { repeat: { every: RUN_INTERVAL_MS } });
  return worker;
}
