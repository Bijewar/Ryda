export type CancellationReasonCategory =
  | 'VEHICLE_PROBLEM'
  | 'EMERGENCY'
  | 'UNSAFE_PICKUP'
  | 'ROAD_BLOCKED'
  | 'WRONG_PICKUP_LOCATION'
  | 'CUSTOMER_REQUESTED'
  | 'TECHNICAL_ISSUE'
  | 'OTHER';

export const CANCELLATION_REASONS: Array<{
  category: CancellationReasonCategory;
  label: string;
  isPenalizedByDefault: boolean;
  requiresVerification: boolean;
  description: string;
}> = [
  {
    category: 'CUSTOMER_REQUESTED',
    label: 'Customer requested cancellation',
    isPenalizedByDefault: false,
    requiresVerification: false,
    description: 'Customer asked driver not to come or cancel the trip',
  },
  {
    category: 'EMERGENCY',
    label: 'Medical / Family emergency',
    isPenalizedByDefault: false,
    requiresVerification: true,
    description: 'Sudden genuine personal or medical emergency',
  },
  {
    category: 'ROAD_BLOCKED',
    label: 'Road blocked / Inaccessible route',
    isPenalizedByDefault: false,
    requiresVerification: false,
    description: 'Severe waterlogging, construction, or road closure',
  },
  {
    category: 'UNSAFE_PICKUP',
    label: 'Unsafe pickup location',
    isPenalizedByDefault: false,
    requiresVerification: false,
    description: 'Area is physically unsafe or restricted access',
  },
  {
    category: 'WRONG_PICKUP_LOCATION',
    label: 'Wrong pickup location specified',
    isPenalizedByDefault: false,
    requiresVerification: false,
    description: 'Customer location pin is significantly incorrect or unreachable',
  },
  {
    category: 'TECHNICAL_ISSUE',
    label: 'App / GPS technical error',
    isPenalizedByDefault: false,
    requiresVerification: false,
    description: 'Device crash or network connectivity failure',
  },
  {
    category: 'VEHICLE_PROBLEM',
    label: 'Vehicle breakdown / Flat tire',
    isPenalizedByDefault: true,
    requiresVerification: false,
    description: 'Mechanical issue requiring repair',
  },
  {
    category: 'OTHER',
    label: 'Other personal reason',
    isPenalizedByDefault: true,
    requiresVerification: false,
    description: 'Driver unable or unwilling to complete the accepted trip',
  },
];

export interface DriverReliabilityStats {
  driverId: string;
  reliabilityScore: number; // 0-100
  totalAccepted: number;
  totalCompleted: number;
  totalDriverCancelled: number;
  totalCustomerCancelled: number;
  validEmergencyCancelled: number;
  avoidableCancelled: number;
  cancellationsThisMonth: number;
  cancellationAllowance: number;
  cancellationRate: number; // percentage (e.g. 2.4%)
  completionRate: number; // percentage (e.g. 96.5%)
  isReliableDriver: boolean;
  earningsBonusRate: number;
  totalPenalties: number; // paise
  recentCancellations: any[];
}

export interface BhopalZoneData {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  currentDemandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  predictedDemand10m: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  predictedDemand20m: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  predictedDemand30m: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  predictedDemand60m: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  activeRequests: number;
  activeDrivers: number;
  idleDrivers: number;
  driverShortage: number;
  repositioningIncentive: number; // paise
  maxDriversNeeded: number;
  currentDriversHeading: number;
}

export interface SystemConfig {
  freeCancellationsLimit: number;
  basePenaltyAmount: number;
  progressivePenaltyIncrement: number;
  maxPenaltyAmount: number;
  cancellationRateThreshold: number;
  reliableDriverCompletionRate: number;
  reliableDriverBonusRate: number;
  reliableDriverCommissionDiscount: number;
  customerCompensationBaseAmount: number;
  customerCompensationMaxAmount: number;
  repositioningMinIncentive: number;
  repositioningMaxIncentive: number;
  repositioningDailyBudget: number;
}
