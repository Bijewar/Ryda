-- ──────────────────────────────────────────────────────────────────────────
-- Ryda v2 — Initial migration
-- Postgres 16 + PostGIS. Prisma can't generate PostGIS types natively, so we
-- apply raw SQL here for the extension + GIST indexes on geometry columns.
-- ──────────────────────────────────────────────────────────────────────────

-- CreateExtensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid fallback

-- CreateTable (User)
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "resetTokenHash" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "accountType" TEXT NOT NULL DEFAULT 'PASSENGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Driver)
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseFrontUrl" TEXT NOT NULL,
    "licenseBackUrl" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentLocation" geometry(Point, 4326),
    "heading" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "totalRides" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" INTEGER NOT NULL DEFAULT 0,
    "stripeAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Vehicle)
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SEDAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Ride)
CREATE TABLE "rides" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "pickupAddress" TEXT NOT NULL,
    "pickupPoint" geometry(Point, 4326) NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffPoint" geometry(Point, 4326) NOT NULL,
    "routeGeometry" JSONB NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "fareAmount" INTEGER NOT NULL,
    "surgeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentMethod" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "driverArrivedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "passengerRating" INTEGER,
    "driverRating" INTEGER,
    "receiptUrl" TEXT,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Payment)
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "refundId" TEXT,
    "refundAmount" INTEGER DEFAULT 0,
    "refundReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "webhookEvents" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable (Notification)
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "driverId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable (AuditLog)
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "userId" TEXT,
    "driverId" TEXT,
    "rideId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable (ServiceArea)
CREATE TABLE "service_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "osmId" BIGINT,
    "geometry" geometry(Polygon, 4326) NOT NULL,
    "centroid" geometry(Point, 4326) NOT NULL,
    "bbox" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_accountType_idx" ON "users"("accountType");

CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");
CREATE UNIQUE INDEX "drivers_phone_key" ON "drivers"("phone");
CREATE UNIQUE INDEX "drivers_licenseNumber_key" ON "drivers"("licenseNumber");
CREATE INDEX "drivers_approvalStatus_idx" ON "drivers"("approvalStatus");
CREATE INDEX "drivers_isOnline_idx" ON "drivers"("isOnline");
CREATE INDEX "drivers_stripeAccountId_idx" ON "drivers"("stripeAccountId");

CREATE UNIQUE INDEX "vehicles_driverId_key" ON "vehicles"("driverId");
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

CREATE INDEX "rides_passengerId_status_idx" ON "rides"("passengerId", "status");
CREATE INDEX "rides_driverId_status_idx" ON "rides"("driverId", "status");
CREATE INDEX "rides_status_requestedAt_idx" ON "rides"("status", "requestedAt");

CREATE UNIQUE INDEX "payments_rideId_key" ON "payments"("rideId");
CREATE UNIQUE INDEX "payments_providerOrderId_key" ON "payments"("providerOrderId");
CREATE UNIQUE INDEX "payments_providerPaymentId_key" ON "payments"("providerPaymentId");
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");
CREATE INDEX "payments_provider_status_idx" ON "payments"("provider", "status");

CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");
CREATE INDEX "notifications_driverId_readAt_idx" ON "notifications"("driverId", "readAt");

CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
CREATE INDEX "audit_logs_rideId_idx" ON "audit_logs"("rideId");

CREATE UNIQUE INDEX "service_areas_name_key" ON "service_areas"("name");
CREATE UNIQUE INDEX "service_areas_osmId_key" ON "service_areas"("osmId");

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rides" ADD CONSTRAINT "rides_passengerId_fkey"
    FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "rides" ADD CONSTRAINT "rides_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_rideId_fkey"
    FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_rideId_fkey"
    FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── PostGIS GIST indexes (Prisma can't generate these) ───────────────────
CREATE INDEX "idx_drivers_location_gist"
    ON "drivers"
    USING GIST (CAST("currentLocation" AS geography));

CREATE INDEX "idx_rides_pickup_gist"
    ON "rides"
    USING GIST (CAST("pickupPoint" AS geography));

CREATE INDEX "idx_rides_dropoff_gist"
    ON "rides"
    USING GIST (CAST("dropoffPoint" AS geography));

CREATE INDEX "idx_service_areas_geometry_gist"
    ON "service_areas"
    USING GIST ("geometry");
