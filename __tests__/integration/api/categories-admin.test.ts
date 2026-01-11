import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";
import {
  createTestCategory,
  seedTestCategories,
  createTestEvent,
} from "@/__tests__/helpers/calendar-helpers";
import {
  createTestAdmin,
  createTestMember,
  mockAdminUser,
  mockMemberUser,
} from "@/__tests__/helpers/auth-helpers";

// Mock NextAuth getServerSession
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Dynamic imports for routes after env vars are set
let POST: typeof import("@/app/api/categories/route").POST;
let PUT: typeof import("@/app/api/categories/[id]/route").PUT;
let DELETE: typeof import("@/app/api/categories/[id]/route").DELETE;

/**
 * Integration Tests: POST/PUT/DELETE /api/categories
 *
 * TDD Phase: RED - These tests should FAIL until the API routes are implemented.
 * Based on: API contract contracts/categories-api.md
 *
 * USER STORY 8: Admin Category Management
 * Goal: Admin panel for managing event categories (create, edit, delete)
 *
 * Test Categories:
 * - POST /api/categories (Create category)
 * - PUT /api/categories/[id] (Update category)
 * - DELETE /api/categories/[id] (Delete category)
 * - Authorization (admin only)
 * - Validation errors
 * - Edge cases
 *
 * API Contract (from categories-api.md):
 * - POST: { name, color, icon? } -> { data: Category }
 * - PUT: { name?, color?, icon? } -> { data: Category }
 * - DELETE: -> { data: { success: true, eventsUncategorized: number } }
 */

describe("Category Admin API", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport routes after env vars are set
    vi.resetModules();
    const categoriesRoute = await import("@/app/api/categories/route");
    const categoryIdRoute = await import("@/app/api/categories/[id]/route");
    POST = categoriesRoute.POST;
    PUT = categoryIdRoute.PUT;
    DELETE = categoryIdRoute.DELETE;
  }, 120000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    vi.clearAllMocks();
  });

  // Helper to mock admin session
  const mockAdminSession = async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        name: mockAdminUser.name,
        role: "ADMIN",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  // Helper to mock member session
  const mockMemberSession = async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: mockMemberUser.id,
        email: mockMemberUser.email,
        name: mockMemberUser.name,
        role: "MEMBER",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  // Helper to mock unauthenticated
  const mockUnauthenticated = async () => {
    const { getServerSession } = await import("next-auth");
    vi.mocked(getServerSession).mockResolvedValue(null);
  };

  describe("POST /api/categories", () => {
    describe("Authorization", () => {
      it("should return 401 when not authenticated", async () => {
        await mockUnauthenticated();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Test", color: "#F97316" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(401);

        const json = await response.json();
        expect(json.error).toBe("Unauthorized");
      });

      it("should return 403 when authenticated as non-admin", async () => {
        await mockMemberSession();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Test", color: "#F97316" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(403);

        const json = await response.json();
        expect(json.error).toBe("Admin access required");
      });
    });

    describe("Successful Creation", () => {
      it("should create category with required fields", async () => {
        await mockAdminSession();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({
            name: "New Category",
            color: "#F97316",
          }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(201);
        expect(json.data).toMatchObject({
          name: "New Category",
          color: "#F97316",
          icon: null,
        });
        expect(json.data.id).toBeDefined();
        expect(json.data.createdAt).toBeDefined();
      });

      it("should create category with optional icon", async () => {
        await mockAdminSession();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({
            name: "Work Events",
            color: "#3B82F6",
            icon: "briefcase",
          }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(201);
        expect(json.data).toMatchObject({
          name: "Work Events",
          color: "#3B82F6",
          icon: "briefcase",
        });
      });

      it("should persist category in database", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({
            name: "Persisted Category",
            color: "#10B981",
          }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        const json = await response.json();

        expect(response.status).toBe(201);

        // Verify in database
        const dbCategory = await prisma.eventCategory.findUnique({
          where: { id: json.data.id },
        });
        expect(dbCategory).not.toBeNull();
        expect(dbCategory?.name).toBe("Persisted Category");
      });
    });

    describe("Validation Errors", () => {
      it("should return 400 when name is missing", async () => {
        await mockAdminSession();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ color: "#F97316" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.error).toMatch(/validation/i);
      });

      it("should return 400 when color is missing", async () => {
        await mockAdminSession();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Test" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.error).toMatch(/validation/i);
      });

      it("should return 400 when color format is invalid", async () => {
        await mockAdminSession();

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Test", color: "red" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.error).toMatch(/validation/i);
      });

      it("should return 400 when name exceeds 50 characters", async () => {
        await mockAdminSession();

        const longName = "a".repeat(51);
        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: longName, color: "#F97316" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it("should return 400 when name already exists", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();

        // Create existing category
        await createTestCategory(prisma, { name: "Existing", color: "#F97316" });

        const request = new NextRequest("http://localhost:3000/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: "Existing", color: "#3B82F6" }),
          headers: { "Content-Type": "application/json" },
        });

        const response = await POST(request);
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.error).toMatch(/validation|exists|unique/i);
      });
    });
  });

  describe("PUT /api/categories/[id]", () => {
    describe("Authorization", () => {
      it("should return 401 when not authenticated", async () => {
        await mockUnauthenticated();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, { name: "Test", color: "#F97316" });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ name: "Updated" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        expect(response.status).toBe(401);
      });

      it("should return 403 when authenticated as non-admin", async () => {
        await mockMemberSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, { name: "Test", color: "#F97316" });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ name: "Updated" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        expect(response.status).toBe(403);
      });
    });

    describe("Successful Update", () => {
      it("should update category name", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, {
          name: "Original",
          color: "#F97316",
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ name: "Updated Name" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.name).toBe("Updated Name");
        expect(json.data.color).toBe("#F97316"); // Unchanged
      });

      it("should update category color", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, {
          name: "Test",
          color: "#F97316",
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ color: "#3B82F6" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.color).toBe("#3B82F6");
        expect(json.data.name).toBe("Test"); // Unchanged
      });

      it("should update category icon", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, {
          name: "Test",
          color: "#F97316",
          icon: "home",
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ icon: "briefcase" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.icon).toBe("briefcase");
      });

      it("should allow setting icon to null", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, {
          name: "Test",
          color: "#F97316",
          icon: "home",
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ icon: null }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.icon).toBeNull();
      });

      it("should update multiple fields at once", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, {
          name: "Original",
          color: "#F97316",
          icon: "home",
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: "New Name",
              color: "#3B82F6",
              icon: "star",
            }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data).toMatchObject({
          name: "New Name",
          color: "#3B82F6",
          icon: "star",
        });
      });
    });

    describe("Error Cases", () => {
      it("should return 404 when category does not exist", async () => {
        await mockAdminSession();

        const request = new NextRequest(
          "http://localhost:3000/api/categories/nonexistent-id",
          {
            method: "PUT",
            body: JSON.stringify({ name: "Updated" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: "nonexistent-id" }) });
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.error).toBe("Category not found");
      });

      it("should return 400 when name already exists", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();

        await createTestCategory(prisma, { name: "Existing", color: "#F97316" });
        const categoryToUpdate = await createTestCategory(prisma, {
          name: "ToUpdate",
          color: "#3B82F6",
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${categoryToUpdate.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ name: "Existing" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: categoryToUpdate.id }) });
        expect(response.status).toBe(400);
      });

      it("should return 400 when color format is invalid", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, { name: "Test", color: "#F97316" });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ color: "invalid" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
        expect(response.status).toBe(400);
      });
    });
  });

  describe("DELETE /api/categories/[id]", () => {
    describe("Authorization", () => {
      it("should return 401 when not authenticated", async () => {
        await mockUnauthenticated();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, { name: "Test", color: "#F97316" });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          { method: "DELETE" }
        );

        const response = await DELETE(request, { params: Promise.resolve({ id: category.id }) });
        expect(response.status).toBe(401);
      });

      it("should return 403 when authenticated as non-admin", async () => {
        await mockMemberSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, { name: "Test", color: "#F97316" });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          { method: "DELETE" }
        );

        const response = await DELETE(request, { params: Promise.resolve({ id: category.id }) });
        expect(response.status).toBe(403);
      });
    });

    describe("Successful Deletion", () => {
      it("should delete category with no events", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();
        const category = await createTestCategory(prisma, { name: "ToDelete", color: "#F97316" });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          { method: "DELETE" }
        );

        const response = await DELETE(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data).toMatchObject({
          success: true,
          eventsUncategorized: 0,
        });

        // Verify deleted from database
        const dbCategory = await prisma.eventCategory.findUnique({
          where: { id: category.id },
        });
        expect(dbCategory).toBeNull();
      });

      it("should delete category and uncategorize associated events", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();

        // Create admin user for event creation
        const admin = await createTestAdmin(prisma);

        // Create category and events
        const category = await createTestCategory(prisma, { name: "ToDelete", color: "#F97316" });
        await createTestEvent(prisma, {
          title: "Event 1",
          categoryId: category.id,
          createdById: admin.id,
        });
        await createTestEvent(prisma, {
          title: "Event 2",
          categoryId: category.id,
          createdById: admin.id,
        });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          { method: "DELETE" }
        );

        const response = await DELETE(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data).toMatchObject({
          success: true,
          eventsUncategorized: 2,
        });

        // Verify events are uncategorized but still exist
        const events = await prisma.event.findMany({
          where: { title: { in: ["Event 1", "Event 2"] } },
        });
        expect(events).toHaveLength(2);
        expect(events.every((e: { categoryId: string | null }) => e.categoryId === null)).toBe(true);
      });

      it("should return correct count of uncategorized events", async () => {
        await mockAdminSession();
        const prisma = getTestPrisma();

        const admin = await createTestAdmin(prisma);
        const category = await createTestCategory(prisma, { name: "ToDelete", color: "#F97316" });
        const otherCategory = await createTestCategory(prisma, { name: "Other", color: "#3B82F6" });

        // Create 3 events in category to delete
        await createTestEvent(prisma, { title: "E1", categoryId: category.id, createdById: admin.id });
        await createTestEvent(prisma, { title: "E2", categoryId: category.id, createdById: admin.id });
        await createTestEvent(prisma, { title: "E3", categoryId: category.id, createdById: admin.id });

        // Create 1 event in other category (should not be affected)
        await createTestEvent(prisma, { title: "E4", categoryId: otherCategory.id, createdById: admin.id });

        const request = new NextRequest(
          `http://localhost:3000/api/categories/${category.id}`,
          { method: "DELETE" }
        );

        const response = await DELETE(request, { params: Promise.resolve({ id: category.id }) });
        const json = await response.json();

        expect(json.data.eventsUncategorized).toBe(3);

        // Verify other category's event is unchanged
        const otherEvent = await prisma.event.findFirst({ where: { title: "E4" } });
        expect(otherEvent?.categoryId).toBe(otherCategory.id);
      });
    });

    describe("Error Cases", () => {
      it("should return 404 when category does not exist", async () => {
        await mockAdminSession();

        const request = new NextRequest(
          "http://localhost:3000/api/categories/nonexistent-id",
          { method: "DELETE" }
        );

        const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent-id" }) });
        expect(response.status).toBe(404);

        const json = await response.json();
        expect(json.error).toBe("Category not found");
      });
    });
  });

  describe("Response Format", () => {
    it("should return createdAt as ISO 8601 string on POST", async () => {
      await mockAdminSession();

      const request = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: "Test", color: "#F97316" }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      const date = new Date(json.data.createdAt);
      expect(date.toISOString()).toBe(json.data.createdAt);
    });

    it("should return all fields on PUT response", async () => {
      await mockAdminSession();
      const prisma = getTestPrisma();
      const category = await createTestCategory(prisma, {
        name: "Test",
        color: "#F97316",
        icon: "home",
      });

      const request = new NextRequest(
        `http://localhost:3000/api/categories/${category.id}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Updated" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PUT(request, { params: Promise.resolve({ id: category.id }) });
      const json = await response.json();

      expect(json.data).toHaveProperty("id");
      expect(json.data).toHaveProperty("name");
      expect(json.data).toHaveProperty("color");
      expect(json.data).toHaveProperty("icon");
      expect(json.data).toHaveProperty("createdAt");
    });
  });
});
