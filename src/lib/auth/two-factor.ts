import { buildTotpUri, generateTwoFactorSecret, verifyTwoFactorToken } from '@/lib/auth/otp';

/**
 * 2FA (TOTP) helpers — thin wrappers around otplib for the NextAuth flow.
 *
 * Flow:
 *   1. User opts in → `enableTwoFactor()` returns a secret + `otpauth://` URI
 *      for QR rendering.
 *   2. User adds to authenticator app, submits a 6-digit code → `confirmEnable()`
 *      verifies and persists the secret to the User row.
 *   3. On subsequent logins, NextAuth's `authorize` callback calls
 *      `verifyLogin()` with the user-submitted TOTP code.
 */
export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
}

export function enableTwoFactor(email: string): TwoFactorSetup {
  const secret = generateTwoFactorSecret();
  const otpauthUrl = buildTotpUri({ secret, email, issuer: 'Ryda v2' });
  return { secret, otpauthUrl };
}

export function confirmTwoFactorEnable(token: string, secret: string): boolean {
  return verifyTwoFactorToken(token, secret);
}

export function verifyTwoFactorLogin(token: string, secret: string): boolean {
  return verifyTwoFactorToken(token, secret);
}
