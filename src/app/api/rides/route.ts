import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePassenger } from '@/lib/auth/session';
import { createRide, OutsideServiceAreaError } from '@/server/services/ride-service';
import { offerRideToDrivers } from '@/server/matching/offer';
import { rideCreateSchema } from '@/lib/validation/ride';
import { ok, error, statusForCode } from '@/types/api';
import { logger } from '@/lib/observability/logger';
import { db } from '@/lib/db/client';

/**
 * POST /api/rides — create a new ride request.
 *
 * Flow:
 *   1. Validate auth (passenger or admin).
 *   2. Validate body (Zod).
 *   3. Create the ride row (geofence check + fare estimate).
 *   4. Kick off the driver-matching pipeline (async — don't block the response).
 *   5. Return the new ride id + fare.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let user;
  try {
    user = await requirePassenger();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const body = await req.json().catch(() => null);
  const parsed = rideCreateSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid ride request', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const input = parsed.data;

  try {
    const passenger = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });
    const result = await createRide({
      passengerId: user.id,
      pickup: input.pickup,
      dropoff: input.dropoff,
      paymentMethod: input.paymentMethod,
    });

    // Fire-and-forget driver matching — don't block the response.
    void offerRideToDrivers(
      result.id,
      input.pickup.point,
      passenger?.name ?? 'Passenger',
      input.pickup.address,
      input.dropoff.address,
      0, // distanceMeters — fetched from the ride row inside the offer flow if needed
      0,
      result.fareAmount,
    ).catch((err) => {
      logger.error({ err, rideId: result.id }, 'Driver matching failed');
    });

    return NextResponse.json(ok(result));
  } catch (err) {
    if (err instanceof OutsideServiceAreaError) {
      const res = error('OUTSIDE_SERVICE_AREA', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
    logger.error({ err, userId: user.id }, 'Create ride failed');
    const res = error('INTERNAL_ERROR', 'Failed to create ride');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}

/**
 * GET /api/rides — list the current user's rides.
 *
 * Query params: ?status=COMPLETED&cursor=xxx&limit=20
 */
export async function GET(req: Request): Promise<NextResponse> {
  let user;
  try {
    user = await requirePassenger();
  } catch (err) {
    const code = (err as { code: string }).code as 'UNAUTHORIZED' | 'FORBIDDEN';
    const res = error(code, (err as Error).message);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status') ?? undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100);
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const rides = await db.ride.findMany({
    where: {
      passengerId: user.id,
      ...(statusParam ? { status: statusParam as never } : {}),
    },
    orderBy: { requestedAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { driver: { include: { vehicle: true } } },
  });

  const hasMore = rides.length > limit;
  const items = rides.slice(0, limit).map((r) => ({
    id: r.id,
    status: r.status,
    pickupAddress: r.pickupAddress,
    dropoffAddress: r.dropoffAddress,
    fareAmount: r.fareAmount,
    surgeMultiplier: r.surgeMultiplier,
    currency: r.currency,
    distanceMeters: r.distanceMeters,
    durationSeconds: r.durationSeconds,
    requestedAt: r.requestedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    driver: r.driver
      ? {
          id: r.driver.id,
          firstName: r.driver.firstName,
          lastName: r.driver.lastName,
          rating: r.driver.rating,
          vehicleModel: r.driver.vehicle?.model ?? null,
          licensePlate: r.driver.vehicle?.licensePlate ?? null,
          vehicleType: (r.driver.vehicle?.type ?? 'SEDAN') as
            | 'SEDAN'
            | 'SUV'
            | 'HATCHBACK'
            | 'BIKE'
            | 'AUTO',
        }
      : undefined,
  }));

  return NextResponse.json(
    ok(items, {
      count: items.length,
      cursor: hasMore ? (items[items.length - 1]?.id ?? undefined) : undefined,
    }),
  );
}
