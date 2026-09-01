import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';

/**
 * OpenTelemetry tracer. The `@vercel/otel` package auto-registers the trace
 * provider when imported — this file just needs to export a `register()`
 * function called from `instrumentation.ts`.
 */
export async function registerOtel(): Promise<void> {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    logger.debug('OTEL endpoint not configured — skipping tracer init');
    return;
  }
  try {
    await import('@vercel/otel');
    logger.info({ endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT }, 'OpenTelemetry registered');
  } catch (err) {
    logger.warn({ err }, 'OTEL registration failed');
  }
}
