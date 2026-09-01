import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind className combiner used by every shadcn component. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a paise integer (1 INR = 100 paise) as ₹XX,XXX.XX. */
export function formatCurrency(paise: number, currency = 'INR'): string {
  const value = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format meters → human distance ("1.2 km" / "850 m"). */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Format seconds → human duration ("12 min" / "1 hr 5 min"). */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs} hr ${mins} min`;
}

/** Format an ISO date string as "12 Mar 2025, 4:30 PM" (en-IN). */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/** Time-ago formatter ("just now", "5m ago", "3h ago", "2d ago"). */
export function timeAgo(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 30) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return formatDate(d);
}

/** Generate a cryptographically-random idempotency key. */
export function generateIdempotencyKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Initials for avatar fallback ("Imran Khan" → "IK"). */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Sleep helper for retry/backoff logic. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
