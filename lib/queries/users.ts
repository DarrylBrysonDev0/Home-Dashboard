/**
 * User management query helpers
 *
 * Provides database operations for admin user management (FR-031, FR-032, FR-033):
 * - List all users
 * - Create new users
 * - Update user details
 * - Delete users
 * - Count admin users
 */

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/utils/password";
import type { User } from "@/generated/prisma/client";
import type { UserRole } from "@/lib/validations/auth";

/**
 * User data returned from queries (excludes passwordHash for security)
 */
export type SafeUser = Omit<User, "passwordHash">;

/**
 * Input data for creating a new user
 */
export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  avatarColor?: string;
}

/**
 * Input data for updating a user
 */
export interface UpdateUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  avatarColor?: string | null;
  unlockAccount?: boolean;
}

/**
 * List all users in the system.
 *
 * Returns users without their password hashes for security.
 * Used by admin to view household members (FR-031).
 *
 * @returns Promise resolving to array of SafeUser
 *
 * @example
 * ```typescript
 * const users = await listUsers();
 * console.log(`Found ${users.length} users`);
 * ```
 */
export async function listUsers(): Promise<SafeUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarColor: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return users;
}

/**
 * Get a single user by ID.
 *
 * Returns user without password hash for security.
 *
 * @param id - User ID
 * @returns Promise resolving to SafeUser or null if not found
 *
 * @example
 * ```typescript
 * const user = await getUserById("clxx...");
 * if (user) {
 *   console.log(`Found: ${user.name}`);
 * }
 * ```
 */
export async function getUserById(id: string): Promise<(SafeUser & { eventsCreated: number }) | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarColor: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { eventsCreated: true },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    eventsCreated: user._count.eventsCreated,
  };
}

/**
 * Check if an email is already in use.
 *
 * @param email - Email address to check
 * @param excludeUserId - Optional user ID to exclude (for update operations)
 * @returns Promise resolving to boolean
 */
export async function isEmailTaken(email: string, excludeUserId?: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  // If we're excluding a user ID (for updates), check if the found user is the same
  if (excludeUserId && user.id === excludeUserId) {
    return false;
  }

  return true;
}

/**
 * Create a new user account.
 *
 * Hashes the password before storing and returns the created user
 * without the password hash (FR-032).
 *
 * @param data - User data including plain-text password
 * @returns Promise resolving to created SafeUser
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   email: "member@home.local",
 *   name: "New Member",
 *   password: "SecurePass123",
 *   role: "MEMBER",
 * });
 * ```
 */
export async function createUser(data: CreateUserData): Promise<SafeUser> {
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role || "MEMBER",
      avatarColor: data.avatarColor || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarColor: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Update a user's details.
 *
 * If password is provided, it will be hashed before storage.
 * If unlockAccount is true, resets failed attempts and lockout (FR-033).
 *
 * @param id - User ID to update
 * @param data - Fields to update
 * @returns Promise resolving to updated SafeUser
 *
 * @example
 * ```typescript
 * // Update name
 * const user = await updateUser(userId, { name: "New Name" });
 *
 * // Unlock account
 * await updateUser(userId, { unlockAccount: true });
 * ```
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<SafeUser> {
  const updateData: Record<string, unknown> = {};

  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.password !== undefined) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  if (data.avatarColor !== undefined) {
    updateData.avatarColor = data.avatarColor;
  }

  // Handle account unlock
  if (data.unlockAccount) {
    updateData.failedLoginAttempts = 0;
    updateData.lockedUntil = null;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarColor: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Delete a user account.
 *
 * @param id - User ID to delete
 * @returns Promise resolving when complete
 *
 * @example
 * ```typescript
 * await deleteUser(userId);
 * ```
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({
    where: { id },
  });
}

/**
 * Count the number of admin users in the system.
 *
 * Used to prevent deleting the last admin.
 *
 * @returns Promise resolving to admin count
 */
export async function countAdminUsers(): Promise<number> {
  return prisma.user.count({
    where: { role: "ADMIN" },
  });
}

/**
 * Check if a user exists by ID.
 *
 * @param id - User ID to check
 * @returns Promise resolving to boolean
 */
export async function userExists(id: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  return user !== null;
}
