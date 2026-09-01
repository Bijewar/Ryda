# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────────
# Ryda v2 — Multi-stage Dockerfile
#
# Stages:
#   1. deps   — install all dependencies (cached layer)
#   2. builder— compile the Next.js app (standalone output) + workers
#   3. runtime— slim image with just the runtime artefacts (~150 MB)
#
# The standalone output bundles only the JS the app actually imports, so the
# runtime image doesn't ship `node_modules` wholesale. Prisma client + migrations
# are copied alongside because the runtime container runs migrations on boot.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM oven/bun:1.1 AS deps
WORKDIR /app

# Copy lockfile + manifest first so this layer caches across source changes.
COPY package.json bun.lockb* ./
COPY prisma ./prisma

# Install with dev deps — we need them for the build step (tsc, prisma generate).
RUN bun install --frozen-lockfile --production=false
# Generate the Prisma client into node_modules so the build can import it.
RUN bunx prisma generate

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM oven/bun:1.1 AS builder
WORKDIR /app

# Bring the installed deps from the previous stage.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy the rest of the source.
COPY . .

# Env vars consumed at build time. None of these are secrets — they're public
# client keys or build-time constants. Real secrets come in at runtime via
# `--env-file` or the orchestrator.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the standalone Next.js output (.next/standalone + .next/static).
RUN bun run build

# Compile the standalone workers to JS so the runtime image can `node` them
# without bundling Bun.
RUN bun build workers/socket-server.ts --target=node --outfile=dist/socket-server.js
RUN bun build workers/queue-worker.ts --target=node --outfile=dist/queue-worker.js

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM oven/bun:1.1-slim AS runtime
WORKDIR /app

# Labels — OCI standard metadata. `image.source` is used by Sentry/GitHub to
# link back to the source commit.
LABEL org.opencontainers.image.title="Ryda v2" \
      org.opencontainers.image.description="Production-grade ride-hailing for Bhopal" \
      org.opencontainers.image.source="https://github.com/ryda-v2/ryda-v2" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.authors="Ryda v2"

# Env defaults — overridable at runtime.
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEMO_MODE=false

# Install only the runtime system deps: OpenSSL (Prisma), ca-certificates
# (HTTPS), dumb-init (PID 1 signal forwarding).
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for the runtime.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --gid 1001 nextjs

# Copy the standalone Next.js server (already-bundled).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Static assets (geo JSON, fonts, brand).
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Workers (compiled to plain JS in stage 2).
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

# Prisma — needed at runtime to apply migrations on container start.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Tiny entrypoint script that runs `prisma migrate deploy` before the app boots.
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# dumb-init forwards SIGTERM correctly so `next start` shuts down cleanly.
ENTRYPOINT ["dumb-init", "--", "./entrypoint.sh"]

# Default command = the Next.js standalone server. Worker containers override
# this in docker-compose.yml (`command: node dist/socket-server.js`).
CMD ["node", "server.js"]
