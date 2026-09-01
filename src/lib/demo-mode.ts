/**
 * Demo mode — feature-flagged mocks for external services.
 *
 * When `DEMO_MODE=true`, the entire app runs end-to-end without any API keys:
 *   - Payments → MockPaymentProvider (mimics Razorpay, auto-verifies, has "fail next" toggle)
 *   - Maps     → MapLibre GL + free OSM tiles (no Mapbox token, no signup)
 *   - Email    → Log to console + expose at `/dev/otp`
 *   - SMS      → No-op
 *   - Razorpay Route → Mock accountId
 *
 * This is the single switch that turns Ryda v2 from "needs API keys to run"
 * into "clone & docker compose up in 60 seconds". Critical for the resume pitch.
 */

export const isDemoMode =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_DEMO_MODE !== 'false'
    : (process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE) !== 'false';

/** Demo OTP cache (email → { code, expiresAt }). Cleared on process restart. */
const demoOtpCache = new Map<string, { code: string; expiresAt: number }>();

export function setDemoOtp(email: string, code: string, ttlMs = 5 * 60_000): void {
  if (!isDemoMode) return;
  demoOtpCache.set(email, { code, expiresAt: Date.now() + ttlMs });
  if (typeof window === 'undefined') {
    console.log(`📧 [DEMO] OTP for ${email}: ${code} (also visible at /dev/otp)`);
  }
}

export function getDemoOtp(email: string): string | null {
  if (!isDemoMode) return null;
  const entry = demoOtpCache.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    demoOtpCache.delete(email);
    return null;
  }
  return entry.code;
}

export function listDemoOtps(): Array<{ email: string; code: string; expiresAt: number }> {
  if (!isDemoMode) return [];
  return Array.from(demoOtpCache.entries()).map(([email, v]) => ({ email, ...v }));
}

/** Demo "fail next payment" toggle — for testing the error UI. */
let failNextPayment = false;
export function setFailNextPayment(value: boolean): void {
  failNextPayment = value;
}
export function shouldFailNextPayment(): boolean {
  const v = failNextPayment;
  failNextPayment = false;
  return v;
}

/** Demo user list for the dev-only `/dev/otp` page. */
export function isDemoAccessible(): boolean {
  return isDemoMode && process.env.NODE_ENV !== 'production';
}
