/* eslint-disable no-console */
/**
 * Ryda v2 — Database seed
 *
 * Seeds:
 *  - 1 admin user
 *  - 5 passengers
 *  - 10 drivers (all APPROVED) + their vehicles
 *  - 50 completed rides between realistic Bhopal pickup/dropoff points
 *  - The Bhopal service area polygon (loaded from public/geo/)
 *
 * Run: `bun run db:seed`
 */
import { PrismaClient, type AccountType, type DriverApproval, type PaymentMethod, type PaymentProvider, type PaymentStatus, type RideStatus, type VehicleType } from '@prisma/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

// ── Real Bhopal pickup/dropoff points (lon, lat) ──────────────────────────
const BHOPAL_POIS: Array<{ name: string; lng: number; lat: number }> = [
  { name: 'MP Nagar', lng: 77.4321, lat: 23.2419 },
  { name: 'New Market', lng: 77.4036, lat: 23.2347 },
  { name: 'Habibganj Railway Station', lng: 77.4334, lat: 23.2701 },
  { name: 'Old City (Jahaz Mahal)', lng: 77.4040, lat: 23.1667 },
  { name: 'BHEL Bhopal', lng: 77.2451, lat: 23.2766 },
  { name: 'Kolar Road', lng: 77.4858, lat: 23.2156 },
  { name: 'Arera Colony', lng: 77.4483, lat: 23.2428 },
  { name: 'Shahpura', lng: 77.4614, lat: 23.2626 },
  { name: 'Bairagarh', lng: 77.3106, lat: 23.3017 },
  { name: 'TT Nagar Stadium', lng: 77.4189, lat: 23.2284 },
  { name: 'Bhopal Junction', lng: 77.4111, lat: 23.2667 },
  { name: 'Bairagarh Chhawni', lng: 77.3270, lat: 23.2920 },
];

const DRIVER_NAMES: Array<{ first: string; last: string; phone: string; email: string }> = [
  { first: 'Imran', last: 'Khan', phone: '+919826000001', email: 'imran.khan@ryda.demo' },
  { first: 'Ravi', last: 'Sharma', phone: '+919826000002', email: 'ravi.sharma@ryda.demo' },
  { first: 'Sunil', last: 'Verma', phone: '+919826000003', email: 'sunil.verma@ryda.demo' },
  { first: 'Mohit', last: 'Yadav', phone: '+919826000004', email: 'mohit.yadav@ryda.demo' },
  { first: 'Anil', last: 'Meena', phone: '+919826000005', email: 'anil.meena@ryda.demo' },
  { first: 'Suresh', last: 'Patel', phone: '+919826000006', email: 'suresh.patel@ryda.demo' },
  { first: 'Deepak', last: 'Gupta', phone: '+919826000007', email: 'deepak.gupta@ryda.demo' },
  { first: 'Kamal', last: 'Singh', phone: '+919826000008', email: 'kamal.singh@ryda.demo' },
  { first: 'Ajay', last: 'Chauhan', phone: '+919826000009', email: 'ajay.chauhan@ryda.demo' },
  { first: 'Vijay', last: 'Raghuwanshi', phone: '+919826000010', email: 'vijay.r@ryda.demo' },
];

const VEHICLES: Array<{ make: string; model: string; year: number; color: string; plate: string; type: VehicleType }> = [
  { make: 'Maruti', model: 'Dzire', year: 2022, color: 'White', plate: 'MP04 GH 3456', type: 'SEDAN' },
  { make: 'Maruti', model: 'Swift', year: 2021, color: 'Silver', plate: 'MP04 GH 7890', type: 'HATCHBACK' },
  { make: 'Hyundai', model: 'Creta', year: 2023, color: 'Black', plate: 'MP04 AB 1122', type: 'SUV' },
  { make: 'Toyota', model: 'Innova', year: 2022, color: 'White', plate: 'MP04 AB 3344', type: 'SUV' },
  { make: 'Honda', model: 'Amaze', year: 2021, color: 'Grey', plate: 'MP04 GH 5566', type: 'SEDAN' },
  { make: 'Maruti', model: 'WagonR', year: 2020, color: 'Red', plate: 'MP04 GH 7788', type: 'HATCHBACK' },
  { make: 'Tata', model: 'Tigor', year: 2022, color: 'Blue', plate: 'MP04 GH 9900', type: 'SEDAN' },
  { make: 'Mahindra', model: 'XUV500', year: 2023, color: 'White', plate: 'MP04 AB 1212', type: 'SUV' },
  { make: 'Hero', model: 'Splendor', year: 2022, color: 'Black', plate: 'MP04 BC 4321', type: 'BIKE' },
  { make: 'Bajaj', model: 'RE Auto', year: 2021, color: 'Green', plate: 'MP04 AT 8765', type: 'AUTO' },
];

const PASSENGERS: Array<{ name: string; email: string; phone: string }> = [
  { name: 'Aarav Gupta', email: 'aarav@example.com', phone: '+919826111111' },
  { name: 'Diya Sharma', email: 'diya@example.com', phone: '+919826111112' },
  { name: 'Ishaan Patel', email: 'ishaan@example.com', phone: '+919826111113' },
  { name: 'Ananya Verma', email: 'ananya@example.com', phone: '+919826111114' },
  { name: 'Vivaan Mehta', email: 'vivaan@example.com', phone: '+919826111115' },
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)] as T;
}

async function loadBhopalPolygon(): Promise<{ geojson: string; bbox: number[] }> {
  const file = path.join(process.cwd(), 'public', 'geo', 'bhopal-boundary-simplified.geojson');
  const raw = readFileSync(file, 'utf-8');
  const fc = JSON.parse(raw) as { features: Array<{ properties: { bbox: number[] } }> };
  const bbox = fc.features[0]?.properties.bbox ?? [77.1656, 23.0725, 77.6485, 23.8953];
  return { geojson: raw, bbox };
}

async function main() {
  console.log('🌱 Seeding Ryda v2 database…');

  // ── Bhopal service area ────────────────────────────────────────────────
  const { geojson, bbox } = await loadBhopalPolygon();
  // Strip outer FeatureCollection to get just the first polygon geometry.
  const fc = JSON.parse(geojson) as { features: Array<{ geometry: { coordinates: number[][][] } }> };
  const polygonCoords = fc.features[0]?.geometry.coordinates ?? [];
  const polygonGeoJSON = JSON.stringify({ type: 'Polygon', coordinates: polygonCoords });

  await prisma.$executeRaw`
    INSERT INTO "service_areas" (id, name, "osmId", geometry, centroid, bbox, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'Bhopal',
      1976080,
      ST_GeomFromGeoJSON(${polygonGeoJSON}),
      ST_Centroid(ST_GeomFromGeoJSON(${polygonGeoJSON})),
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
  console.log('  ✓ Bhopal service area loaded');

  // ── Admins ────────────────────────────────────────────────────────────
  const adminManas = await prisma.user.upsert({
    where: { email: 'bijewarmanas1@gmail.com' },
    update: { accountType: 'ADMIN' as AccountType },
    create: {
      email: 'bijewarmanas1@gmail.com',
      phone: '+919826999998',
      name: 'Manas Bijewar (Admin)',
      accountType: 'ADMIN' as AccountType,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ryda.demo' },
    update: {},
    create: {
      email: 'admin@ryda.demo',
      phone: '+919826999999',
      name: 'Ryda Admin',
      accountType: 'ADMIN' as AccountType,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });
  console.log('  ✓ Admins:', adminManas.email, admin.email);

  // ── Passengers ─────────────────────────────────────────────────────────
  const passengers = [];
  for (const p of PASSENGERS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        phone: p.phone,
        name: p.name,
        accountType: 'PASSENGER' as AccountType,
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      },
    });
    passengers.push(user);
  }
  console.log(`  ✓ ${passengers.length} passengers`);

  // ── Drivers + vehicles ─────────────────────────────────────────────────
  const drivers = [];
  for (let i = 0; i < DRIVER_NAMES.length; i++) {
    const meta = DRIVER_NAMES[i]!;
    const veh = VEHICLES[i]!;
    const home = pick(BHOPAL_POIS);
    // Use raw SQL to insert driver with currentLocation (PostGIS POINT).
    const driverId = `driver_seed_${i + 1}`;
    await prisma.$executeRaw`
      INSERT INTO "drivers" (
        id, email, phone, "firstName", "lastName",
        "licenseNumber", "licenseFrontUrl", "licenseBackUrl",
        "approvalStatus", "approvedById", "approvedAt",
        "isOnline", "currentLocation", rating,
        "totalRides", "totalEarnings", "razorpayAccountId",
        "createdAt", "updatedAt"
      ) VALUES (
        ${driverId},
        ${meta.email},
        ${meta.phone},
        ${meta.first},
        ${meta.last},
        ${`DL${String(i + 1).padStart(2, '0')}2023${randInt(1000, 9999)}`},
        ${`https://demo.ryda.app/licenses/${i + 1}-front.jpg`},
        ${`https://demo.ryda.app/licenses/${i + 1}-back.jpg`},
        ${'APPROVED'}::"DriverApproval",
        ${admin.id},
        NOW(),
        ${i % 3 === 0}, -- one third online
        ST_SetSRID(ST_MakePoint(${home.lng}, ${home.lat}), 4326),
        ${4.5 + Math.random() * 0.5},
        ${randInt(20, 500)},
        ${randInt(10000, 500000)},
        ${i % 2 === 0 ? `acct_demo_${i + 1}` : null},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE
      SET "currentLocation" = EXCLUDED."currentLocation",
          "isOnline"        = EXCLUDED."isOnline",
          "updatedAt"       = NOW();
    `;
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) throw new Error(`Failed to fetch seeded driver ${driverId}`);

    const { plate, ...vehRest } = veh;
    await prisma.vehicle.upsert({
      where: { driverId: driver.id },
      create: {
        driverId: driver.id,
        licensePlate: plate,
        ...vehRest,
      },
      update: {},
    });
    drivers.push(driver);
  }
  console.log(`  ✓ ${drivers.length} drivers with vehicles`);

  // ── Rides ──────────────────────────────────────────────────────────────
  let rideCount = 0;
  for (let i = 0; i < 50; i++) {
    const passenger = pick(passengers);
    const driver = pick(drivers);
    const pickup = pick(BHOPAL_POIS);
    let dropoff = pick(BHOPAL_POIS);
    while (dropoff.name === pickup.name) dropoff = pick(BHOPAL_POIS);

    const distance = randInt(1500, 18000);
    const duration = Math.round((distance / 1000) * 2.5 * 60); // ~2.5 min/km
    const baseFare = 50_00; // ₹50 in paise
    const perKm = 12_00;
    const perMin = 1_00;
    const surge = 1.0 + Math.random() * 0.5;
    const fare = Math.round((baseFare + (distance / 1000) * perKm + (duration / 60) * perMin) * surge);

    const rideId = `ride_seed_${i + 1}`;
    const route = {
      type: 'LineString',
      coordinates: [
        [pickup.lng, pickup.lat],
        [dropoff.lng, dropoff.lat],
      ],
    };
    const requestedAt = new Date(Date.now() - randInt(1, 60) * 86400_000);
    const completedAt = new Date(requestedAt.getTime() + duration * 1000 + randInt(300, 600) * 1000);

    await prisma.$executeRaw`
      INSERT INTO "rides" (
        id, "passengerId", "driverId", status,
        "pickupAddress", "pickupPoint",
        "dropoffAddress", "dropoffPoint",
        "routeGeometry", "distanceMeters", "durationSeconds",
        "fareAmount", "surgeMultiplier", "paymentMethod",
        "requestedAt", "acceptedAt", "driverArrivedAt",
        "startedAt", "completedAt"
      ) VALUES (
        ${rideId},
        ${passenger.id},
        ${driver.id},
        ${'PAID'}::"RideStatus",
        ${pickup.name},
        ST_SetSRID(ST_MakePoint(${pickup.lng}, ${pickup.lat}), 4326),
        ${dropoff.name},
        ST_SetSRID(ST_MakePoint(${dropoff.lng}, ${dropoff.lat}), 4326),
        ${JSON.stringify(route)}::jsonb,
        ${distance},
        ${duration},
        ${fare},
        ${surge},
        ${'UPI'}::"PaymentMethod",
        ${requestedAt},
        ${new Date(requestedAt.getTime() + 30_000)},
        ${new Date(requestedAt.getTime() + 300_000)},
        ${new Date(requestedAt.getTime() + 360_000)},
        ${completedAt}
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    await prisma.payment.upsert({
      where: { rideId },
      create: {
        rideId,
        userId: passenger.id,
        provider: 'RAZORPAY' as PaymentProvider,
        providerOrderId: `order_${rideId}`,
        providerPaymentId: `pay_${rideId}`,
        amount: fare,
        status: 'CAPTURED' as PaymentStatus,
        idempotencyKey: `seed_${rideId}`,
      },
      update: {},
    });
    rideCount++;
  }
  console.log(`  ✓ ${rideCount} rides with payments`);

  console.log('\n✅ Seed complete. Login with:');
  console.log('   Admin:      admin@ryda.demo');
  console.log('   Passenger:  aarav@example.com');
  console.log('   Driver:     imran.khan@ryda.demo');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
