import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getSystemSettings } from '@/server/services/system-settings';
import { ok, error } from '@/types/api';

/**
 * GET /api/admin/reliability — get system-wide driver reliability & customer compensation stats
 */
export async function GET(): Promise<NextResponse> {
  try {
    const config = await getSystemSettings();

    const [
      totalDrivers,
      reliableDriversCount,
      totalCancellations,
      penalizedCancellationsCount,
      recentCancellations,
      compensations,
      topDrivers,
      flaggedDrivers,
    ] = await Promise.all([
      db.driver.count(),
      db.driver.count({ where: { isReliableDriver: true } }),
      db.driverCancellationHistory.count(),
      db.driverCancellationHistory.count({ where: { isPenalized: true } }),
      db.driverCancellationHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { driver: { select: { firstName: true, lastName: true, phone: true } } },
      }),
      db.customerCompensation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { passenger: { select: { name: true, email: true } } },
      }),
      db.driver.findMany({
        orderBy: [{ reliabilityScore: 'desc' }, { totalRides: 'desc' }],
        take: 5,
        include: { vehicle: true },
      }),
      db.driver.findMany({
        where: {
          OR: [{ reliabilityScore: { lte: 70 } }, { penalizedCancellations: { gte: 1 } }],
        },
        orderBy: { reliabilityScore: 'asc' },
        take: 5,
        include: { vehicle: true },
      }),
    ]);

    const totalCompensationPaise = compensations.reduce((acc, c) => acc + c.amount, 0);

    return NextResponse.json(
      ok({
        config,
        stats: {
          totalDrivers,
          reliableDriversCount,
          totalCancellations,
          penalizedCancellationsCount,
          totalCompensationPaise,
        },
        recentCancellations,
        compensations,
        topDrivers,
        flaggedDrivers,
      }),
    );
  } catch (err) {
    return NextResponse.json(
      error('INTERNAL_ERROR', err instanceof Error ? err.message : 'Failed to fetch reliability metrics'),
      { status: 500 },
    );
  }
}
