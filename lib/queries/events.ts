import { prisma } from "@/lib/db";
import { Event, Prisma } from "@/generated/prisma/client";
import { ListEventsQuery } from "@/lib/validations/event";

/**
 * Event query helpers
 * Provides reusable database queries for calendar events
 */

/**
 * Filter events by date range (client-side filtering)
 *
 * Includes events that:
 * - Start within the range
 * - End within the range
 * - Overlap the range (start before, end after)
 * - Span the entire range
 *
 * @param events - Array of events to filter
 * @param rangeStart - Start of date range (inclusive)
 * @param rangeEnd - End of date range (inclusive)
 * @returns Filtered array of events
 */
export function filterEventsByDateRange<T extends Pick<Event, "startTime" | "endTime">>(
  events: T[],
  rangeStart: Date,
  rangeEnd: Date
): T[] {
  return events.filter((event) => {
    // Event overlaps range if:
    // - Event start is before or equal to range end AND
    // - Event end is after or equal to range start
    return event.startTime <= rangeEnd && event.endTime >= rangeStart;
  });
}

/**
 * Filter events by category ID (client-side filtering)
 *
 * @param events - Array of events to filter
 * @param categoryId - Category ID to filter by
 * @returns Filtered array of events matching the category
 */
export function filterEventsByCategory<T extends Pick<Event, "categoryId">>(
  events: T[],
  categoryId: string
): T[] {
  return events.filter((event) => event.categoryId === categoryId);
}

/**
 * Build Prisma query for event list with filters
 *
 * Constructs a Prisma query object with:
 * - Date range filtering (if start/end provided)
 * - Category filtering (if categoryId provided)
 * - Relations (category, createdBy)
 * - Ordering by startTime ascending
 *
 * @param filters - Query parameters (start, end, categoryId)
 * @returns Prisma query object for event.findMany()
 */
export function buildEventListQuery(filters: ListEventsQuery): Prisma.EventFindManyArgs {
  const where: Prisma.EventWhereInput = {};

  // Add date range filter
  // For events to be in range, they must overlap with [start, end]
  // This means: event.startTime <= end AND event.endTime >= start

  const hasStart = !!filters.start;
  const hasEnd = !!filters.end;

  if (hasStart && hasEnd) {
    // Both start and end: use AND array
    where.AND = [
      {
        endTime: {
          gte: new Date(filters.start!),
        },
      },
      {
        startTime: {
          lte: new Date(filters.end!),
        },
      },
    ];
  } else if (hasStart) {
    // Only start: add directly to where
    where.endTime = {
      gte: new Date(filters.start!),
    };
  } else if (hasEnd) {
    // Only end: add directly to where
    where.startTime = {
      lte: new Date(filters.end!),
    };
  }

  // Add category filter
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  return {
    where,
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  };
}

/**
 * List events with optional filters
 *
 * Fetches events from database with:
 * - Optional date range filtering
 * - Optional category filtering
 * - Category and creator relations included
 * - Ordered by start time ascending
 *
 * @param filters - Query parameters
 * @returns Array of events with relations
 */
export async function listEvents(filters: ListEventsQuery = {}) {
  const query = buildEventListQuery(filters);
  return prisma.event.findMany(query);
}

/**
 * Get a single event by ID with all relations
 *
 * Includes:
 * - Category details
 * - Creator details (id, name)
 * - Attendees with user details
 * - Sent invites
 *
 * @param id - Event ID
 * @returns Event with all relations, or null if not found
 */
export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      attendees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      invitesSent: true,
    },
  });
}
