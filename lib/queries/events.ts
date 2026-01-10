import { prisma } from "@/lib/db";
import { Event, Prisma } from "@/generated/prisma/client";
import { ListEventsQuery } from "@/lib/validations/event";

/**
 * Event query helpers
 * Provides reusable database queries for calendar events
 */

/**
 * Select configuration for event list queries (optimized for performance)
 *
 * Uses `select` instead of `include` to only fetch the columns needed
 * for calendar display, reducing data transfer and improving query speed.
 */
const eventListSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  startTime: true,
  endTime: true,
  allDay: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

/**
 * Include configuration for event list queries (legacy, kept for type compatibility)
 */
const eventListInclude = {
  category: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

/**
 * Type for event list results with relations
 */
export type EventWithRelations = Prisma.EventGetPayload<{
  include: typeof eventListInclude;
}>;

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
 * List events with optional filters (optimized for performance)
 *
 * Performance optimizations:
 * - Uses `select` instead of `include` to minimize data transfer
 * - Leverages the [startTime, endTime] composite index for date range queries
 * - Uses [categoryId] index when filtering by category
 * - Returns only fields needed for calendar display
 *
 * Query execution plan utilizes indexes:
 * - @@index([startTime, endTime]) - primary filter index
 * - @@index([categoryId]) - secondary filter index
 *
 * Target: <2s load time for typical month view (~30-50 events)
 *
 * @param filters - Query parameters
 * @returns Array of events with relations (selected fields only)
 */
export async function listEvents(filters: ListEventsQuery = {}): Promise<EventWithRelations[]> {
  const where: Prisma.EventWhereInput = {};

  // Build date range filter optimized for index usage
  // The [startTime, endTime] composite index efficiently handles these conditions
  const hasStart = !!filters.start;
  const hasEnd = !!filters.end;

  if (hasStart && hasEnd) {
    // Overlap condition: events that have any overlap with [start, end]
    // event.startTime <= end AND event.endTime >= start
    where.AND = [
      { endTime: { gte: new Date(filters.start!) } },
      { startTime: { lte: new Date(filters.end!) } },
    ];
  } else if (hasStart) {
    where.endTime = { gte: new Date(filters.start!) };
  } else if (hasEnd) {
    where.startTime = { lte: new Date(filters.end!) };
  }

  // Add category filter (uses @@index([categoryId]))
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  // Use select for performance - only fetch columns needed for calendar display
  return prisma.event.findMany({
    where,
    select: eventListSelect,
    orderBy: { startTime: "asc" },
  }) as Promise<EventWithRelations[]>;
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

/**
 * Create event include configuration for Prisma queries
 */
const createEventInclude = {
  category: true,
  createdBy: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

/**
 * Type for created event with relations
 */
export type CreatedEvent = Prisma.EventGetPayload<{
  include: typeof createEventInclude;
}>;

/**
 * Create a new event
 *
 * Creates an event with the provided data and returns the full event
 * with category and creator relations.
 *
 * @param data - Event creation data (validated by createEventSchema)
 * @param createdById - ID of the user creating the event
 * @returns Created event with relations
 */
export async function createEvent(
  data: {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    categoryId?: string;
    timezone: string;
  },
  createdById: string
): Promise<CreatedEvent> {
  return prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      allDay: data.allDay,
      categoryId: data.categoryId,
      timezone: data.timezone,
      createdById,
    },
    include: createEventInclude,
  });
}

/**
 * Update an existing event
 *
 * Performs a partial update - only provided fields are updated.
 * Returns the full updated event with relations.
 *
 * @param id - Event ID
 * @param data - Partial event data to update (validated by updateEventSchema)
 * @returns Updated event with relations, or null if event not found
 */
export async function updateEvent(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    location?: string | null;
    startTime?: Date;
    endTime?: Date;
    allDay?: boolean;
    categoryId?: string | null;
    timezone?: string;
  }
) {
  // Build update data object with only provided fields
  const updateData: Prisma.EventUpdateInput = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.allDay !== undefined) updateData.allDay = data.allDay;
  if (data.categoryId !== undefined) {
    if (data.categoryId === null) {
      updateData.category = { disconnect: true };
    } else {
      updateData.category = { connect: { id: data.categoryId } };
    }
  }
  if (data.timezone !== undefined) updateData.timezone = data.timezone;

  return prisma.event.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Delete an event by ID
 *
 * Removes the event and all related attendees and invites (cascade delete).
 * Any household member can delete any event (FR-020).
 *
 * @param id - Event ID
 * @returns Deleted event, or throws error if not found
 */
export async function deleteEvent(id: string) {
  return prisma.event.delete({
    where: { id },
  });
}
