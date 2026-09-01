import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { driverRegisterSchema } from '@/lib/validation/driver';
import { hashPassword } from '@/lib/auth/password';
import { ok, error, statusForCode } from '@/types/api';
import { logger } from '@/lib/observability/logger';

/**
 * POST /api/auth/driver-register
 *
 * Driver registration endpoint.
 * Validates driver details, license documentation, and vehicle specs.
 * Hashes password using argon2id and creates Driver + Vehicle records
 * in Postgres with approvalStatus = 'PENDING'.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const parsed = driverRegisterSchema.safeParse(body);
  if (!parsed.success) {
    const res = error('VALIDATION_ERROR', 'Invalid driver registration data', {
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }

  const { firstName, lastName, email, phone, password, licenseNumber, licenseFrontUrl, licenseBackUrl, vehicle } = parsed.data;

  try {
    // Check if email, phone, or license is already registered
    const existing = await db.driver.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone },
          { licenseNumber },
        ],
      },
    });

    if (existing) {
      const res = error('CONFLICT', 'A driver with this email, phone, or license number already exists.');
      return NextResponse.json(res, { status: 409 });
    }

    // Check if license plate is already registered
    const existingVehicle = await db.vehicle.findUnique({
      where: { licensePlate: vehicle.licensePlate.toUpperCase().trim() },
    });

    if (existingVehicle) {
      const res = error('CONFLICT', 'A vehicle with this license plate is already registered.');
      return NextResponse.json(res, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const driver = await db.driver.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
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
            licensePlate: vehicle.licensePlate.toUpperCase().trim(),
            type: vehicle.type,
          },
        },
      },
      include: {
        vehicle: true,
      },
    });

    logger.info({ driverId: driver.id, email: driver.email }, 'New driver registered (PENDING approval)');

    return NextResponse.json(
      ok({
        driver: {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          approvalStatus: driver.approvalStatus,
          vehicle: driver.vehicle,
        },
      }),
      { status: 201 },
    );
  } catch (dbErr) {
    logger.error({ dbErr, email }, 'Driver registration failed in database');
    const res = error('INTERNAL_ERROR', 'Failed to register driver. Please try again later.');
    return NextResponse.json(res, { status: statusForCode(res.error.code) });
  }
}
