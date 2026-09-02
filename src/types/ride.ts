/** Shared Ride domain types — mirror the Prisma enum but available to client code. */
export type RideStatus =
  | 'REQUESTED'
  | 'MATCHING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAID'
  | 'CANCELED'
  | 'NO_DRIVERS';

export type PaymentProvider = 'RAZORPAY';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'UPI' | 'WALLET' | 'CASH';
export type AccountType = 'PASSENGER' | 'ADMIN';
export type DriverApproval = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VehicleType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'BIKE' | 'AUTO';

export interface Point {
  lat: number;
  lng: number;
}

export interface RideEvent {
  type:
    | 'ride:created'
    | 'ride:matching'
    | 'ride:offered'
    | 'ride:accepted'
    | 'ride:arrived'
    | 'ride:started'
    | 'ride:completed'
    | 'ride:paid'
    | 'ride:canceled'
    | 'ride:no_drivers'
    | 'driver:location'
    | 'driver:heading';
  rideId: string;
  payload?: unknown;
  timestamp: string;
}

export interface RideSummary {
  id: string;
  status: RideStatus;
  pickupAddress: string;
  dropoffAddress: string;
  fareAmount: number;
  surgeMultiplier: number;
  currency: string;
  distanceMeters: number;
  durationSeconds: number;
  requestedAt: string;
  completedAt: string | null;
  otp?: string;
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    rating: number;
    vehicleModel?: string;
    licensePlate?: string;
    vehicleType?: VehicleType;
  };
}

/** Allowed state transitions — enforced in ride-service.ts. */
export const ALLOWED_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  REQUESTED: ['MATCHING', 'OFFERED', 'ACCEPTED', 'CANCELED'],
  MATCHING: ['OFFERED', 'ACCEPTED', 'NO_DRIVERS', 'CANCELED'],
  OFFERED: ['ACCEPTED', 'MATCHING', 'NO_DRIVERS', 'CANCELED'],
  ACCEPTED: ['ARRIVED', 'IN_PROGRESS', 'CANCELED'],
  ARRIVED: ['IN_PROGRESS', 'COMPLETED', 'CANCELED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELED'],
  COMPLETED: ['PAID'],
  PAID: [],
  CANCELED: [],
  NO_DRIVERS: [],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}

export const TERMINAL_STATUSES: ReadonlySet<RideStatus> = new Set([
  'PAID',
  'CANCELED',
  'NO_DRIVERS',
]);
