import { describe, it, expect } from "vitest";
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
  sendInviteSchema,
} from "@/lib/validations/event";

/**
 * Unit tests for event validation schemas
 *
 * Tests the Zod validation logic for event CRUD operations (US3)
 * Key validations:
 * - Title: required, 1-200 characters
 * - Description/Location: optional, max length limits
 * - Times: ISO 8601 datetime, end must be after start
 * - Category: optional CUID format
 */

describe("Event Validation Schemas", () => {
  describe("createEventSchema", () => {
    it("should validate a complete valid event", () => {
      const validEvent = {
        title: "Team Meeting",
        description: "Quarterly planning session",
        location: "Conference Room A",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
        allDay: false,
        categoryId: "clx1234567890abcdefghij",
        timezone: "America/New_York",
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEvent);
      }
    });

    it("should validate a minimal valid event (required fields only)", () => {
      const minimalEvent = {
        title: "Quick Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(minimalEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Quick Event");
        expect(result.data.allDay).toBe(false); // Default value
        expect(result.data.timezone).toBe("America/New_York"); // Default value
      }
    });

    it("should validate an all-day event", () => {
      const allDayEvent = {
        title: "Birthday",
        startTime: "2026-01-15T00:00:00.000Z",
        endTime: "2026-01-15T23:59:59.000Z",
        allDay: true,
      };

      const result = createEventSchema.safeParse(allDayEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allDay).toBe(true);
      }
    });

    // ============================================
    // TITLE VALIDATION
    // ============================================

    it("should reject empty title", () => {
      const invalidEvent = {
        title: "",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("title");
        expect(result.error.issues[0].message).toMatch(/required/i);
      }
    });

    it("should reject missing title", () => {
      const invalidEvent = {
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("title");
      }
    });

    it("should reject title longer than 200 characters", () => {
      const longTitle = "A".repeat(201);
      const invalidEvent = {
        title: longTitle,
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("title");
        expect(result.error.issues[0].message).toMatch(/200 characters/i);
      }
    });

    it("should accept title at exactly 200 characters", () => {
      const exactTitle = "A".repeat(200);
      const validEvent = {
        title: exactTitle,
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    // ============================================
    // DESCRIPTION VALIDATION
    // ============================================

    it("should accept description up to 2000 characters", () => {
      const longDescription = "A".repeat(2000);
      const validEvent = {
        title: "Event with long description",
        description: longDescription,
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject description longer than 2000 characters", () => {
      const tooLongDescription = "A".repeat(2001);
      const invalidEvent = {
        title: "Event",
        description: tooLongDescription,
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("description");
        expect(result.error.issues[0].message).toMatch(/2000 characters/i);
      }
    });

    // ============================================
    // LOCATION VALIDATION
    // ============================================

    it("should accept location up to 500 characters", () => {
      const longLocation = "A".repeat(500);
      const validEvent = {
        title: "Event",
        location: longLocation,
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject location longer than 500 characters", () => {
      const tooLongLocation = "A".repeat(501);
      const invalidEvent = {
        title: "Event",
        location: tooLongLocation,
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("location");
        expect(result.error.issues[0].message).toMatch(/500 characters/i);
      }
    });

    // ============================================
    // TIME VALIDATION (FR-015: End time after start time)
    // ============================================

    it("should reject event where end time equals start time", () => {
      const invalidEvent = {
        title: "Invalid Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T14:00:00.000Z", // Same as start
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("endTime");
        expect(result.error.issues[0].message).toMatch(/after start time/i);
      }
    });

    it("should reject event where end time is before start time", () => {
      const invalidEvent = {
        title: "Invalid Event",
        startTime: "2026-01-15T15:00:00.000Z",
        endTime: "2026-01-15T14:00:00.000Z", // Before start
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("endTime");
        expect(result.error.issues[0].message).toMatch(/after start time/i);
      }
    });

    it("should accept event where end time is 1 millisecond after start time", () => {
      const validEvent = {
        title: "Valid Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T14:00:00.001Z", // 1ms later
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should reject invalid ISO 8601 start time format", () => {
      const invalidEvent = {
        title: "Event",
        startTime: "2026-01-15 14:00:00", // Missing 'T' and 'Z'
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("startTime");
        expect(result.error.issues[0].message).toMatch(/ISO 8601/i);
      }
    });

    it("should reject invalid ISO 8601 end time format", () => {
      const invalidEvent = {
        title: "Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "not-a-date",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("endTime");
        expect(result.error.issues[0].message).toMatch(/ISO 8601/i);
      }
    });

    // ============================================
    // CATEGORY VALIDATION
    // ============================================

    it("should reject invalid categoryId format", () => {
      const invalidEvent = {
        title: "Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
        categoryId: "not-a-cuid",
      };

      const result = createEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("categoryId");
        expect(result.error.issues[0].message).toMatch(/Invalid category ID/i);
      }
    });

    it("should accept valid CUID categoryId", () => {
      const validEvent = {
        title: "Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
        categoryId: "clx1234567890abcdefghij",
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should accept missing categoryId (optional field)", () => {
      const validEvent = {
        title: "Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    // ============================================
    // TIMEZONE VALIDATION
    // ============================================

    it("should use default timezone when not provided", () => {
      const event = {
        title: "Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
      };

      const result = createEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("America/New_York");
      }
    });

    it("should accept custom timezone", () => {
      const event = {
        title: "Event",
        startTime: "2026-01-15T14:00:00.000Z",
        endTime: "2026-01-15T15:00:00.000Z",
        timezone: "Europe/London",
      };

      const result = createEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timezone).toBe("Europe/London");
      }
    });
  });

  // ============================================
  // UPDATE EVENT SCHEMA TESTS
  // ============================================

  describe("updateEventSchema", () => {
    it("should validate when updating only title", () => {
      const update = {
        title: "Updated Title",
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate when updating all fields", () => {
      const update = {
        title: "Updated Event",
        description: "Updated description",
        location: "Updated location",
        startTime: "2026-01-20T10:00:00.000Z",
        endTime: "2026-01-20T11:00:00.000Z",
        allDay: true,
        categoryId: "clx1234567890abcdefghij",
        timezone: "Europe/Paris",
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate empty update object (no changes)", () => {
      const update = {};

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should reject invalid title in update", () => {
      const update = {
        title: "", // Empty string not allowed
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it("should validate when setting description to null", () => {
      const update = {
        description: null,
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate when setting location to null", () => {
      const update = {
        location: null,
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate when setting categoryId to null", () => {
      const update = {
        categoryId: null,
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should reject when end time before start time (both provided)", () => {
      const update = {
        startTime: "2026-01-15T15:00:00.000Z",
        endTime: "2026-01-15T14:00:00.000Z", // Before start
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("endTime");
        expect(result.error.issues[0].message).toMatch(/after start time/i);
      }
    });

    it("should validate when only startTime provided (no end time validation)", () => {
      const update = {
        startTime: "2026-01-20T10:00:00.000Z",
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should validate when only endTime provided (no time validation)", () => {
      const update = {
        endTime: "2026-01-20T11:00:00.000Z",
      };

      const result = updateEventSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // LIST EVENTS QUERY SCHEMA TESTS
  // ============================================

  describe("listEventsQuerySchema", () => {
    it("should validate empty query (no filters)", () => {
      const query = {};

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate with start date filter", () => {
      const query = {
        start: "2026-01-01T00:00:00.000Z",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate with end date filter", () => {
      const query = {
        end: "2026-01-31T23:59:59.000Z",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate with date range filter", () => {
      const query = {
        start: "2026-01-01T00:00:00.000Z",
        end: "2026-01-31T23:59:59.000Z",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate with category filter", () => {
      const query = {
        categoryId: "clx1234567890abcdefghij",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate with all filters", () => {
      const query = {
        start: "2026-01-01T00:00:00.000Z",
        end: "2026-01-31T23:59:59.000Z",
        categoryId: "clx1234567890abcdefghij",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should reject invalid start date format", () => {
      const query = {
        start: "not-a-date",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("start");
        expect(result.error.issues[0].message).toMatch(/valid ISO 8601/i);
      }
    });

    it("should reject invalid end date format", () => {
      const query = {
        end: "not-a-date",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("end");
        expect(result.error.issues[0].message).toMatch(/valid ISO 8601/i);
      }
    });

    it("should reject invalid categoryId format", () => {
      const query = {
        categoryId: "not-a-cuid",
      };

      const result = listEventsQuerySchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("categoryId");
      }
    });
  });

  // ============================================
  // SEND INVITE SCHEMA TESTS
  // ============================================

  describe("sendInviteSchema", () => {
    it("should validate a valid email address", () => {
      const invite = {
        recipientEmail: "user@example.com",
      };

      const result = sendInviteSchema.safeParse(invite);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const invite = {
        recipientEmail: "not-an-email",
      };

      const result = sendInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("recipientEmail");
        expect(result.error.issues[0].message).toMatch(/Invalid email/i);
      }
    });

    it("should reject email longer than 320 characters", () => {
      const longEmail = `${"a".repeat(310)}@example.com`; // > 320 chars
      const invite = {
        recipientEmail: longEmail,
      };

      const result = sendInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it("should reject missing email", () => {
      const invite = {};

      const result = sendInviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it("should accept email at exactly 320 characters", () => {
      // Create email at exactly 320 chars: 308 chars + "@" + "example.com" (11 chars) = 320
      const exactEmail = `${"a".repeat(308)}@example.com`;
      const invite = {
        recipientEmail: exactEmail,
      };

      const result = sendInviteSchema.safeParse(invite);
      expect(result.success).toBe(true);
    });
  });
});
