/**
 * Integration tests for account lockout mechanism
 *
 * Tests the 5-failed-attempts lockout feature (FR-005) which locks
 * accounts for 15 minutes after 5 consecutive failed login attempts.
 *
 * NOTE: These tests may FAIL until T035-T036 (auth implementation) complete.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getTestContainer } from "@/__tests__/helpers/test-db";
import {
  createTestUser,
  clearTestUsers,
} from "@/__tests__/helpers/auth-helpers";
import type { PrismaClient } from "@/generated/prisma/client";

describe("Account Lockout Integration Tests", () => {
  let testDb: PrismaClient;

  beforeEach(async () => {
    const container = await getTestContainer();
    testDb = container.prisma;
    await clearTestUsers(testDb);
  });

  afterEach(async () => {
    await clearTestUsers(testDb);
  });

  describe("FR-005: 5 Failed Attempts Lockout", () => {
    it("should lock account after exactly 5 failed login attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
      });

      // Attempt 5 failed logins
      for (let i = 1; i <= 5; i++) {
        await fetch("http://localhost:3000/api/auth/callback/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "WrongPassword",
            redirect: false,
          }),
        });
      }

      // Verify account is locked
      const lockedUser = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(lockedUser?.failedLoginAttempts).toBe(5);
      expect(lockedUser?.lockedUntil).toBeDefined();
      expect(lockedUser?.lockedUntil).not.toBeNull();

      // Verify lock duration is ~15 minutes
      const lockDuration =
        lockedUser!.lockedUntil!.getTime() - Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      // Allow 1-second variance
      expect(lockDuration).toBeGreaterThan(fifteenMinutes - 1000);
      expect(lockDuration).toBeLessThan(fifteenMinutes + 1000);
    });

    it("should not lock account before 5 attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
      });

      // Attempt 4 failed logins
      for (let i = 1; i <= 4; i++) {
        await fetch("http://localhost:3000/api/auth/callback/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "WrongPassword",
            redirect: false,
          }),
        });
      }

      // Verify account is NOT locked
      const user = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(user?.failedLoginAttempts).toBe(4);
      expect(user?.lockedUntil).toBeNull();
    });

    it("should reject login on locked account even with correct password", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Locked for 15 min
      });

      // Attempt login with CORRECT password
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "CorrectPassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      // Should be rejected due to lockout
      expect(data.error).toBe("CredentialsSignin");
    });

    it("should allow login after lockout period expires", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      // Attempt login with correct password
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "CorrectPassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      // Should succeed - lockout expired
      expect(data.error).toBeUndefined();

      // Verify lockout reset
      const updatedUser = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser?.failedLoginAttempts).toBe(0);
      expect(updatedUser?.lockedUntil).toBeNull();
    });

    it("should reset failed attempts counter on successful login", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
        failedLoginAttempts: 3,
      });

      // Successful login
      await fetch("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: "CorrectPassword123",
          redirect: false,
        }),
      });

      // Verify reset
      const updatedUser = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser?.failedLoginAttempts).toBe(0);
      expect(updatedUser?.lockedUntil).toBeNull();
    });
  });

  describe("Lockout Edge Cases", () => {
    it("should handle rapid successive failed attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
      });

      // Fire 5 failed attempts in rapid succession
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          fetch("http://localhost:3000/api/auth/callback/credentials", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: testUser.email,
              password: "WrongPassword",
              redirect: false,
            }),
          })
        );
      }

      await Promise.all(attempts);

      // Should still be locked
      const lockedUser = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(lockedUser?.failedLoginAttempts).toBeGreaterThanOrEqual(5);
      expect(lockedUser?.lockedUntil).toBeDefined();
    });

    it("should not reset lockout on failed login during lockout period", async () => {
      const lockTime = new Date(Date.now() + 15 * 60 * 1000);
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
        failedLoginAttempts: 5,
        lockedUntil: lockTime,
      });

      // Try to login with wrong password during lockout
      await fetch("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: "WrongPassword",
          redirect: false,
        }),
      });

      // Lockout should remain unchanged
      const user = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(user?.failedLoginAttempts).toBe(5);
      expect(user?.lockedUntil?.getTime()).toBe(lockTime.getTime());
    });

    it("should handle alternating success and failure attempts", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
      });

      // Fail 2 times
      for (let i = 0; i < 2; i++) {
        await fetch("http://localhost:3000/api/auth/callback/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "WrongPassword",
            redirect: false,
          }),
        });
      }

      // Succeed once (resets counter)
      await fetch("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: "CorrectPassword123",
          redirect: false,
        }),
      });

      // Fail 4 more times
      for (let i = 0; i < 4; i++) {
        await fetch("http://localhost:3000/api/auth/callback/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "WrongPassword",
            redirect: false,
          }),
        });
      }

      // Should NOT be locked (counter was reset by success)
      const user = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(user?.failedLoginAttempts).toBe(4);
      expect(user?.lockedUntil).toBeNull();
    });
  });

  describe("Multiple User Lockouts", () => {
    it("should lock accounts independently", async () => {
      const user1 = await createTestUser(testDb, {
        email: "user1@example.com",
        password: "Password123",
      });

      const user2 = await createTestUser(testDb, {
        email: "user2@example.com",
        password: "Password123",
      });

      // Lock user1
      for (let i = 0; i < 5; i++) {
        await fetch("http://localhost:3000/api/auth/callback/credentials", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user1.email,
            password: "WrongPassword",
            redirect: false,
          }),
        });
      }

      // User2 should remain unlocked
      const user2Status = await testDb.user.findUnique({
        where: { id: user2.id },
      });

      expect(user2Status?.failedLoginAttempts).toBe(0);
      expect(user2Status?.lockedUntil).toBeNull();

      // User1 should be locked
      const user1Status = await testDb.user.findUnique({
        where: { id: user1.id },
      });

      expect(user1Status?.failedLoginAttempts).toBe(5);
      expect(user1Status?.lockedUntil).toBeDefined();
    });
  });

  describe("Lockout Error Messages", () => {
    it("should return generic error for locked account (no info leakage)", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "CorrectPassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      // Should not reveal that account is locked (security)
      expect(data.error).toBe("CredentialsSignin");
      // Should NOT contain "locked" or "timeout" in error message
    });

    it("should return same error for wrong password as locked account", async () => {
      const lockedUser = await createTestUser(testDb, {
        email: "locked@example.com",
        password: "Password123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      const normalUser = await createTestUser(testDb, {
        email: "normal@example.com",
        password: "Password123",
      });

      // Try locked account with correct password
      const lockedResponse = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: lockedUser.email,
            password: "Password123",
            redirect: false,
          }),
        }
      );

      // Try normal account with wrong password
      const wrongPassResponse = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalUser.email,
            password: "WrongPassword",
            redirect: false,
          }),
        }
      );

      const lockedData = await lockedResponse.json();
      const wrongPassData = await wrongPassResponse.json();

      // Both should return identical error (no information leakage)
      expect(lockedData.error).toBe(wrongPassData.error);
      expect(lockedData.error).toBe("CredentialsSignin");
    });
  });
});
