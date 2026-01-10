/**
 * Integration tests for User Management API
 *
 * Tests the admin-only user CRUD endpoints (FR-031, FR-032, FR-033):
 * - GET /api/users (list all users)
 * - POST /api/users (create user)
 * - GET /api/users/[id] (get single user)
 * - PUT /api/users/[id] (update user)
 * - DELETE /api/users/[id] (delete user)
 *
 * NOTE: These tests will FAIL until T084-T088 (users API implementation) complete.
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

describe("Users API Integration Tests", () => {
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

  describe("GET /api/users - List Users (FR-031)", () => {
    it("should return list of all users for admin", async () => {
      // Setup: Create admin and regular users
      const admin = await createTestAdmin(testDb);
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      // Mock admin session
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
      expect(body.data.length).toBe(2);

      // Should not return passwordHash
      body.data.forEach((user: any) => {
        expect(user.passwordHash).toBeUndefined();
        expect(user.id).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.role).toMatch(/^(ADMIN|MEMBER)$/);
      });
    });

    it("should return 401 for unauthenticated request", async () => {
      // Mock no session
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await fetch("http://localhost:3000/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 403 for non-admin user", async () => {
      // Setup: Create member user
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      // Mock member session (not admin)
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: member.id, email: member.email, name: member.name, role: "MEMBER" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users", {
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

  describe("POST /api/users - Create User (FR-032)", () => {
    it("should create new user with valid data", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const newUser = {
        email: "newuser@example.com",
        name: "New User",
        password: "NewUserPass123",
        role: "MEMBER",
        avatarColor: "#10B981",
      };

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data).toBeDefined();
      expect(body.data.id).toBeDefined();
      expect(body.data.email).toBe(newUser.email);
      expect(body.data.name).toBe(newUser.name);
      expect(body.data.role).toBe("MEMBER");
      expect(body.data.avatarColor).toBe(newUser.avatarColor);
      expect(body.data.passwordHash).toBeUndefined(); // Should never return password

      // Verify user was actually created in database
      const dbUser = await testDb.user.findUnique({
        where: { email: newUser.email },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.name).toBe(newUser.name);
    });

    it("should create admin user when role is ADMIN", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const newAdmin = {
        email: "newadmin@example.com",
        name: "New Admin",
        password: "AdminPass123",
        role: "ADMIN",
      };

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAdmin),
      });

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.data.role).toBe("ADMIN");
    });

    it("should reject duplicate email", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      // Create first user
      await createTestUser(testDb, {
        email: "duplicate@example.com",
        password: "Password123",
      });

      // Try to create with same email
      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "duplicate@example.com",
          name: "Duplicate User",
          password: "Password123",
        }),
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details?.fieldErrors?.email).toContain("Email already exists");
    });

    it("should reject invalid password (too short)", async () => {
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
          password: "short1", // Less than 8 characters
        }),
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.details?.fieldErrors?.password).toBeDefined();
    });

    it("should reject password without number (FR-004)", async () => {
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
          password: "NoNumberPassword", // No number
        }),
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Validation failed");
    });

    it("should reject invalid email format", async () => {
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
          email: "not-an-email",
          name: "Invalid Email User",
          password: "ValidPass123",
        }),
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Validation failed");
    });

    it("should return 401 for unauthenticated request", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "newuser@example.com",
          name: "New User",
          password: "ValidPass123",
        }),
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 for non-admin user", async () => {
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "MemberPass123",
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: member.id, email: member.email, name: member.name, role: "MEMBER" },
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
          password: "ValidPass123",
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/users/[id] - Get Single User", () => {
    it("should return user details for admin", async () => {
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
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe(member.id);
      expect(body.data.email).toBe(member.email);
      expect(body.data.name).toBe(member.name);
      expect(body.data.role).toBe("MEMBER");
      expect(body.data.passwordHash).toBeUndefined();
    });

    it("should return 404 for non-existent user", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users/nonexistent-id", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe("User not found");
    });
  });

  describe("PUT /api/users/[id] - Update User (FR-033)", () => {
    it("should update user name", async () => {
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

      // Verify database was updated
      const dbUser = await testDb.user.findUnique({
        where: { id: member.id },
      });
      expect(dbUser?.name).toBe("Updated Name");
    });

    it("should update user email", async () => {
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
          email: "updated@example.com",
        }),
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.email).toBe("updated@example.com");
    });

    it("should update user password (hashed)", async () => {
      const admin = await createTestAdmin(testDb);
      const member = await createTestUser(testDb, {
        ...mockMemberUser,
        password: "OldPassword123",
      });

      const oldHash = (await testDb.user.findUnique({ where: { id: member.id } }))?.passwordHash;

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
          password: "NewPassword456",
        }),
      });

      expect(response.status).toBe(200);

      // Verify password hash changed
      const dbUser = await testDb.user.findUnique({
        where: { id: member.id },
      });
      expect(dbUser?.passwordHash).not.toBe(oldHash);
    });

    it("should change user role from MEMBER to ADMIN", async () => {
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
          role: "ADMIN",
        }),
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.data.role).toBe("ADMIN");
    });

    it("should unlock account when unlockAccount is true", async () => {
      const admin = await createTestAdmin(testDb);
      const lockedUser = await createTestUser(testDb, {
        email: "locked@example.com",
        password: "LockedPass123",
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch(`http://localhost:3000/api/users/${lockedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unlockAccount: true,
        }),
      });

      expect(response.status).toBe(200);

      // Verify account was unlocked
      const dbUser = await testDb.user.findUnique({
        where: { id: lockedUser.id },
      });
      expect(dbUser?.failedLoginAttempts).toBe(0);
      expect(dbUser?.lockedUntil).toBeNull();
    });

    it("should return 404 for non-existent user", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users/nonexistent-id", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "New Name",
        }),
      });

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe("User not found");
    });

    it("should reject invalid password on update", async () => {
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
          password: "short1", // Too short
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/users/[id] - Delete User", () => {
    it("should delete user", async () => {
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

      // Verify user was deleted
      const dbUser = await testDb.user.findUnique({
        where: { id: member.id },
      });
      expect(dbUser).toBeNull();
    });

    it("should not allow deleting own account", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch(`http://localhost:3000/api/users/${admin.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Cannot delete your own account");
    });

    it("should not allow deleting last admin", async () => {
      // Create only one admin
      const admin = await createTestAdmin(testDb);
      const anotherAdmin = await createTestUser(testDb, {
        email: "admin2@example.com",
        password: "Admin2Pass123",
        role: "ADMIN",
      });

      // Delete the other admin first
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      await fetch(`http://localhost:3000/api/users/${anotherAdmin.id}`, {
        method: "DELETE",
      });

      // Now try to delete the last admin (self)
      const response = await fetch(`http://localhost:3000/api/users/${admin.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toMatch(/Cannot delete.*admin/i);
    });

    it("should return 404 for non-existent user", async () => {
      const admin = await createTestAdmin(testDb);

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: admin.id, email: admin.email, name: admin.name, role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      });

      const response = await fetch("http://localhost:3000/api/users/nonexistent-id", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe("User not found");
    });
  });
});
