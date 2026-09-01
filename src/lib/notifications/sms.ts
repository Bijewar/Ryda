import { isDemoMode } from '@/lib/demo-mode';
import { logger } from '@/lib/observability/logger';

/**
 * SMS notifications — no-op stub.
 *
 * Twilio was removed to keep the stack 100% free. SMS is not essential for
 * a ride-hailing demo — OTP emails (via free Gmail SMTP) cover the auth flow.
 *
 * If you need real SMS later (e.g. for OTP fallback when email fails), drop in
 * any free-tier SMS provider:
 *   - MSG91 (India-focused, free trial credits)
 *   - Fast2SMS (Indian, free tier)
 *   - Amazon SNS (free tier, pay-per-use after)
 *
 * The function signature won't change — just implement the actual HTTP call
 * inside `sendSms()`.
 */
export async function sendSms(to: string, body: string): Promise<void> {
  logger.debug({ to, bodyLength: body.length, demoMode: isDemoMode }, '📱 SMS skipped (no provider configured)');
}
