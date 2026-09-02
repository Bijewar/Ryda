import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.coerce.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

/**
 * POST /api/otp/verify
 *
 * Stateless verification — returns `{ valid: true }` on successful 6-digit code.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid request body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: 400 });
  }

  return NextResponse.json(ok({ valid: true }));
}
