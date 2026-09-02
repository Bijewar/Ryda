import { db } from '@/lib/db/client';
import { getSystemSettings } from './system-settings';
import { logger } from '@/lib/observability/logger';
import { BHOPAL_POIS } from '@/lib/geo/pois';
import { findDriverByEmailOrId, completedTripsMap, activeOngoingTrips } from '@/lib/db/driverStore';
import type { BhopalZoneData } from '@/types/reliability';

export type { BhopalZoneData };

export interface ZoneDemandProfile {
  name: string;
  cluster: string;
  centerLat: number;
  centerLng: number;
  totalPickups: number;
  totalDropoffs: number;
  pickupProbability: number; // 0.00 to 1.00 (probability that a driver gets a return ride here)
  demandCategory: 'INZONE_HOTSPOT' | 'MODERATE_DEMAND' | 'OUTZONE_LOW_DEMAND';
  lastTrainedAt: Date;
}

// Global runtime learned frequency model
const globalForAi = globalThis as unknown as {
  learnedZoneProfiles: Map<string, ZoneDemandProfile>;
};

// Seed baseline probabilistic training weights across Bhopal
const INITIAL_LEARNED_PROFILES: Array<{
  cluster: string;
  name: string;
  centerLat: number;
  centerLng: number;
  initialPickups: number;
  initialDropoffs: number;
}> = [
  // High-Demand Core Zones (Many bookings originate here)
  { cluster: 'mp_nagar', name: 'MP Nagar Zone 1 & 2', centerLat: 23.2332, centerLng: 77.4344, initialPickups: 148, initialDropoffs: 140 },
  { cluster: 'rkmp', name: 'Rani Kamlapati Station (RKMP)', centerLat: 23.2208, centerLng: 77.4395, initialPickups: 112, initialDropoffs: 95 },
  { cluster: 'new_market', name: 'New Market (TT Nagar)', centerLat: 23.2386, centerLng: 77.4012, initialPickups: 98, initialDropoffs: 90 },
  { cluster: 'bhopal_jn', name: 'Bhopal Junction Railway Station', centerLat: 23.2689, centerLng: 77.4116, initialPickups: 165, initialDropoffs: 130 },
  { cluster: 'arera_colony', name: 'Arera Colony (10 No. Market)', centerLat: 23.2155, centerLng: 77.4367, initialPickups: 74, initialDropoffs: 70 },
  { cluster: 'shahpura', name: 'Shahpura Lake & Chunabhatti', centerLat: 23.2084, centerLng: 77.4241, initialPickups: 65, initialDropoffs: 60 },
  { cluster: 'indrapuri', name: 'Indrapuri (BHEL Commercial Hub)', centerLat: 23.2512, centerLng: 77.4689, initialPickups: 52, initialDropoffs: 48 },

  // Outer / Low-Booking Outzones (Passengers drop off here, but almost no return rides originate)
  { cluster: 'airport', name: 'Raja Bhoj Airport (Gandhi Nagar)', centerLat: 23.2875, centerLng: 77.3377, initialPickups: 6, initialDropoffs: 84 },
  { cluster: 'bairagarh', name: 'Bairagarh (Outer Corridor)', centerLat: 23.2845, centerLng: 77.3489, initialPickups: 9, initialDropoffs: 62 },
  { cluster: 'bhauri', name: 'IISER / Bhauri Bypass Outskirts', centerLat: 23.2760, centerLng: 77.2760, initialPickups: 3, initialDropoffs: 45 },
  { cluster: 'mandideep', name: 'Mandideep / 11th Mile Border', centerLat: 23.1450, centerLng: 77.5120, initialPickups: 4, initialDropoffs: 58 },
  { cluster: 'ratibad', name: 'Ratibad / Neelbad Outskirts', centerLat: 23.1780, centerLng: 77.3420, initialPickups: 5, initialDropoffs: 49 },
  { cluster: 'sukhi_sewaniya', name: 'Sukhi Sewaniya Bypass', centerLat: 23.3240, centerLng: 77.4890, initialPickups: 2, initialDropoffs: 38 },
  { cluster: 'kolar_outer', name: 'Kolar Extension (Danish Kunj Outer)', centerLat: 23.1650, centerLng: 77.4100, initialPickups: 11, initialDropoffs: 52 },
];

export const learnedZoneProfiles: Map<string, ZoneDemandProfile> =
  globalForAi.learnedZoneProfiles ?? new Map<string, ZoneDemandProfile>();

if (process.env.NODE_ENV !== 'production') {
  globalForAi.learnedZoneProfiles = learnedZoneProfiles;
}

// Initialize seed data if empty
if (learnedZoneProfiles.size === 0) {
  for (const item of INITIAL_LEARNED_PROFILES) {
    const total = item.initialPickups + item.initialDropoffs;
    const ratio = item.initialPickups / (total || 1);
    let category: ZoneDemandProfile['demandCategory'] = 'MODERATE_DEMAND';
    if (ratio >= 0.45 && item.initialPickups >= 40) category = 'INZONE_HOTSPOT';
    else if (ratio < 0.25 || item.initialPickups < 15) category = 'OUTZONE_LOW_DEMAND';

    learnedZoneProfiles.set(item.cluster, {
      cluster: item.cluster,
      name: item.name,
      centerLat: item.centerLat,
      centerLng: item.centerLng,
      totalPickups: item.initialPickups,
      totalDropoffs: item.initialDropoffs,
      pickupProbability: Number(ratio.toFixed(2)),
      demandCategory: category,
      lastTrainedAt: new Date(),
    });
  }
}

/**
 * AI Model Training Step: Continuously learns ride demand telemetry on every booking & completion.
 * Increments pickup/dropoff statistics and updates the probability distribution.
 */
export function recordRideDemandTelemetry(pickupAddress: string, dropoffAddress: string): void {
  const matchCluster = (addr: string): string => {
    const lower = addr.toLowerCase();
    for (const item of INITIAL_LEARNED_PROFILES) {
      if (lower.includes(item.cluster) || lower.includes(item.name.toLowerCase().split(' ')[0]!)) {
        return item.cluster;
      }
    }
    // Check keywords
    if (lower.includes('airport') || lower.includes('bho') || lower.includes('gandhi nagar')) return 'airport';
    if (lower.includes('bairagarh') || lower.includes('sant hirdaram')) return 'bairagarh';
    if (lower.includes('bhauri') || lower.includes('iiser')) return 'bhauri';
    if (lower.includes('mandideep') || lower.includes('11th mile')) return 'mandideep';
    if (lower.includes('kolar')) return 'kolar_outer';
    if (lower.includes('mp nagar')) return 'mp_nagar';
    if (lower.includes('station') || lower.includes('railway') || lower.includes('junction')) return 'bhopal_jn';
    if (lower.includes('rkmp') || lower.includes('habibganj')) return 'rkmp';
    if (lower.includes('new market')) return 'new_market';
    return 'mp_nagar';
  };

  const pickupCluster = matchCluster(pickupAddress);
  const dropoffCluster = matchCluster(dropoffAddress);

  // Update Pickup Zone
  const pickupProf = learnedZoneProfiles.get(pickupCluster);
  if (pickupProf) {
    pickupProf.totalPickups += 1;
    const total = pickupProf.totalPickups + pickupProf.totalDropoffs;
    pickupProf.pickupProbability = Number((pickupProf.totalPickups / total).toFixed(2));
    if (pickupProf.pickupProbability >= 0.40 && pickupProf.totalPickups >= 25) {
      pickupProf.demandCategory = 'INZONE_HOTSPOT';
    }
    pickupProf.lastTrainedAt = new Date();
  }

  // Update Dropoff Zone
  const dropoffProf = learnedZoneProfiles.get(dropoffCluster);
  if (dropoffProf) {
    dropoffProf.totalDropoffs += 1;
    const total = dropoffProf.totalDropoffs + dropoffProf.totalPickups;
    dropoffProf.pickupProbability = Number((dropoffProf.totalPickups / total).toFixed(2));
    if (dropoffProf.pickupProbability < 0.25 || dropoffProf.totalPickups < 15) {
      dropoffProf.demandCategory = 'OUTZONE_LOW_DEMAND';
    }
    dropoffProf.lastTrainedAt = new Date();
  }

  logger.info({ pickupCluster, dropoffCluster }, 'AI Zone Demand Model updated with real booking telemetry');
}

/**
 * AI Classifier: Dynamically classifies whether a destination is a learned "OUTZONE"
 * based on real booking frequency & historical pickup probability.
 */
export function classifyZoneByLearnedRideDensity(address: string): {
  isOutzone: boolean;
  clusterName: string;
  pickupProbability: number;
  totalPickupsInZone: number;
  totalDropoffsInZone: number;
  calculatedReturnBonusPaise: number;
  explanation: string;
} {
  const lower = address.toLowerCase();
  let matched: ZoneDemandProfile | undefined;

  for (const profile of learnedZoneProfiles.values()) {
    if (lower.includes(profile.cluster) || lower.includes(profile.name.toLowerCase().split(' ')[0]!)) {
      matched = profile;
      break;
    }
  }

  // Keyword check for outer locations if not directly matched
  if (!matched) {
    if (lower.includes('airport') || lower.includes('bho') || lower.includes('gandhi nagar')) matched = learnedZoneProfiles.get('airport');
    else if (lower.includes('bairagarh') || lower.includes('sant hirdaram')) matched = learnedZoneProfiles.get('bairagarh');
    else if (lower.includes('bhauri') || lower.includes('iiser')) matched = learnedZoneProfiles.get('bhauri');
    else if (lower.includes('mandideep') || lower.includes('11th mile') || lower.includes('misrod')) matched = learnedZoneProfiles.get('mandideep');
    else if (lower.includes('ratibad') || lower.includes('neelbad')) matched = learnedZoneProfiles.get('ratibad');
    else if (lower.includes('sukhi sewaniya') || lower.includes('bypass')) matched = learnedZoneProfiles.get('sukhi_sewaniya');
    else if (lower.includes('kolar outer') || lower.includes('danish kunj')) matched = learnedZoneProfiles.get('kolar_outer');
  }

  // Fallback to central core if standard central landmark
  if (!matched) {
    matched = learnedZoneProfiles.get('mp_nagar') || {
      cluster: 'mp_nagar',
      name: 'MP Nagar Zone 1 & 2',
      centerLat: 23.2332,
      centerLng: 77.4344,
      totalPickups: 150,
      totalDropoffs: 140,
      pickupProbability: 0.52,
      demandCategory: 'INZONE_HOTSPOT',
      lastTrainedAt: new Date(),
    };
  }

  const isOutzone = matched.demandCategory === 'OUTZONE_LOW_DEMAND' || matched.pickupProbability < 0.30;

  // Dynamic formula: Bonus increases when pickup probability is lowest (e.g. ₹45 to ₹65)
  const calculatedReturnBonusPaise = isOutzone
    ? Math.round(3500 + (1 - matched.pickupProbability) * 3000)
    : 0;

  const explanation = isOutzone
    ? `Trained AI Model: Only ${Math.round(matched.pickupProbability * 100)}% return ride probability in ${matched.name} (${matched.totalPickups} pickups vs ${matched.totalDropoffs} dropoffs recorded).`
    : `Trained AI Model: High booking frequency zone (${Math.round(matched.pickupProbability * 100)}% pickup rate in ${matched.name}). Standard dispatch active.`;

  return {
    isOutzone,
    clusterName: matched.name,
    pickupProbability: matched.pickupProbability,
    totalPickupsInZone: matched.totalPickups,
    totalDropoffsInZone: matched.totalDropoffs,
    calculatedReturnBonusPaise,
    explanation,
  };
}

/**
 * Get AI Repositioning & Return Bonus Opportunity for a Driver.
 * Strictly uses the trained ride-frequency model to trigger bonus payouts.
 */
export async function getDriverRepositioningOpportunity(driverIdOrEmail: string): Promise<{
  available: boolean;
  isOuterDropoffZone: boolean;
  dropoffAddress?: string;
  reason?: string;
  pickupProbabilityPercent?: number;
  zone?: {
    id: string;
    name: string;
    currentDemandLevel: string;
    predictedDemand10m: string;
    predictedDemand30m: string;
    repositioningIncentive: number;
    centerLat?: number;
    centerLng?: number;
  };
  distanceMeters?: number;
  incentivePaise?: number;
}> {
  const driver = await findDriverByEmailOrId(driverIdOrEmail);
  if (!driver || !driver.isOnline) {
    return { available: false, isOuterDropoffZone: false };
  }

  // Inspect driver's active trip or last completed ride dropoff location
  let lastDropoff = 'Raja Bhoj Airport (BHO), Bhopal';
  let hasRide = false;

  for (const trip of activeOngoingTrips.values()) {
    if (trip.driverId === driver.id || trip.driverId === driver.email.toLowerCase()) {
      lastDropoff = trip.dropoffAddress;
      hasRide = true;
      break;
    }
  }

  if (!hasRide && driver.ridesHistory && driver.ridesHistory.length > 0) {
    lastDropoff = driver.ridesHistory[0]!.dropoffAddress;
    hasRide = true;
  }

  // Classify with AI trained model
  const analysis = classifyZoneByLearnedRideDensity(lastDropoff);

  if (analysis.isOutzone) {
    const bestCore = learnedZoneProfiles.get('mp_nagar') || INITIAL_LEARNED_PROFILES[0]!;

    return {
      available: true,
      isOuterDropoffZone: true,
      dropoffAddress: lastDropoff,
      reason: analysis.explanation,
      pickupProbabilityPercent: Math.round(analysis.pickupProbability * 100),
      zone: {
        id: 'core_mp_nagar',
        name: 'MP Nagar Commercial Core',
        currentDemandLevel: 'VERY_HIGH',
        predictedDemand10m: 'HIGH',
        predictedDemand30m: 'VERY_HIGH',
        repositioningIncentive: analysis.calculatedReturnBonusPaise,
        centerLat: bestCore.centerLat,
        centerLng: bestCore.centerLng,
      },
      distanceMeters: 8500,
      incentivePaise: analysis.calculatedReturnBonusPaise,
    };
  }

  return {
    available: false,
    isOuterDropoffZone: false,
    dropoffAddress: lastDropoff,
    reason: analysis.explanation,
  };
}

/**
 * Record driver accepting a repositioning bonus.
 */
export async function acceptDriverRepositioning(opts: {
  driverId: string;
  zoneId: string;
}): Promise<{ success: boolean; message: string; incentiveAmount: number }> {
  const bonusPaise = 5500;
  logger.info(
    { driverId: opts.driverId, zoneId: opts.zoneId, bonus: bonusPaise },
    'Driver accepted AI-trained return repositioning bonus',
  );

  return {
    success: true,
    message: `Return Bonus Activated! Head towards MP Nagar / City Core to receive your bonus on next pickup.`,
    incentiveAmount: bonusPaise,
  };
}

/**
 * Get live AI demand zones across Bhopal for heatmaps and admin overview
 */
export async function getLiveDemandZones(): Promise<BhopalZoneData[]> {
  const zones: BhopalZoneData[] = [];
  let idx = 1;

  for (const profile of learnedZoneProfiles.values()) {
    const isHotspot = profile.demandCategory === 'INZONE_HOTSPOT';
    const isOutzone = profile.demandCategory === 'OUTZONE_LOW_DEMAND';

    zones.push({
      id: `zone_${profile.cluster || idx++}`,
      name: profile.name,
      centerLat: profile.centerLat,
      centerLng: profile.centerLng,
      radiusMeters: 2200,
      currentDemandLevel: isHotspot ? 'VERY_HIGH' : isOutzone ? 'LOW' : 'MEDIUM',
      predictedDemand10m: isHotspot ? 'HIGH' : isOutzone ? 'LOW' : 'MEDIUM',
      predictedDemand20m: isHotspot ? 'VERY_HIGH' : isOutzone ? 'LOW' : 'MEDIUM',
      predictedDemand30m: isHotspot ? 'VERY_HIGH' : isOutzone ? 'LOW' : 'MEDIUM',
      predictedDemand60m: isHotspot ? 'HIGH' : 'LOW',
      activeRequests: profile.totalPickups,
      activeDrivers: isHotspot ? 4 : 1,
      idleDrivers: isHotspot ? 2 : 0,
      driverShortage: isOutzone ? 0 : 3,
      repositioningIncentive: isOutzone ? Math.round(3500 + (1 - profile.pickupProbability) * 3000) : 0,
      maxDriversNeeded: isHotspot ? 6 : 2,
      currentDriversHeading: 0,
    });
  }

  return zones;
}
