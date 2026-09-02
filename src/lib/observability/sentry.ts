import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';

/**
 * Sentry initialization. The actual Sentry import is dynamic so the codebase
 * compiles without `@sentry/nextjs` installed in demo mode.
 */
export async function initSentry(): Promise<void> {
  if (!env.SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.init({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: env.NODE_ENV,
      enabled: env.NODE_ENV === 'production',
    });
    logger.info('Sentry initialized');
  } catch (err) {
    logger.warn({ err }, 'Sentry init failed — continuing without telemetry');
  }
}

/** Capture an exception in Sentry (no-op if Sentry isn't initialised). */
export async function captureException(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  if (!env.SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // Sentry unavailable — swallow, the logger already captured the error.
  }
}
