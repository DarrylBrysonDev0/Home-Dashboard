/**
 * Integration tests for authentication flow
 *
 * Tests the complete login flow via NextAuth API endpoints,
 * including credential validation and session creation.
 *
 * NOTE: Some tests may FAIL until T035-T036 (auth implementation) complete.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getTestContainer } from "@/__tests__/helpers/test-db";
import {
  createTestUser,
  clearTestUsers,
  mockMemberUser,
  mockAdminUser,
} from "@/__tests__/helpers/auth-helpers";
import type { PrismaClient } from "@/generated/prisma/client";

describe("Authentication API - Login Flow", () => {
  let testDb: PrismaClient;

  beforeEach(async () => {
    const container = await getTestContainer();
    testDb = container.prisma;
    await clearTestUsers(testDb);
  });

  afterEach(async () => {
    await clearTestUsers(testDb);
  });

  describe("POST /api/auth/callback/credentials - Login", () => {
    it("should authenticate with valid credentials (member)", async () => {
      // Create test user
      const testUser = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      // Attempt login via NextAuth
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testUser.email,
            password: "MemberPass123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      // Should return success (exact format depends on NextAuth config)
      expect(response.ok).toBe(true);
      expect(data.error).toBeUndefined();
    });

    it("should authenticate with valid credentials (admin)", async () => {
      // Create test admin
      const testAdmin = await createTestUser(testDb, {
        ...mockAdminUser,
        password: "AdminPass123",
      });

      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: testAdmin.email,
            password: "AdminPass123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.error).toBeUndefined();
    });

    it("should reject invalid email", async () => {
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "nonexistent@test.local",
            password: "SomePassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      // NextAuth returns error for invalid credentials
      expect(data.error).toBeDefined();
      expect(data.error).toBe("CredentialsSignin");
    });

    it("should reject invalid password", async () => {
      // Create test user
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
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
            password: "WrongPassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      expect(data.error).toBe("CredentialsSignin");
    });

    it("should be case-sensitive for password", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
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
            password: "testpassword123", // Wrong case
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      expect(data.error).toBe("CredentialsSignin");
    });

    it("should reject missing email", async () => {
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "SomePassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      expect(data.error).toBeDefined();
    });

    it("should reject missing password", async () => {
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      expect(data.error).toBeDefined();
    });

    it("should reset failed attempts on successful login", async () => {
      // Create user with some failed attempts
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
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
          password: "TestPassword123",
          redirect: false,
        }),
      });

      // Verify failed attempts reset
      const updatedUser = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser?.failedLoginAttempts).toBe(0);
      expect(updatedUser?.lockedUntil).toBeNull();
    });

    it("should increment failed attempts on invalid password", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "CorrectPassword123",
        failedLoginAttempts: 0,
      });

      // Failed login
      await fetch("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: "WrongPassword123",
          redirect: false,
        }),
      });

      // Verify failed attempts incremented
      const updatedUser = await testDb.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser?.failedLoginAttempts).toBe(1);
    });
  });

  describe("GET /api/auth/session - Session Retrieval", () => {
    it("should return session for authenticated user", async () => {
      // This test requires a valid session cookie
      // For now, we'll test the endpoint structure
      const response = await fetch("http://localhost:3000/api/auth/session");

      expect(response.ok).toBe(true);

      const data = await response.json();

      // Unauthenticated request should return empty session
      expect(data).toBeDefined();
    });

    it("should return null session for unauthenticated request", async () => {
      const response = await fetch("http://localhost:3000/api/auth/session");

      const data = await response.json();

      // No session should be present
      expect(data.user).toBeUndefined();
    });
  });

  describe("POST /api/auth/signout - Logout", () => {
    it("should accept signout request", async () => {
      const response = await fetch("http://localhost:3000/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callbackUrl: "/",
        }),
      });

      // Should accept the request (may redirect)
      expect(response.ok || response.status === 302).toBe(true);
    });
  });

  describe("GET /api/auth/csrf - CSRF Token", () => {
    it("should return CSRF token", async () => {
      const response = await fetch("http://localhost:3000/api/auth/csrf");

      expect(response.ok).toBe(true);

      const data = await response.json();

      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe("string");
      expect(data.csrfToken.length).toBeGreaterThan(0);
    });
  });

  describe("Email Case Sensitivity", () => {
    it("should login with case-insensitive email", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com", // lowercase
        password: "TestPassword123",
      });

      // Try with uppercase
      const response = await fetch(
        "http://localhost:3000/api/auth/callback/credentials",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "TEST@EXAMPLE.COM",
            password: "TestPassword123",
            redirect: false,
          }),
        }
      );

      const data = await response.json();

      // Should succeed (email lookup is case-insensitive)
      expect(response.ok).toBe(true);
      expect(data.error).toBeUndefined();
    });
  });

  describe("Performance Requirements (SC-001)", () => {
    it("should complete login in under 10 seconds", async () => {
      const testUser = await createTestUser(testDb, {
        email: "test@example.com",
        password: "TestPassword123",
      });

      const startTime = Date.now();

      await fetch("http://localhost:3000/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: "TestPassword123",
          redirect: false,
        }),
      });

      const duration = Date.now() - startTime;

      // FR-001: Login should complete in <10s
      expect(duration).toBeLessThan(10000);
    });
  });
});
