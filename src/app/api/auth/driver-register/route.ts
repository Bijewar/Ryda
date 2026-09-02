import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { driverRegisterSchema } from '@/lib/validation/driver';
import { hashPassword } from '@/lib/auth/password';
import { saveDriverRecord, type DriverRecord } from '@/lib/db/driverStore';
import { ok, error } from '@/types/api';
import { logger } from '@/lib/observability/logger';

/**
 * POST /api/auth/driver-register
 *
 * Driver registration endpoint.
 * Hashes password, saves driver record with PENDING approval status.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = driverRegisterSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Please check your inputs and try again.', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: 400 });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    password,
    licenseNumber,
    licenseFrontUrl,
    licenseBackUrl,
    vehicle,
  } = parsed.data;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPlate = vehicle.licensePlate.toUpperCase().trim();

  try {
    const passwordHash = await hashPassword(password);
    const driverId = `driver_${Date.now()}`;

    const driverRecord: DriverRecord = {
      id: driverId,
      email: normalizedEmail,
      phone,
      firstName,
      lastName,
      passwordHash,
      licenseNumber,
      approvalStatus: 'PENDING',
      isOnline: false,
      rating: 5.0,
      totalRides: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      ridesHistory: [],
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        licensePlate: normalizedPlate,
        type: vehicle.type,
      },
    };

    // Save to shared driver store
    await saveDriverRecord(driverRecord);

    // Try saving to DB if Postgres is connected
    try {
      await db.driver.create({
        data: {
          id: driverId,
          firstName,
          lastName,
          email: normalizedEmail,
          phone,
          passwordHash,
          licenseNumber,
          licenseFrontUrl,
          licenseBackUrl,
          approvalStatus: 'PENDING',
          isOnline: false,
          vehicle: {
            create: {
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              color: vehicle.color,
              licensePlate: normalizedPlate,
              type: vehicle.type,
            },
          },
        },
      });
    } catch (dbErr) {
      logger.warn({ dbErr }, 'DB insert notice — driver saved to memory registry');
    }

    logger.info({ driverId, email: normalizedEmail }, 'New driver registered (PENDING approval)');

    return NextResponse.json(
      ok({
        driver: {
          id: driverId,
          firstName,
          lastName,
          email: normalizedEmail,
          approvalStatus: 'PENDING',
          vehicle: driverRecord.vehicle,
        },
      }),
      { status: 201 },
    );
  } catch (err) {
    logger.error({ err, email: normalizedEmail }, 'Driver registration failed');
    return NextResponse.json(
      error('INTERNAL_ERROR', 'Unable to complete driver registration. Please try again.'),
      { status: 500 },
    );
  }
}
