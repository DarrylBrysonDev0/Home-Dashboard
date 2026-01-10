/**
 * Authentication query helpers
 *
 * Provides database operations for user authentication, including:
 * - User lookup by email
 * - Failed login attempt tracking
 * - Account lockout management (FR-005)
 */

import { prisma } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

/**
 * Find a user by email address.
 *
 * Used during login to look up the user account.
 * Returns null if no user with the given email exists.
 *
 * @param email - Email address to search for
 * @returns Promise resolving to User or null
 *
 * @example
 * ```typescript
 * const user = await findUserByEmail("admin@home.local");
 * if (user) {
 *   // User found
 * }
 * ```
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Increment failed login attempts for a user.
 *
 * After 5 failed attempts (counting from 0), the account is locked for 15 minutes.
 * This implements the account lockout security requirement (FR-005).
 *
 * @param userId - ID of the user who failed to log in
 * @returns Promise resolving to the updated User
 *
 * @example
 * ```typescript
 * // User has 4 failed attempts - this will lock the account
 * const user = await incrementFailedAttempts(userId);
 * if (user.lockedUntil) {
 *   console.log("Account locked until:", user.lockedUntil);
 * }
 * ```
 */
export async function incrementFailedAttempts(userId: string): Promise<User> {
  // First, get current attempt count
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  const currentAttempts = user?.failedLoginAttempts ?? 0;
  const newAttempts = currentAttempts + 1;

  // Lock account if this is the 5th failed attempt (attempts are 0-indexed)
  const shouldLock = newAttempts >= 5;
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
  const lockedUntil = shouldLock ? new Date(Date.now() + lockoutDuration) : null;

  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      ...(shouldLock && { lockedUntil }),
    },
  });
}

/**
 * Reset failed login attempts and unlock account.
 *
 * Called after a successful login to reset the security counters.
 *
 * @param userId - ID of the user who successfully logged in
 * @returns Promise resolving to the updated User
 *
 * @example
 * ```typescript
 * // User logged in successfully
 * await resetFailedAttempts(userId);
 * ```
 */
export async function resetFailedAttempts(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Check if a user account is currently locked.
 *
 * Returns true if the account has a lockout time in the future.
 *
 * @param user - User object to check
 * @returns boolean indicating if account is locked
 *
 * @example
 * ```typescript
 * const user = await findUserByEmail(email);
 * if (isAccountLocked(user)) {
 *   throw new Error("Account is locked. Try again later.");
 * }
 * ```
 */
export function isAccountLocked(user: User): boolean {
  if (!user.lockedUntil) {
    return false;
  }
  return user.lockedUntil > new Date();
}
