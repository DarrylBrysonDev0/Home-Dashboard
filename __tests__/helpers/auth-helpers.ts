import { Session } from "next-auth";
import { User } from "@/generated/prisma/client";
import * as bcrypt from "bcryptjs";

/**
 * Test helper utilities for authentication testing
 *
 * Provides mock session data, user fixtures, and helper functions
 * for testing authentication-related features.
 */

// ============================================
// MOCK USER DATA
// ============================================

/**
 * Mock admin user for testing
 */
export const mockAdminUser: Omit<User, "passwordHash"> & { password: string } =
  {
    id: "test-admin-id",
    email: "admin@test.local",
    name: "Test Admin",
    password: "AdminPass123",
    role: "ADMIN",
    avatarColor: "#F97316",
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  };

/**
 * Mock member user for testing
 */
export const mockMemberUser: Omit<User, "passwordHash"> & { password: string } =
  {
    id: "test-member-id",
    email: "member@test.local",
    name: "Test Member",
    password: "MemberPass123",
    role: "MEMBER",
    avatarColor: "#3B82F6",
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  };

/**
 * Mock locked user for testing account lockout
 */
export const mockLockedUser: Omit<User, "passwordHash"> & { password: string } =
  {
    id: "test-locked-id",
    email: "locked@test.local",
    name: "Test Locked User",
    password: "LockedPass123",
    role: "MEMBER",
    avatarColor: "#6B7280",
    failedLoginAttempts: 5,
    lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  };

// ============================================
// MOCK SESSION DATA
// ============================================

/**
 * Creates a mock NextAuth session for an admin user
 */
export function createMockAdminSession(): Session {
  return {
    user: {
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      name: mockAdminUser.name,
      role: "ADMIN",
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
}

/**
 * Creates a mock NextAuth session for a member user
 */
export function createMockMemberSession(): Session {
  return {
    user: {
      id: mockMemberUser.id,
      email: mockMemberUser.email,
      name: mockMemberUser.name,
      role: "MEMBER",
    },
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Creates a mock session with custom user data
 */
export function createMockSession(
  userData: Partial<Session["user"]>,
  expiresInDays = 7
): Session {
  const defaultUser = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "MEMBER" as const,
  };

  return {
    user: {
      ...defaultUser,
      ...userData,
    },
    expires: new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    ).toISOString(),
  };
}

/**
 * Creates a mock expired session
 */
export function createExpiredSession(): Session {
  return {
    user: {
      id: mockMemberUser.id,
      email: mockMemberUser.email,
      name: mockMemberUser.name,
      role: "MEMBER",
    },
    expires: new Date(Date.now() - 1000).toISOString(), // Already expired
  };
}

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Hashes a password for test user creation
 * Uses bcrypt with 10 rounds (faster for tests than production's 12)
 */
export async function hashPasswordForTest(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// TEST USER CREATION
// ============================================

/**
 * Creates a test user in the database with hashed password
 *
 * @param prisma Prisma client instance
 * @param userData User data (password will be hashed)
 * @returns Created user from database
 */
export async function createTestUser(
  prisma: any,
  userData: Partial<
    Omit<User, "passwordHash" | "createdAt" | "updatedAt">
  > & { password: string }
): Promise<User> {
  const passwordHash = await hashPasswordForTest(userData.password);

  return prisma.user.create({
    data: {
      email: userData.email ?? `test-${Date.now()}@example.com`,
      name: userData.name ?? "Test User",
      passwordHash,
      role: userData.role ?? "MEMBER",
      avatarColor: userData.avatarColor ?? "#3B82F6",
      failedLoginAttempts: userData.failedLoginAttempts ?? 0,
      lockedUntil: userData.lockedUntil ?? null,
    },
  });
}

/**
 * Creates a test admin user in the database
 */
export async function createTestAdmin(prisma: any): Promise<User> {
  return createTestUser(prisma, {
    ...mockAdminUser,
    password: mockAdminUser.password,
  });
}

/**
 * Creates a test member user in the database
 */
export async function createTestMember(prisma: any): Promise<User> {
  return createTestUser(prisma, {
    ...mockMemberUser,
    password: mockMemberUser.password,
  });
}

/**
 * Creates a locked test user in the database
 */
export async function createTestLockedUser(prisma: any): Promise<User> {
  return createTestUser(prisma, {
    ...mockLockedUser,
    password: mockLockedUser.password,
  });
}

// ============================================
// MOCK AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Mock NextAuth authorize function that always succeeds
 */
export const mockAuthorizeSuccess = async (credentials: any) => {
  return {
    id: mockAdminUser.id,
    email: credentials?.email ?? mockAdminUser.email,
    name: mockAdminUser.name,
    role: "ADMIN" as const,
  };
};

/**
 * Mock NextAuth authorize function that always fails
 */
export const mockAuthorizeFail = async () => {
  return null;
};

/**
 * Mock NextAuth authorize function that checks credentials
 */
export const mockAuthorizeWithValidation = async (credentials: any) => {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  // Simple mock validation
  if (
    credentials.email === mockAdminUser.email &&
    credentials.password === mockAdminUser.password
  ) {
    return {
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      name: mockAdminUser.name,
      role: "ADMIN" as const,
    };
  }

  if (
    credentials.email === mockMemberUser.email &&
    credentials.password === mockMemberUser.password
  ) {
    return {
      id: mockMemberUser.id,
      email: mockMemberUser.email,
      name: mockMemberUser.name,
      role: "MEMBER" as const,
    };
  }

  return null;
};

// ============================================
// SESSION MOCKING FOR COMPONENTS
// ============================================

/**
 * Mock useSession hook return value for authenticated admin
 */
export const mockUseSessionAdmin = {
  data: createMockAdminSession(),
  status: "authenticated" as const,
};

/**
 * Mock useSession hook return value for authenticated member
 */
export const mockUseSessionMember = {
  data: createMockMemberSession(),
  status: "authenticated" as const,
};

/**
 * Mock useSession hook return value for unauthenticated user
 */
export const mockUseSessionUnauthenticated = {
  data: null,
  status: "unauthenticated" as const,
};

/**
 * Mock useSession hook return value for loading state
 */
export const mockUseSessionLoading = {
  data: null,
  status: "loading" as const,
};

// ============================================
// JWT TOKEN MOCKING
// ============================================

/**
 * Creates a mock JWT token payload
 */
export function createMockJWTToken(userData: {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
}) {
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };
}

// ============================================
// CLEANUP UTILITIES
// ============================================

/**
 * Deletes all users from the test database
 */
export async function clearTestUsers(prisma: any): Promise<void> {
  await prisma.user.deleteMany({});
}

/**
 * Resets a user's failed login attempts
 */
export async function resetFailedAttempts(
  prisma: any,
  userId: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Locks a user account for testing lockout behavior
 */
export async function lockUserAccount(
  prisma: any,
  userId: string,
  minutesLocked = 15
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + minutesLocked * 60 * 1000),
    },
  });
}
