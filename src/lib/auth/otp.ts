import { createHmac, randomInt } from 'node:crypto';
import { authenticator } from 'otplib';

/**
 * 2FA TOTP — RFC 6238, 30s step, 6 digits.
 *
 * The user adds the secret to their authenticator app (Google Authenticator,
 * 1Password, etc.) via a QR code rendered by the client. Verification uses
 * otplib's `authenticator.verify`, which includes a ±1 step window to absorb
 * clock skew.
 */
authenticator.options = { step: 30, window: 1 };

/** Generate a new base32-encoded secret for a user. */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/** Build the `otpauth://` URI for QR-code generation. */
export function buildTotpUri(opts: {
  secret: string;
  email: string;
  issuer?: string;
}): string {
  return authenticator.keyuri(opts.email, opts.issuer ?? 'Ryda v2', opts.secret);
}

/** Verify a 6-digit TOTP code against the user's secret. */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Email OTP — 6 numeric digits, 5-minute TTL.
 *
 * The OTP itself is stateless: we derive it from the user's email + a
 * rotating 5-minute window + a per-process HMAC key. This means we don't
 * need Redis to track issued OTPs — verifying is just "regenerate and
 * compare".
 */
const OTP_WINDOW_MS = 5 * 60_000;

function currentOtpWindow(): number {
  return Math.floor(Date.now() / OTP_WINDOW_MS);
}

function hmac(data: string): string {
  const key = process.env.AUTH_SECRET ?? 'ryda-v2-otp-fallback-key';
  return createHmac('sha256', key).update(data).digest('hex');
}

/** Generate the 6-digit OTP for `email` in the current 5-min window. */
export function generateEmailOtp(email: string): string {
  const window = currentOtpWindow();
  const h = hmac(`${email}:${window}`);
  // First 8 hex chars → 32-bit int → last 6 digits
  const n = Number.parseInt(h.slice(0, 8), 16);
  return (n % 1_000_000).toString().padStart(6, '0');
}

/** Verify an OTP — accepts the current or previous window to absorb skew. */
export function verifyEmailOtp(email: string, token: string): boolean {
  const now = currentOtpWindow();
  for (const w of [now, now - 1]) {
    const h = hmac(`${email}:${w}`);
    const n = Number.parseInt(h.slice(0, 8), 16);
    const expected = (n % 1_000_000).toString().padStart(6, '0');
    if (expected === token) return true;
  }
  return false;
}

/** Random 6-digit OTP for SMS — stateful (caller must track attempts). */
export function generateNumericOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
