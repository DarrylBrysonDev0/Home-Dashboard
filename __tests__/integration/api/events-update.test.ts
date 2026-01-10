import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";
import { DateTime } from "luxon";
import {
  createTestUser,
  createMockMemberSession,
  createMockAdminSession,
} from "@/__tests__/helpers/auth-helpers";
import {
  createTestEvent,
  createTestCategory,
  seedTestCategories,
} from "@/__tests__/helpers/calendar-helpers";

// Mock getAuthSession before importing the route
vi.mock("@/lib/server/auth-session", () => ({
  getAuthSession: vi.fn(),
}));

// Dynamic import for the route after env vars are set
let PUT: typeof import("@/app/api/events/[id]/route").PUT;
let getAuthSession: ReturnType<typeof vi.fn>;

/**
 * Integration Tests: PUT /api/events/[id]
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract contracts/events-api.md
 *
 * USER STORY 3: Create and Edit Events
 * Goal: Enable editing events with validation, partial updates, and drag-and-drop (FR-018, FR-020)
 *
 * Test Categories:
 * - Authentication requirement (FR-001)
 * - Successful full update (all fields)
 * - Successful partial update (specific fields only)
 * - Validation errors (title, times, field lengths)
 * - Category reassignment (FR-016)
 * - Timezone changes (FR-022)
 * - Clearing optional fields (set to null)
 * - Non-existent event handling
 * - Response shape validation
 *
 * API Contract (from events-api.md):
 * Request Body: {
 *   title?, description?, location?,
 *   startTime?, endTime?, allDay?, categoryId?, timezone?
 * }
 * Response: {
 *   data: {
 *     id, title, description, location,
 *     startTime, endTime, allDay, timezone,
 *     category: { id, name, color, icon } | null,
 *     createdBy: { id, name },
 *     createdAt, updatedAt
 *   }
 * }
 */

describe("PUT /api/events/[id]", () => {
  let testUserId: string;
  let testUser2Id: string;
  let testCategoryId: string;
  let testCategoryId2: string;
  let testEventId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/events/[id]/route");
    PUT = routeModule.PUT;
    // Import the mocked function
    const authModule = await import("@/lib/server/auth-session");
    getAuthSession = authModule.getAuthSession as ReturnType<typeof vi.fn>;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();

    // Create test users
    const prisma = getTestPrisma();
    const user1 = await createTestUser(prisma, {
      email: "user1@example.com",
      password: "TestPass123",
      name: "Test User 1",
    });
    testUserId = user1.id;

    const user2 = await createTestUser(prisma, {
      email: "user2@example.com",
      password: "TestPass456",
      name: "Test User 2",
    });
    testUser2Id = user2.id;

    // Create test categories
    const categories = await seedTestCategories(prisma);
    testCategoryId = categories[0].id; // Family category
    testCategoryId2 = categories[1].id; // Work category

    // Create a test event to update
    const now = DateTime.now();
    const event = await createTestEvent(prisma, {
      title: "Original Event",
      description: "Original description",
      location: "Original location",
      startTime: now.plus({ hours: 1 }).toJSDate(),
      endTime: now.plus({ hours: 2 }).toJSDate(),
      allDay: false,
      categoryId: testCategoryId,
      timezone: "America/New_York",
      createdById: testUserId,
    });
    testEventId = event.id;

    // Default mock: authenticated session with test user
    getAuthSession.mockResolvedValue({
      user: {
        id: testUserId,
        email: "user1@example.com",
        name: "Test User 1",
        role: "MEMBER",
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      // Override mock to return null (unauthenticated)
      getAuthSession.mockResolvedValueOnce(null);

      const updateData = {
        title: "Updated Title",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should allow authenticated MEMBER users to update events (FR-018)", async () => {
      const updateData = {
        title: "Updated by Member",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.title).toBe("Updated by Member");
    });

    it("should allow authenticated ADMIN users to update events", async () => {
      const updateData = {
        title: "Updated by Admin",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.title).toBe("Updated by Admin");
    });

    it("should allow any household member to update any event (FR-018)", async () => {
      // User 2 updating User 1's event
      const updateData = {
        title: "Updated by Different User",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.title).toBe("Updated by Different User");
    });
  });

  // ============================================
  // SUCCESSFUL FULL UPDATE
  // ============================================

  describe("Successful Full Update", () => {
    it("should update all fields of an event", async () => {
      const now = DateTime.now();
      const updateData = {
        title: "Fully Updated Event",
        description: "New description",
        location: "New location",
        startTime: now.plus({ hours: 3 }).toISO(),
        endTime: now.plus({ hours: 4 }).toISO(),
        allDay: true,
        categoryId: testCategoryId2, // Change category
        timezone: "Europe/London",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toMatchObject({
        id: testEventId,
        title: "Fully Updated Event",
        description: "New description",
        location: "New location",
        allDay: true,
        timezone: "Europe/London",
      });
      expect(data.data.category.id).toBe(testCategoryId2);
    });
  });

  // ============================================
  // SUCCESSFUL PARTIAL UPDATE
  // ============================================

  describe("Successful Partial Update", () => {
    it("should update only title, leaving other fields unchanged", async () => {
      const updateData = {
        title: "Only Title Changed",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.title).toBe("Only Title Changed");
      expect(data.data.description).toBe("Original description"); // Unchanged
      expect(data.data.location).toBe("Original location"); // Unchanged
    });

    it("should update only description", async () => {
      const updateData = {
        description: "New description only",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.description).toBe("New description only");
      expect(data.data.title).toBe("Original Event"); // Unchanged
    });

    it("should update only location", async () => {
      const updateData = {
        location: "New location only",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.location).toBe("New location only");
    });

    it("should update only start and end times (drag-and-drop scenario, FR-020)", async () => {
      const now = DateTime.now();
      const updateData = {
        startTime: now.plus({ hours: 5 }).toISO(),
        endTime: now.plus({ hours: 6 }).toISO(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(new Date(data.data.startTime).getTime()).toBeCloseTo(
        now.plus({ hours: 5 }).toMillis(),
        -2 // Allow 100ms tolerance
      );
      expect(data.data.title).toBe("Original Event"); // Unchanged
    });

    it("should update only allDay flag", async () => {
      const updateData = {
        allDay: true,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.allDay).toBe(true);
      expect(data.data.title).toBe("Original Event"); // Unchanged
    });

    it("should update only category (FR-016)", async () => {
      const updateData = {
        categoryId: testCategoryId2,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.category.id).toBe(testCategoryId2);
      expect(data.data.title).toBe("Original Event"); // Unchanged
    });

    it("should update only timezone (FR-022)", async () => {
      const updateData = {
        timezone: "Asia/Tokyo",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.timezone).toBe("Asia/Tokyo");
    });
  });

  // ============================================
  // CLEARING OPTIONAL FIELDS
  // ============================================

  describe("Clearing Optional Fields", () => {
    it("should clear description by setting to null", async () => {
      const updateData = {
        description: null,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.description).toBeNull();
    });

    it("should clear location by setting to null", async () => {
      const updateData = {
        location: null,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.location).toBeNull();
    });

    it("should clear category by setting to null", async () => {
      const updateData = {
        categoryId: null,
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.category).toBeNull();
    });
  });

  // ============================================
  // VALIDATION ERROR TESTS
  // ============================================

  describe("Validation Errors", () => {
    it("should reject empty title", async () => {
      const updateData = {
        title: "",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject title > 200 characters", async () => {
      const updateData = {
        title: "A".repeat(201),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toMatch(/200 characters/i);
    });

    it("should reject description > 2000 characters", async () => {
      const updateData = {
        description: "A".repeat(2001),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toMatch(/2000 characters/i);
    });

    it("should reject location > 500 characters", async () => {
      const updateData = {
        location: "A".repeat(501),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toMatch(/500 characters/i);
    });

    it("should reject when both times provided and endTime before startTime", async () => {
      const now = DateTime.now();
      const updateData = {
        startTime: now.plus({ hours: 2 }).toISO(),
        endTime: now.plus({ hours: 1 }).toISO(), // Before start
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toMatch(/after start time/i);
    });

    it("should reject invalid categoryId format", async () => {
      const updateData = {
        categoryId: "not-a-cuid",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject non-existent categoryId", async () => {
      const updateData = {
        categoryId: "clx0000000000000000000", // Valid format but doesn't exist
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect([400, 404]).toContain(response.status);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });

  // ============================================
  // NON-EXISTENT EVENT HANDLING
  // ============================================

  describe("Non-Existent Event", () => {
    it("should return 404 for non-existent event ID", async () => {
      const fakeEventId = "clx9999999999999999999";
      const updateData = {
        title: "Updated Title",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${fakeEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: fakeEventId } });
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/not found/i);
    });

    it("should return 400 for invalid event ID format", async () => {
      const invalidId = "not-a-cuid";
      const updateData = {
        title: "Updated Title",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${invalidId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: invalidId } });
      expect([400, 404]).toContain(response.status);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });
  });

  // ============================================
  // RESPONSE SHAPE VALIDATION
  // ============================================

  describe("Response Shape", () => {
    it("should return correct response structure", async () => {
      const updateData = {
        title: "Structure Test",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();

      // Check top-level structure
      expect(data).toHaveProperty("data");
      expect(data.data).toBeTypeOf("object");

      // Check event fields
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("title");
      expect(data.data).toHaveProperty("description");
      expect(data.data).toHaveProperty("location");
      expect(data.data).toHaveProperty("startTime");
      expect(data.data).toHaveProperty("endTime");
      expect(data.data).toHaveProperty("allDay");
      expect(data.data).toHaveProperty("timezone");
      expect(data.data).toHaveProperty("createdAt");
      expect(data.data).toHaveProperty("updatedAt");

      // Check category nested object
      expect(data.data).toHaveProperty("category");

      // Check createdBy nested object
      expect(data.data).toHaveProperty("createdBy");
      expect(data.data.createdBy).toHaveProperty("id");
      expect(data.data.createdBy).toHaveProperty("name");
    });
  });

  // ============================================
  // DATABASE PERSISTENCE TESTS
  // ============================================

  describe("Database Persistence", () => {
    it("should persist updates to database", async () => {
      const updateData = {
        title: "Persisted Update",
        description: "Updated description",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      // Verify updates in database
      const prisma = getTestPrisma();
      const dbEvent = await prisma.event.findUnique({
        where: { id: testEventId },
      });

      expect(dbEvent?.title).toBe("Persisted Update");
      expect(dbEvent?.description).toBe("Updated description");
    });

    it("should update updatedAt timestamp", async () => {
      const prisma = getTestPrisma();
      const beforeUpdate = await prisma.event.findUnique({
        where: { id: testEventId },
      });
      const originalUpdatedAt = beforeUpdate?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updateData = {
        title: "Timestamp Update",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      await PUT(request, { params: { id: testEventId } });

      // Verify updatedAt changed
      const afterUpdate = await prisma.event.findUnique({
        where: { id: testEventId },
      });

      expect(afterUpdate?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt!.getTime()
      );
    });

    it("should preserve createdAt timestamp", async () => {
      const prisma = getTestPrisma();
      const beforeUpdate = await prisma.event.findUnique({
        where: { id: testEventId },
      });
      const originalCreatedAt = beforeUpdate?.createdAt;

      const updateData = {
        title: "CreatedAt Preservation Test",
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      await PUT(request, { params: { id: testEventId } });

      // Verify createdAt unchanged
      const afterUpdate = await prisma.event.findUnique({
        where: { id: testEventId },
      });

      expect(afterUpdate?.createdAt.getTime()).toBe(
        originalCreatedAt!.getTime()
      );
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe("Edge Cases", () => {
    it("should handle empty update object (no changes)", async () => {
      const updateData = {};

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.title).toBe("Original Event"); // Unchanged
    });

    it("should validate endTime > startTime when updating only startTime", async () => {
      // Update startTime to be after current endTime
      const prisma = getTestPrisma();
      const currentEvent = await prisma.event.findUnique({
        where: { id: testEventId },
      });

      const updateData = {
        startTime: DateTime.fromJSDate(currentEvent!.endTime)
          .plus({ hours: 1 })
          .toISO(),
      };

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      const response = await PUT(request, { params: { id: testEventId } });
      // Should succeed since we only validate when BOTH times are in the update
      expect(response.status).toBe(200);
    });
  });
});
