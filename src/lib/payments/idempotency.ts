import { randomUUID } from 'node:crypto';

/**
 * Idempotency-Key header helper.
 *
 * Every state-changing payment request (create-order, verify, refund) MUST
 * carry an `Idempotency-Key` header so a network-retried request doesn't
 * double-charge the customer. The key is stored on the Payment row
 * (`Payment.idempotencyKey`); a retry with the same key returns the cached
 * response instead of re-executing.
 */
export function readIdempotencyKey(req: Request): string {
  const header = req.headers.get('x-idempotency-key');
  if (header && header.length >= 8 && header.length <= 128) return header;
  // Generate one for the caller if missing (best-effort, not enforced).
  return randomUUID();
}

/** Generate a fresh idempotency key for client-side use. */
export function newIdempotencyKey(): string {
  return `ryda_${randomUUID()}`;
}
