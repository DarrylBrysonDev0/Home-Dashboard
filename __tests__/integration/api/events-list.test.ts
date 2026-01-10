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
} from "@/__tests__/helpers/auth-helpers";
import {
  createTestEvent,
  createTestCategory,
  seedTestCategories,
} from "@/__tests__/helpers/calendar-helpers";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/events/route").GET;

/**
 * Integration Tests: GET /api/events
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract contracts/events-api.md
 *
 * USER STORY 2: View Calendar and Browse Events
 * Goal: Display calendar in month/week/day views with navigation and event details
 *
 * Test Categories:
 * - Response shape validation
 * - Date range filtering (start, end query params)
 * - Category filtering (categoryId query param)
 * - Empty data handling
 * - Authentication requirement
 * - Combined filters
 *
 * API Contract (from events-api.md):
 * Query Params: start (ISO 8601), end (ISO 8601), categoryId (cuid)
 * Response: {
 *   data: Array<{
 *     id, title, description, location,
 *     startTime, endTime, allDay, timezone,
 *     category: { id, name, color, icon } | null,
 *     createdBy: { id, name },
 *     createdAt, updatedAt
 *   }>
 * }
 */

describe("GET /api/events", () => {
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/events/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();

    // Create test user for event ownership
    const prisma = getTestPrisma();
    const user = await createTestUser(prisma, {
      email: "test@example.com",
      password: "TestPass123",
      name: "Test User",
    });
    testUserId = user.id;

    // Create test category
    const categories = await seedTestCategories(prisma);
    testCategoryId = categories[0].id; // Family category
  });

  describe("Response Structure", () => {
    it("should return data with events array", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create a test event
      await createTestEvent(prisma, {
        title: "Test Event",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("should return events with all required fields", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      await createTestEvent(prisma, {
        title: "Complete Event",
        description: "Event description",
        location: "Test Location",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        allDay: false,
        timezone: "America/New_York",
        categoryId: testCategoryId,
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);

      const event = json.data[0];
      // Core fields
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title");
      expect(event).toHaveProperty("description");
      expect(event).toHaveProperty("location");
      expect(event).toHaveProperty("startTime");
      expect(event).toHaveProperty("endTime");
      expect(event).toHaveProperty("allDay");
      expect(event).toHaveProperty("timezone");

      // Relations
      expect(event).toHaveProperty("category");
      expect(event.category).toHaveProperty("id");
      expect(event.category).toHaveProperty("name");
      expect(event.category).toHaveProperty("color");

      expect(event).toHaveProperty("createdBy");
      expect(event.createdBy).toHaveProperty("id");
      expect(event.createdBy).toHaveProperty("name");

      // Timestamps
      expect(event).toHaveProperty("createdAt");
      expect(event).toHaveProperty("updatedAt");
    });

    it("should handle events without category", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      await createTestEvent(prisma, {
        title: "Uncategorized Event",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        categoryId: null,
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].category).toBeNull();
    });
  });

  describe("Date Range Filtering", () => {
    it("should filter events by start date (inclusive)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create events: one before, two within range
      await createTestEvent(prisma, {
        title: "Event Before",
        startTime: now.minus({ days: 10 }).toJSDate(),
        endTime: now.minus({ days: 10, hours: -1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event In Range 1",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event In Range 2",
        startTime: now.plus({ days: 3 }).toJSDate(),
        endTime: now.plus({ days: 3, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const startDate = now.toISO();
      const request = new NextRequest(
        `http://localhost:3000/api/events?start=${startDate}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
      const titles = json.data.map((e: any) => e.title);
      expect(titles).toContain("Event In Range 1");
      expect(titles).toContain("Event In Range 2");
      expect(titles).not.toContain("Event Before");
    });

    it("should filter events by end date (inclusive)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create events: two within range, one after
      await createTestEvent(prisma, {
        title: "Event In Range 1",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event In Range 2",
        startTime: now.plus({ days: 5 }).toJSDate(),
        endTime: now.plus({ days: 5, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event After",
        startTime: now.plus({ days: 20 }).toJSDate(),
        endTime: now.plus({ days: 20, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const endDate = now.plus({ days: 7 }).toISO();
      const request = new NextRequest(
        `http://localhost:3000/api/events?end=${endDate}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
      const titles = json.data.map((e: any) => e.title);
      expect(titles).toContain("Event In Range 1");
      expect(titles).toContain("Event In Range 2");
      expect(titles).not.toContain("Event After");
    });

    it("should filter events by both start and end date", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create events: before, within, after range
      await createTestEvent(prisma, {
        title: "Event Before",
        startTime: now.minus({ days: 10 }).toJSDate(),
        endTime: now.minus({ days: 10, hours: -1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event In Range",
        startTime: now.plus({ days: 3 }).toJSDate(),
        endTime: now.plus({ days: 3, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event After",
        startTime: now.plus({ days: 20 }).toJSDate(),
        endTime: now.plus({ days: 20, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const startDate = now.toISO();
      const endDate = now.plus({ days: 7 }).toISO();
      const request = new NextRequest(
        `http://localhost:3000/api/events?start=${startDate}&end=${endDate}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("Event In Range");
    });

    it("should include events that overlap the date range", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Event starts before range, ends within range
      await createTestEvent(prisma, {
        title: "Event Overlap Start",
        startTime: now.minus({ days: 2 }).toJSDate(),
        endTime: now.plus({ days: 2 }).toJSDate(),
        createdById: testUserId,
      });

      // Event starts within range, ends after range
      await createTestEvent(prisma, {
        title: "Event Overlap End",
        startTime: now.plus({ days: 5 }).toJSDate(),
        endTime: now.plus({ days: 10 }).toJSDate(),
        createdById: testUserId,
      });

      // Event spans entire range
      await createTestEvent(prisma, {
        title: "Event Span All",
        startTime: now.minus({ days: 5 }).toJSDate(),
        endTime: now.plus({ days: 10 }).toJSDate(),
        createdById: testUserId,
      });

      const startDate = now.toISO();
      const endDate = now.plus({ days: 7 }).toISO();
      const request = new NextRequest(
        `http://localhost:3000/api/events?start=${startDate}&end=${endDate}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
      const titles = json.data.map((e: any) => e.title);
      expect(titles).toContain("Event Overlap Start");
      expect(titles).toContain("Event Overlap End");
      expect(titles).toContain("Event Span All");
    });
  });

  describe("Category Filtering", () => {
    it("should filter events by category ID", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create second category
      const workCategory = await createTestCategory(prisma, {
        name: "Work",
        color: "#3B82F6",
      });

      // Create events with different categories
      await createTestEvent(prisma, {
        title: "Family Event",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        categoryId: testCategoryId,
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Work Event 1",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        categoryId: workCategory.id,
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Work Event 2",
        startTime: now.plus({ days: 2 }).toJSDate(),
        endTime: now.plus({ days: 2, hours: 1 }).toJSDate(),
        categoryId: workCategory.id,
        createdById: testUserId,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events?categoryId=${workCategory.id}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
      const titles = json.data.map((e: any) => e.title);
      expect(titles).toContain("Work Event 1");
      expect(titles).toContain("Work Event 2");
      expect(titles).not.toContain("Family Event");
    });

    it("should combine category filter with date range", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create events with category, some in range, some out
      await createTestEvent(prisma, {
        title: "Family Event In Range",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        categoryId: testCategoryId,
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Family Event Out of Range",
        startTime: now.plus({ days: 20 }).toJSDate(),
        endTime: now.plus({ days: 20, hours: 1 }).toJSDate(),
        categoryId: testCategoryId,
        createdById: testUserId,
      });

      const startDate = now.toISO();
      const endDate = now.plus({ days: 7 }).toISO();
      const request = new NextRequest(
        `http://localhost:3000/api/events?start=${startDate}&end=${endDate}&categoryId=${testCategoryId}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("Family Event In Range");
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty array when no events exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/events");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it("should return empty array when no events match filters", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create event outside the filtered range
      await createTestEvent(prisma, {
        title: "Event Outside Range",
        startTime: now.plus({ days: 100 }).toJSDate(),
        endTime: now.plus({ days: 100, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const startDate = now.toISO();
      const endDate = now.plus({ days: 7 }).toISO();
      const request = new NextRequest(
        `http://localhost:3000/api/events?start=${startDate}&end=${endDate}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });
  });

  describe("Event Ordering", () => {
    it("should return events ordered by startTime ascending", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      await createTestEvent(prisma, {
        title: "Event 3 (Latest)",
        startTime: now.plus({ days: 5 }).toJSDate(),
        endTime: now.plus({ days: 5, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event 1 (Earliest)",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event 2 (Middle)",
        startTime: now.plus({ days: 2 }).toJSDate(),
        endTime: now.plus({ days: 2, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
      expect(json.data[0].title).toBe("Event 1 (Earliest)");
      expect(json.data[1].title).toBe("Event 2 (Middle)");
      expect(json.data[2].title).toBe("Event 3 (Latest)");
    });
  });

  describe("All-Day Events", () => {
    it("should include all-day events in results", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now().startOf("day");

      await createTestEvent(prisma, {
        title: "All-Day Event",
        startTime: now.toJSDate(),
        endTime: now.endOf("day").toJSDate(),
        allDay: true,
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Timed Event",
        startTime: now.set({ hour: 14 }).toJSDate(),
        endTime: now.set({ hour: 15 }).toJSDate(),
        allDay: false,
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
      const allDayEvent = json.data.find((e: any) => e.title === "All-Day Event");
      expect(allDayEvent.allDay).toBe(true);
    });
  });
});
