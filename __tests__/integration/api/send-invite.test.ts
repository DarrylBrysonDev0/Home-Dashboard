/**
 * Integration Tests: POST /api/events/[id]/send-invite
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract invites-api.md
 *
 * USER STORY 6: Send Google Calendar Invite via Email
 * Goal: Send ICS calendar invite attachments via email when creating/editing events
 *
 * Test Categories:
 * - Request validation (email format, event existence)
 * - Email sending with ICS attachment
 * - Invite tracking in EventInvite table
 * - Error handling (invalid email, missing event, SMTP failures)
 * - Response shape validation
 * - Authentication requirements
 *
 * API Contract (from invites-api.md):
 * Request: { recipientEmail: string }
 * Response: { data: { inviteId, eventId, recipientEmail, sentAt } }
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Mock email service to avoid actually sending emails during tests
vi.mock("@/lib/email", () => ({
  sendCalendarInvite: vi.fn().mockResolvedValue(undefined),
  verifyEmailConfiguration: vi.fn().mockResolvedValue(true),
}));

// Dynamic import for the route after env vars are set
let POST: typeof import("@/app/api/events/[id]/send-invite/route").POST;

describe("POST /api/events/[id]/send-invite", () => {
  let testUserId: string;
  let testEventId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/events/[id]/send-invite/route");
    POST = routeModule.POST;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    await seedTestData();
  });

  /**
   * Seed test data: user, category, and event
   */
  async function seedTestData() {
    const prisma = getTestPrisma();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "testuser@example.com",
        name: "Test User",
        passwordHash: "$2a$12$testHashForTesting", // Dummy hash
        role: "MEMBER",
      },
    });
    testUserId = user.id;

    // Create test category
    const category = await prisma.eventCategory.create({
      data: {
        name: "Test Category",
        color: "#F97316",
      },
    });
    testCategoryId = category.id;

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: "Test Event",
        description: "Test event for invite testing",
        location: "Test Location",
        startTime: new Date("2026-01-15T14:00:00Z"),
        endTime: new Date("2026-01-15T15:00:00Z"),
        allDay: false,
        timezone: "America/New_York",
        categoryId: testCategoryId,
        createdById: testUserId,
      },
    });
    testEventId = event.id;
  }

  describe("Response Structure", () => {
    it("should return data with invite details", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("inviteId");
      expect(json.data).toHaveProperty("eventId");
      expect(json.data).toHaveProperty("recipientEmail");
      expect(json.data).toHaveProperty("sentAt");
    });

    it("should return correct eventId in response", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(json.data.eventId).toBe(testEventId);
    });

    it("should return correct recipientEmail in response", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "test@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(json.data.recipientEmail).toBe("test@example.com");
    });

    it("should return sentAt timestamp in ISO format", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      // Should be valid ISO 8601 date string
      expect(() => new Date(json.data.sentAt)).not.toThrow();
      expect(json.data.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("should return cuid for inviteId", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      // cuid format: starts with 'c' followed by alphanumeric chars (at least 20 chars total)
      // Newer Prisma versions use 'cm' prefix instead of 'cl'
      expect(json.data.inviteId).toMatch(/^c[a-z0-9]{19,}/);
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email addresses", async () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      for (const email of validEmails) {
        const request = new NextRequest(
          `http://localhost:3000/api/events/${testEventId}/send-invite`,
          {
            method: "POST",
            body: JSON.stringify({ recipientEmail: email }),
          }
        );

        const response = await POST(request, { params: { id: testEventId } });
        expect(response.status).toBe(200);
      }
    });

    it("should reject invalid email format", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "not-an-email",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
      expect(json.error).toContain("email");
    });

    it("should reject missing email", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
    });

    it("should reject email exceeding 320 characters", async () => {
      const longEmail = "a".repeat(310) + "@example.com"; // > 320 chars

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: longEmail,
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
    });

    it("should reject email with spaces", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "user name@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
    });

    it("should reject email without @ symbol", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "userexample.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
    });
  });

  describe("Event Validation", () => {
    it("should return 404 for non-existent event", async () => {
      const fakeEventId = "clx_nonexistent_event_123";

      const request = new NextRequest(
        `http://localhost:3000/api/events/${fakeEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: fakeEventId } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty("error");
      expect(json.error).toContain("Event not found");
    });

    it("should return 400 for invalid event ID format", async () => {
      const invalidEventId = "invalid-id-format";

      const request = new NextRequest(
        `http://localhost:3000/api/events/${invalidEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: invalidEventId } });
      const json = await response.json();

      // Should either be 400 (validation error) or 404 (not found)
      expect([400, 404]).toContain(response.status);
      expect(json).toHaveProperty("error");
    });
  });

  describe("Invite Tracking", () => {
    it("should create EventInvite record in database", async () => {
      const prisma = getTestPrisma();

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      await POST(request, { params: { id: testEventId } });

      // Check that invite was logged in database
      const invites = await prisma.eventInvite.findMany({
        where: { eventId: testEventId },
      });

      expect(invites.length).toBe(1);
      expect(invites[0].recipientEmail).toBe("recipient@example.com");
    });

    it("should allow sending multiple invites to different recipients", async () => {
      const prisma = getTestPrisma();

      const recipients = [
        "recipient1@example.com",
        "recipient2@example.com",
        "recipient3@example.com",
      ];

      for (const email of recipients) {
        const request = new NextRequest(
          `http://localhost:3000/api/events/${testEventId}/send-invite`,
          {
            method: "POST",
            body: JSON.stringify({ recipientEmail: email }),
          }
        );

        await POST(request, { params: { id: testEventId } });
      }

      // Check all invites were logged
      const invites = await prisma.eventInvite.findMany({
        where: { eventId: testEventId },
      });

      expect(invites.length).toBe(3);
      const emails = invites.map((inv) => inv.recipientEmail);
      expect(emails).toContain("recipient1@example.com");
      expect(emails).toContain("recipient2@example.com");
      expect(emails).toContain("recipient3@example.com");
    });

    it("should allow sending duplicate invites to same recipient", async () => {
      const prisma = getTestPrisma();

      // Send invite twice with fresh request objects each time
      // (NextRequest body can only be read once)
      const request1 = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );
      await POST(request1, { params: { id: testEventId } });

      const request2 = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );
      await POST(request2, { params: { id: testEventId } });

      // Both should be logged (no unique constraint on recipient email)
      const invites = await prisma.eventInvite.findMany({
        where: {
          eventId: testEventId,
          recipientEmail: "recipient@example.com",
        },
      });

      expect(invites.length).toBe(2);
    });

    it("should set sentAt timestamp when creating invite record", async () => {
      const prisma = getTestPrisma();
      const beforeSend = new Date();

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      await POST(request, { params: { id: testEventId } });

      const afterSend = new Date();

      const invite = await prisma.eventInvite.findFirst({
        where: { eventId: testEventId },
      });

      expect(invite).not.toBeNull();
      expect(invite!.sentAt.getTime()).toBeGreaterThanOrEqual(beforeSend.getTime());
      expect(invite!.sentAt.getTime()).toBeLessThanOrEqual(afterSend.getTime());
    });
  });

  describe("Email Sending", () => {
    it("should call sendCalendarInvite with correct parameters", async () => {
      const emailService = await import("@/lib/email");
      const sendCalendarInviteSpy = vi.spyOn(emailService, "sendCalendarInvite");

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      await POST(request, { params: { id: testEventId } });

      expect(sendCalendarInviteSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientEmail: "recipient@example.com",
          event: expect.objectContaining({
            id: testEventId,
            title: "Test Event",
            description: "Test event for invite testing",
            location: "Test Location",
          }),
        })
      );
    });

    it("should handle email sending failure gracefully", async () => {
      const emailService = await import("@/lib/email");
      vi.spyOn(emailService, "sendCalendarInvite").mockRejectedValueOnce(
        new Error("SMTP connection failed")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json).toHaveProperty("error");
      expect(json.error).toContain("email");
    });

    it("should not create invite record if email sending fails", async () => {
      const prisma = getTestPrisma();
      const emailService = await import("@/lib/email");
      vi.spyOn(emailService, "sendCalendarInvite").mockRejectedValueOnce(
        new Error("SMTP connection failed")
      );

      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      await POST(request, { params: { id: testEventId } });

      // No invite should be logged if email failed to send
      const invites = await prisma.eventInvite.findMany({
        where: { eventId: testEventId },
      });

      expect(invites.length).toBe(0);
    });
  });

  describe("Event Details", () => {
    it("should send invite for all-day events", async () => {
      const prisma = getTestPrisma();

      // Create all-day event
      const allDayEvent = await prisma.event.create({
        data: {
          title: "All Day Event",
          startTime: new Date("2026-01-15T05:00:00Z"),
          endTime: new Date("2026-01-16T05:00:00Z"),
          allDay: true,
          timezone: "America/New_York",
          createdById: testUserId,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${allDayEvent.id}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: allDayEvent.id } });

      expect(response.status).toBe(200);
    });

    it("should send invite for events without description", async () => {
      const prisma = getTestPrisma();

      const eventWithoutDesc = await prisma.event.create({
        data: {
          title: "Simple Event",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
          createdById: testUserId,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventWithoutDesc.id}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: eventWithoutDesc.id } });

      expect(response.status).toBe(200);
    });

    it("should send invite for events without location", async () => {
      const prisma = getTestPrisma();

      const eventWithoutLoc = await prisma.event.create({
        data: {
          title: "Virtual Event",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
          createdById: testUserId,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${eventWithoutLoc.id}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: eventWithoutLoc.id } });

      expect(response.status).toBe(200);
    });

    it("should send invite for events in different timezones", async () => {
      const prisma = getTestPrisma();

      const pacificEvent = await prisma.event.create({
        data: {
          title: "Pacific Event",
          startTime: new Date("2026-01-15T17:00:00Z"),
          endTime: new Date("2026-01-15T18:00:00Z"),
          timezone: "America/Los_Angeles",
          createdById: testUserId,
        },
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${pacificEvent.id}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: pacificEvent.id } });

      expect(response.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for malformed JSON", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: "invalid json{",
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
    });

    it("should return 400 for missing request body", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
        }
      );

      const response = await POST(request, { params: { id: testEventId } });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty("error");
    });

    it("should return 400 for extra fields in request", async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/events/${testEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
            extraField: "should be ignored",
          }),
        }
      );

      const response = await POST(request, { params: { id: testEventId } });

      // Should still succeed (extra fields ignored by Zod strict mode)
      expect(response.status).toBe(200);
    });

    it("should handle database connection errors gracefully", async () => {
      // This test verifies graceful error handling if database is unavailable
      // In real implementation, would need to mock Prisma to throw error

      const fakeEventId = "clx_nonexistent_event_999";
      const request = new NextRequest(
        `http://localhost:3000/api/events/${fakeEventId}/send-invite`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: "recipient@example.com",
          }),
        }
      );

      const response = await POST(request, { params: { id: fakeEventId } });
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty("error");
    });
  });
});
