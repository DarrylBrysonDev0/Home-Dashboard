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
  seedTestCategories,
} from "@/__tests__/helpers/calendar-helpers";

// Mock getAuthSession before importing the route
vi.mock("@/lib/server/auth-session", () => ({
  getAuthSession: vi.fn(),
}));

// Dynamic import for the route after env vars are set
let DELETE: typeof import("@/app/api/events/[id]/route").DELETE;
let getAuthSession: ReturnType<typeof vi.fn>;

/**
 * Integration Tests: DELETE /api/events/[id]
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: API contract contracts/events-api.md
 *
 * USER STORY 4: Delete Events
 * Goal: Enable deleting events with proper authentication and error handling
 *
 * Test Categories:
 * - Successful event deletion (FR-024)
 * - Event not found (404 handling)
 * - Authentication requirement
 * - Cascade deletion of related data (attendees, invites)
 * - Response shape validation
 *
 * API Contract (from events-api.md):
 * DELETE /api/events/[id]
 * Response 200: { data: { success: true } }
 * Response 404: { error: "Event not found" }
 * Response 401: { error: "Unauthorized" }
 */

describe("DELETE /api/events/[id]", () => {
  let testUserId: string;
  let testCategoryId: string;

  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/events/[id]/route");
    DELETE = routeModule.DELETE;
    // Import the mocked function
    const authModule = await import("@/lib/server/auth-session");
    getAuthSession = authModule.getAuthSession as ReturnType<typeof vi.fn>;
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

    // Default mock: authenticated session with test user
    getAuthSession.mockResolvedValue(
      createMockMemberSession({
        userId: testUserId,
        email: "test@example.com",
        name: "Test User",
      })
    );
  });

  // ============================================
  // SUCCESSFUL DELETION
  // ============================================

  describe("Successful Deletion", () => {
    it("should delete an existing event and return success", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create a test event
      const event = await createTestEvent(prisma, {
        title: "Event to Delete",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
        categoryId: testCategoryId,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: { success: true },
      });

      // Verify event is deleted from database
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it("should delete event with all optional fields populated", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      const event = await createTestEvent(prisma, {
        title: "Full Event to Delete",
        description: "A detailed description",
        location: "Conference Room A",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 2 }).toJSDate(),
        allDay: false,
        timezone: "America/Chicago",
        createdById: testUserId,
        categoryId: testCategoryId,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.success).toBe(true);

      // Verify deletion
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it("should delete all-day event successfully", async () => {
      const prisma = getTestPrisma();
      const today = DateTime.now().startOf("day");

      const event = await createTestEvent(prisma, {
        title: "All-Day Event to Delete",
        startTime: today.toJSDate(),
        endTime: today.endOf("day").toJSDate(),
        allDay: true,
        createdById: testUserId,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });

      expect(response.status).toBe(200);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });
  });

  // ============================================
  // CASCADE DELETION
  // ============================================

  describe("Cascade Deletion", () => {
    it("should cascade delete event attendees when event is deleted", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create another user
      const otherUser = await createTestUser(prisma, {
        email: "other@example.com",
        password: "TestPass123",
        name: "Other User",
      });

      // Create event
      const event = await createTestEvent(prisma, {
        title: "Event with Attendees",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Add attendees
      await prisma.eventAttendee.create({
        data: {
          eventId: event.id,
          userId: otherUser.id,
          status: "ACCEPTED",
        },
      });

      // Verify attendee exists
      const attendeesBefore = await prisma.eventAttendee.findMany({
        where: { eventId: event.id },
      });
      expect(attendeesBefore).toHaveLength(1);

      // Delete event
      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, { params: { id: event.id } });

      expect(response.status).toBe(200);

      // Verify attendees are also deleted (cascade)
      const attendeesAfter = await prisma.eventAttendee.findMany({
        where: { eventId: event.id },
      });
      expect(attendeesAfter).toHaveLength(0);
    });

    it("should cascade delete event invites when event is deleted", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create event
      const event = await createTestEvent(prisma, {
        title: "Event with Invites",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Add invites
      await prisma.eventInvite.create({
        data: {
          eventId: event.id,
          recipientEmail: "invited@example.com",
        },
      });

      await prisma.eventInvite.create({
        data: {
          eventId: event.id,
          recipientEmail: "another@example.com",
        },
      });

      // Verify invites exist
      const invitesBefore = await prisma.eventInvite.findMany({
        where: { eventId: event.id },
      });
      expect(invitesBefore).toHaveLength(2);

      // Delete event
      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, { params: { id: event.id } });

      expect(response.status).toBe(200);

      // Verify invites are also deleted (cascade)
      const invitesAfter = await prisma.eventInvite.findMany({
        where: { eventId: event.id },
      });
      expect(invitesAfter).toHaveLength(0);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe("Error Handling", () => {
    it("should return 404 when event does not exist", async () => {
      const nonExistentId = "clxxxxxxxxxxxxxxxxx"; // Valid cuid format

      const request = new NextRequest(
        `http://localhost:3000/api/events/${nonExistentId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: nonExistentId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: "Event not found",
      });
    });

    it("should return 404 for invalid event ID format", async () => {
      const invalidId = "invalid-id-123";

      const request = new NextRequest(
        `http://localhost:3000/api/events/${invalidId}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: invalidId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeTruthy();
    });

    it("should return 401 when user is not authenticated", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create event
      const event = await createTestEvent(prisma, {
        title: "Event to Delete",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Mock unauthenticated session
      getAuthSession.mockResolvedValueOnce(null);

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: "Unauthorized",
      });

      // Verify event was NOT deleted
      const stillExists = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(stillExists).not.toBeNull();
    });
  });

  // ============================================
  // PERMISSIONS
  // ============================================

  describe("Permissions", () => {
    it("should allow any household member to delete any event (FR-020)", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create another user
      const otherUser = await createTestUser(prisma, {
        email: "other@example.com",
        password: "TestPass123",
        name: "Other User",
      });

      // Create event owned by testUser
      const event = await createTestEvent(prisma, {
        title: "Event Created by Test User",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Mock session as otherUser (different from event creator)
      getAuthSession.mockResolvedValueOnce(
        createMockMemberSession({
          userId: otherUser.id,
          email: "other@example.com",
          name: "Other User",
        })
      );

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });
      const data = await response.json();

      // Should succeed - any member can delete
      expect(response.status).toBe(200);
      expect(data.data.success).toBe(true);

      // Verify deletion
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe("Edge Cases", () => {
    it("should handle deletion of event with no category", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      const event = await createTestEvent(prisma, {
        title: "Uncategorized Event",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
        categoryId: null,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });

      expect(response.status).toBe(200);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it("should handle deletion of past events", async () => {
      const prisma = getTestPrisma();
      const pastDate = DateTime.now().minus({ months: 6 });

      const event = await createTestEvent(prisma, {
        title: "Past Event",
        startTime: pastDate.toJSDate(),
        endTime: pastDate.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });

      expect(response.status).toBe(200);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it("should handle deletion of future events", async () => {
      const prisma = getTestPrisma();
      const futureDate = DateTime.now().plus({ months: 6 });

      const event = await createTestEvent(prisma, {
        title: "Future Event",
        startTime: futureDate.toJSDate(),
        endTime: futureDate.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/events/${event.id}`,
        { method: "DELETE" }
      );

      const response = await DELETE(request, { params: { id: event.id } });

      expect(response.status).toBe(200);

      const deletedEvent = await prisma.event.findUnique({
        where: { id: event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    it("should not affect other events when deleting one event", async () => {
      const prisma = getTestPrisma();
      const now = DateTime.now();

      // Create multiple events
      const event1 = await createTestEvent(prisma, {
        title: "Event 1",
        startTime: now.toJSDate(),
        endTime: now.plus({ hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const event2 = await createTestEvent(prisma, {
        title: "Event 2",
        startTime: now.plus({ days: 1 }).toJSDate(),
        endTime: now.plus({ days: 1, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      const event3 = await createTestEvent(prisma, {
        title: "Event 3",
        startTime: now.plus({ days: 2 }).toJSDate(),
        endTime: now.plus({ days: 2, hours: 1 }).toJSDate(),
        createdById: testUserId,
      });

      // Delete event2
      const request = new NextRequest(
        `http://localhost:3000/api/events/${event2.id}`,
        { method: "DELETE" }
      );
      const response = await DELETE(request, { params: { id: event2.id } });

      expect(response.status).toBe(200);

      // Verify event2 is deleted
      const deletedEvent = await prisma.event.findUnique({
        where: { id: event2.id },
      });
      expect(deletedEvent).toBeNull();

      // Verify event1 and event3 still exist
      const stillExists1 = await prisma.event.findUnique({
        where: { id: event1.id },
      });
      const stillExists3 = await prisma.event.findUnique({
        where: { id: event3.id },
      });

      expect(stillExists1).not.toBeNull();
      expect(stillExists1?.title).toBe("Event 1");
      expect(stillExists3).not.toBeNull();
      expect(stillExists3?.title).toBe("Event 3");
    });
  });
});
