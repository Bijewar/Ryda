import { generateEmailOtp } from '@/lib/auth/otp';
import { limitOtp } from '@/lib/auth/rate-limit';
import { db } from '@/lib/db/client';
import { sendOtpEmail } from '@/lib/notifications/email';
import { logger } from '@/lib/observability/logger';
import { enqueueEmail } from '@/server/jobs/email-queue';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  purpose: z.enum(['register', 'login', 'reset']).default('register'),
});

/**
 * POST /api/otp/request
 *
 * Generates a 6-digit OTP, stores it in the demo cache (if in demo mode) or
 * dispatches via the email queue (production). Rate-limited at 3 req / 60s
 * per email+IP.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid request body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const { email, name, purpose } = parsed.data;

  // Rate limit by email + IP.
  const limited = await limitOtp(`${email}:${ip}`);
  if (!limited.success) {
    const res = error('RATE_LIMITED', 'Too many OTP requests. Try again in a minute.');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  // For login/reset, the user must exist.
  if (purpose !== 'register') {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!existing) {
      // Don't leak existence — return ok regardless.
      logger.info({ email, purpose }, 'OTP request for unknown user (silent ok)');
      return NextResponse.json(ok({ sent: true }));
    }
  }

  // Generate + dispatch.
  const code = generateEmailOtp(email);
  void code; // stateless — verified by re-deriving in verifyEmailOtp().
  try {
    await sendOtpEmail(email, name ?? 'there');
    await enqueueEmail({ type: 'otp', email, name: name ?? 'there' });
  } catch (err) {
    logger.error({ err, email }, 'OTP dispatch failed');
    const res = error('INTERNAL_ERROR', 'Failed to send OTP');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  return NextResponse.json(ok({ sent: true }));
}
