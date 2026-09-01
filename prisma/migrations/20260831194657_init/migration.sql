/*
  Warnings:

  - You are about to drop the column `stripeAccountId` on the `drivers` table. All the data in the column will be lost.
  - The `approvalStatus` column on the `drivers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `rides` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `accountType` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `vehicles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `provider` on the `payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paymentMethod` on the `rides` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PASSENGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "DriverApproval" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'BIKE', 'AUTO');

-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'MATCHING', 'OFFERED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'PAID', 'CANCELED', 'NO_DRIVERS');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'UPI', 'WALLET', 'CASH');

-- DropIndex
DROP INDEX "drivers_stripeAccountId_idx";

-- DropIndex
DROP INDEX "idx_service_areas_geometry_gist";

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "stripeAccountId",
ADD COLUMN     "razorpayAccountId" TEXT,
DROP COLUMN "approvalStatus",
ADD COLUMN     "approvalStatus" "DriverApproval" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "provider",
ADD COLUMN     "provider" "PaymentProvider" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "rides" DROP COLUMN "status",
ADD COLUMN     "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "accountType",
ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PASSENGER';

-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "type",
ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'SEDAN';

-- CreateIndex
CREATE INDEX "drivers_approvalStatus_idx" ON "drivers"("approvalStatus");

-- CreateIndex
CREATE INDEX "drivers_razorpayAccountId_idx" ON "drivers"("razorpayAccountId");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");

-- CreateIndex
CREATE INDEX "payments_provider_status_idx" ON "payments"("provider", "status");

-- CreateIndex
CREATE INDEX "rides_passengerId_status_idx" ON "rides"("passengerId", "status");

-- CreateIndex
CREATE INDEX "rides_driverId_status_idx" ON "rides"("driverId", "status");

-- CreateIndex
CREATE INDEX "rides_status_requestedAt_idx" ON "rides"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "users_accountType_idx" ON "users"("accountType");
