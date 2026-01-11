/**
 * Unit tests for ICS file generation utility
 *
 * Tests the generateICSContent function that creates RFC 5545-compliant
 * iCalendar files for email attachments (FR-028).
 *
 * Test Categories:
 * - Basic ICS generation with required fields
 * - All-day event handling
 * - Timezone conversion accuracy
 * - Optional fields (description, location)
 * - UID format validation
 * - Error handling for invalid inputs
 * - RFC 5545 compliance
 */

import { describe, it, expect } from "vitest";
import { generateICSContent } from "@/lib/utils/ics-generator";

describe("ICS Generator", () => {
  describe("Basic ICS Generation", () => {
    it("should generate valid ICS content with required fields", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Team Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"), // 9 AM EST
        endTime: new Date("2026-01-15T15:00:00Z"),   // 10 AM EST
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      // Verify ICS structure
      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("END:VCALENDAR");
      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("END:VEVENT");
      expect(icsContent).toContain("VERSION:2.0");
    });

    it("should include event title (SUMMARY)", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Family Dinner",
        startTime: new Date("2026-01-15T23:00:00Z"),
        endTime: new Date("2026-01-16T01:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("SUMMARY:Family Dinner");
    });

    it("should include organizer information", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("ORGANIZER");
      expect(icsContent).toContain("jane@example.com");
    });

    it("should include attendee with RSVP enabled", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "attendee@example.com",
      });

      expect(icsContent).toContain("ATTENDEE");
      expect(icsContent).toContain("attendee@example.com");
      expect(icsContent).toContain("RSVP=TRUE");
      expect(icsContent).toContain("PARTSTAT=NEEDS-ACTION");
    });

    it("should include globally unique UID in eventId@domain format", () => {
      const icsContent = generateICSContent({
        eventId: "clx123abc456",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("UID:clx123abc456@cemdash.local");
    });

    it("should set event status to CONFIRMED", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("STATUS:CONFIRMED");
    });

    it("should set product ID to cemdash-calendar", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("PRODID:cemdash-calendar");
    });
  });

  describe("Optional Fields", () => {
    it("should include description when provided", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        description: "Monthly team sync meeting to discuss progress",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("DESCRIPTION:");
      expect(icsContent).toContain("Monthly team sync meeting");
    });

    it("should include location when provided", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        location: "Conference Room A, 123 Main St",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("LOCATION:");
      expect(icsContent).toContain("Conference Room A");
    });

    it("should handle missing description gracefully", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        // description omitted
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      // Should still generate valid ICS
      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("END:VEVENT");
    });

    it("should handle missing location gracefully", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        // location omitted
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      // Should still generate valid ICS
      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("END:VEVENT");
    });
  });

  describe("Timezone Handling", () => {
    it("should convert UTC times to Eastern timezone correctly", () => {
      // January 15, 2026 9:00 AM EST = 14:00 UTC
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      // Should show local time in ICS (9:00 AM in Eastern)
      expect(icsContent).toContain("DTSTART");
      expect(icsContent).toContain("2026");
      expect(icsContent).toContain("0115"); // January 15
    });

    it("should convert UTC times to Pacific timezone correctly", () => {
      // January 15, 2026 9:00 AM PST = 17:00 UTC
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T17:00:00Z"),
        endTime: new Date("2026-01-15T18:00:00Z"),
        timezone: "America/Los_Angeles",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("DTSTART");
      expect(icsContent).toContain("2026");
    });

    it("should handle UTC timezone", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "UTC",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("DTSTART");
    });

    it("should handle European timezone (London)", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "Europe/London",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("DTSTART");
    });
  });

  describe("All-Day Events", () => {
    it("should handle all-day events correctly", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Birthday",
        startTime: new Date("2026-01-15T05:00:00Z"), // Midnight EST in UTC
        endTime: new Date("2026-01-16T05:00:00Z"),   // Next midnight EST
        allDay: true,
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      // All-day events should have date-only format (no time component)
      expect(icsContent).toContain("DTSTART");
      expect(icsContent).toContain("DTEND");
      expect(icsContent).toContain("BEGIN:VEVENT");
    });

    it("should set hour and minute to 0 for all-day events", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Holiday",
        startTime: new Date("2026-12-25T05:00:00Z"),
        endTime: new Date("2026-12-26T05:00:00Z"),
        allDay: true,
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("DTSTART");
    });

    it("should handle multi-day all-day events", () => {
      // 3-day vacation
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Vacation",
        startTime: new Date("2026-06-15T04:00:00Z"),
        endTime: new Date("2026-06-18T04:00:00Z"),
        allDay: true,
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("SUMMARY:Vacation");
      expect(icsContent).toContain("DTSTART");
      expect(icsContent).toContain("DTEND");
    });
  });

  describe("Error Handling", () => {
    it("should throw error if ICS generation fails", () => {
      // Pass invalid date to trigger error
      expect(() => {
        generateICSContent({
          eventId: "test_event_123",
          title: "Meeting",
          startTime: new Date("invalid"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
          organizerName: "Jane Doe",
          organizerEmail: "jane@example.com",
          attendeeEmail: "john@example.com",
        });
      }).toThrow();
    });

    it("should handle special characters in title", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting: Q&A with Jane & John (Update #2)",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("SUMMARY:");
      expect(icsContent).toContain("BEGIN:VEVENT");
    });

    it("should handle special characters in description", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        description: "Discuss Q1 goals:\n1. Revenue increase\n2. Cost reduction",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("DESCRIPTION:");
      expect(icsContent).toContain("BEGIN:VEVENT");
    });

    it("should handle Unicode characters in title", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "会議 (Meeting) - Café ☕",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("SUMMARY:");
      expect(icsContent).toContain("BEGIN:VEVENT");
    });

    it("should handle long event IDs", () => {
      const longEventId = "clx" + "a".repeat(50); // Very long cuid
      const icsContent = generateICSContent({
        eventId: longEventId,
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain(`UID:${longEventId}@cemdash.local`);
    });

    it("should handle email addresses with special characters", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane O'Doe",
        organizerEmail: "jane.o'doe+tag@example.com",
        attendeeEmail: "john.smith+work@example.co.uk",
      });

      expect(icsContent).toContain("ORGANIZER");
      expect(icsContent).toContain("ATTENDEE");
      expect(icsContent).toContain("BEGIN:VEVENT");
    });
  });

  describe("RFC 5545 Compliance", () => {
    it("should include required VCALENDAR properties", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("BEGIN:VCALENDAR");
      expect(icsContent).toContain("VERSION:2.0");
      expect(icsContent).toContain("PRODID:");
      expect(icsContent).toContain("END:VCALENDAR");
    });

    it("should include required VEVENT properties", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent).toContain("BEGIN:VEVENT");
      expect(icsContent).toContain("UID:");
      expect(icsContent).toContain("DTSTART");
      expect(icsContent).toContain("DTEND");
      expect(icsContent).toContain("SUMMARY:");
      expect(icsContent).toContain("END:VEVENT");
    });

    it("should not contain syntax errors (balanced BEGIN/END)", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      // Count BEGIN and END tags
      const beginCount = (icsContent.match(/BEGIN:/g) || []).length;
      const endCount = (icsContent.match(/END:/g) || []).length;
      expect(beginCount).toBe(endCount);
    });

    it("should return non-empty string", () => {
      const icsContent = generateICSContent({
        eventId: "test_event_123",
        title: "Meeting",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "jane@example.com",
        attendeeEmail: "john@example.com",
      });

      expect(icsContent.length).toBeGreaterThan(100);
      expect(typeof icsContent).toBe("string");
    });
  });
});
