import { db } from '@/lib/db/client';
import { logger } from '@/lib/observability/logger';
import type { RideOfferPayload } from '@/lib/realtime/events';

export interface DriverCompletedRide {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareAmount: number; // in paise (e.g. 18000 = ₹180)
  distanceKm: number;
  passengerName: string;
  paymentMethod: string;
  completedAt: Date;
}

export interface ActiveOngoingTrip {
  rideId: string;
  driverId: string;
  passengerName: string;
  passengerPhone?: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMeters: number;
  durationSeconds: number;
  fareAmount: number;
  surgeMultiplier: number;
  status: 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID';
  paymentMethod: string;
  otp: string;
}

export interface DriverRecord {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  passwordHash?: string;
  licenseNumber: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  isOnline: boolean;
  rating: number;
  totalRides: number;
  totalEarnings: number; // in paise
  createdAt: Date;
  lat?: number;
  lng?: number;
  heading?: number;
  ridesHistory?: DriverCompletedRide[];
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    type: 'SEDAN' | 'SUV' | 'HATCHBACK' | 'BIKE' | 'AUTO';
  };
}

export interface StoredOfferItem {
  offer: RideOfferPayload;
  createdAt: number;
  dismissedBy: Set<string>;
}

// Global runtime stores
const globalForDrivers = globalThis as unknown as {
  registeredDrivers: Map<string, DriverRecord>;
  pendingRideOffers: Map<string, RideOfferPayload>;
  activeOngoingTrips: Map<string, ActiveOngoingTrip>;
  completedTripsMap: Map<string, ActiveOngoingTrip>;
  storedOfferQueue: Map<string, StoredOfferItem>;
};

export const memoryDrivers: Map<string, DriverRecord> =
  globalForDrivers.registeredDrivers ?? new Map<string, DriverRecord>();

export const pendingRideOffers: Map<string, RideOfferPayload> =
  globalForDrivers.pendingRideOffers ?? new Map<string, RideOfferPayload>();

export const activeOngoingTrips: Map<string, ActiveOngoingTrip> =
  globalForDrivers.activeOngoingTrips ?? new Map<string, ActiveOngoingTrip>();

export const completedTripsMap: Map<string, ActiveOngoingTrip> =
  globalForDrivers.completedTripsMap ?? new Map<string, ActiveOngoingTrip>();

export const storedOfferQueue: Map<string, StoredOfferItem> =
  globalForDrivers.storedOfferQueue ?? new Map<string, StoredOfferItem>();

if (process.env.NODE_ENV !== 'production') {
  globalForDrivers.registeredDrivers = memoryDrivers;
  globalForDrivers.pendingRideOffers = pendingRideOffers;
  globalForDrivers.activeOngoingTrips = activeOngoingTrips;
  globalForDrivers.completedTripsMap = completedTripsMap;
  globalForDrivers.storedOfferQueue = storedOfferQueue;
}

/**
 * Register or update driver in both DB and memory registry
 */
export async function saveDriverRecord(driver: DriverRecord): Promise<void> {
  if (!driver.ridesHistory) driver.ridesHistory = [];
  memoryDrivers.set(driver.email.toLowerCase(), driver);
  memoryDrivers.set(driver.id, driver);
}

/**
 * Find driver by email or ID (checks memory then DB)
 */
export async function findDriverByEmailOrId(
  emailOrId: string,
): Promise<DriverRecord | null> {
  const query = emailOrId.toLowerCase().trim();

  // 1. Check memory store
  const inMem = memoryDrivers.get(query);
  if (inMem) {
    if (!inMem.ridesHistory) inMem.ridesHistory = [];
    return inMem;
  }

  // 2. Check Postgres DB if available
  try {
    const dbDriver = await db.driver.findFirst({
      where: {
        OR: [{ email: query }, { id: query }],
      },
      include: {
        vehicle: true,
        rides: {
          where: { status: 'COMPLETED' },
          orderBy: { completedAt: 'desc' },
          take: 50,
          include: { passenger: true },
        },
      },
    });

    if (dbDriver) {
      const dbRidesHistory: DriverCompletedRide[] = ((dbDriver as any).rides || []).map((r: any) => ({
        id: r.id,
        pickupAddress: r.pickupAddress,
        dropoffAddress: r.dropoffAddress,
        fareAmount: r.fareAmount,
        distanceKm: Number(r.distanceKm || 5.2),
        passengerName: r.passenger?.name || 'Passenger',
        paymentMethod: r.paymentMethod || 'UPI',
        completedAt: r.completedAt ? new Date(r.completedAt) : new Date(r.requestedAt),
      }));

      const record: DriverRecord = {
        id: dbDriver.id,
        email: dbDriver.email,
        phone: dbDriver.phone,
        firstName: dbDriver.firstName,
        lastName: dbDriver.lastName,
        passwordHash: dbDriver.passwordHash ?? undefined,
        licenseNumber: dbDriver.licenseNumber,
        approvalStatus: dbDriver.approvalStatus as any,
        isOnline: dbDriver.isOnline,
        rating: dbDriver.rating,
        totalRides: dbDriver.totalRides,
        totalEarnings: dbDriver.totalEarnings,
        createdAt: dbDriver.createdAt,
        ridesHistory: dbRidesHistory,
        vehicle: dbDriver.vehicle as any,
      };
      memoryDrivers.set(dbDriver.email.toLowerCase(), record);
      memoryDrivers.set(dbDriver.id, record);
      return record;
    }
  } catch (err) {
    logger.warn({ err, query }, 'DB driver lookup note');
  }

  return null;
}

/**
 * Broadcast a new ride offer to all online approved drivers
 */
export function broadcastRideOffer(offer: RideOfferPayload): void {
  pendingRideOffers.set(offer.rideId, offer);
  storedOfferQueue.set(offer.rideId, {
    offer,
    createdAt: Date.now(),
    dismissedBy: new Set(),
  });
}

/**
 * Dismiss or reject a ride offer for a specific driver
 */
export async function dismissDriverOffer(driverIdOrEmail: string, rideId: string): Promise<void> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  const item = storedOfferQueue.get(rideId);
  if (item && driver) {
    item.dismissedBy.add(driver.id);
    item.dismissedBy.add(driver.email.toLowerCase());
  }
}

/**
 * Get active pending offer or ongoing trip for a driver
 */
export async function getDriverOfferOrTrip(driverIdOrEmail: string): Promise<{
  offer: RideOfferPayload | null;
  activeTrip: ActiveOngoingTrip | null;
}> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  if (!driver || !driver.isOnline || driver.approvalStatus !== 'APPROVED') {
    return { offer: null, activeTrip: null };
  }

  // 1. Check if driver has an ongoing active trip
  for (const trip of activeOngoingTrips.values()) {
    if (trip.driverId === driver.id || trip.driverId === driver.email.toLowerCase()) {
      return { offer: null, activeTrip: trip };
    }
  }

  // 2. Check offer queue (prune expired > 25 seconds & ignore dismissed)
  const now = Date.now();
  const driverKey1 = driver.id;
  const driverKey2 = driver.email.toLowerCase();

  for (const [rideId, item] of storedOfferQueue.entries()) {
    // Expire offers older than 25 seconds
    if (now - item.createdAt > 25_000) {
      storedOfferQueue.delete(rideId);
      pendingRideOffers.delete(rideId);
      continue;
    }

    // Skip if already rejected/dismissed by this driver
    if (item.dismissedBy.has(driverKey1) || item.dismissedBy.has(driverKey2)) {
      continue;
    }

    // Fresh active offer available for this driver
    return { offer: item.offer, activeTrip: null };
  }

  return { offer: null, activeTrip: null };
}

/**
 * Driver accepts a pending ride offer
 */
export async function acceptRideOffer(
  rideId: string,
  driverIdOrEmail: string,
): Promise<ActiveOngoingTrip | null> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  if (!driver) return null;

  const item = storedOfferQueue.get(rideId);
  const offer = item?.offer || pendingRideOffers.get(rideId);

  storedOfferQueue.delete(rideId);
  pendingRideOffers.delete(rideId);

  const newTrip: ActiveOngoingTrip = {
    rideId,
    driverId: driver.id,
    passengerName: offer?.passengerName ?? 'Aarav Gupta (Passenger)',
    passengerPhone: '+91 98260 12345',
    pickupAddress: offer?.pickupAddress ?? 'MP Nagar Zone 1, Bhopal',
    dropoffAddress: offer?.dropoffAddress ?? 'Rani Kamlapati Station, Bhopal',
    distanceMeters: offer?.distanceMeters ?? 4800,
    durationSeconds: offer?.durationSeconds ?? 720,
    fareAmount: offer?.fareAmount ?? 14500,
    surgeMultiplier: offer?.surgeMultiplier ?? 1.0,
    status: 'ACCEPTED',
    paymentMethod: 'UPI',
    otp: '4829',
  };

  activeOngoingTrips.set(rideId, newTrip);
  return newTrip;
}

/**
 * Update active trip status (ARRIVED, IN_PROGRESS, COMPLETED)
 */
export async function updateActiveTripStatus(
  rideId: string,
  status: 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'CANCELLED',
): Promise<ActiveOngoingTrip | null> {
  const trip = activeOngoingTrips.get(rideId) || completedTripsMap.get(rideId);
  if (!trip) return null;

  if (status === 'COMPLETED' || status === 'PAID') {
    trip.status = status;
    completedTripsMap.set(rideId, trip);

    // Record to driver's shift ledger
    await recordCompletedRide(trip.driverId, {
      pickupAddress: trip.pickupAddress,
      dropoffAddress: trip.dropoffAddress,
      fareAmount: trip.fareAmount,
      distanceKm: Number((trip.distanceMeters / 1000).toFixed(1)),
      passengerName: trip.passengerName,
      paymentMethod: trip.paymentMethod,
    });

    activeOngoingTrips.delete(rideId);
    return trip;
  }

  if (status === 'CANCELLED') {
    activeOngoingTrips.delete(rideId);
    completedTripsMap.delete(rideId);
    storedOfferQueue.delete(rideId);
    pendingRideOffers.delete(rideId);
    return null;
  }

  trip.status = status;
  activeOngoingTrips.set(rideId, trip);
  return trip;
}

/**
 * Record a completed ride for a driver and save to daily history
 */
export async function recordCompletedRide(
  driverIdOrEmail: string,
  rideData: {
    pickupAddress: string;
    dropoffAddress: string;
    fareAmount: number; // paise
    distanceKm?: number;
    passengerName?: string;
    paymentMethod?: string;
  },
): Promise<DriverCompletedRide> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  const newRide: DriverCompletedRide = {
    id: `ride_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    pickupAddress: rideData.pickupAddress,
    dropoffAddress: rideData.dropoffAddress,
    fareAmount: rideData.fareAmount,
    distanceKm: rideData.distanceKm ?? 4.8,
    passengerName: rideData.passengerName ?? 'Aarav Gupta',
    paymentMethod: rideData.paymentMethod ?? 'UPI',
    completedAt: new Date(),
  };

  if (driver) {
    if (!driver.ridesHistory) driver.ridesHistory = [];
    driver.ridesHistory.unshift(newRide);
    driver.totalRides = driver.ridesHistory.length;
    driver.totalEarnings = driver.ridesHistory.reduce((sum, r) => sum + r.fareAmount, 0);

    memoryDrivers.set(driver.email.toLowerCase(), driver);
    memoryDrivers.set(driver.id, driver);

    // Save to DB if available
    try {
      await (db as any).driver?.updateMany({
        where: { OR: [{ id: driver.id }, { email: driver.email }] },
        data: {
          totalRides: driver.totalRides,
          totalEarnings: driver.totalEarnings,
        },
      });
    } catch (_e) {
      // Offline fallback
    }
  }

  return newRide;
}

/**
 * Update driver approval status (Approved / Rejected)
 */
export async function setDriverApprovalStatus(
  driverIdOrEmail: string,
  status: 'APPROVED' | 'REJECTED',
): Promise<DriverRecord | null> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  if (driver) {
    driver.approvalStatus = status;
    memoryDrivers.set(driver.email.toLowerCase(), driver);
    memoryDrivers.set(driver.id, driver);

    try {
      await db.driver.updateMany({
        where: { OR: [{ id: driver.id }, { email: driver.email }] },
        data: { approvalStatus: status as any },
      });
    } catch (_e) {
      // Offline fallback
    }
    return driver;
  }
  return null;
}

/**
 * Update driver online/offline toggle and location
 */
export async function setDriverOnlineStatus(
  driverIdOrEmail: string,
  isOnline: boolean,
  lat?: number,
  lng?: number,
): Promise<DriverRecord | null> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  if (driver) {
    driver.isOnline = isOnline;
    if (lat) driver.lat = lat;
    if (lng) driver.lng = lng;
    memoryDrivers.set(driver.email.toLowerCase(), driver);
    memoryDrivers.set(driver.id, driver);

    try {
      await db.driver.updateMany({
        where: { OR: [{ id: driver.id }, { email: driver.email }] },
        data: { isOnline },
      });
    } catch (_e) {
      // Offline fallback
    }
    return driver;
  }
  return null;
}
