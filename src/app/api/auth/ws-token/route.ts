import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { signWsToken } from '@/lib/realtime/auth';
import { ok, error, statusForCode } from '@/types/api';

/**
 * GET /api/auth/ws-token
 *
 * Returns a short-lived (60s) JWT for the standalone Socket.IO server.
 * The client passes it as `auth.token` in the socket handshake — the WS
 * server verifies with the same `AUTH_SECRET`.
 *
 * Must be authenticated by NextAuth.
 */
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user) {
    const res = error('UNAUTHORIZED', 'Sign in required');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const u = session.user as { id: string; email: string; accountType: 'PASSENGER' | 'ADMIN'; driverId?: string };

  const token = await signWsToken({
    sub: u.id,
    email: u.email,
    accountType: u.driverId ? 'DRIVER' : u.accountType,
    driverId: u.driverId,
  });

  return NextResponse.json(ok({ token }));
}
