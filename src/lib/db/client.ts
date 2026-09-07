import { env } from '@/lib/env';
import { PrismaClient } from '@prisma/client';

function sanitizeDbUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let cleaned = url.trim().replace(/^["']|["']$/g, '').trim();
  if (cleaned.includes('postgresql://')) {
    const idx = cleaned.indexOf('postgresql://');
    cleaned = cleaned.substring(idx).split(/[\r\n\s"']/)[0] ?? '';
  } else if (cleaned.includes('postgres://')) {
    const idx = cleaned.indexOf('postgres://');
    cleaned = cleaned.substring(idx).split(/[\r\n\s"']/)[0] ?? '';
  }
  return cleaned.trim() || undefined;
}

const sanitizedDatabaseUrl = sanitizeDbUrl(process.env.DATABASE_URL || (env as any).DATABASE_URL);
const sanitizedDirectUrl = sanitizeDbUrl(process.env.DIRECT_URL || (env as any).DIRECT_URL);

if (sanitizedDatabaseUrl) {
  process.env.DATABASE_URL = sanitizedDatabaseUrl;
}
if (sanitizedDirectUrl) {
  process.env.DIRECT_URL = sanitizedDirectUrl;
}

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
    datasources: sanitizedDatabaseUrl
      ? {
          db: {
            url: sanitizedDatabaseUrl,
          },
        }
      : undefined,
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
