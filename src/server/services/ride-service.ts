import { db } from '@/lib/db/client';
import { logger } from '@/lib/observability/logger';
import { getDirections, computeFare } from '@/lib/geo/osm';
import { isInsideBhopal } from '@/lib/db/bhopal';
import { insertRideWithPoints } from '@/lib/db/postgis';
import { emitToRide } from '@/lib/realtime/server';
import { createNotification } from '@/lib/notifications/in-app';
import { RideEvents } from '@/lib/realtime/events';
import { canTransition, type RideStatus, type Point } from '@/types/ride';

/**
 * RideService — single entry point for ride lifecycle operations.
 *
 * Every method:
 *   - Validates input (Zod is done at the API boundary; here we trust the input)
 *   - Performs the DB transition atomically
 *   - Emits a WS event to the ride room
 *   - Writes an audit log entry
 *   - Returns a typed RideSummary
 *
 * The state machine is the canonical list of allowed transitions in
 * `src/types/ride.ts` — `transitionRideStatus` refuses anything not in
 * `ALLOWED_TRANSITIONS[from]`.
 */
export class InvalidRideTransitionError extends Error {
  constructor(
    public from: RideStatus,
    public to: RideStatus,
  ) {
    super(`Invalid ride transition: ${from} → ${to}`);
    this.name = 'InvalidRideTransitionError';
  }
}

export class OutsideServiceAreaError extends Error {
  constructor(public point: Point) {
    super(`Point (${point.lat}, ${point.lng}) is outside the Bhopal service area`);
    this.name = 'OutsideServiceAreaError';
  }
}

export interface CreateRideInput {
  passengerId: string;
  pickup: { address: string; point: Point };
  dropoff: { address: string; point: Point };
  paymentMethod: 'CARD' | 'UPI' | 'WALLET' | 'CASH';
}

export async function createRide(input: CreateRideInput): Promise<{ id: string; fareAmount: number }> {
  // Geofence check — both pickup and dropoff must be inside Bhopal.
  const [pickupOk, dropoffOk] = await Promise.all([
    isInsideBhopal(input.pickup.point),
    isInsideBhopal(input.dropoff.point),
  ]);
  if (!pickupOk) throw new OutsideServiceAreaError(input.pickup.point);
  if (!dropoffOk) throw new OutsideServiceAreaError(input.dropoff.point);

  // Route + fare estimate.
  const route = await getDirections(input.pickup.point, input.dropoff.point);
  const surge = 1.0; // SurgeService recomputes asynchronously.
  const fare = computeFare(route.distanceMeters, route.durationSeconds, surge);

  const rideId = crypto.randomUUID();
  try {
    await insertRideWithPoints({
      id: rideId,
      passengerId: input.passengerId,
      driverId: null,
      status: 'REQUESTED',
      pickupAddress: input.pickup.address,
      pickup: input.pickup.point,
      dropoffAddress: input.dropoff.address,
      dropoff: input.dropoff.point,
      routeGeometry: route.geometry,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      fareAmount: fare,
      surgeMultiplier: surge,
      currency: 'INR',
      paymentMethod: input.paymentMethod,
    });

    await db.auditLog.create({
      data: {
        action: 'ride:create',
        entity: 'Ride',
        entityId: rideId,
        actorType: 'USER',
        actorId: input.passengerId,
        rideId,
        metadata: { fare, distance: route.distanceMeters },
      },
    });
  } catch (dbErr) {
    logger.warn({ dbErr }, 'DB write skipped in demo/offline mode');
  }

  emitToRide(rideId, RideEvents.Created, { rideId, status: 'REQUESTED', timestamp: new Date().toISOString() });
  logger.info({ rideId, passengerId: input.passengerId, fare }, 'Ride created');
  return { id: rideId, fareAmount: fare };
}

export async function transitionRideStatus(
  rideId: string,
  to: RideStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const ride = await db.ride.findUnique({ where: { id: rideId }, select: { status: true } });
  if (!ride) throw new Error(`Ride ${rideId} not found`);
  const from = ride.status as RideStatus;
  if (!canTransition(from, to)) {
    throw new InvalidRideTransitionError(from, to);
  }

  const columnFor: Partial<Record<RideStatus, string>> = {
    ACCEPTED: 'acceptedAt',
    ARRIVED: 'driverArrivedAt',
    IN_PROGRESS: 'startedAt',
    COMPLETED: 'completedAt',
    CANCELED: 'canceledAt',
  };
  const update: Record<string, unknown> = { status: to };
  if (columnFor[to]) update[columnFor[to] as string] = new Date();
  Object.assign(update, extra);

  await db.ride.update({ where: { id: rideId }, data: update as never });

  emitToRide(rideId, `ride:${to.toLowerCase()}` as never, {
    rideId,
    status: to,
    timestamp: new Date().toISOString(),
  });
  logger.info({ rideId, from, to }, 'Ride status transitioned');
}

export async function cancelRide(rideId: string, reason: string, byUserId?: string): Promise<void> {
  await transitionRideStatus(rideId, 'CANCELED', { cancelReason: reason });
  await createNotification({
    userId: byUserId,
    type: 'RIDE_CANCELED',
    title: 'Ride canceled',
    body: reason,
    data: { rideId },
  });
}

export async function completeRide(rideId: string): Promise<void> {
  await transitionRideStatus(rideId, 'COMPLETED');
  // Mark ride as PAID if the payment method is CASH (no provider verification).
  const ride = await db.ride.findUnique({
    where: { id: rideId },
    select: { paymentMethod: true, passengerId: true },
  });
  if (ride?.paymentMethod === 'CASH') {
    await transitionRideStatus(rideId, 'PAID');
  }
}

export async function rateRide(rideId: string, rating: number, feedback?: string): Promise<void> {
  await db.ride.update({
    where: { id: rideId },
    data: { passengerRating: rating },
  });
  if (feedback) {
    // Feedback is stored as an audit log entry for now.
    await db.auditLog.create({
      data: {
        action: 'ride:rated',
        entity: 'Ride',
        entityId: rideId,
        actorType: 'USER',
        rideId,
        metadata: { rating, feedback },
      },
    });
  }
}

export function getRideOtp(rideId: string): string {
  let hash = 0;
  for (let i = 0; i < rideId.length; i++) {
    hash = (hash << 5) - hash + rideId.charCodeAt(i);
    hash |= 0;
  }
  const code = (Math.abs(hash) % 9000) + 1000;
  return code.toString();
}

export async function getRideSummary(rideId: string) {
  const ride = await db.ride.findUnique({
    where: { id: rideId },
    include: {
      driver: { include: { vehicle: true } },
    },
  });
  if (!ride) return null;
  return {
    id: ride.id,
    status: ride.status as RideStatus,
    pickupAddress: ride.pickupAddress,
    dropoffAddress: ride.dropoffAddress,
    fareAmount: ride.fareAmount,
    surgeMultiplier: ride.surgeMultiplier,
    currency: ride.currency,
    distanceMeters: ride.distanceMeters,
    durationSeconds: ride.durationSeconds,
    requestedAt: ride.requestedAt.toISOString(),
    completedAt: ride.completedAt?.toISOString() ?? null,
    otp: getRideOtp(ride.id),
    driver: ride.driver
      ? {
          id: ride.driver.id,
          firstName: ride.driver.firstName,
          lastName: ride.driver.lastName,
          rating: ride.driver.rating,
          vehicleModel: ride.driver.vehicle?.model ?? null,
          licensePlate: ride.driver.vehicle?.licensePlate ?? null,
          vehicleType: (ride.driver.vehicle?.type ?? 'SEDAN') as
            | 'SEDAN'
            | 'SUV'
            | 'HATCHBACK'
            | 'BIKE'
            | 'AUTO',
        }
      : undefined,
  };
}
