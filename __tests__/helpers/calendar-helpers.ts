import { Event, EventCategory, EventAttendee, EventInvite } from "@/generated/prisma/client";
import { DateTime } from "luxon";

/**
 * Test helper utilities for calendar and event testing
 *
 * Provides mock event data, category fixtures, date utilities,
 * and helper functions for testing calendar-related features.
 */

// ============================================
// MOCK CATEGORY DATA
// ============================================

/**
 * Default category fixtures matching seed data
 */
export const mockCategories: Omit<EventCategory, "id" | "createdAt">[] = [
  { name: "Family", color: "#F97316", icon: "home" },
  { name: "Work", color: "#3B82F6", icon: "briefcase" },
  { name: "Medical", color: "#EF4444", icon: "heart" },
  { name: "Social", color: "#8B5CF6", icon: "users" },
  { name: "Finance", color: "#10B981", icon: "dollar-sign" },
  { name: "Other", color: "#6B7280", icon: "calendar" },
];

/**
 * Creates a mock category with defaults
 */
export function createMockCategory(
  overrides?: Partial<EventCategory>
): EventCategory {
  return {
    id: `cat-${Date.now()}`,
    name: "Test Category",
    color: "#F97316",
    icon: "calendar",
    createdAt: new Date(),
    ...overrides,
  };
}

// ============================================
// MOCK EVENT DATA
// ============================================

/**
 * Creates a mock event with sensible defaults
 */
export function createMockEvent(
  overrides?: Partial<Event>
): Omit<Event, "createdAt" | "updatedAt"> {
  const now = DateTime.now();
  const startTime = now.plus({ hours: 1 }).toJSDate();
  const endTime = now.plus({ hours: 2 }).toJSDate();

  return {
    id: `event-${Date.now()}`,
    title: "Test Event",
    description: "Test event description",
    location: "Test Location",
    startTime,
    endTime,
    allDay: false,
    timezone: "America/New_York",
    recurrenceRule: null,
    categoryId: null,
    createdById: "test-user-id",
    ...overrides,
  };
}

/**
 * Mock all-day event
 */
export function createMockAllDayEvent(
  overrides?: Partial<Event>
): Omit<Event, "createdAt" | "updatedAt"> {
  const today = DateTime.now().startOf("day");

  return createMockEvent({
    title: "All-Day Event",
    startTime: today.toJSDate(),
    endTime: today.endOf("day").toJSDate(),
    allDay: true,
    ...overrides,
  });
}

/**
 * Mock multi-day event
 */
export function createMockMultiDayEvent(
  overrides?: Partial<Event>
): Omit<Event, "createdAt" | "updatedAt"> {
  const start = DateTime.now().startOf("day");
  const end = start.plus({ days: 3 }).endOf("day");

  return createMockEvent({
    title: "Multi-Day Event",
    startTime: start.toJSDate(),
    endTime: end.toJSDate(),
    allDay: true,
    ...overrides,
  });
}

/**
 * Mock recurring event (future expansion)
 */
export function createMockRecurringEvent(
  overrides?: Partial<Event>
): Omit<Event, "createdAt" | "updatedAt"> {
  const start = DateTime.now().set({ hour: 14, minute: 0, second: 0 });

  return createMockEvent({
    title: "Recurring Event",
    startTime: start.toJSDate(),
    endTime: start.plus({ hours: 1 }).toJSDate(),
    recurrenceRule: "FREQ=WEEKLY;BYDAY=MO,WE,FR", // Every Mon, Wed, Fri
    ...overrides,
  });
}

/**
 * Creates multiple mock events for a date range
 */
export function createMockEventsForRange(
  startDate: Date,
  endDate: Date,
  count = 5,
  userId = "test-user-id"
): Omit<Event, "createdAt" | "updatedAt">[] {
  const events: Omit<Event, "createdAt" | "updatedAt">[] = [];
  const start = DateTime.fromJSDate(startDate);
  const end = DateTime.fromJSDate(endDate);
  const daysDiff = Math.floor(end.diff(start, "days").days);
  const daysPerEvent = Math.max(1, Math.floor(daysDiff / count));

  for (let i = 0; i < count; i++) {
    const eventDate = start.plus({ days: i * daysPerEvent });
    const eventStart = eventDate.set({ hour: 10 + i, minute: 0 });
    const eventEnd = eventStart.plus({ hours: 1 });

    events.push(
      createMockEvent({
        id: `event-${i + 1}`,
        title: `Event ${i + 1}`,
        description: `Description for event ${i + 1}`,
        startTime: eventStart.toJSDate(),
        endTime: eventEnd.toJSDate(),
        createdById: userId,
        categoryId: mockCategories[i % mockCategories.length].name, // Use category name as ID proxy
      })
    );
  }

  return events;
}

// ============================================
// MOCK ATTENDEE DATA
// ============================================

/**
 * Creates a mock event attendee
 */
export function createMockAttendee(
  overrides?: Partial<EventAttendee>
): EventAttendee {
  return {
    id: `attendee-${Date.now()}`,
    eventId: "test-event-id",
    userId: "test-user-id",
    status: "PENDING",
    ...overrides,
  };
}

/**
 * Creates multiple attendees for an event
 */
export function createMockAttendees(
  eventId: string,
  userIds: string[]
): EventAttendee[] {
  return userIds.map((userId, index) =>
    createMockAttendee({
      id: `attendee-${eventId}-${index}`,
      eventId,
      userId,
      status: index % 3 === 0 ? "ACCEPTED" : index % 3 === 1 ? "DECLINED" : "PENDING",
    })
  );
}

// ============================================
// MOCK INVITE DATA
// ============================================

/**
 * Creates a mock event invite
 */
export function createMockInvite(
  overrides?: Partial<EventInvite>
): EventInvite {
  return {
    id: `invite-${Date.now()}`,
    eventId: "test-event-id",
    recipientEmail: "test@example.com",
    sentAt: new Date(),
    ...overrides,
  };
}

/**
 * Creates multiple invites for an event
 */
export function createMockInvites(
  eventId: string,
  emails: string[]
): EventInvite[] {
  return emails.map((email, index) =>
    createMockInvite({
      id: `invite-${eventId}-${index}`,
      eventId,
      recipientEmail: email,
    })
  );
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Gets the start of today in America/New_York timezone
 */
export function getTodayStart(): Date {
  return DateTime.now()
    .setZone("America/New_York")
    .startOf("day")
    .toJSDate();
}

/**
 * Gets the end of today in America/New_York timezone
 */
export function getTodayEnd(): Date {
  return DateTime.now()
    .setZone("America/New_York")
    .endOf("day")
    .toJSDate();
}

/**
 * Gets the start of the current week (Sunday)
 */
export function getWeekStart(): Date {
  return DateTime.now()
    .setZone("America/New_York")
    .startOf("week")
    .toJSDate();
}

/**
 * Gets the end of the current week (Saturday)
 */
export function getWeekEnd(): Date {
  return DateTime.now()
    .setZone("America/New_York")
    .endOf("week")
    .toJSDate();
}

/**
 * Gets the start of the current month
 */
export function getMonthStart(): Date {
  return DateTime.now()
    .setZone("America/New_York")
    .startOf("month")
    .toJSDate();
}

/**
 * Gets the end of the current month
 */
export function getMonthEnd(): Date {
  return DateTime.now()
    .setZone("America/New_York")
    .endOf("month")
    .toJSDate();
}

/**
 * Creates a date range for testing
 */
export function createDateRange(
  startDaysFromNow: number,
  endDaysFromNow: number
): { start: Date; end: Date } {
  const now = DateTime.now().setZone("America/New_York");
  return {
    start: now.plus({ days: startDaysFromNow }).toJSDate(),
    end: now.plus({ days: endDaysFromNow }).toJSDate(),
  };
}

/**
 * Checks if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  const dt1 = DateTime.fromJSDate(date1).setZone("America/New_York");
  const dt2 = DateTime.fromJSDate(date2).setZone("America/New_York");
  return dt1.hasSame(dt2, "day");
}

/**
 * Formats a date for display in tests
 */
export function formatTestDate(date: Date): string {
  return DateTime.fromJSDate(date)
    .setZone("America/New_York")
    .toFormat("yyyy-MM-dd HH:mm:ss");
}

/**
 * Checks if a date is within a range (inclusive)
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const dt = DateTime.fromJSDate(date);
  const startDt = DateTime.fromJSDate(start);
  const endDt = DateTime.fromJSDate(end);
  return dt >= startDt && dt <= endDt;
}

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Creates a test category in the database
 */
export async function createTestCategory(
  prisma: any,
  data?: Partial<EventCategory>
): Promise<EventCategory> {
  return prisma.eventCategory.create({
    data: {
      name: data?.name ?? `Test Category ${Date.now()}`,
      color: data?.color ?? "#F97316",
      icon: data?.icon !== undefined ? data.icon : "calendar",
    },
  });
}

/**
 * Creates a test event in the database
 */
export async function createTestEvent(
  prisma: any,
  data: Partial<Event> & { createdById: string }
): Promise<Event> {
  const mockEvent = createMockEvent(data);

  return prisma.event.create({
    data: {
      title: mockEvent.title,
      description: mockEvent.description,
      location: mockEvent.location,
      startTime: mockEvent.startTime,
      endTime: mockEvent.endTime,
      allDay: mockEvent.allDay,
      timezone: mockEvent.timezone,
      recurrenceRule: mockEvent.recurrenceRule,
      categoryId: mockEvent.categoryId,
      createdById: mockEvent.createdById,
    },
  });
}

/**
 * Creates multiple test events in the database
 */
export async function createTestEvents(
  prisma: any,
  userId: string,
  count = 5
): Promise<Event[]> {
  const events: Event[] = [];
  const range = createDateRange(0, 30); // Next 30 days

  const mockEvents = createMockEventsForRange(range.start, range.end, count, userId);

  for (const mockEvent of mockEvents) {
    const event = await createTestEvent(prisma, {
      ...mockEvent,
      createdById: userId,
    });
    events.push(event);
  }

  return events;
}

/**
 * Seeds default categories in the test database
 */
export async function seedTestCategories(prisma: any): Promise<EventCategory[]> {
  const categories: EventCategory[] = [];

  for (const cat of mockCategories) {
    const category = await prisma.eventCategory.create({
      data: cat,
    });
    categories.push(category);
  }

  return categories;
}

// ============================================
// CLEANUP UTILITIES
// ============================================

/**
 * Deletes all events from the test database
 */
export async function clearTestEvents(prisma: any): Promise<void> {
  await prisma.event.deleteMany({});
}

/**
 * Deletes all categories from the test database
 */
export async function clearTestCategories(prisma: any): Promise<void> {
  await prisma.eventCategory.deleteMany({});
}

/**
 * Deletes all attendees from the test database
 */
export async function clearTestAttendees(prisma: any): Promise<void> {
  await prisma.eventAttendee.deleteMany({});
}

/**
 * Deletes all invites from the test database
 */
export async function clearTestInvites(prisma: any): Promise<void> {
  await prisma.eventInvite.deleteMany({});
}

/**
 * Clears all calendar-related test data
 */
export async function clearAllCalendarData(prisma: any): Promise<void> {
  // Delete in correct order due to foreign key constraints
  await clearTestInvites(prisma);
  await clearTestAttendees(prisma);
  await clearTestEvents(prisma);
  await clearTestCategories(prisma);
}

// ============================================
// FULLCALENDAR FORMAT HELPERS
// ============================================

/**
 * Converts an Event to FullCalendar event format
 */
export function toFullCalendarEvent(
  event: Event,
  category?: EventCategory
): any {
  return {
    id: event.id,
    title: event.title,
    start: event.startTime.toISOString(),
    end: event.endTime.toISOString(),
    allDay: event.allDay,
    backgroundColor: category?.color ?? "#6B7280",
    borderColor: category?.color ?? "#6B7280",
    extendedProps: {
      description: event.description,
      location: event.location,
      timezone: event.timezone,
      categoryId: event.categoryId,
      categoryName: category?.name ?? "Uncategorized",
      createdById: event.createdById,
    },
  };
}

/**
 * Creates mock FullCalendar event data
 */
export function createMockFullCalendarEvents(count = 5): any[] {
  const range = createDateRange(0, 30);
  const mockEvents = createMockEventsForRange(range.start, range.end, count);

  return mockEvents.map((event, index) => ({
    id: event.id,
    title: event.title,
    start: event.startTime.toISOString(),
    end: event.endTime.toISOString(),
    allDay: event.allDay,
    backgroundColor: mockCategories[index % mockCategories.length].color,
    borderColor: mockCategories[index % mockCategories.length].color,
    extendedProps: {
      description: event.description,
      location: event.location,
      timezone: event.timezone,
      categoryId: event.categoryId,
      categoryName: mockCategories[index % mockCategories.length].name,
      createdById: event.createdById,
    },
  }));
}
