import { describe, it, expect } from "vitest";
import {
  filterEventsByDateRange,
  filterEventsByCategory,
  buildEventListQuery,
} from "@/lib/queries/events";
import { createMockEvent, createMockEventsForRange } from "@/__tests__/helpers/calendar-helpers";
import { DateTime } from "luxon";

/**
 * Unit Tests: Event Query Helpers
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/events.ts is implemented.
 * Based on: API contract contracts/events-api.md, data-model.md
 *
 * USER STORY 2: View Calendar and Browse Events
 * Goal: Display calendar in month/week/day views with navigation and event details
 *
 * Test Categories:
 * - filterEventsByDateRange: Filter events within start/end date range
 * - filterEventsByCategory: Filter events by category ID
 * - buildEventListQuery: Construct Prisma query with date and category filters
 */

describe("filterEventsByDateRange", () => {
  it("should filter events within the date range (inclusive)", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        id: "event-1",
        title: "Event 1",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
      }),
      createMockEvent({
        id: "event-2",
        title: "Event 2",
        startTime: now.plus({ days: 3 }).toJSDate(),
        endTime: now.plus({ days: 3, hours: 2 }).toJSDate(),
      }),
      createMockEvent({
        id: "event-3",
        title: "Event 3 (before range)",
        startTime: now.minus({ days: 1 }).toJSDate(),
        endTime: now.minus({ days: 1, hours: -1 }).toJSDate(),
      }),
      createMockEvent({
        id: "event-4",
        title: "Event 4 (after range)",
        startTime: now.plus({ days: 10 }).toJSDate(),
        endTime: now.plus({ days: 10, hours: 1 }).toJSDate(),
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["event-1", "event-2"]);
  });

  it("should include events that start before range but end within range", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        id: "event-overlap",
        title: "Overlapping Event",
        startTime: now.minus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 2 }).toJSDate(), // Ends within range
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-overlap");
  });

  it("should include events that start within range but end after range", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        id: "event-overlap",
        title: "Overlapping Event",
        startTime: now.plus({ days: 5 }).toJSDate(), // Starts within range
        endTime: now.plus({ days: 10 }).toJSDate(),
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-overlap");
  });

  it("should include events that span the entire range", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        id: "event-span",
        title: "Spanning Event",
        startTime: now.minus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 10 }).toJSDate(),
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-span");
  });

  it("should return empty array when no events in range", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        startTime: now.minus({ days: 10 }).toJSDate(),
        endTime: now.minus({ days: 9 }).toJSDate(),
      }),
      createMockEvent({
        startTime: now.plus({ days: 20 }).toJSDate(),
        endTime: now.plus({ days: 21 }).toJSDate(),
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(0);
  });

  it("should return empty array for empty events list", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const result = filterEventsByDateRange([], rangeStart, rangeEnd);

    expect(result).toHaveLength(0);
  });

  it("should handle events with exact boundary start time", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        id: "event-boundary",
        startTime: rangeStart, // Exact start boundary
        endTime: now.plus({ hours: 1 }).toJSDate(),
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-boundary");
  });

  it("should handle events with exact boundary end time", () => {
    const now = DateTime.now();
    const rangeStart = now.toJSDate();
    const rangeEnd = now.plus({ days: 7 }).toJSDate();

    const events = [
      createMockEvent({
        id: "event-boundary",
        startTime: now.plus({ days: 6 }).toJSDate(),
        endTime: rangeEnd, // Exact end boundary
      }),
    ];

    const result = filterEventsByDateRange(events, rangeStart, rangeEnd);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-boundary");
  });
});

describe("filterEventsByCategory", () => {
  it("should filter events by category ID", () => {
    const events = [
      createMockEvent({
        id: "event-1",
        title: "Work Event",
        categoryId: "cat-work",
      }),
      createMockEvent({
        id: "event-2",
        title: "Family Event",
        categoryId: "cat-family",
      }),
      createMockEvent({
        id: "event-3",
        title: "Another Work Event",
        categoryId: "cat-work",
      }),
      createMockEvent({
        id: "event-4",
        title: "Uncategorized Event",
        categoryId: null,
      }),
    ];

    const result = filterEventsByCategory(events, "cat-work");

    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(["event-1", "event-3"]);
  });

  it("should return empty array when no events match category", () => {
    const events = [
      createMockEvent({
        id: "event-1",
        categoryId: "cat-family",
      }),
      createMockEvent({
        id: "event-2",
        categoryId: "cat-social",
      }),
    ];

    const result = filterEventsByCategory(events, "cat-work");

    expect(result).toHaveLength(0);
  });

  it("should return empty array for empty events list", () => {
    const result = filterEventsByCategory([], "cat-work");

    expect(result).toHaveLength(0);
  });

  it("should handle events with null categoryId", () => {
    const events = [
      createMockEvent({
        id: "event-1",
        categoryId: null,
      }),
      createMockEvent({
        id: "event-2",
        categoryId: "cat-work",
      }),
    ];

    const result = filterEventsByCategory(events, "cat-work");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("event-2");
  });
});

describe("buildEventListQuery", () => {
  it("should build query with date range filter", () => {
    const now = DateTime.now();
    const startDate = now.toISO()!;
    const endDate = now.plus({ days: 7 }).toISO()!;

    const query = buildEventListQuery({ start: startDate, end: endDate });

    expect(query).toHaveProperty("where");
    expect(query.where).toHaveProperty("AND");
    expect(query.where.AND).toBeInstanceOf(Array);
    expect(query.where.AND).toHaveLength(2);

    // Check for start time condition: startTime <= endDate
    const startCondition = query.where.AND.find((c: any) => c.hasOwnProperty("startTime"));
    expect(startCondition).toBeDefined();
    expect(startCondition.startTime).toHaveProperty("lte");

    // Check for end time condition: endTime >= startDate
    const endCondition = query.where.AND.find((c: any) => c.hasOwnProperty("endTime"));
    expect(endCondition).toBeDefined();
    expect(endCondition.endTime).toHaveProperty("gte");
  });

  it("should build query with category filter", () => {
    const query = buildEventListQuery({ categoryId: "cat-work" });

    expect(query).toHaveProperty("where");
    expect(query.where).toHaveProperty("categoryId");
    expect(query.where.categoryId).toBe("cat-work");
  });

  it("should build query with both date range and category filter", () => {
    const now = DateTime.now();
    const startDate = now.toISO()!;
    const endDate = now.plus({ days: 7 }).toISO()!;

    const query = buildEventListQuery({
      start: startDate,
      end: endDate,
      categoryId: "cat-work",
    });

    expect(query).toHaveProperty("where");
    expect(query.where).toHaveProperty("AND");
    expect(query.where).toHaveProperty("categoryId");
    expect(query.where.categoryId).toBe("cat-work");
    expect(query.where.AND).toBeInstanceOf(Array);
  });

  it("should include standard relations (category, createdBy)", () => {
    const query = buildEventListQuery({});

    expect(query).toHaveProperty("include");
    expect(query.include).toHaveProperty("category");
    expect(query.include).toHaveProperty("createdBy");
    expect(query.include.category).toBe(true);
    expect(query.include.createdBy).toEqual({
      select: {
        id: true,
        name: true,
      },
    });
  });

  it("should order by startTime ascending", () => {
    const query = buildEventListQuery({});

    expect(query).toHaveProperty("orderBy");
    expect(query.orderBy).toEqual({
      startTime: "asc",
    });
  });

  it("should build query with no filters", () => {
    const query = buildEventListQuery({});

    expect(query).toHaveProperty("where");
    expect(query).toHaveProperty("include");
    expect(query).toHaveProperty("orderBy");
    // No AND array when no date filters
    expect(query.where).not.toHaveProperty("AND");
  });

  it("should handle start date only", () => {
    const now = DateTime.now();
    const startDate = now.toISO()!;

    const query = buildEventListQuery({ start: startDate });

    expect(query.where).toHaveProperty("endTime");
    expect(query.where.endTime).toHaveProperty("gte");
  });

  it("should handle end date only", () => {
    const now = DateTime.now();
    const endDate = now.plus({ days: 7 }).toISO()!;

    const query = buildEventListQuery({ end: endDate });

    expect(query.where).toHaveProperty("startTime");
    expect(query.where.startTime).toHaveProperty("lte");
  });
});
