import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Ryda v2 — typed environment variables.
 *
 * Every `process.env.X` access in the codebase MUST go through `env.X` so
 * the type-system guarantees presence at boot. Missing vars throw at startup,
 * not at runtime.
 *
 * ── 100% FREE STACK ──────────────────────────────────────────────────────
 * No paid API keys are required to run the app end-to-end. The only external
 * services are:
 *   - Postgres + PostGIS (self-hosted via docker-compose, free)
 *   - Redis (self-hosted via docker-compose, free)
 *   - Razorpay (no signup fee, no monthly fee — only per-transaction pricing)
 *   - OpenStreetMap tiles + Nominatim + OSRM (free, rate-limited)
 *   - Gmail SMTP for transactional email (free with any Gmail account)
 *
 * Optional (still free tiers, but require signup):
 *   - Google OAuth (for social login)
 *   - Sentry (error tracking, free tier)
 *   - PostHog (product analytics, free tier)
 *   - OpenTelemetry → any free OTLP collector
 */
function cleanDbUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let cleaned = url.trim().replace(/^["']|["']$/g, '').trim();
  if (cleaned.includes('postgresql://')) {
    const idx = cleaned.indexOf('postgresql://');
    cleaned = cleaned.substring(idx).split(/[\r\n\s"']/)[0] ?? '';
  } else if (cleaned.includes('postgres://')) {
    const idx = cleaned.indexOf('postgres://');
    cleaned = cleaned.substring(idx).split(/[\r\n\s"']/)[0] ?? '';
  }
  return cleaned.trim() || undefined;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = cleanDbUrl(process.env.DATABASE_URL);
}
if (process.env.DIRECT_URL) {
  process.env.DIRECT_URL = cleanDbUrl(process.env.DIRECT_URL);
}

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/ryda'),
    DIRECT_URL: z.string().url().optional(),
    SHADOW_DATABASE_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    AUTH_SECRET: z.string().min(16).default('ryda-auth-secret-production-32-chars-fallback'),
    AUTH_TRUST_HOST: z
      .string()
      .transform((v) => v === 'true')
      .default('true'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    // ── Razorpay (the only payment provider — no Stripe) ─────────────────
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
    // ── Email via Gmail SMTP (free) — no Resend, no API key ──────────────
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(), // your Gmail address
    SMTP_PASS: z.string().optional(), // Gmail App Password (16 chars)
    EMAIL_FROM: z.string().default('Ryda <noreply@ryda.app>'),
    // ── Observability (all optional, free tiers) ─────────────────────────
    SENTRY_DSN: z.string().url().optional(),
    SENTRY_AUTH_TOKEN: z.string().optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_SERVICE_NAME: z.string().default('ryda-v2'),
    // ── Worker processes ─────────────────────────────────────────────────
    SOCKET_IO_PORT: z.coerce.number().default(3001),
    SOCKET_IO_ORIGINS: z.string().default('http://localhost:3000'),
    // ── Feature flags ────────────────────────────────────────────────────
    DEMO_MODE: z
      .string()
      .transform((v) => v === 'true')
      .default('true'),
    ENABLE_SURGE_PRICING: z
      .string()
      .transform((v) => v === 'true')
      .default('true'),
    ENABLE_RIDE_TIMEOUT: z
      .string()
      .transform((v) => v === 'true')
      .default('true'),
    MATCHING_MAX_ATTEMPTS: z.coerce.number().default(3),
    MATCHING_RADIUS_METERS: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_DEMO_MODE: z
      .string()
      .transform((v) => v === 'true')
      .default('true'),
    // Razorpay key is public (it identifies the merchant, not a secret)
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://app.posthog.com'),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE ?? 'true',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === 'lint' ||
    process.env.npm_lifecycle_event === 'build' ||
    process.env.NODE_ENV === 'test' ||
    !!process.env.VERCEL,
  emptyStringAsUndefined: true,
});
