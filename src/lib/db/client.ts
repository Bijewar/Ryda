import { env } from '@/lib/env';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 *
 * Next.js dev hot-reload creates a new module instance per request, which
 * would exhaust Postgres connection pools. We stash the client on a global
 * symbol so subsequent imports reuse the same connection.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
