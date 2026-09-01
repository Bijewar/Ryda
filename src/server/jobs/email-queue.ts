import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '@/lib/env';
import { logger } from '@/lib/observability/logger';
import { sendOtpEmail, sendWelcomeEmail, sendRideReceiptEmail, sendPasswordResetEmail } from '@/lib/notifications/email';

/**
 * Email queue — BullMQ-backed, so email sends don't block the request.
 *
 * Connection: lazily-created ioredis instance, shared across all queues.
 * In demo mode, the queue is a no-op (emails are logged synchronously).
 */
let connection: IORedis | null = null;
function getConnection(): IORedis {
  if (connection) return connection;
  connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

export type EmailJob =
  | { type: 'otp'; email: string; name: string }
  | { type: 'welcome'; email: string; name: string }
  | {
      type: 'receipt';
      email: string;
      passengerName: string;
      rideId: string;
      farePaise: number;
      currency: string;
      pickupAddress: string;
      dropoffAddress: string;
      completedAt: string;
    }
  | { type: 'password-reset'; email: string; resetUrl: string };

let emailQueue: Queue<EmailJob> | null = null;
export function getEmailQueue(): Queue<EmailJob> {
  if (emailQueue) return emailQueue;
  emailQueue = new Queue<EmailJob>('ryda:email', { connection: getConnection() });
  return emailQueue;
}

export async function enqueueEmail(job: EmailJob): Promise<void> {
  if (env.DEMO_MODE) {
    // Run synchronously in demo mode — logger prints the OTP.
    await processEmailJob(job);
    return;
  }
  await getEmailQueue().add(job.type, job, { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } });
}

export async function processEmailJob(job: Job<EmailJob> | EmailJob): Promise<void> {
  const data: EmailJob = 'data' in job && job.data ? job.data : (job as EmailJob);
  switch (data.type) {
    case 'otp':
      await sendOtpEmail(data.email, data.name);
      break;
    case 'welcome':
      await sendWelcomeEmail(data.email, data.name);
      break;
    case 'receipt':
      await sendRideReceiptEmail(data);
      break;
    case 'password-reset':
      await sendPasswordResetEmail(data.email, data.resetUrl);
      break;
  }
  logger.info({ jobType: data.type, email: data.email }, 'Email job processed');
}

export function startEmailWorker(): Worker<EmailJob> {
  const worker = new Worker<EmailJob>('ryda:email', processEmailJob, { connection: getConnection() });
  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Email job failed');
  });
  return worker;
}
