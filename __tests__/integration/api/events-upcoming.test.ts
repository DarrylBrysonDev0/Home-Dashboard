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
} from "@/__tests__/helpers/auth-helpers";
import {
  createTestEvent,
} from "@/__tests__/helpers/calendar-helpers";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/events/upcoming/route").GET;

/**
 * Integration Tests: GET /api/events/upcoming
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract contracts/upcoming-events-api.md
 *
 * USER STORY 6: Upcoming Events on Landing Page
 * Goal: Display next 3 upcoming calendar events in landing page hero section
 *
 * Test Categories:
 * - Response structure validation
 * - Query parameter validation (limit, days)
 * - Date filtering (events within days from now)
 * - Empty data handling
 * - Event ordering (soonest first)
 * - Error handling
 *
 * API Contract (from upcoming-events-api.md):
 * Query Params: limit (1-10, default: 3), days (1-30, default: 7)
 * Response: {
 *   data: Array<{
 *     id: string,
 *     title: string,
 *     startTime: string (ISO 8601),
 *     location: string | null
 *   }>
 * }
 */

describe("GET /api/events/upcoming", () => {
  let testUserId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/events/upcoming/route");
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
  });

  describe("Response Structure", () => {
    it("should return data with events array", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create a test event within the next 7 days
      await createTestEvent(prisma, {
        title: "Upcoming Event",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
    });

    it("should return events with only required fields (id, title, startTime, location)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      await createTestEvent(prisma, {
        title: "Complete Event",
        description: "Should not appear in response",
        location: "Test Location",
        startTime: now.plus({ days: 2 }).toJSDate(),
        endTime: now.plus({ days: 2, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);

      const event = json.data[0];
      // Required fields
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("title", "Complete Event");
      expect(event).toHaveProperty("startTime");
      expect(event).toHaveProperty("location", "Test Location");

      // Should NOT have these fields (minimal response)
      expect(event).not.toHaveProperty("description");
      expect(event).not.toHaveProperty("endTime");
      expect(event).not.toHaveProperty("category");
      expect(event).not.toHaveProperty("createdBy");
    });

    it("should return startTime as ISO 8601 string", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();
      const eventStart = now.plus({ days: 1 });

      await createTestEvent(prisma, {
        title: "Test Event",
        startTime: eventStart.toJSDate(),
        endTime: eventStart.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      const event = json.data[0];
      // startTime should be a valid ISO 8601 string
      expect(typeof event.startTime).toBe("string");
      expect(() => new Date(event.startTime)).not.toThrow();
      expect(event.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should handle events without location (null)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      await createTestEvent(prisma, {
        title: "No Location Event",
        location: null,
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].location).toBeNull();
    });
  });

  describe("Default Parameters", () => {
    it("should default to limit=3 when not specified", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create 5 events within the next 7 days
      for (let i = 1; i <= 5; i++) {
        await createTestEvent(prisma, {
          title: `Event ${i}`,
          startTime: now.plus({ days: i }).toJSDate(),
          endTime: now.plus({ days: i, hours: 1 }).toJSDate(),
          createdById: testUserId,
        });
      }

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
    });

    it("should default to days=7 when not specified", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Event within 7 days
      await createTestEvent(prisma, {
        title: "Within Range",
        startTime: now.plus({ days: 5 }).toJSDate(),
        endTime: now.plus({ days: 5, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Event outside 7 days
      await createTestEvent(prisma, {
        title: "Outside Range",
        startTime: now.plus({ days: 10 }).toJSDate(),
        endTime: now.plus({ days: 10, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("Within Range");
    });
  });

  describe("Query Parameters", () => {
    it("should respect limit parameter", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create 5 events
      for (let i = 1; i <= 5; i++) {
        await createTestEvent(prisma, {
          title: `Event ${i}`,
          startTime: now.plus({ days: i }).toJSDate(),
          endTime: now.plus({ days: i, hours: 1 }).toJSDate(),
          createdById: testUserId,
        });
      }

      const request = new NextRequest("http://localhost:3000/api/events/upcoming?limit=2");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
    });

    it("should respect days parameter", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Event at day 3
      await createTestEvent(prisma, {
        title: "Day 3 Event",
        startTime: now.plus({ days: 3 }).toJSDate(),
        endTime: now.plus({ days: 3, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Event at day 15
      await createTestEvent(prisma, {
        title: "Day 15 Event",
        startTime: now.plus({ days: 15 }).toJSDate(),
        endTime: now.plus({ days: 15, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Query with days=10 should only get the day 3 event
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=10");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("Day 3 Event");
    });

    it("should accept limit up to 10", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create 12 events in the next 30 days
      for (let i = 1; i <= 12; i++) {
        await createTestEvent(prisma, {
          title: `Event ${i}`,
          startTime: now.plus({ hours: i * 6 }).toJSDate(),
          endTime: now.plus({ hours: i * 6 + 1 }).toJSDate(),
          createdById: testUserId,
        });
      }

      const request = new NextRequest("http://localhost:3000/api/events/upcoming?limit=10&days=30");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(10);
    });

    it("should accept days up to 30", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Event at day 25
      await createTestEvent(prisma, {
        title: "Day 25 Event",
        startTime: now.plus({ days: 25 }).toJSDate(),
        endTime: now.plus({ days: 25, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=30");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("Day 25 Event");
    });
  });

  describe("Query Parameter Validation", () => {
    it("should return 400 for limit > 10", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?limit=11");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error", "Invalid query parameters");
      expect(json.details.fieldErrors).toHaveProperty("limit");
    });

    it("should return 400 for limit < 1", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?limit=0");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error", "Invalid query parameters");
      expect(json.details.fieldErrors).toHaveProperty("limit");
    });

    it("should return 400 for days > 30", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=31");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error", "Invalid query parameters");
      expect(json.details.fieldErrors).toHaveProperty("days");
    });

    it("should return 400 for days < 1", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=0");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error", "Invalid query parameters");
      expect(json.details.fieldErrors).toHaveProperty("days");
    });

    it("should return 400 for non-numeric limit", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?limit=abc");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error", "Invalid query parameters");
    });

    it("should return 400 for non-numeric days", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=abc");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error", "Invalid query parameters");
    });
  });

  describe("Date Filtering", () => {
    it("should only return events starting from now", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Past event
      await createTestEvent(prisma, {
        title: "Past Event",
        startTime: now.minus({ days: 1 }).toJSDate(),
        endTime: now.minus({ days: 1, hours: -1 }).toJSDate(),
        createdById: testUserId,
      });

      // Future event
      await createTestEvent(prisma, {
        title: "Future Event",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("Future Event");
    });

    it("should include events exactly at the boundary (now + days)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Event exactly at day 7 boundary
      await createTestEvent(prisma, {
        title: "Boundary Event",
        startTime: now.plus({ days: 7 }).startOf("day").toJSDate(),
        endTime: now.plus({ days: 7 }).startOf("day").plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Event just outside boundary
      await createTestEvent(prisma, {
        title: "Outside Boundary",
        startTime: now.plus({ days: 8 }).toJSDate(),
        endTime: now.plus({ days: 8, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=7");
      const response = await GET(request);
      const json = await response.json();

      const titles = json.data.map((e: any) => e.title);
      expect(titles).toContain("Boundary Event");
      expect(titles).not.toContain("Outside Boundary");
    });
  });

  describe("Event Ordering", () => {
    it("should return events ordered by startTime ascending (soonest first)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create events in non-chronological order
      await createTestEvent(prisma, {
        title: "Event 3 (Day 5)",
        startTime: now.plus({ days: 5 }).toJSDate(),
        endTime: now.plus({ days: 5, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event 1 (Day 1)",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      await createTestEvent(prisma, {
        title: "Event 2 (Day 3)",
        startTime: now.plus({ days: 3 }).toJSDate(),
        endTime: now.plus({ days: 3, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming?limit=5");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
      expect(json.data[0].title).toBe("Event 1 (Day 1)");
      expect(json.data[1].title).toBe("Event 2 (Day 3)");
      expect(json.data[2].title).toBe("Event 3 (Day 5)");
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty array when no events exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it("should return empty array when no events match date range", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Event far in the future
      await createTestEvent(prisma, {
        title: "Far Future Event",
        startTime: now.plus({ days: 30 }).toJSDate(),
        endTime: now.plus({ days: 30, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming?days=7");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it("should return empty array when all events are in the past", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      await createTestEvent(prisma, {
        title: "Past Event",
        startTime: now.minus({ days: 5 }).toJSDate(),
        endTime: now.minus({ days: 5, hours: -1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });
  });

  describe("All-Day Events", () => {
    it("should include all-day events within the date range", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();
      const tomorrow = now.plus({ days: 1 }).startOf("day");

      await createTestEvent(prisma, {
        title: "All-Day Event",
        startTime: tomorrow.toJSDate(),
        endTime: tomorrow.endOf("day").toJSDate(),
        allDay: true,
        createdById: testUserId,
      });

      const request = new NextRequest("http://localhost:3000/api/events/upcoming");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe("All-Day Event");
    });
  });
});
