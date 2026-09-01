import { db } from '@/lib/db/client';
import { findNearbyDrivers } from './algorithm';
import { getCurrentSurge } from './surge';
import { transitionRideStatus, type CreateRideInput } from '@/server/services/ride-service';
import { emitToDriver } from '@/lib/realtime/server';
import { createNotification } from '@/lib/notifications/in-app';
import { DriverEvents, RideEvents } from '@/lib/realtime/events';
import { logger } from '@/lib/observability/logger';
import { env } from '@/lib/env';
import type { Point } from '@/lib/db/postgis';

/**
 * Ride offer dispatch — fan-out to top 3 drivers, escalate on timeout.
 *
 * Flow:
 *   1. After a ride is created (status REQUESTED), call `offerRideToDrivers`.
 *   2. Mark the ride MATCHING, compute surge, find nearby drivers.
 *   3. If no drivers → mark NO_DRIVERS, notify passenger, done.
 *   4. Otherwise, mark OFFERED and emit a `ride:offered` event to the top 3
 *      drivers' personal rooms. Each has 10 seconds to accept.
 *   5. If none accept within 10s, escalate to the next 3 drivers.
 *   6. After `MAX_ATTEMPTS` rounds with no accept → NO_DRIVERS.
 *
 * A driver "accepts" by calling `POST /api/rides/[id]` with `{ action: 'accept' }`,
 * which calls `ride-service.transitionRideStatus(rideId, 'ACCEPTED')` and
 * cancels all outstanding offers to other drivers.
 */

const OFFER_TIMEOUT_MS = 25_000;
const TOP_N_PER_ROUND = 5;

export async function offerRideToDrivers(
  rideId: string,
  pickup: Point,
  passengerName: string,
  pickupAddress: string,
  dropoffAddress: string,
  distanceMeters: number,
  durationSeconds: number,
  fareAmount: number,
): Promise<{ offered: boolean; reason?: string }> {
  await transitionRideStatus(rideId, 'MATCHING');
  const surge = await getCurrentSurge();
  const surgeFare = Math.round(fareAmount * surge);

  const drivers = await findNearbyDrivers(pickup);
  if (drivers.length === 0) {
    await transitionRideStatus(rideId, 'NO_DRIVERS');
    await createNotification({
      userId: await getPassengerId(rideId),
      type: 'NO_DRIVERS',
      title: 'No drivers available',
      body: 'We could not find any drivers near your pickup. Please try again in a few minutes.',
      data: { rideId },
    });
    return { offered: false, reason: 'NO_DRIVERS' };
  }

  // Offer to the top N drivers in rounds.
  for (let attempt = 0; attempt < env.MATCHING_MAX_ATTEMPTS; attempt++) {
    const slice = drivers.slice(attempt * TOP_N_PER_ROUND, (attempt + 1) * TOP_N_PER_ROUND);
    if (slice.length === 0) break;
    await transitionRideStatus(rideId, 'OFFERED');
    const expiresAt = new Date(Date.now() + OFFER_TIMEOUT_MS);
    for (const driver of slice) {
      const offerPayload = {
        rideId,
        passengerName,
        pickupAddress,
        dropoffAddress,
        distanceMeters,
        durationSeconds,
        fareAmount: surgeFare,
        surgeMultiplier: surge,
        expiresAt: expiresAt.toISOString(),
      };
      emitToDriver(driver.id, DriverEvents.Assigned, offerPayload);
      await createNotification({
        driverId: driver.id,
        type: 'RIDE_REQUEST',
        title: 'New ride request',
        body: `${pickupAddress} → ${dropoffAddress} · ₹${(surgeFare / 100).toFixed(0)} (${surge}x surge)`,
        data: offerPayload,
      });
    }
    // Wait for accept or timeout — driver accept cancels via WS broadcast.
    const accepted = await waitForAccept(rideId, OFFER_TIMEOUT_MS);
    if (accepted) {
      return { offered: true };
    }
    logger.info({ rideId, attempt }, 'Ride offer round timed out, escalating');
  }

  await transitionRideStatus(rideId, 'NO_DRIVERS');
  return { offered: false, reason: 'NO_DRIVERS' };
}

async function waitForAccept(rideId: string, timeoutMs: number): Promise<boolean> {
  // Poll the DB for status change — the Socket.IO server doesn't have a
  // direct "wait for event" API. In production this is BullMQ-driven.
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ride = await db.ride.findUnique({
      where: { id: rideId },
      select: { status: true, driverId: true },
    });
    if (ride?.status === 'ACCEPTED' && ride.driverId) {
      return true;
    }
    if (ride?.status === 'NO_DRIVERS' || ride?.status === 'CANCELED') {
      return false;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function getPassengerId(rideId: string): Promise<string> {
  const ride = await db.ride.findUnique({
    where: { id: rideId },
    select: { passengerId: true },
  });
  return ride?.passengerId ?? '';
}

export async function acceptRide(rideId: string, driverId: string): Promise<void> {
  // Optimistic concurrency: succeed if the ride is in OFFERED, REQUESTED, or MATCHING
  const result = await db.ride.updateMany({
    where: { 
      id: rideId, 
      status: { in: ['OFFERED', 'REQUESTED', 'MATCHING'] },
      driverId: null,
    },
    data: { status: 'ACCEPTED', driverId, acceptedAt: new Date() },
  });
  if (result.count === 0) {
    throw new Error('Ride is no longer available — another driver accepted or it was canceled');
  }

  // Clear unread ride request notifications so offer popup does not repeat
  await db.notification.updateMany({
    where: {
      type: 'RIDE_REQUEST',
      readAt: null,
    },
    data: { readAt: new Date() },
  }).catch(() => {});

  emitToDriver(driverId, RideEvents.Accepted, { rideId, driverId, timestamp: new Date().toISOString() });
  logger.info({ rideId, driverId }, 'Ride accepted');
}
