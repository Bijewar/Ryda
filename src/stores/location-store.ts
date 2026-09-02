'use client';

import type { Point } from '@/types/ride';
import { create } from 'zustand';

interface LocationState {
  pickup: { address: string; point: Point } | null;
  dropoff: { address: string; point: Point } | null;
  driverLocation: {
    point: Point;
    heading?: number | undefined;
    etaSeconds?: number | undefined;
  } | null;
  isInsideBhopal: boolean;

  setPickup: (p: { address: string; point: Point } | null) => void;
  setDropoff: (p: { address: string; point: Point } | null) => void;
  setDriverLocation: (
    loc: { point: Point; heading?: number | undefined; etaSeconds?: number | undefined } | null,
  ) => void;
  setIsInsideBhopal: (v: boolean) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  pickup: null,
  dropoff: null,
  driverLocation: null,
  isInsideBhopal: false,

  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  setDriverLocation: (driverLocation) => set({ driverLocation }),
  setIsInsideBhopal: (isInsideBhopal) => set({ isInsideBhopal }),
  clear: () => set({ pickup: null, dropoff: null, driverLocation: null, isInsideBhopal: false }),
}));
