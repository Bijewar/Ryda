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
  }

  return NextResponse.json(ok({ success: true }));
}
