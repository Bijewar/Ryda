import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Connecting to Supabase DB ===');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@'));
  
  try {
    // 1. Check drivers
    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    console.log('\n=== DRIVERS IN DATABASE ===');
    console.log(JSON.stringify(drivers, null, 2));
    console.log('Total drivers:', drivers.length);
    console.log('PENDING:', drivers.filter(d => d.approvalStatus === 'PENDING').length);
    console.log('APPROVED:', drivers.filter(d => d.approvalStatus === 'APPROVED').length);

    // 2. Check users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, accountType: true },
    });
    console.log('\n=== USERS IN DATABASE ===');
    console.log(JSON.stringify(users, null, 2));
    console.log('Total users:', users.length);

  } catch (e) {
    console.error('\n=== DB CONNECTION ERROR ===');
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
