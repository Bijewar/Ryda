import argon2 from 'argon2';
import { compare, hash } from 'bcryptjs';

/**
 * Password hashing — argon2id for new hashes, bcrypt fallback for legacy.
 *
 * Default cost: argon2id with m=64MiB, t=3, p=1. Verification auto-detects
 * the algorithm from the hash prefix (`$argon2id$` vs `$2b$`).
 */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plaintext: string): Promise<string> {
  try {
    return await argon2.hash(plaintext, {
      type: argon2.argon2id,
      memoryCost: 65_536, // 64 MiB
      timeCost: 3,
      parallelism: 1,
    });
  } catch (_e) {
    return hash(plaintext, BCRYPT_ROUNDS);
  }
}

export async function verifyPassword(plaintext: string, hashStr: string): Promise<boolean> {
  if (hashStr.startsWith('$argon2')) {
    try {
      return await argon2.verify(hashStr, plaintext);
    } catch {
      return false;
    }
  }
  if (hashStr.startsWith('$2')) {
    return compare(plaintext, hashStr);
  }
  return false;
}

/** Hash a token (e.g. password reset) with bcrypt for DB storage. */
export async function hashToken(token: string): Promise<string> {
  return hash(token, BCRYPT_ROUNDS);
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return compare(token, hash);
}
