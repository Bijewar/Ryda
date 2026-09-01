import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');

  // Delete in order of foreign key relationships
  try {
    await prisma.notification.deleteMany({});
    console.log('  ✓ Notifications cleared');
  } catch (e) {
    console.warn('  - Notifications:', (e as Error).message);
  }

  try {
    await prisma.auditLog.deleteMany({});
    console.log('  ✓ Audit logs cleared');
  } catch (e) {
    console.warn('  - Audit logs:', (e as Error).message);
  }

  try {
    await prisma.payment.deleteMany({});
    console.log('  ✓ Payments cleared');
  } catch (e) {
    console.warn('  - Payments:', (e as Error).message);
  }

  try {
    await prisma.ride.deleteMany({});
    console.log('  ✓ Rides cleared');
  } catch (e) {
    console.warn('  - Rides:', (e as Error).message);
  }

  try {
    await prisma.vehicle.deleteMany({});
    console.log('  ✓ Vehicles cleared');
  } catch (e) {
    console.warn('  - Vehicles:', (e as Error).message);
  }

  try {
    await prisma.driver.deleteMany({});
    console.log('  ✓ Drivers cleared');
  } catch (e) {
    console.warn('  - Drivers:', (e as Error).message);
  }

  try {
    await prisma.user.deleteMany({});
    console.log('  ✓ Users cleared');
  } catch (e) {
    console.warn('  - Users:', (e as Error).message);
  }

  console.log('🎉 Database successfully cleared!');
}

main()
  .catch((e) => {
    console.error('Fatal error clearing DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
