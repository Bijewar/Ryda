import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/session';
import { getRideSummary, transitionRideStatus, InvalidRideTransitionError, getRideOtp } from '@/server/services/ride-service';
import { acceptRide } from '@/server/matching/offer';
import { processDriverCancellation, type CancellationReasonCategory } from '@/server/services/reliability-service';
import { handleDriverCancellationCompensation } from '@/server/services/compensation-service';
import { ok, error, statusForCode } from '@/types/api';
import { logger } from '@/lib/observability/logger';
import type { RideStatus } from '@/types/ride';

const patchSchema = z.object({
  action: z.enum(['accept', 'arrived', 'start', 'complete', 'cancel']),
  driverId: z.string().optional(),
  reason: z.string().max(300).optional(),
  category: z
    .enum([
      'VEHICLE_PROBLEM',
      'EMERGENCY',
      'UNSAFE_PICKUP',
      'ROAD_BLOCKED',
      'WRONG_PICKUP_LOCATION',
      'CUSTOMER_REQUESTED',
      'TECHNICAL_ISSUE',
      'OTHER',
    ])
    .optional(),
  otp: z.string().optional(),
});

/**
 * GET /api/rides/[id] — fetch a single ride (passenger, driver, or admin).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  const summary = await getRideSummary(id);
  if (!summary) {
    const res = error('NOT_FOUND', `Ride ${id} not found`);
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  return NextResponse.json(ok(summary));
}

/**
 * PATCH /api/rides/[id] — trigger a state transition.
 *
 * Actions:
 *   - accept    → OFFERED → ACCEPTED (driver only)
 *   - arrived   → ACCEPTED → ARRIVED (driver only)
 *   - start     → ARRIVED → IN_PROGRESS (requires valid passenger 4-digit start OTP)
 *   - complete  → IN_PROGRESS → COMPLETED (driver only)
 *   - cancel    → * → CANCELED (passenger or driver with progressive penalty / customer compensation)
 */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user && process.env.DEMO_MODE !== 'true') {
    const res = error('UNAUTHORIZED', 'Sign in required');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid patch body', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
  const { action, driverId, reason, category, otp } = parsed.data;

  try {
    if (action === 'accept') {
      if (!driverId) {
        const res = error('VALIDATION_ERROR', 'driverId is required for accept');
        return NextResponse.json(res, { status: statusForCode(res.error.code) });
      }
      await acceptRide(id, driverId);
      return NextResponse.json(ok({ id, status: 'ACCEPTED' as RideStatus }));
    }
    if (action === 'start') {
      const expectedOtp = getRideOtp(id);
      if (!otp || otp.trim() !== expectedOtp) {
        const res = error('VALIDATION_ERROR', `Invalid Start OTP "${otp || ''}". Please ask the passenger for their 4-digit code shown on their screen.`);
        return NextResponse.json(res, { status: statusForCode(res.error.code) });
      }
    }
    if (action === 'cancel') {
      let penaltyInfo: any = null;
      let compInfo: any = null;

      if (driverId) {
        // Process driver reliability score & progressive penalty
        const cat = (category ?? 'OTHER') as CancellationReasonCategory;
        penaltyInfo = await processDriverCancellation({
          driverId,
          rideId: id,
          category: cat,
          details: reason,
        });

        // Trigger customer compensation and automatic re-matching
        compInfo = await handleDriverCancellationCompensation({
          rideId: id,
          driverId,
          reasonCategory: cat,
        });
      }

      await transitionRideStatus(id, 'CANCELED', {
        cancelReason: reason ?? category ?? 'Cancelled',
      });

      return NextResponse.json(
        ok({
          id,
          status: 'CANCELED' as RideStatus,
          penalized: penaltyInfo?.penalized ?? false,
          penaltyAmount: penaltyInfo?.penaltyAmount ?? 0,
          compensationIssued: compInfo?.issued ?? false,
          warning: penaltyInfo?.warning,
        }),
      );
    }
    const target: Record<'arrived' | 'start' | 'complete' | 'accept' | 'cancel', RideStatus> = {
      arrived: 'ARRIVED',
      start: 'IN_PROGRESS',
      complete: 'COMPLETED',
      accept: 'ACCEPTED',
      cancel: 'CANCELED',
    };
    await transitionRideStatus(id, target[action]);
    return NextResponse.json(ok({ id, status: target[action] }));
  } catch (err) {
    if (err instanceof InvalidRideTransitionError) {
      const res = error('INVALID_STATE_TRANSITION', err.message);
      return NextResponse.json(res, { status: statusForCode(res.error.code) });
    }
    logger.error({ err, rideId: id, action }, 'Ride transition failed');
    const res = error('INTERNAL_ERROR', 'Failed to update ride');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
