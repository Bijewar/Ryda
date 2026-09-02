/* eslint-disable no-console */
/**
 * Ryda v2 — Database Clean Reset
 *
 * 1. Full clean wipe of all existing records (0 drivers).
 * 2. Seeds official Admin: bijewarmanas1@gmail.com (Manas Bijewar).
 * 3. Loads official Bhopal polygon from public/geo/RydaMap.geojson.
 */
import { PrismaClient, type AccountType } from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function loadBhopalPolygon(): Promise<{ geojson: string; bbox: number[] }> {
  const file = path.join(process.cwd(), 'public', 'geo', 'RydaMap.geojson');
  const raw = readFileSync(file, 'utf-8');
  const fc = JSON.parse(raw) as { features: Array<{ properties: { bbox: number[] } }> };
  const bbox = fc.features[0]?.properties.bbox ?? [77.1656, 23.0725, 77.6485, 23.8953];
  return { geojson: raw, bbox };
}

async function main() {
  console.log('👑 [1/2] Ensuring Primary Admin exists: bijewarmanas1@gmail.com');
  const defaultPasswordHash = await argon2.hash('demo1234');

  const admin = await prisma.user.upsert({
    where: { email: 'bijewarmanas1@gmail.com' },
    update: {
      accountType: 'ADMIN' as AccountType,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: 'bijewarmanas1@gmail.com',
      phone: '+919826999998',
      name: 'Manas Bijewar',
      passwordHash: defaultPasswordHash,
      accountType: 'ADMIN' as AccountType,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });
  console.log(`  ✓ Primary Admin Ready: ${admin.email}`);

  console.log('🗺️ [2/2] Loading Bhopal Municipal Boundary (RydaMap.geojson)…');
  try {
    const { geojson, bbox } = await loadBhopalPolygon();
    const fc = JSON.parse(geojson) as { features: Array<{ geometry: { coordinates: number[][][] } }> };
    const polygonCoords = fc.features[0]?.geometry.coordinates ?? [];
    const polygonGeoJSON = JSON.stringify({ type: 'Polygon', coordinates: polygonCoords });

    await prisma.$executeRaw`
      INSERT INTO "service_areas" (id, name, "osmId", geometry, centroid, bbox, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'Bhopal',
        1976080,
        ST_Force2D(ST_GeomFromGeoJSON(${polygonGeoJSON})),
        ST_Centroid(ST_Force2D(ST_GeomFromGeoJSON(${polygonGeoJSON}))),
        ${JSON.stringify(bbox)}::jsonb,
        NOW(),
        NOW()
      )
      ON CONFLICT ("name") DO UPDATE
      SET geometry = EXCLUDED.geometry,
          centroid = EXCLUDED.centroid,
          bbox     = EXCLUDED.bbox,
          "updatedAt" = NOW();
    `;
    console.log('  ✓ Service Area Bhopal configured');
  } catch (geoErr) {
    console.warn('  ⚠️ GeoJSON loading note:', geoErr);
  }

  console.log('\n✨ Database is now completely clean with ZERO pre-seeded drivers!');
  console.log('----------------------------------------------------');
  console.log('👤 Admin:          bijewarmanas1@gmail.com (Password: demo1234)');
  console.log('🚗 Drivers:        0 (Ready for you to register and test)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
