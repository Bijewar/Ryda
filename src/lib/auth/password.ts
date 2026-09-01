import { compare, hash } from 'bcryptjs';
import argon2 from 'argon2';

/**
 * Password hashing — argon2id for new hashes, bcrypt fallback for legacy.
 *
 * Default cost: argon2id with m=64MiB, t=3, p=1. Verification auto-detects
 * the algorithm from the hash prefix (`$argon2id$` vs `$2b$`).
 */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65_536, // 64 MiB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$argon2')) {
    return argon2.verify(hash, plaintext);
  }
  if (hash.startsWith('$2')) {
    return compare(plaintext, hash);
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
