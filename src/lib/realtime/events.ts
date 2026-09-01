import type { RideStatus } from '@/types/ride';

/**
 * Realtime event name constants + payload types.
 *
 * Every Socket.IO event in Ryda v2 has a typed name + payload — the client
 * hook (`useRealtimeRide`) and the server (`workers/socket-server.ts`) share
 * these constants so a typo is a compile error, not a runtime bug.
 */

export const RideEvents = {
  Created: 'ride:created',
  Matching: 'ride:matching',
  Offered: 'ride:offered',
  Accepted: 'ride:accepted',
  Arrived: 'ride:arrived',
  Started: 'ride:started',
  Completed: 'ride:completed',
  Paid: 'ride:paid',
  Canceled: 'ride:canceled',
  NoDrivers: 'ride:no_drivers',
} as const;

export const DriverEvents = {
  Location: 'driver:location',
  Heading: 'driver:heading',
  Status: 'driver:status',
  Assigned: 'driver:assigned',
  Cleared: 'driver:cleared',
} as const;

export const SystemEvents = {
  Connected: 'sys:connected',
  Disconnected: 'sys:disconnected',
  Error: 'sys:error',
} as const;

export type RideEventName = (typeof RideEvents)[keyof typeof RideEvents];
export type DriverEventName = (typeof DriverEvents)[keyof typeof DriverEvents];
export type SystemEventName = (typeof SystemEvents)[keyof typeof SystemEvents];
export type EventName = RideEventName | DriverEventName | SystemEventName;

export interface RideStatusPayload {
  rideId: string;
  status: RideStatus;
  driverId?: string;
  timestamp: string;
}

export interface DriverLocationPayload {
  rideId: string;
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  /** Recomputed ETA to pickup/dropoff in seconds. */
  etaSeconds?: number;
  timestamp: string;
}

export interface RideOfferPayload {
  rideId: string;
  passengerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMeters: number;
  durationSeconds: number;
  fareAmount: number;
  surgeMultiplier: number;
  /** Time the driver has to accept before the offer expires. */
  expiresAt: string;
}
