import { createNotification, type CreateNotificationInput } from '@/lib/notifications/in-app';

/**
 * NotificationService — thin orchestration layer over the in-app + email + SMS
 * helpers. Decides which channels to fire based on the notification type.
 *
 * For now it always writes an in-app Notification row. Email/SMS are
 * dispatched by the BullMQ email queue (`src/server/jobs/email-queue.ts`)
 * to keep the request path fast.
 */
export async function notifyPassenger(opts: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
}): Promise<void> {
  await createNotification({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    data: opts.data,
  });
}

export async function notifyDriver(opts: {
  driverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | undefined;
}): Promise<void> {
  await createNotification({
    driverId: opts.driverId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    data: opts.data,
  });
}

export async function notifyAdmin(opts: Omit<CreateNotificationInput, 'userId' | 'driverId'>): Promise<void> {
  await createNotification(opts);
}

