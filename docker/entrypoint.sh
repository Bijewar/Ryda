#!/bin/sh
# Ryda v2 — container entrypoint.
#
# Runs Prisma migrations before handing off to the main process. Skipped when
# `SKIP_MIGRATIONS=1` (useful for the socket-worker + queue-worker containers
# which don't need to migrate but do need the Prisma client).
set -e

if [ -z "$SKIP_MIGRATIONS" ]; then
  echo "[entrypoint] Applying Prisma migrations…"
  # `prisma migrate deploy` is idempotent — safe to run on every boot.
  node ./node_modules/prisma/build/index.js migrate deploy || {
    echo "[entrypoint] Migration failed — continuing anyway (the app may fail to start).";
  }
fi

echo "[entrypoint] Starting: $@"
exec "$@"
