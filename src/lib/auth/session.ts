import { db } from '@/lib/db/client';
import type { AccountType } from '@/types/ride';
import { logger } from '@/lib/observability/logger';

/**
 * Server-side session helpers.
 *
 * NextAuth's `auth()` returns the session for the current request. We layer
 * role-based access on top with `requireRole()` — every protected API route
 * calls it before doing anything else.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  /** Present when the session belongs to a driver (drivers live in a separate table). */
  driverId?: string;
  image?: string | null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  // Lazy-import to avoid initialising NextAuth at module load time.
  const { auth } = await import('./config');
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as SessionUser;
  if (!u.id) return null;
  return u;
}

export async function requireRole(roles: AccountType[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new RoleError('UNAUTHORIZED', 'You must be signed in to access this resource');
  }
  if (!roles.includes(user.accountType)) {
    throw new RoleError('FORBIDDEN', `This action requires one of: ${roles.join(', ')}`);
  }
  return user;
}

export async function requirePassenger(): Promise<SessionUser> {
  return requireRole(['PASSENGER', 'ADMIN']);
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(['ADMIN']);
}

export async function requireDriver(driverId: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new RoleError('UNAUTHORIZED', 'Sign in required');
  if (user.driverId !== driverId && user.accountType !== 'ADMIN') {
    throw new RoleError('FORBIDDEN', 'You can only act on your own driver record');
  }
  return user;
}

export class RoleError extends Error {
  constructor(
    public code: 'UNAUTHORIZED' | 'FORBIDDEN',
    message: string,
  ) {
    super(message);
    this.name = 'RoleError';
  }
}

/** Lock an account after too many failed logins. */
export async function lockAccount(userId: string, durationMs = 15 * 60_000): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { lockedUntil: new Date(Date.now() + durationMs) },
  });
  logger.warn({ userId, durationMs }, 'Account locked due to repeated failed logins');
}

export async function incrementFailedLogin(userId: string): Promise<{ locked: boolean }> {
  if (!userId || userId.startsWith('demo-user-')) return { locked: false };
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
    });
    if (user.failedLogins >= 5) {
      await lockAccount(userId);
      return { locked: true };
    }
  } catch (_e) {
    // Ignore if not in DB
  }
  return { locked: false };
}

export async function resetFailedLogins(userId: string): Promise<void> {
  if (!userId || userId.startsWith('demo-user-')) return;
  try {
    await db.user.updateMany({
      where: { id: userId, failedLogins: { gt: 0 } },
      data: { failedLogins: 0, lockedUntil: null },
    });
  } catch (_e) {
    // Ignore if not in DB
  }
}
