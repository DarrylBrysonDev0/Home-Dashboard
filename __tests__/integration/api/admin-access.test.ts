/**
 * Integration tests for Role-Based Access Control (RBAC)
 *
 * Tests that admin-only endpoints properly restrict access based on user role.
 * Validates FR-007 (user roles) and admin middleware functionality.
 *
 * NOTE: These tests will FAIL until T085 (admin middleware) and T086-T088 (API routes) complete.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getTestContainer } from "@/__tests__/helpers/test-db";
import {
  createTestUser,
  createTestAdmin,
  clearTestUsers,
  mockAdminUser,
  mockMemberUser,
} from "@/__tests__/helpers/auth-helpers";
import type { PrismaClient } from "@/generated/prisma/client";

// Mock NextAuth's getServerSession for API route authentication
vi.mock("next-auth", async () => {
  const actual = await vi.importActual("next-auth");
  return {
    ...actual,
    getServerSession: vi.fn(),
  };
});

import { getServerSession } from "next-auth";

/**
 * Admin-only endpoints that require role check
 */
const ADMIN_ENDPOINTS = [
  { method: "GET", path: "/api/users" },
  { method: "POST", path: "/api/users" },
  { method: "PUT", path: "/api/users/test-id" },
  { method: "DELETE", path: "/api/users/test-id" },
  { method: "POST", path: "/api/categories" },
  { method: "PUT", path: "/api/categories/test-id" },
  { method: "DELETE", path: "/api/categories/test-id" },
];

describe("Role-Based Access Control (RBAC) Integration Tests", () => {
  let testDb: PrismaClient;

  beforeEach(async () => {
    const container = await getTestContainer();
    testDb = container.prisma;
    await clearTestUsers(testDb);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestUsers(testDb);
  });

  describe("Unauthenticated Access - 401 Unauthorized", () => {
    it.each(ADMIN_ENDPOINTS)(
      "should return 401 for unauthenticated $method $path",
      async ({ method, path }) => {
        // Mock no session
        vi.mocked(getServerSession).mockResolvedValue(null);

        const response = await fetch(`http://localhost:3000${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: method !== "GET" && method !== "DELETE"
            ? JSON.stringify({ email: "test@test.com", name: "Test", password: "Test12345" })
            : undefined,
        });

        expect(response.status).toBe(401);

        const body = await response.json();
        expect(body.error).toBe("Unauthorized");
      }
    );

    it("should return 401 for GET /api/users/[id] when not authenticated", async () => {
      const admin = await createTestAdmin(testDb);
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await fetch(`http://localhost:3000/api/users/${admin.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });
  });

  describe("Member Access - 403 Forbidden", () => {
    it.each(ADMIN_ENDPOINTS)(
      "should return 403 for member accessing $method $path",
      async ({ method, path }) => {
        const member = await createTestUser(testDb, {
          ...mockMemberUser,
          password: "MemberPass123",
        });

        // Mock member session (not admin)
        vi.mocked(getServerSession).mockResolvedValue({
          user: { id: member.id, email: member.email, name: member.name, role: "MEMBER" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        });

        const response = await fetch(`http://localhost:3000${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: method !== "GET" && method !== "DELETE"
            ? JSON.stringify({ email: "test@test.com", name: "Test", password: "Test12345" })
            : undefined,
        });

        expect(response.status).toBe(403);

        const body = await response.json();
        expect(body.error).toBe("Admin access required");
      }
    );

    it("should return 403 for member trying to access user details", async () => {
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });
      const admin = await createTestAdmin(testDb);

      // Mock member session
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: member.id, email: member.email, name: member.name, role: "MEMBER" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch(`http://localhost:3000/api/users/${admin.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe("Admin access required");
    });
  });

  describe("Admin Access - 200 OK / Appropriate Response", () => {
    it("should allow admin to GET /api/users", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("should allow admin to POST /api/users", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "newuser@example.com",
          name: "New User",
          password: "NewUserPass123",
        }),
      });

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.email).toBe("newuser@example.com");
    });

    it("should allow admin to PUT /api/users/[id]", async () => {
      const admin = await createTestAdmin(testDb);
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch(`http://localhost:3000/api/users/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Name",
        }),
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.name).toBe("Updated Name");
    });

    it("should allow admin to DELETE /api/users/[id]", async () => {
      const admin = await createTestAdmin(testDb);
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch(`http://localhost:3000/api/users/${member.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.success).toBe(true);
    });

    it("should allow admin to GET /api/users/[id]", async () => {
      const admin = await createTestAdmin(testDb);
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch(`http://localhost:3000/api/users/${member.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.id).toBe(member.id);
    });
  });

  describe("Read-Only Endpoints - Member Access Allowed", () => {
    it("should allow member to GET /api/categories (read-only)", async () => {
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: member.id, email: member.email, name: member.name, role: "MEMBER" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Members can read categories
      expect(response.status).toBe(200);
    });

    it("should allow member to GET /api/events", async () => {
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: member.id, email: member.email, name: member.name, role: "MEMBER" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/events", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Members can read events
      expect(response.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    it("should reject requests with invalid session user", async () => {
      // Mock session with missing role
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: "test-id", email: "test@example.com", name: "Test" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const response = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Should fail - role missing
      expect(response.status).toBe(403);
    });

    it("should reject requests with empty session", async () => {
      // Mock empty session object
      vi.mocked(getServerSession).mockResolvedValue({
        user: null,
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      const response = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);
    });

    it("should handle case-sensitive role values", async () => {
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      // Mock session with lowercase role (should fail)
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: member.id, email: member.email, name: member.name, role: "admin" as any },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Role check should be case-sensitive (lowercase "admin" != "ADMIN")
      expect(response.status).toBe(403);
    });
  });

  describe("Admin Middleware Consistency", () => {
    it("should return consistent error format across all admin endpoints", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const responses = await Promise.all(
        ADMIN_ENDPOINTS.map(({ method, path }) =>
          fetch(`http://localhost:3000${path}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: method !== "GET" && method !== "DELETE"
              ? JSON.stringify({ email: "t@t.com", name: "T", password: "Test12345" })
              : undefined,
          }).then(async (r) => ({ status: r.status, body: await r.json() }))
        )
      );

      // All should return 401 with consistent error message
      responses.forEach((response) => {
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Unauthorized");
      });
    });

    it("should log admin access attempts for audit trail", async () => {
      const consoleSpy = vi.spyOn(console, "log");
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Implementation should log admin access (optional but recommended)
      // This test documents expected behavior but may need adjustment
      consoleSpy.mockRestore();
    });
  });
});
