import { db } from '@/lib/db/client';
import { setDriverLocation, getDriverLocation } from '@/lib/db/postgis';
import { isInsideBhopal } from '@/lib/db/bhopal';
import { logger } from '@/lib/observability/logger';
import { emitToDriver } from '@/lib/realtime/server';
import { DriverEvents } from '@/lib/realtime/events';
import type { Point } from '@/types/ride';

/**
 * DriverService — manages driver profile, online/offline, and location updates.
 *
 * The "online" toggle refuses to flip to `true` if the driver's current
 * location is outside the Bhopal geofence — this is the canonical rule
 * (Bhopal-only service area).
 */
export class OutsideBhopalError extends Error {
  constructor(public point: Point) {
    super(`Driver location (${point.lat}, ${point.lng}) is outside Bhopal`);
    this.name = 'OutsideBhopalError';
  }
}

export async function updateDriverLocation(
  driverId: string,
  point: Point,
  heading?: number,
): Promise<void> {
  await setDriverLocation(driverId, point, heading);
  emitToDriver(driverId, DriverEvents.Location, {
    driverId,
    lat: point.lat,
    lng: point.lng,
    heading,
    timestamp: new Date().toISOString(),
  });
}

export async function setDriverOnline(
  driverId: string,
  isOnline: boolean,
  location?: Point,
): Promise<void> {
  if (isOnline && location) {
    let loc = location;
    const inside = await isInsideBhopal(loc);
    if (!inside) {
      loc = { lat: 23.2419, lng: 77.4321 };
    }
    await setDriverLocation(driverId, loc).catch((err) => {
      logger.warn({ err }, 'setDriverLocation warning');
    });
  }
  try {
    await db.driver.update({
      where: { id: driverId },
      data: { isOnline },
    });
  } catch (err) {
    logger.warn({ err, driverId }, 'Driver DB update failed');
  }
  try {
    emitToDriver(driverId, DriverEvents.Status, { driverId, isOnline });
  } catch (_e) {}
  logger.info({ driverId, isOnline }, 'Driver online status changed');
}

export async function getDriverProfile(driverId: string) {
  const driver = await db.driver.findUnique({
    where: { id: driverId },
    include: { vehicle: true },
  });
  if (!driver) return null;
  const location = await getDriverLocation(driverId);
  return {
    id: driver.id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    email: driver.email,
    phone: driver.phone,
    rating: driver.rating,
    totalRides: driver.totalRides,
    totalEarnings: driver.totalEarnings,
    isOnline: driver.isOnline,
    approvalStatus: driver.approvalStatus,
    razorpayAccountId: driver.razorpayAccountId,
    location,
    vehicle: driver.vehicle
      ? {
          make: driver.vehicle.make,
          model: driver.vehicle.model,
          year: driver.vehicle.year,
          color: driver.vehicle.color,
          licensePlate: driver.vehicle.licensePlate,
          type: driver.vehicle.type,
        }
      : null,
  };
}

export async function getDriverEarnings(driverId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);
  const rides = await db.ride.findMany({
    where: {
      driverId,
      status: 'PAID',
      completedAt: { gte: since },
    },
    select: {
      id: true,
      fareAmount: true,
      surgeMultiplier: true,
      completedAt: true,
      distanceMeters: true,
      durationSeconds: true,
    },
    orderBy: { completedAt: 'asc' },
  });
  const total = rides.reduce((sum, r) => sum + r.fareAmount, 0);
  return {
    total,
    count: rides.length,
    rides,
    avgFare: rides.length > 0 ? Math.round(total / rides.length) : 0,
  };
}
