import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import { computeSurge } from '@/server/matching/surge';
import { type Job, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

/**
 * Surge-pricing job — recomputes the global surge multiplier every 5 minutes.
 *
 * The result is cached in Redis (key `ryda:surge:current`, TTL 300s) by the
 * surge module itself; this worker just triggers the recompute so the cache
 * is always fresh.
 */
let connection: IORedis | null = null;
function getConnection(): IORedis {
  if (connection) return connection;
  connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

export const SURGE_INTERVAL_MS = 5 * 60_000;

export function startSurgeWorker(): Worker<{ type: 'recompute' }> {
  const queue = new Queue<{ type: 'recompute' }>('ryda:surge', { connection: getConnection() });
  const worker = new Worker<{ type: 'recompute' }>(
    'ryda:surge',
    async (job: Job<{ type: 'recompute' }>) => {
      const result = await computeSurge();
      logger.info(result, 'Surge recompute job done');
    },
    { connection: getConnection() },
  );
  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Surge job failed');
  });

  // Repeat every 5 minutes.
  void queue.add('recompute', { type: 'recompute' }, { repeat: { every: SURGE_INTERVAL_MS } });
  return worker;
}
