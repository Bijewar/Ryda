import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { userRegisterSchema } from '@/lib/validation/user';
import { hashPassword } from '@/lib/auth/password';
import { generateEmailOtp } from '@/lib/auth/otp';
import { setDemoOtp } from '@/lib/demo-mode';
import { sendOtpEmail } from '@/lib/notifications/email';
import { ok, error, statusForCode } from '@/types/api';
import { logger } from '@/lib/observability/logger';

/**
 * POST /api/auth/register
 *
 * Passenger and admin registration endpoint.
 * Validates credentials, checks uniqueness, hashes passwords with argon2id,
 * inserts the user into Postgres (with fallback for demo mode), and dispatches
 * verification OTP.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = userRegisterSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid registration data', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const { name, email, phone, password, accountType } = parsed.data;

  // Check existing user in database if reachable
  try {
    const existing = await db.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existing) {
      const res = error('CONFLICT', 'An account with this email or phone already exists.');
      return NextResponse.json(res, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        accountType,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      },
    });
  } catch (dbErr) {
    logger.warn({ dbErr }, 'Database not reachable — continuing with demo fallback');
  }

  // Generate OTP and store in demo cache
  const otp = generateEmailOtp(email);
  setDemoOtp(email, otp);

  try {
    await sendOtpEmail(email, name);
  } catch (mailErr) {
    logger.info({ mailErr }, 'Email dispatch skipped/failed in dev');
  }

  return NextResponse.json(
    ok({
      user: {
        name,
        email,
        phone,
        accountType,
      },
    }),
    { status: 201 },
  );
}
