import { logger } from '@/lib/observability/logger';

/**
 * In-memory rate limiter — 100% free, no Upstash signup required.
 *
 * Every auth/OTP/payment endpoint is wrapped with one of:
 *   - `limitAuth(key)`       — 10 req / 10 sec / IP
 *   - `limitOtp(key)`        — 3 req / 60 sec / email+IP
 *   - `limitPayment(key)`    — 5 req / 60 sec / user
 *
 * Trade-off: in-memory limiters don't share state across instances, so a
 * multi-node deploy would let each node allow the full quota. For a
 * portfolio app running on a single Vercel serverless instance + a single
 * Socket.IO worker, this is fine. For real horizontal scaling, swap this
 * for a Redis-backed limiter (`@upstash/ratelimit` or `rate-limiter-flexible`
 * with the existing `ioredis` client) — the function signatures stay the same.
 */

interface InMemoryBucket {
  count: number;
  resetAt: number;
}

class InMemoryRatelimit {
  private buckets = new Map<string, InMemoryBucket>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  async limit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const bucket = this.buckets.get(identifier);
    if (!bucket || now > bucket.resetAt) {
      this.buckets.set(identifier, { count: 1, resetAt: now + this.windowMs });
      return { success: true, remaining: this.max - 1, reset: this.windowMs };
    }
    if (bucket.count >= this.max) {
      return { success: false, remaining: 0, reset: bucket.resetAt - now };
    }
    bucket.count++;
    return { success: true, remaining: this.max - bucket.count, reset: bucket.resetAt - now };
  }
}

const authLimiter = new InMemoryRatelimit(10, 10_000);
const otpLimiter = new InMemoryRatelimit(3, 60_000);
const paymentLimiter = new InMemoryRatelimit(5, 60_000);

logger.info('Rate limiters initialized (in-memory, single-instance)');

export async function limitAuth(identifier: string) {
  if (process.env.DEMO_MODE === 'true') return { success: true, remaining: 999, reset: 0 };
  return authLimiter.limit(identifier);
}
export async function limitOtp(identifier: string) {
  if (process.env.DEMO_MODE === 'true') return { success: true, remaining: 999, reset: 0 };
  return otpLimiter.limit(identifier);
}
export async function limitPayment(identifier: string) {
  if (process.env.DEMO_MODE === 'true') return { success: true, remaining: 999, reset: 0 };
  return paymentLimiter.limit(identifier);
}
