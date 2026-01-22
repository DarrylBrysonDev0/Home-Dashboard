/**
 * Password hashing utilities using bcryptjs
 *
 * Uses 12 salt rounds for optimal security/performance balance (~100ms hash time).
 * All methods are async to avoid blocking the event loop.
 *
 * Note: bcrypt has a 72-byte input limit. Passwords longer than 72 bytes will be truncated.
 * This is enforced by validation schemas (max 72 characters).
 */

import bcrypt from "bcryptjs";

/**
 * Number of salt rounds for bcrypt hashing.
 * 12 rounds provides strong security while maintaining reasonable performance.
 */
const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 *
 * @param password - Plain-text password to hash (max 72 characters)
 * @returns Promise resolving to the bcrypt hash string (includes salt)
 *
 * @example
 * ```typescript
 * const hash = await hashPassword("MySecurePassword123!");
 * // Returns: "$2a$12$..."
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain-text password against a bcrypt hash.
 *
 * @param password - Plain-text password to verify
 * @param hash - Stored bcrypt hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword("MySecurePassword123!", storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  console.log("[PASSWORD] Comparing password length:", password.length);
  console.log("[PASSWORD] Hash starts with:", hash.substring(0, 10));
  const result = await bcrypt.compare(password, hash);
  console.log("[PASSWORD] Compare result:", result);
  return result;
}
