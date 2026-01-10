/**
 * Unit tests for auth query helpers
 *
 * Tests database query functions for user authentication,
 * account lockout logic, and failed attempt tracking (FR-005).
 *
 * NOTE: These tests will FAIL until lib/queries/auth.ts is implemented (T035).
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getTestContainer } from "@/__tests__/helpers/test-db";
import {
  createTestUser,
  clearTestUsers,
  mockMemberUser,
} from "@/__tests__/helpers/auth-helpers";
import type { PrismaClient } from "@/generated/prisma/client";

// Import functions to test (will fail until implemented)
import {
  findUserByEmail,
  incrementFailedAttempts,
  resetFailedAttempts,
} from "@/lib/queries/auth";

describe("Auth Query Helpers", () => {
  let testDb: PrismaClient;

  beforeEach(async () => {
    const container = await getTestContainer();
    testDb = container.prisma;
    await clearTestUsers(testDb);
  });

  afterEach(async () => {
    await clearTestUsers(testDb);
  });

  describe("findUserByEmail", () => {
    it("should find an existing user by email", async () => {
      // Create test user
      const testUser = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "TestPassword123",
      });

      // Find by email
      const foundUser = await findUserByEmail(testDb, testUser.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
      expect(foundUser?.email).toBe(testUser.email);
      expect(foundUser?.name).toBe(testUser.name);
      expect(foundUser?.role).toBe("MEMBER");
    });

    it("should return null for non-existent email", async () => {
      const foundUser = await findUserByEmail(testDb, "nonexistent@test.local");

      expect(foundUser).toBeNull();
    });

    it("should be case-insensitive for email lookup", async () => {
      // Create user with lowercase email
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
      });

      // Find with uppercase
      const foundUser = await findUserByEmail(testDb, "TEST@EXAMPLE.COM");

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUser.id);
    });

    it("should include failedLoginAttempts in result", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 3,
      });

      const foundUser = await findUserByEmail(testDb, testUser.email);

      expect(foundUser?.failedLoginAttempts).toBe(3);
    });

    it("should include lockedUntil in result", async () => {
      const lockTime = new Date(Date.now() + 15 * 60 * 1000);
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        lockedUntil: lockTime,
      });

      const foundUser = await findUserByEmail(testDb, testUser.email);

      expect(foundUser?.lockedUntil).toBeDefined();
      expect(foundUser?.lockedUntil?.getTime()).toBe(lockTime.getTime());
    });
  });

  describe("incrementFailedAttempts", () => {
    it("should increment failed attempts by 1", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 0,
      });

      const updatedUser = await incrementFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(1);
    });

    it("should increment from existing failed attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 2,
      });

      const updatedUser = await incrementFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(3);
    });

    it("should lock account after 5th failed attempt (FR-005)", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 4,
      });

      const beforeLock = Date.now();
      const updatedUser = await incrementFailedAttempts(testDb, testUser.id);
      const afterLock = Date.now();

      expect(updatedUser.failedLoginAttempts).toBe(5);
      expect(updatedUser.lockedUntil).toBeDefined();

      // Should be locked for 15 minutes (FR-005)
      const lockTime = updatedUser.lockedUntil!.getTime();
      const expectedMin = beforeLock + 15 * 60 * 1000;
      const expectedMax = afterLock + 15 * 60 * 1000;

      expect(lockTime).toBeGreaterThanOrEqual(expectedMin);
      expect(lockTime).toBeLessThanOrEqual(expectedMax);
    });

    it("should not increment beyond 5 failed attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const updatedUser = await incrementFailedAttempts(testDb, testUser.id);

      // Should remain at 5, not increment further
      expect(updatedUser.failedLoginAttempts).toBe(5);
      expect(updatedUser.lockedUntil).toBeDefined();
    });

    it("should maintain existing lockedUntil when < 5 attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 2,
        lockedUntil: null,
      });

      const updatedUser = await incrementFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(3);
      expect(updatedUser.lockedUntil).toBeNull();
    });
  });

  describe("resetFailedAttempts", () => {
    it("should reset failed attempts to 0", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 4,
      });

      const updatedUser = await resetFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(0);
    });

    it("should clear lockedUntil timestamp", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const updatedUser = await resetFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.lockedUntil).toBeNull();
    });

    it("should work on already-reset account", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 0,
        lockedUntil: null,
      });

      const updatedUser = await resetFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.lockedUntil).toBeNull();
    });

    it("should not affect other user fields", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        name: "Test User",
        password: "TestPassword123",
        role: "MEMBER",
        failedLoginAttempts: 3,
      });

      const updatedUser = await resetFailedAttempts(testDb, testUser.id);

      // Other fields should remain unchanged
      expect(updatedUser.email).toBe(testUser.email);
      expect(updatedUser.name).toBe(testUser.name);
      expect(updatedUser.role).toBe(testUser.role);
    });
  });

  describe("Account Lockout Scenarios", () => {
    it("should track lockout workflow: 0 -> 1 -> 2 -> 3 -> 4 -> 5 (locked)", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
      });

      // Simulate 5 failed attempts
      let user = testUser;
      for (let i = 1; i <= 5; i++) {
        user = await incrementFailedAttempts(testDb, user.id);
        expect(user.failedLoginAttempts).toBe(i);

        if (i < 5) {
          expect(user.lockedUntil).toBeNull();
        } else {
          expect(user.lockedUntil).toBeDefined();
        }
      }
    });

    it("should unlock after successful login (reset)", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      // Simulate successful login (manual unlock for testing)
      const updatedUser = await resetFailedAttempts(testDb, testUser.id);

      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.lockedUntil).toBeNull();
    });

    it("should handle expired lockout (lockedUntil in past)", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // 1 second ago
      });

      // User should still have lockout record, but it's expired
      const foundUser = await findUserByEmail(testDb, testUser.email);

      expect(foundUser?.failedLoginAttempts).toBe(5);
      expect(foundUser?.lockedUntil).toBeDefined();
      expect(foundUser?.lockedUntil!.getTime()).toBeLessThan(Date.now());
    });
  });
});
