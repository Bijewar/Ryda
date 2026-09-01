/**
 * Room name helpers — every WS event is scoped to a room so we don't broadcast
 * driver locations to all 100k passengers simultaneously.
 *
 * Rooms:
 *   - `ride:<id>`       — passenger + driver for a specific ride
 *   - `driver:<id>`     — driver-specific notifications
 *   - `passenger:<id>`  — passenger-specific notifications
 *   - `admin`           — admin panel live updates
 *   - `bhopal:online`   — all online drivers (for the admin heatmap)
 */

export function rideRoom(rideId: string): string {
  return `ride:${rideId}`;
}

export function driverRoom(driverId: string): string {
  return `driver:${driverId}`;
}

export function passengerRoom(userId: string): string {
  return `passenger:${userId}`;
}

export const ADMIN_ROOM = 'admin';
export const BHOPAL_ONLINE_ROOM = 'bhopal:online';
