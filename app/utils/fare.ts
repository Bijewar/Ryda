// app/utils/fare.ts

import { FARE_CONFIG } from '../constants';

export const calculateFare = (distanceInKm: number): number => {
  const baseFare = Math.round(distanceInKm * FARE_CONFIG.RATE_PER_KM);
  return Math.max(baseFare, FARE_CONFIG.MIN_FARE);
};