import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { getUnreadCount } from '@/lib/notifications/in-app';
import { error, ok, statusForCode } from '@/types/api';
import { NextResponse } from 'next/server';

/**
 * GET /api/notifications — list notifications for the current user/driver.
 */
export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    const res = error('UNAUTHORIZED', 'Sign in required');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const where = user.driverId ? { driverId: user.driverId } : { userId: user.id };
  const [items, unread] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    getUnreadCount({ userId: user.id, driverId: user.driverId }),
  ]);
  return NextResponse.json(ok({ items, unread }));
}
