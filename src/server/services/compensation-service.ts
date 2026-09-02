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
 * Issue automatic flat ₹20-₹30 compensation (default ₹25) to the passenger
 * whenever a driver cancels their ride or if driver cancellations occur.
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

  // Calculate flat compensation: ₹25.00 (2500 paise), bounded between ₹20 and ₹30
  const compensationPaise = Math.min(
    config.customerCompensationMaxAmount, // 3000 (₹30)
    Math.max(2000, config.customerCompensationBaseAmount) // 2500 (₹25)
  );

  // 1. Issue compensation record
  await db.customerCompensation.create({
    data: {
      passengerId: ride.passengerId,
      rideId: ride.id,
      driverId: opts.driverId,
      amount: compensationPaise,
      type: 'RIDE_CREDIT',
      reason: `Driver cancellation inconvenience compensation`,
      inconvenienceScore: 1.0,
      status: 'ISSUED',
    },
  });

  // 2. Credit passenger's wallet balance
  await db.user.update({
    where: { id: ride.passengerId },
    data: {
      rideCredits: { increment: compensationPaise },
    },
  });

  const formattedAmount = formatCurrency(compensationPaise);

  // 3. Notify passenger with compensation notice
  await createNotification({
    userId: ride.passengerId,
    type: 'DRIVER_CANCELED_COMPENSATION',
    title: 'Driver cancelled — Compensation Credited',
    body: `We apologize for the inconvenience. A flat ${formattedAmount} credit has been added to your Ryda wallet for your next ride. Finding you a new captain now...`,
    data: {
      rideId: ride.id,
      compensationAmount: compensationPaise,
    },
  });

  // 4. Emit realtime update
  emitToRide(ride.id, 'ride_status_updated', {
    rideId: ride.id,
    status: 'MATCHING',
    previousStatus: ride.status,
    compensationIssued: true,
    compensationAmount: compensationPaise,
    message: `Driver cancelled. ${formattedAmount} added to your wallet. Re-matching...`,
  });

  logger.info(
    {
      rideId: ride.id,
      passengerId: ride.passengerId,
      driverId: opts.driverId,
      compensationPaise,
    },
    'Customer automatic flat compensation credited',
  );

  return {
    issued: true,
    amount: compensationPaise,
    reason: `Driver cancellation compensation (${formattedAmount})`,
    autoReassigned: true,
  };
}

/**
 * Check if a passenger has experienced multiple driver cancellations (> 10)
 * and grant an automatic flat ₹25 loyalty recovery bonus.
 */
export async function checkAndCompensateFrequentCancellations(passengerId: string): Promise<boolean> {
  const cancellationCount = await db.customerCompensation.count({
    where: { passengerId },
  });

  if (cancellationCount >= 10) {
    const loyaltyBonus = 2500; // Flat ₹25
    await db.user.update({
      where: { id: passengerId },
      data: { rideCredits: { increment: loyaltyBonus } },
    });

    await createNotification({
      userId: passengerId,
      type: 'DRIVER_CANCELED_COMPENSATION',
      title: 'Loyalty Compensation Bonus',
      body: `You have received a flat ₹25 loyalty bonus credited to your wallet due to cumulative driver cancellations.`,
      data: { compensationAmount: loyaltyBonus },
    });
    return true;
  }

  return false;
}
