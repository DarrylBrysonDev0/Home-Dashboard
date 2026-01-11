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
  createTestCategory,
  seedTestCategories,
} from "@/__tests__/helpers/calendar-helpers";

// Mock getAuthSession before importing the route
vi.mock("@/lib/server/auth-session", () => ({
  getAuthSession: vi.fn(),
}));

// Dynamic import for the route after env vars are set
let POST: typeof import("@/app/api/events/route").POST;
let getAuthSession: ReturnType<typeof vi.fn>;

/**
 * Integration Tests: POST /api/events
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract contracts/events-api.md
 *
 * USER STORY 3: Create and Edit Events
 * Goal: Enable creating events with all fields, validation, and authentication
 *
 * Test Categories:
 * - Authentication requirement (FR-001)
 * - Successful event creation (FR-015, FR-016)
 * - Validation errors (title, times, field lengths)
 * - Category assignment (FR-016)
 * - All-day events (FR-017)
 * - Timezone handling (FR-022)
 * - Response shape validation
 *
 * API Contract (from events-api.md):
 * Request Body: {
 *   title, description?, location?,
 *   startTime, endTime, allDay?, categoryId?, timezone?
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

describe("POST /api/events", () => {
  let testUserId: string;
  let testCategoryId: string;
  let testCategoryId2: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/events/route");
    POST = routeModule.POST;
    // Import the mocked function
    const authModule = await import("@/lib/server/auth-session");
    getAuthSession = authModule.getAuthSession as ReturnType<typeof vi.fn>;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();

    // Create test user for event creation
    const prisma = getTestPrisma();
    const user = await createTestUser(prisma, {
      email: "test@example.com",
      password: "TestPass123",
      name: "Test User",
    });
    testUserId = user.id;

    // Create test categories
    const categories = await seedTestCategories(prisma);
    testCategoryId = categories[0].id; // Family category
    testCategoryId2 = categories[1].id; // Work category

    // Default mock: authenticated session with test user
    getAuthSession.mockResolvedValue({
      user: {
        id: testUserId,
        email: "test@example.com",
        name: "Test User",
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

      const eventData = {
        title: "Test Event",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should allow authenticated MEMBER users to create events", async () => {
      const eventData = {
        title: "Member Event",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data.title).toBe("Member Event");
    });

    it("should allow authenticated ADMIN users to create events", async () => {
      const eventData = {
        title: "Admin Event",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data.title).toBe("Admin Event");
    });
  });

  // ============================================
  // SUCCESSFUL EVENT CREATION
  // ============================================

  describe("Successful Event Creation", () => {
    it("should create event with all fields", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Complete Event",
        description: "Event with all fields populated",
        location: "Conference Room A",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
        allDay: false,
        categoryId: testCategoryId,
        timezone: "America/New_York",
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(data.data).toMatchObject({
        title: "Complete Event",
        description: "Event with all fields populated",
        location: "Conference Room A",
        allDay: false,
        timezone: "America/New_York",
      });
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("startTime");
      expect(data.data).toHaveProperty("endTime");
      expect(data.data).toHaveProperty("createdAt");
      expect(data.data).toHaveProperty("updatedAt");
    });

    it("should create event with minimal required fields", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Minimal Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data.title).toBe("Minimal Event");
      expect(data.data.description).toBeNull();
      expect(data.data.location).toBeNull();
      expect(data.data.allDay).toBe(false); // Default value
      expect(data.data.timezone).toBe("America/New_York"); // Default value
    });

    it("should create all-day event (FR-017)", async () => {
      const today = DateTime.now().startOf("day");
      const eventData = {
        title: "All-Day Event",
        startTime: today.toISO(),
        endTime: today.endOf("day").toISO(),
        allDay: true,
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data.allDay).toBe(true);
      expect(data.data.title).toBe("All-Day Event");
    });

    it("should create event with custom timezone (FR-022)", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "London Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
        timezone: "Europe/London",
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data.timezone).toBe("Europe/London");
    });

    it("should associate event with category (FR-016)", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Categorized Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
        categoryId: testCategoryId,
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data).toHaveProperty("category");
      expect(data.data.category).not.toBeNull();
      expect(data.data.category).toHaveProperty("id", testCategoryId);
      expect(data.data.category).toHaveProperty("name");
      expect(data.data.category).toHaveProperty("color");
    });

    it("should create event without category", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Uncategorized Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data.category).toBeNull();
    });

    it("should set createdBy to authenticated user (FR-023)", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "User Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.data).toHaveProperty("createdBy");
      expect(data.data.createdBy).toHaveProperty("id");
      expect(data.data.createdBy).toHaveProperty("name");
    });
  });

  // ============================================
  // VALIDATION ERROR TESTS
  // ============================================

  describe("Validation Errors", () => {
    it("should reject event with missing title", async () => {
      const eventData = {
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/title/i);
    });

    it("should reject event with empty title", async () => {
      const eventData = {
        title: "",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject event with title > 200 characters", async () => {
      const eventData = {
        title: "A".repeat(201),
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/200 characters/i);
    });

    it("should reject event with description > 2000 characters", async () => {
      const eventData = {
        title: "Event",
        description: "A".repeat(2001),
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/2000 characters/i);
    });

    it("should reject event with location > 500 characters", async () => {
      const eventData = {
        title: "Event",
        location: "A".repeat(501),
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/500 characters/i);
    });

    it("should reject event with missing startTime", async () => {
      const eventData = {
        title: "Event",
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject event with missing endTime", async () => {
      const eventData = {
        title: "Event",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject event where endTime equals startTime", async () => {
      const time = DateTime.now().plus({ hours: 1 }).toISO();
      const eventData = {
        title: "Event",
        startTime: time,
        endTime: time, // Same as start
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/after start time/i);
    });

    it("should reject event where endTime is before startTime", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Event",
        startTime: now.plus({ hours: 2 }).toISO(),
        endTime: now.plus({ hours: 1 }).toISO(), // Before start
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatch(/after start time/i);
    });

    it("should reject event with invalid ISO 8601 startTime format", async () => {
      const eventData = {
        title: "Event",
        startTime: "2026-01-15 14:00:00", // Missing 'T' and 'Z'
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject event with invalid categoryId format", async () => {
      const eventData = {
        title: "Event",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
        categoryId: "not-a-cuid",
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should reject event with non-existent categoryId", async () => {
      const eventData = {
        title: "Event",
        startTime: DateTime.now().plus({ hours: 1 }).toISO(),
        endTime: DateTime.now().plus({ hours: 2 }).toISO(),
        categoryId: "clx0000000000000000000", // Valid CUID format but doesn't exist
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      // Should either return 400 (validation error) or 404 (not found)
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
      const now = DateTime.now();
      const eventData = {
        title: "Structure Test Event",
        description: "Test description",
        location: "Test location",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
        allDay: false,
        categoryId: testCategoryId,
        timezone: "America/New_York",
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

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
      expect(data.data.category).toHaveProperty("id");
      expect(data.data.category).toHaveProperty("name");
      expect(data.data.category).toHaveProperty("color");

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
    it("should persist event to database", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Persisted Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      const eventId = data.data.id;

      // Verify event exists in database
      const prisma = getTestPrisma();
      const dbEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      expect(dbEvent).not.toBeNull();
      expect(dbEvent?.title).toBe("Persisted Event");
    });

    it("should store timestamps in database", async () => {
      const now = DateTime.now();
      const eventData = {
        title: "Timestamp Event",
        startTime: now.plus({ hours: 1 }).toISO(),
        endTime: now.plus({ hours: 2 }).toISO(),
      };

      const request = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = await response.json();
      const eventId = data.data.id;

      // Verify timestamps in database
      const prisma = getTestPrisma();
      const dbEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      expect(dbEvent?.createdAt).toBeInstanceOf(Date);
      expect(dbEvent?.updatedAt).toBeInstanceOf(Date);
      expect(dbEvent?.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
