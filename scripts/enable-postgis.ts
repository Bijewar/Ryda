import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Enabling PostGIS extension on Supabase…');
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
  console.log('✓ PostGIS extension successfully enabled on Supabase!');
}

main()
  .catch((err) => {
    console.error('Error enabling PostGIS:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
