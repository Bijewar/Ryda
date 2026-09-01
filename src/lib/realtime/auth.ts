import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';

/**
 * JWT auth middleware for Socket.IO connections.
 *
 * NextAuth uses httpOnly cookies for browser sessions, but the WS server
 * runs as a separate process (workers/socket-server.ts) so it can't read
 * those cookies directly. Instead, the client fetches a short-lived JWT
 * from `/api/auth/ws-token` (authenticated by NextAuth) and passes it as
 * the `auth.token` field in the Socket.IO handshake.
 *
 * The JWT is signed with the same `AUTH_SECRET` as NextAuth, so the WS server
 * can verify it without sharing a session store.
 */
export interface WsTokenPayload {
  sub: string; // user id or driver id
  email: string;
  accountType: 'PASSENGER' | 'ADMIN' | 'DRIVER';
  driverId?: string;
  exp: number;
}

export async function verifyWsToken(token: string): Promise<WsTokenPayload | null> {
  try {
    // Dynamic import so the codebase compiles without `jose` in demo mode.
    const { jwtVerify, createRemoteJWKSet } = await import('jose');
    // We sign with HS256 using AUTH_SECRET directly — no JWKS needed.
    const secret = new TextEncoder().encode(env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload as unknown as WsTokenPayload;
  } catch (err) {
    logger.warn({ err }, 'WS token verification failed');
    return null;
  }
}

/** Server-side: sign a short-lived WS token for the current user. */
export async function signWsToken(
  payload: Omit<WsTokenPayload, 'exp'>,
  ttlSeconds = 60,
): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(env.AUTH_SECRET);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(secret);
}
