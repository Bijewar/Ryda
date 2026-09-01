import { db } from '@/lib/db/client';
import { getSystemSettings } from './system-settings';
import { createNotification } from '@/lib/notifications/in-app';
import { logger } from '@/lib/observability/logger';
import { formatCurrency } from '@/lib/utils';
import {
  type CancellationReasonCategory,
  CANCELLATION_REASONS,
  type DriverReliabilityStats,
} from '@/types/reliability';

export {
  type CancellationReasonCategory,
  CANCELLATION_REASONS,
  type DriverReliabilityStats,
};

/**
 * Recalculate a driver's reliability score (0-100) and update rewards status.
 *
 * Scoring factors:
 * - Completion rate: 40%
 * - Cancellation rate: 30%
 * - Customer rating: 15%
 * - Acceptance / Activity score: 15%
 */
export async function calculateDriverReliability(driverId: string): Promise<DriverReliabilityStats> {
  const config = await getSystemSettings();

  const driver = await db.driver.findUnique({
    where: { id: driverId },
    include: {
      rides: {
        select: { id: true, status: true, requestedAt: true, acceptedAt: true },
      },
      cancellations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!driver) {
    throw new Error(`Driver ${driverId} not found`);
  }

  // Calculate stats from ride history
  const allRides = driver.rides;
  const acceptedRides = allRides.filter((r) => r.acceptedAt !== null);
  const totalAccepted = Math.max(driver.totalRides, acceptedRides.length);
  const completedRides = allRides.filter((r) => r.status === 'COMPLETED' || r.status === 'PAID');
  const totalCompleted = Math.max(driver.totalRides, completedRides.length);

  // Cancellations this calendar month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthCancellations = await db.driverCancellationHistory.findMany({
    where: {
      driverId,
      createdAt: { gte: startOfMonth },
    },
  });

  const totalDriverCancelled = driver.cancellations.length;
  const avoidableCancelled = driver.cancellations.filter((c) => c.isPenalized).length;
  const validEmergencyCancelled = driver.cancellations.filter((c) => !c.isPenalized).length;
  const cancellationsThisMonth = monthCancellations.length;

  // Rate calculations
  const effectiveAccepted = Math.max(totalAccepted, 1);
  const cancellationRate = (avoidableCancelled / effectiveAccepted) * 100;
  const completionRate = Math.min(100, (totalCompleted / effectiveAccepted) * 100);

  // Score formula (0 to 100)
  // Completion weight: 40 points
  const completionComponent = (completionRate / 100) * 40;
  // Cancellation weight: 30 points (decreases as cancellationRate rises above 0%)
  const cancellationPenaltyRatio = Math.min(1, cancellationRate / 20); // 20% cancellation = 0 points
  const cancellationComponent = (1 - cancellationPenaltyRatio) * 30;
  // Rating weight: 15 points
  const ratingComponent = (Math.min(5, driver.rating) / 5) * 15;
  // Activity / Base weight: 15 points
  const activityComponent = Math.min(15, totalCompleted >= 10 ? 15 : totalCompleted * 1.5);

  let rawScore = Math.round(completionComponent + cancellationComponent + ratingComponent + activityComponent);
  rawScore = Math.max(10, Math.min(100, rawScore));

  // Determine Reliable Driver Status
  const isReliable =
    rawScore >= 88 &&
    cancellationRate <= config.cancellationRateThreshold &&
    completionRate >= config.reliableDriverCompletionRate;

  const earningsBonusRate = isReliable ? config.reliableDriverBonusRate : 0.0;

  // Persist updated score
  await db.driver.update({
    where: { id: driverId },
    data: {
      reliabilityScore: rawScore,
      cancellationsThisMonth,
      isReliableDriver: isReliable,
      earningsBonusRate,
    },
  });

  return {
    driverId,
    reliabilityScore: rawScore,
    totalAccepted,
    totalCompleted,
    totalDriverCancelled,
    totalCustomerCancelled: 0,
    validEmergencyCancelled,
    avoidableCancelled,
    cancellationsThisMonth,
    cancellationAllowance: config.freeCancellationsLimit,
    cancellationRate: Number(cancellationRate.toFixed(1)),
    completionRate: Number(completionRate.toFixed(1)),
    isReliableDriver: isReliable,
    earningsBonusRate,
    totalPenalties: driver.totalPenalties,
    recentCancellations: driver.cancellations,
  };
}

/**
 * Handle a driver cancellation with reason classification, progressive penalty calculation,
 * and reliability score adjustment.
 */
export async function processDriverCancellation(opts: {
  driverId: string;
  rideId: string;
  category: CancellationReasonCategory;
  details?: string;
}): Promise<{
  penalized: boolean;
  penaltyAmount: number;
  newScore: number;
  warning?: string;
}> {
  const config = await getSystemSettings();
  const reasonMeta = CANCELLATION_REASONS.find((r) => r.category === opts.category) ?? {
    category: 'OTHER' as CancellationReasonCategory,
    label: 'Other',
    isPenalizedByDefault: true,
    requiresVerification: false,
    description: '',
  };

  // Check driver's cancellations this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyCount = await db.driverCancellationHistory.count({
    where: {
      driverId: opts.driverId,
      createdAt: { gte: startOfMonth },
    },
  });

  const nextCount = monthlyCount + 1;
  let isPenalized = false;
  let penaltyAmount = 0; // in paise

  if (reasonMeta.isPenalizedByDefault) {
    if (nextCount > config.freeCancellationsLimit) {
      isPenalized = true;
      const overLimitCount = nextCount - config.freeCancellationsLimit;
      // Progressive penalty: Base + (excess * increment), capped at Max
      const progressive = config.basePenaltyAmount + (overLimitCount - 1) * config.progressivePenaltyIncrement;
      penaltyAmount = Math.min(config.maxPenaltyAmount, progressive);
    }
  }

  // Record cancellation history
  await db.driverCancellationHistory.create({
    data: {
      driverId: opts.driverId,
      rideId: opts.rideId,
      reasonCategory: opts.category,
      reasonDetails: opts.details ?? reasonMeta.label,
      isPenalized,
      penaltyAmount,
      status: reasonMeta.requiresVerification ? 'REQUIRES_VERIFICATION' : 'APPROVED',
    },
  });

  // If penalized, update driver's total penalties
  if (isPenalized && penaltyAmount > 0) {
    await db.driver.update({
      where: { id: opts.driverId },
      data: {
        totalPenalties: { increment: penaltyAmount },
        penalizedCancellations: { increment: 1 },
      },
    });

    // Notify driver about progressive penalty
    await createNotification({
      driverId: opts.driverId,
      type: 'CANCELLATION_PENALTY',
      title: 'Cancellation fee applied',
      body: `You have exceeded your ${config.freeCancellationsLimit} monthly cancellation allowance. A fee of ${formatCurrency(penaltyAmount)} has been recorded.`,
      data: { rideId: opts.rideId, penaltyAmount, count: nextCount },
    });
  }

  // Recalculate score
  const updatedStats = await calculateDriverReliability(opts.driverId);

  let warning: string | undefined;
  if (nextCount > config.freeCancellationsLimit - 3 && nextCount <= config.freeCancellationsLimit) {
    warning = `Warning: You have used ${nextCount}/${config.freeCancellationsLimit} free monthly cancellations. Avoidable cancellations beyond ${config.freeCancellationsLimit} incur progressive fees.`;
  }

  logger.info(
    {
      driverId: opts.driverId,
      rideId: opts.rideId,
      category: opts.category,
      isPenalized,
      penaltyAmount,
      newScore: updatedStats.reliabilityScore,
    },
    'Driver cancellation processed',
  );

  return {
    penalized: isPenalized,
    penaltyAmount,
    newScore: updatedStats.reliabilityScore,
    warning,
  };
}
