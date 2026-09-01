'use client';

import { useCallback, useMemo } from 'react';
import { useRideStore } from '@/stores/ride-store';
import type { RideStatus } from '@/types/ride';
import { canTransition, TERMINAL_STATUSES } from '@/types/ride';

/**
 * useRideStateMachine — client-side guard around ride state transitions.
 *
 * The server is the source of truth (ride-service.ts enforces transitions
 * atomically), but the UI also needs to know what actions are valid for the
 * current state — e.g. "Cancel" is hidden when status is COMPLETED.
 *
 * This hook exposes a pure-JS mirror of the server's transition table. It's
 * not a state machine library (no XState dependency) — just a small wrapper
 * that returns `can(action)` predicates for the current ride status.
 */
export type RideAction = 'cancel' | 'rate' | 'track' | 'pay' | 'rebook';

const ACTION_ALLOWED: Record<RideAction, RideStatus[]> = {
  cancel: ['REQUESTED', 'MATCHING', 'OFFERED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'],
  rate: ['COMPLETED', 'PAID'],
  track: ['MATCHING', 'OFFERED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'],
  pay: ['COMPLETED'],
  rebook: ['COMPLETED', 'PAID', 'CANCELED', 'NO_DRIVERS'],
};

export function useRideStateMachine(rideId?: string) {
  const currentRide = useRideStore((s) => s.currentRide);
  const rideStatus = useRideStore((s) => s.status);
  const updateStatus = useRideStore((s) => s.updateStatus);

  // If a rideId is passed and it matches the current ride, use its status.
  const status: RideStatus | 'IDLE' =
    rideId && currentRide?.id === rideId ? currentRide.status : rideStatus;

  const isTerminal = useMemo(() => (status !== 'IDLE' ? TERMINAL_STATUSES.has(status) : false), [status]);

  const can = useCallback(
    (action: RideAction): boolean => {
      if (status === 'IDLE') return false;
      return ACTION_ALLOWED[action].includes(status);
    },
    [status],
  );

  const transitionTo = useCallback(
    (next: RideStatus): { ok: boolean; reason?: string } => {
      if (status === 'IDLE') return { ok: false, reason: 'No active ride' };
      if (!canTransition(status, next)) {
        return { ok: false, reason: `Cannot transition from ${status} to ${next}` };
      }
      updateStatus(next);
      return { ok: true };
    },
    [status, updateStatus],
  );

  return { status, isTerminal, can, transitionTo };
}
