import IORedis from 'ioredis';
import { env } from '../src/lib/env';
import { logger } from '../src/lib/observability/logger';
import { startEmailWorker } from '../src/server/jobs/email-queue';
import { startSurgeWorker } from '../src/server/jobs/surge-pricing';
import { startRideTimeoutWorker } from '../src/server/jobs/ride-timeout';
import type { Worker } from 'bullmq';

/**
 * Ryda v2 — standalone BullMQ worker.
 *
 * Runs as a separate process (`bun run dev:worker` / `bun workers/queue-worker.ts`)
 * and owns three queues:
 *
 *   - `ryda:email`         — transactional email (OTP, welcome, receipt, reset)
 *   - `ryda:surge`          — recomputes the surge multiplier every 5 minutes
 *   - `ryda:ride-timeout`   — cancels rides stuck in MATCHING for > 30s
 *
 * A separate worker process lets us scale queue workers independently of the
 * Next.js app. The Next.js API routes enqueue jobs (via `getEmailQueue().add(...)`)
 * but never run them — that's this process's job.
 *
 * In demo mode, the email queue already no-ops inside `enqueueEmail()` (it
 * logs synchronously rather than adding to BullMQ). We still run the surge +
 * ride-timeout workers because their effects are useful for the demo (e.g.
 * surge heatmap, expired-ride cleanup).
 */

const log = logger.child({ scope: 'queue-worker' });

async function bootstrap(): Promise<void> {
  if (env.DEMO_MODE) {
    log.info('Demo mode: queue worker running but jobs are mocked');
    // Still open the Redis connection so the worker is "alive" for healthchecks.
    // We don't actually start the workers in demo mode — the demo OTP email
    // is logged synchronously in `enqueueEmail()`, and surge/timeout are
    // not needed when the app has no real traffic.
  }

  // Single shared Redis connection for all queues. BullMQ recommends
  // `maxRetriesPerRequest: null` so the connection doesn't throw if the
  // first retry fails — important for long-running workers.
  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  connection.on('connect', () => log.info('Redis connected'));
  connection.on('error', (err) => log.error({ err }, 'Redis error'));
  connection.on('reconnecting', (delay: number) => log.warn({ delay }, 'Redis reconnecting'));

  const workers: Worker[] = [];

  if (env.DEMO_MODE) {
    // In demo mode we still want surge + ride-timeout workers running so the
    // admin panel has live data. Email worker is skipped (no-op queue).
    log.info('Demo mode: skipping email worker (emails are synchronous)');
  } else {
    workers.push(startEmailWorker());
    log.info('Email worker started');
  }

  if (env.ENABLE_SURGE_PRICING) {
    workers.push(startSurgeWorker());
    log.info('Surge-pricing worker started (interval: 5 min)');
  }

  if (env.ENABLE_RIDE_TIMEOUT) {
    workers.push(startRideTimeoutWorker());
    log.info('Ride-timeout worker started (interval: 15 s)');
  }

  for (const w of workers) {
    w.on('ready', () => log.info({ queue: w.name }, 'Worker ready'));
    w.on('failed', (job, err) => {
      log.error({ err, queue: w.name, jobId: job?.id }, 'Worker job failed');
    });
    w.on('error', (err) => {
      log.error({ err, queue: w.name }, 'Worker error');
    });
  }

  log.info(
    {
      workerCount: workers.length,
      demoMode: env.DEMO_MODE,
      surge: env.ENABLE_SURGE_PRICING,
      rideTimeout: env.ENABLE_RIDE_TIMEOUT,
    },
    'Queue worker bootstrapped',
  );

  // ── Graceful shutdown ──────────────────────────────────────────────────
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal, workerCount: workers.length }, 'Shutting down queue workers');

    // Close workers first so they stop picking up new jobs, then close Redis.
    await Promise.allSettled(workers.map((w) => w.close()));
    log.info('All workers closed');

    try {
      await connection.quit();
      log.info('Redis connection closed');
    } catch (err) {
      log.warn({ err }, 'Redis close failed during shutdown');
    }

    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    log.error({ err }, 'uncaughtException in queue worker');
  });
  process.on('unhandledRejection', (reason) => {
    log.error({ reason }, 'unhandledRejection in queue worker');
  });
}

void bootstrap().catch((err) => {
  log.error({ err }, 'Failed to bootstrap queue worker');
  process.exit(1);
});
