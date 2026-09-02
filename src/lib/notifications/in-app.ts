import { db } from '@/lib/db/client';
import { logger } from '@/lib/observability/logger';

/**
 * In-app notifications — persisted to the `Notification` table.
 *
 * The client polls `/api/notifications` (or subscribes via the WS
 * `passenger:<id>` room) for new notifications. This module is the single
 * write-path: every service that needs to notify a user calls one of these
 * helpers instead of writing to the DB directly.
 */

export interface CreateNotificationInput {
  userId?: string | undefined;
  driverId?: string | undefined;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!input.userId && !input.driverId) {
    logger.warn({ input }, 'createNotification called with neither userId nor driverId');
    return;
  }
  const payload: Record<string, unknown> = {
    type: input.type,
    title: input.title,
    body: input.body,
  };
  if (input.userId) payload.userId = input.userId;
  if (input.driverId) payload.driverId = input.driverId;
  if (input.data) payload.data = input.data;

  await db.notification.create({
    data: payload as any,
  });
}

export async function markNotificationRead(
  id: string,
  userId?: string,
  driverId?: string,
): Promise<void> {
  await db.notification.updateMany({
    where: { id, OR: [{ userId: userId ?? null }, { driverId: driverId ?? null }] },
    data: { readAt: new Date() },
  });
}

export async function getUnreadCount(opts: {
  userId?: string;
  driverId?: string;
}): Promise<number> {
  return db.notification.count({
    where: {
      OR: [{ userId: opts.userId ?? null }, { driverId: opts.driverId ?? null }],
      readAt: null,
    },
  });
}
