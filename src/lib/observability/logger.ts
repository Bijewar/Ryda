import pino from 'pino';
import { env } from '@/lib/env';

/**
 * Pino logger — structured JSON in production, pretty-printed in dev.
 *
 * Every log line carries: `level`, `time`, `msg`, plus any structured
 * fields the caller passes. Request-scoped fields (`requestId`, `userId`)
 * are added by the API route wrapper.
 */
export const logger = pino({
  name: 'ryda-v2',
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: env.OTEL_SERVICE_NAME },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.secret',
      '*.razorpayAccountId',
      '*.razorpayKeySecret',
      '*.smtpPass',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV === 'development' && typeof window === 'undefined' && !process.env.NEXT_RUNTIME
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss' },
        },
      }
    : {}),
});

/** Create a child logger scoped to a request/module. */
export function createLogger(scope: string, bindings?: Record<string, unknown>): pino.Logger {
  return logger.child({ scope, ...bindings });
}
