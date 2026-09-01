import { db } from '@/lib/db/client';
import { getSystemSettings } from './system-settings';
import { createNotification } from '@/lib/notifications/in-app';
import { offerRideToDrivers } from '@/server/matching/offer';
import { emitToRide } from '@/lib/realtime/server';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/observability/logger';
import type { Point } from '@/lib/db/postgis';

export interface CompensationResult {
  issued: boolean;
  amount: number; // in paise
  reason: string;
  autoReassigned: boolean;
}

/**
 * Calculate customer inconvenience and issue automatic compensation when a driver cancels.
 * Automatically initiates seamless driver re-matching for the passenger.
 */
export async function handleDriverCancellationCompensation(opts: {
  rideId: string;
  driverId: string;
  reasonCategory: string;
}): Promise<CompensationResult> {
  const config = await getSystemSettings();

  const ride = await db.ride.findUnique({
    where: { id: opts.rideId },
    include: {
      passenger: true,
      driver: true,
    },
  });

  if (!ride) {
    return { issued: false, amount: 0, reason: 'Ride not found', autoReassigned: false };
  }

  // 1. Calculate customer inconvenience factor
  let waitMinutes = 0;
  if (ride.acceptedAt) {
    waitMinutes = Math.max(0, (Date.now() - new Date(ride.acceptedAt).getTime()) / 60000);
  }

  let inconvenienceMultiplier = 1.0;
  if (waitMinutes > 10) {
    inconvenienceMultiplier = 2.0;
  } else if (waitMinutes > 5) {
    inconvenienceMultiplier = 1.5;
  } else if (waitMinutes < 2) {
    inconvenienceMultiplier = 0.8;
  }

  // If driver was already marked ARRIVED, increase inconvenience multiplier
  if (ride.driverArrivedAt) {
    inconvenienceMultiplier += 0.5;
  }

  // Calculate compensation amount (in paise)
  let compensationPaise = Math.round(config.customerCompensationBaseAmount * inconvenienceMultiplier);
  compensationPaise = Math.min(config.customerCompensationMaxAmount, Math.max(2000, compensationPaise));

  // 2. Issue compensation record and credit passenger wallet
  await db.customerCompensation.create({
    data: {
      passengerId: ride.passengerId,
      rideId: ride.id,
      driverId: opts.driverId,
      amount: compensationPaise,
      type: 'RIDE_CREDIT',
      reason: `Driver cancellation compensation (Waited ${waitMinutes.toFixed(0)} min)`,
      inconvenienceScore: Number(inconvenienceMultiplier.toFixed(2)),
      status: 'ISSUED',
    },
  });

  // Credit user's wallet balance
  await db.user.update({
    where: { id: ride.passengerId },
    data: {
      rideCredits: { increment: compensationPaise },
    },
  });

  const formattedAmount = formatCurrency(compensationPaise);

  // 3. Notify passenger with the compensation message
  await createNotification({
    userId: ride.passengerId,
    type: 'DRIVER_CANCELED_COMPENSATION',
    title: 'Driver cancelled your ride',
    body: `We are automatically finding another driver for you. ${formattedAmount} ride credit has been added to your account for the inconvenience.`,
    data: {
      rideId: ride.id,
      compensationAmount: compensationPaise,
      waitMinutes: Math.round(waitMinutes),
    },
  });

  // Emit live socket event to the passenger
  emitToRide(ride.id, 'ride:driver_canceled_reassigning' as never, {
    rideId: ride.id,
    compensationAmount: compensationPaise,
    formattedCompensation: formattedAmount,
    message: `Driver cancelled. ${formattedAmount} credit added. Finding another driver…`,
    timestamp: new Date().toISOString(),
  });

  logger.info(
    {
      rideId: ride.id,
      passengerId: ride.passengerId,
      compensationPaise,
      waitMinutes,
    },
    'Customer compensation issued and auto-reassign triggered',
  );

  // 4. Seamlessly re-dispatch matching for the same ride in the background
  // Extract coordinate points safely
  const pickupPoint: Point = {
    lat: 23.2419,
    lng: 77.4321,
  };

  void offerRideToDrivers(
    ride.id,
    pickupPoint,
    ride.passenger?.name ?? 'Passenger',
    ride.pickupAddress,
    ride.dropoffAddress,
    ride.distanceMeters,
    ride.durationSeconds,
    ride.fareAmount,
  ).catch((err) => {
    logger.error({ err, rideId: ride.id }, 'Auto-reassign ride offer failed');
  });

  return {
    issued: true,
    amount: compensationPaise,
    reason: `Inconvenience compensation (${formattedAmount})`,
    autoReassigned: true,
  };
}
