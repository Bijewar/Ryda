import { hashPassword } from '@/lib/auth/password';
import { db } from '@/lib/db/client';
import { type DriverRecord, saveDriverRecord } from '@/lib/db/driverStore';
import { logger } from '@/lib/observability/logger';
import { driverRegisterSchema } from '@/lib/validation/driver';
import { error, ok } from '@/types/api';
import { NextResponse } from 'next/server';

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

    // Persist to Postgres database
    try {
      const existing = await db.driver.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            { phone },
            { licenseNumber },
            { vehicle: { licensePlate: normalizedPlate } },
          ],
        },
        include: { vehicle: true },
      });

      if (existing) {
        await db.driver.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            passwordHash,
            licenseNumber,
            licenseFrontUrl,
            licenseBackUrl,
            approvalStatus: 'PENDING',
            vehicle: existing.vehicle
              ? {
                  update: {
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year,
                    color: vehicle.color,
                    licensePlate: normalizedPlate,
                    type: vehicle.type,
                  },
                }
              : {
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
      } else {
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
      }
    } catch (dbErr: any) {
      logger.error({ dbErr, email: normalizedEmail }, 'DB driver registration write failed');
      return NextResponse.json(
        error(
          'INTERNAL_ERROR',
          `Could not save driver to database: ${dbErr?.message || 'Database error'}`,
        ),
        { status: 500 },
      );
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
