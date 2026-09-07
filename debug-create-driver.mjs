import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDriverCreate() {
  console.log('=== Testing driver DB create ===');
  
  const testId = `driver_test_${Date.now()}`;
  
  try {
    const driver = await prisma.driver.create({
      data: {
        id: testId,
        firstName: 'Debug',
        lastName: 'TestDriver',
        email: `debug_${Date.now()}@test.com`,
        phone: `+91${Math.floor(9000000000 + Math.random() * 999999999)}`,
        passwordHash: 'fakehash',
        licenseNumber: `DL${Date.now()}`,
        licenseFrontUrl: 'https://example.com/front.jpg',
        licenseBackUrl: 'https://example.com/back.jpg',
        approvalStatus: 'PENDING',
        isOnline: false,
        vehicle: {
          create: {
            make: 'Maruti',
            model: 'Swift',
            year: 2024,
            color: 'White',
            licensePlate: `MP04TEST${Date.now() % 10000}`,
            type: 'HATCHBACK',
          },
        },
      },
      include: { vehicle: true },
    });
    console.log('✅ Driver created successfully!');
    console.log(JSON.stringify(driver, null, 2));
    
    // Now verify it shows up in findMany
    const allDrivers = await prisma.driver.findMany({
      where: { approvalStatus: 'PENDING' },
      select: { id: true, firstName: true, lastName: true, email: true, approvalStatus: true },
    });
    console.log('\n=== All PENDING drivers ===');
    console.log(JSON.stringify(allDrivers, null, 2));
    
    // Clean up test driver
    await prisma.vehicle.deleteMany({ where: { driverId: testId } });
    await prisma.driver.delete({ where: { id: testId } });
    console.log('\n✅ Test driver cleaned up');
    
  } catch (e) {
    console.error('❌ Driver create FAILED:', e.message);
    console.error('Full error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

testDriverCreate();
