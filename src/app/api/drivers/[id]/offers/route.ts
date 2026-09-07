import { db } from '@/lib/db/client';
import {
  dismissDriverOffer,
  findDriverByEmailOrId,
  getDriverOfferOrTrip,
} from '@/lib/db/driverStore';
import { ok } from '@/types/api';
import { NextResponse } from 'next/server';

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
 * Real-time endpoint returning active ride request or current ongoing trip.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;

  try {
    const driver = await findDriverByEmailOrId(id);

    if (!driver || !driver.isOnline || driver.approvalStatus !== 'APPROVED') {
      return NextResponse.json(ok({ offer: null, activeTrip: null }));
    }

    // 1. Check in-memory dispatch queue & ongoing trips
    const liveState = await getDriverOfferOrTrip(id);
    if (liveState.activeTrip || liveState.offer) {
      return NextResponse.json(ok(liveState));
    }

    // 2. Check DB for assigned ongoing ride
    try {
      const activeRide = await db.ride.findFirst({
        where: {
          driverId: driver.id,
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
    } catch (_dbErr) {
      // Offline fallback
    }

    // 3. Check DB for unread RIDE_REQUEST notifications targeted to this driver
    try {
      const notif = await db.notification.findFirst({
        where: {
          driverId: driver.id,
          type: 'RIDE_REQUEST',
          readAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (notif?.data && typeof notif.data === 'object' && (notif.data as any).rideId) {
        const offerData = notif.data as any;
        const ride = await db.ride.findUnique({
          where: { id: offerData.rideId },
          select: { status: true, driverId: true },
        });

        if (ride && ['REQUESTED', 'MATCHING', 'OFFERED'].includes(ride.status) && !ride.driverId) {
          return NextResponse.json(ok({ offer: offerData, activeTrip: null }));
        } else {
          // If ride is no longer available, mark notification read so driver stops seeing it
          await db.notification
            .update({
              where: { id: notif.id },
              data: { readAt: new Date() },
            })
            .catch(() => null);
        }
      }
    } catch (_dbErr) {
      // Offline fallback
    }

    // 4. Check DB for any fresh active unassigned ride in Bhopal
    // (Broadcast to all online approved drivers so serverless instances never drop rides)
    try {
      const cutoffTime = new Date(Date.now() - 45_000); // within last 45 seconds
      const pendingRide = await db.ride.findFirst({
        where: {
          status: { in: ['REQUESTED', 'MATCHING', 'OFFERED'] },
          driverId: null,
          requestedAt: { gte: cutoffTime },
        },
        orderBy: { requestedAt: 'desc' },
        include: { passenger: { select: { name: true } } },
      });

      if (pendingRide) {
        const broadcastOffer = {
          rideId: pendingRide.id,
          passengerName: pendingRide.passenger?.name || 'Passenger',
          pickupAddress: pendingRide.pickupAddress,
          dropoffAddress: pendingRide.dropoffAddress,
          distanceMeters: pendingRide.distanceMeters || 4800,
          durationSeconds: pendingRide.durationSeconds || 720,
          fareAmount: pendingRide.fareAmount || 14500,
          surgeMultiplier: pendingRide.surgeMultiplier || 1.0,
          expiresAt: new Date(new Date(pendingRide.requestedAt).getTime() + 45_000).toISOString(),
        };
        return NextResponse.json(ok({ offer: broadcastOffer, activeTrip: null }));
      }
    } catch (_dbErr) {
      // Offline fallback
    }

    return NextResponse.json(ok({ offer: null, activeTrip: null }));
  } catch (err) {
    return NextResponse.json(ok({ offer: null, activeTrip: null }));
  }
}

/**
 * POST /api/drivers/[id]/offers
 *
 * Dismiss or reject an incoming offer so it never repeats.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { rideId, action } = body;

  if (rideId && (action === 'dismiss' || action === 'reject')) {
    await dismissDriverOffer(id, rideId);
    try {
      const driver = await findDriverByEmailOrId(id);
      if (driver) {
        await db.notification.updateMany({
          where: {
            driverId: driver.id,
            type: 'RIDE_REQUEST',
            readAt: null,
          },
          data: { readAt: new Date() },
        });
      }
    } catch {
      // Ignore
    }
  }

  return NextResponse.json(ok({ success: true }));
}
