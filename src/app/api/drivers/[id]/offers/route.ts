import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { ok, error, statusForCode } from '@/types/api';
import type { RideOfferPayload } from '@/lib/realtime/events';

export interface ActiveTripPayload {
  rideId: string;
  passengerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMeters: number;
  durationSeconds: number;
  fareAmount: number;
  surgeMultiplier: number;
  status: 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS';
  paymentMethod: string;
}

/**
 * GET /api/drivers/[id]/offers
 *
 * Real-time endpoint returning any active ride request assigned or available
 * for this driver, or the driver's current active ongoing trip.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;

  try {
    const driver = await db.driver.findUnique({
      where: { id },
      select: { id: true, isOnline: true, approvalStatus: true },
    });

    if (!driver || !driver.isOnline || driver.approvalStatus !== 'APPROVED') {
      return NextResponse.json(ok({ offer: null, activeTrip: null }));
    }

    // 1. Check if the driver is currently assigned to an ongoing trip
    const activeRide = await db.ride.findFirst({
      where: {
        driverId: id,
        status: { in: ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'] },
      },
      orderBy: { requestedAt: 'desc' },
      include: { passenger: { select: { name: true } } },
    });

    if (activeRide) {
      const activeTrip: ActiveTripPayload = {
        rideId: activeRide.id,
        passengerName: activeRide.passenger?.name ?? 'Passenger',
        pickupAddress: activeRide.pickupAddress,
        dropoffAddress: activeRide.dropoffAddress,
        distanceMeters: activeRide.distanceMeters,
        durationSeconds: activeRide.durationSeconds,
        fareAmount: activeRide.fareAmount,
        surgeMultiplier: activeRide.surgeMultiplier,
        status: activeRide.status as 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS',
        paymentMethod: activeRide.paymentMethod,
      };
      return NextResponse.json(ok({ offer: null, activeTrip }));
    }

    // 2. Check if an unread in-app notification exists for this driver
    const notif = await db.notification.findFirst({
      where: {
        driverId: id,
        type: 'RIDE_REQUEST',
        readAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (notif?.data) {
      const data = notif.data as Record<string, unknown>;
      const rideId = data.rideId as string;

      const ride = await db.ride.findUnique({
        where: { id: rideId },
        include: { passenger: { select: { name: true } } },
      });

      if (ride && (ride.status === 'OFFERED' || ride.status === 'REQUESTED' || ride.status === 'MATCHING') && !ride.driverId) {
        const payload: RideOfferPayload = {
          rideId: ride.id,
          passengerName: ride.passenger?.name ?? 'Passenger',
          pickupAddress: ride.pickupAddress,
          dropoffAddress: ride.dropoffAddress,
          distanceMeters: ride.distanceMeters,
          durationSeconds: ride.durationSeconds,
          fareAmount: ride.fareAmount,
          surgeMultiplier: ride.surgeMultiplier,
          expiresAt: (data.expiresAt as string) ?? new Date(Date.now() + 15_000).toISOString(),
        };
        return NextResponse.json(ok({ offer: payload, activeTrip: null }));
      }
    }

    // 3. Check for any recent unassigned ride in matching queue
    const pendingRide = await db.ride.findFirst({
      where: {
        status: { in: ['OFFERED', 'REQUESTED', 'MATCHING'] },
        driverId: null,
        requestedAt: { gte: new Date(Date.now() - 60_000) },
      },
      orderBy: { requestedAt: 'desc' },
      include: { passenger: { select: { name: true } } },
    });

    if (pendingRide) {
      const payload: RideOfferPayload = {
        rideId: pendingRide.id,
        passengerName: pendingRide.passenger?.name ?? 'Passenger',
        pickupAddress: pendingRide.pickupAddress,
        dropoffAddress: pendingRide.dropoffAddress,
        distanceMeters: pendingRide.distanceMeters,
        durationSeconds: pendingRide.durationSeconds,
        fareAmount: pendingRide.fareAmount,
        surgeMultiplier: pendingRide.surgeMultiplier,
        expiresAt: new Date(Date.now() + 15_000).toISOString(),
      };
      return NextResponse.json(ok({ offer: payload, activeTrip: null }));
    }

    return NextResponse.json(ok({ offer: null, activeTrip: null }));
  } catch (err) {
    const res = error('INTERNAL_ERROR', 'Failed to fetch driver offers');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
