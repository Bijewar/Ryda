'use client';

import { create } from 'zustand';
import type { RideSummary, RideStatus } from '@/types/ride';

/**
 * Zustand ride store — single source of truth for the active ride on the
 * client. Updated by `useRealtimeRide` as WS events arrive.
 */
interface RideState {
  currentRide: RideSummary | null;
  rideHistory: RideSummary[];
  status: RideStatus | 'IDLE';
  error: string | null;
  isConnecting: boolean;

  setCurrentRide: (ride: RideSummary | null) => void;
  setRideHistory: (rides: RideSummary[]) => void;
  setStatus: (status: RideStatus | 'IDLE') => void;
  setError: (error: string | null) => void;
  setConnecting: (connecting: boolean) => void;
  updateStatus: (status: RideStatus) => void;
  reset: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  currentRide: null,
  rideHistory: [],
  status: 'IDLE',
  error: null,
  isConnecting: false,

  setCurrentRide: (ride) => set({ currentRide: ride, status: ride?.status ?? 'IDLE' }),
  setRideHistory: (rides) => set({ rideHistory: rides }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  updateStatus: (status) =>
    set((state) => ({
      status,
      currentRide: state.currentRide ? { ...state.currentRide, status } : null,
    })),
  reset: () => set({ currentRide: null, status: 'IDLE', error: null }),
}));
