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
} from "@/__tests__/helpers/calendar-helpers";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/categories/route").GET;

/**
 * Integration Tests: GET /api/categories
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract contracts/categories-api.md
 *
 * USER STORY 5: Filter Events by Category
 * Goal: Display category filters with toggles to show/hide events by category
 *
 * Test Categories:
 * - Response shape validation
 * - All categories retrieval
 * - Default categories (seeded)
 * - Empty data handling
 * - Field validation (id, name, color, icon, createdAt)
 *
 * API Contract (from categories-api.md):
 * Response: {
 *   data: Array<{
 *     id: string;
 *     name: string;
 *     color: string;    // Hex color like #F97316
 *     icon: string | null;  // Lucide icon name
 *     createdAt: string;
 *   }>
 * }
 */

describe("GET /api/categories", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/categories/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe("Response Structure", () => {
    it("should return data with categories array", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("should return categories with all required fields", async () => {
      const prisma = getTestPrisma();
      await createTestCategory(prisma, {
        name: "Test Category",
        color: "#F97316",
        icon: "home",
      });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);

      const category = json.data[0];
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("color");
      expect(category).toHaveProperty("icon");
      expect(category).toHaveProperty("createdAt");

      // Verify types
      expect(typeof category.id).toBe("string");
      expect(typeof category.name).toBe("string");
      expect(typeof category.color).toBe("string");
      expect(typeof category.createdAt).toBe("string");
      expect(category.icon === null || typeof category.icon === "string").toBe(true);
    });

    it("should handle categories without icon", async () => {
      const prisma = getTestPrisma();
      await createTestCategory(prisma, {
        name: "No Icon Category",
        color: "#3B82F6",
        icon: null,
      });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].icon).toBeNull();
    });

    it("should return hex color in correct format", async () => {
      const prisma = getTestPrisma();
      await createTestCategory(prisma, {
        name: "Color Test",
        color: "#F97316",
      });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const category = json.data[0];
      expect(category.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe("Default Categories", () => {
    it("should return all 6 default seeded categories", async () => {
      const prisma = getTestPrisma();
      const categories = await seedTestCategories(prisma);

      expect(categories).toHaveLength(6);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(6);
    });

    it("should include Family category with correct properties", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const family = json.data.find((c: any) => c.name === "Family");
      expect(family).toBeDefined();
      expect(family.color).toBe("#F97316");
      expect(family.icon).toBe("home");
    });

    it("should include Work category with correct properties", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const work = json.data.find((c: any) => c.name === "Work");
      expect(work).toBeDefined();
      expect(work.color).toBe("#3B82F6");
      expect(work.icon).toBe("briefcase");
    });

    it("should include Medical category with correct properties", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const medical = json.data.find((c: any) => c.name === "Medical");
      expect(medical).toBeDefined();
      expect(medical.color).toBe("#EF4444");
      expect(medical.icon).toBe("heart");
    });

    it("should include Social category with correct properties", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const social = json.data.find((c: any) => c.name === "Social");
      expect(social).toBeDefined();
      expect(social.color).toBe("#8B5CF6");
      expect(social.icon).toBe("users");
    });

    it("should include Finance category with correct properties", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const finance = json.data.find((c: any) => c.name === "Finance");
      expect(finance).toBeDefined();
      expect(finance.color).toBe("#10B981");
      expect(finance.icon).toBe("dollar-sign");
    });

    it("should include Other category with correct properties", async () => {
      const prisma = getTestPrisma();
      await seedTestCategories(prisma);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const other = json.data.find((c: any) => c.name === "Other");
      expect(other).toBeDefined();
      expect(other.color).toBe("#6B7280");
      expect(other.icon).toBe("calendar");
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty array when no categories exist", async () => {
      // Don't seed any categories

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });
  });

  describe("Multiple Categories", () => {
    it("should return all categories when multiple exist", async () => {
      const prisma = getTestPrisma();

      await createTestCategory(prisma, {
        name: "Category 1",
        color: "#F97316",
        icon: "star",
      });

      await createTestCategory(prisma, {
        name: "Category 2",
        color: "#3B82F6",
        icon: "moon",
      });

      await createTestCategory(prisma, {
        name: "Category 3",
        color: "#10B981",
      });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
      const names = json.data.map((c: any) => c.name);
      expect(names).toContain("Category 1");
      expect(names).toContain("Category 2");
      expect(names).toContain("Category 3");
    });
  });

  describe("Category Ordering", () => {
    it("should return categories ordered by name ascending", async () => {
      const prisma = getTestPrisma();

      await createTestCategory(prisma, { name: "Zebra", color: "#F97316" });
      await createTestCategory(prisma, { name: "Apple", color: "#3B82F6" });
      await createTestCategory(prisma, { name: "Mango", color: "#10B981" });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
      expect(json.data[0].name).toBe("Apple");
      expect(json.data[1].name).toBe("Mango");
      expect(json.data[2].name).toBe("Zebra");
    });
  });

  describe("Timestamp Format", () => {
    it("should return createdAt as ISO 8601 string", async () => {
      const prisma = getTestPrisma();
      await createTestCategory(prisma, {
        name: "Timestamp Test",
        color: "#F97316",
      });

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);
      const json = await response.json();

      const category = json.data[0];
      expect(category.createdAt).toBeDefined();

      // Verify it's a valid ISO 8601 string
      const date = new Date(category.createdAt);
      expect(date.toISOString()).toBe(category.createdAt);
    });
  });
});
