-- ──────────────────────────────────────────────────────────────────────────
-- Ryda v2 — Postgres init script
--
-- Runs once on container first-boot (when the data dir is empty). Subsequent
-- boots skip this file — migrations are applied by the app container's
-- entrypoint.sh (`prisma migrate deploy`).
-- ──────────────────────────────────────────────────────────────────────────

-- PostGIS — required for all spatial queries (ST_Contains, ST_DWithin, etc.).
CREATE EXTENSION IF NOT EXISTS postgis;

-- uuid-ossp — used by Prisma for some legacy @db.Uuid columns (kept for
-- forward-compat; the schema currently uses cuid() at the app layer).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The Bhopal service-area polygon is inserted by prisma/seed.ts — see
-- src/lib/db/bhopal.ts for the load path. This init script just makes sure
-- the geometry types + functions are available before the seed runs.
