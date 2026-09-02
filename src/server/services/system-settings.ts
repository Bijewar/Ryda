import { db } from '@/lib/db/client';
import type { SystemConfig } from '@/types/reliability';

export type { SystemConfig };

export const DEFAULT_CONFIG: SystemConfig = {
  freeCancellationsLimit: 15, // > 15 rejections incur penalty
  rewardBonusThreshold: 5, // <= 5 rejections earn reliability reward bonus
  rewardBonusAmount: 30000, // ₹300 reward bonus
  basePenaltyAmount: 5000, // ₹50 base penalty
  progressivePenaltyIncrement: 2500, // ₹25 progressive per rejection
  maxPenaltyAmount: 20000, // ₹200 max penalty
  cancellationRateThreshold: 8.0, // 8%
  reliableDriverCompletionRate: 90.0, // 90%
  reliableDriverBonusRate: 0.02, // +2%
  reliableDriverCommissionDiscount: 0.05, // 5%
  customerCompensationBaseAmount: 2500, // Flat ₹25 (within ₹20-₹30 range)
  customerCompensationMaxAmount: 3000, // Max ₹30
  repositioningMinIncentive: 1000, // ₹10
  repositioningMaxIncentive: 6000, // ₹60
  repositioningDailyBudget: 500000, // ₹5,000
};

/**
 * Get all system settings from DB with fallback to defaults.
 */
export async function getSystemSettings(): Promise<SystemConfig> {
  try {
    const settings = await db.systemSetting.findMany();
    const map = new Map(settings.map((s) => [s.key, s.value]));

    return {
      freeCancellationsLimit: Number(
        map.get('freeCancellationsLimit') ?? DEFAULT_CONFIG.freeCancellationsLimit,
      ),
      rewardBonusThreshold: Number(
        map.get('rewardBonusThreshold') ?? DEFAULT_CONFIG.rewardBonusThreshold,
      ),
      rewardBonusAmount: Number(map.get('rewardBonusAmount') ?? DEFAULT_CONFIG.rewardBonusAmount),
      basePenaltyAmount: Number(map.get('basePenaltyAmount') ?? DEFAULT_CONFIG.basePenaltyAmount),
      progressivePenaltyIncrement: Number(
        map.get('progressivePenaltyIncrement') ?? DEFAULT_CONFIG.progressivePenaltyIncrement,
      ),
      maxPenaltyAmount: Number(map.get('maxPenaltyAmount') ?? DEFAULT_CONFIG.maxPenaltyAmount),
      cancellationRateThreshold: Number(
        map.get('cancellationRateThreshold') ?? DEFAULT_CONFIG.cancellationRateThreshold,
      ),
      reliableDriverCompletionRate: Number(
        map.get('reliableDriverCompletionRate') ?? DEFAULT_CONFIG.reliableDriverCompletionRate,
      ),
      reliableDriverBonusRate: Number(
        map.get('reliableDriverBonusRate') ?? DEFAULT_CONFIG.reliableDriverBonusRate,
      ),
      reliableDriverCommissionDiscount: Number(
        map.get('reliableDriverCommissionDiscount') ??
          DEFAULT_CONFIG.reliableDriverCommissionDiscount,
      ),
      customerCompensationBaseAmount: Number(
        map.get('customerCompensationBaseAmount') ?? DEFAULT_CONFIG.customerCompensationBaseAmount,
      ),
      customerCompensationMaxAmount: Number(
        map.get('customerCompensationMaxAmount') ?? DEFAULT_CONFIG.customerCompensationMaxAmount,
      ),
      repositioningMinIncentive: Number(
        map.get('repositioningMinIncentive') ?? DEFAULT_CONFIG.repositioningMinIncentive,
      ),
      repositioningMaxIncentive: Number(
        map.get('repositioningMaxIncentive') ?? DEFAULT_CONFIG.repositioningMaxIncentive,
      ),
      repositioningDailyBudget: Number(
        map.get('repositioningDailyBudget') ?? DEFAULT_CONFIG.repositioningDailyBudget,
      ),
    };
  } catch (_e) {
    return DEFAULT_CONFIG;
  }
}

/**
 * Update system settings in DB.
 */
export async function updateSystemSettings(updates: Partial<SystemConfig>): Promise<SystemConfig> {
  const entries = Object.entries(updates);
  for (const [key, value] of entries) {
    if (value !== undefined) {
      await db.systemSetting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      });
    }
  }
  return getSystemSettings();
}
