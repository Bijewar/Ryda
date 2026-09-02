import { getCurrentUser } from '@/lib/auth/session';
import { findDriverByEmailOrId, recordCompletedRide } from '@/lib/db/driverStore';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';

const BHOPAL_SAMPLE_ROUTES = [
  {
    pickup: 'MP Nagar Zone 1, Bhopal',
    dropoff: 'Raja Bhoj Airport (BHO), Bhopal',
    distanceKm: 14.2,
    fareAmount: 28000,
  },
  {
    pickup: '10 No. Market, Arera Colony, Bhopal',
    dropoff: 'Rani Kamlapati Station, Bhopal',
    distanceKm: 4.8,
    fareAmount: 12000,
  },
  {
    pickup: 'New Market, TT Nagar, Bhopal',
    dropoff: 'DB City Mall, MP Nagar, Bhopal',
    distanceKm: 3.6,
    fareAmount: 9500,
  },
  {
    pickup: 'Bittan Market, E-5, Bhopal',
    dropoff: 'MANIT Square, Link Road 3, Bhopal',
    distanceKm: 5.1,
    fareAmount: 14000,
  },
  {
    pickup: 'Bhopal Junction Railway Station',
    dropoff: 'Upper Lake (VIP Road), Bhopal',
    distanceKm: 6.7,
    fareAmount: 16500,
  },
];

/**
 * POST /api/drivers/complete-ride
 *
 * Simulates or records a completed ride for the logged-in driver,
 * saving the transaction to today's history in the DB/driverStore.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(error('UNAUTHORIZED', 'Sign in required'), { status: 401 });
  }

  const driverKey = user.driverId || user.email;
  const driver = await findDriverByEmailOrId(driverKey);
  if (!driver) {
    return NextResponse.json(error('NOT_FOUND', 'Driver account not found'), { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const defaultRoute = {
    pickup: 'MP Nagar Zone 1, Bhopal',
    dropoff: 'Raja Bhoj Airport (BHO), Bhopal',
    distanceKm: 14.2,
    fareAmount: 28000,
  };
  const randomRoute =
    BHOPAL_SAMPLE_ROUTES[Math.floor(Math.random() * BHOPAL_SAMPLE_ROUTES.length)] || defaultRoute;

  const pickupAddress = body.pickupAddress || randomRoute.pickup;
  const dropoffAddress = body.dropoffAddress || randomRoute.dropoff;
  const fareAmount = Number(body.fareAmount || randomRoute.fareAmount);
  const distanceKm = Number(body.distanceKm || randomRoute.distanceKm);
  const passengerName = body.passengerName || 'Aarav Gupta';
  const paymentMethod = body.paymentMethod || 'UPI';

  const completed = await recordCompletedRide(driver.id, {
    pickupAddress,
    dropoffAddress,
    fareAmount,
    distanceKm,
    passengerName,
    paymentMethod,
  });

  return NextResponse.json(
    ok({
      completedRide: completed,
      totalEarnings: driver.totalEarnings,
      totalRides: driver.totalRides,
    }),
    { status: 201 },
  );
}
