import { z } from "zod";

/**
 * Event validation schemas
 * Used for event CRUD operations in the calendar API routes
 */

/**
 * Create event schema
 * POST /api/events
 *
 * Creates a new calendar event with all required fields (FR-015, FR-016)
 * - Title: Required, 1-200 characters
 * - Description: Optional, max 2000 characters
 * - Location: Optional, max 500 characters
 * - Times: Must be valid ISO 8601 timestamps, end after start
 * - All-day: Boolean flag for all-day events
 * - Category: Optional reference to EventCategory
 * - Timezone: IANA timezone identifier
 */
export const createEventSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    location: z.string().max(500, "Location must be at most 500 characters").optional(),
    startTime: z.string().datetime({ offset: true, message: "Start time must be a valid ISO 8601 datetime" }),
    endTime: z.string().datetime({ offset: true, message: "End time must be a valid ISO 8601 datetime" }),
    allDay: z.boolean().default(false),
    categoryId: z.string().cuid("Invalid category ID format").optional(),
    timezone: z.string().default("America/New_York"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );
export type CreateEventInput = z.infer<typeof createEventSchema>;

/**
 * Update event schema
 * PUT /api/events/[id]
 *
 * Updates an existing event (FR-018, FR-020)
 * All fields are optional - only provided fields will be updated
 * Any household member can update any event
 */
export const updateEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    location: z.string().max(500).nullable().optional(),
    startTime: z.string().datetime({ offset: true }).optional(),
    endTime: z.string().datetime({ offset: true }).optional(),
    allDay: z.boolean().optional(),
    categoryId: z.string().cuid().nullable().optional(),
    timezone: z.string().optional(),
  })
  .refine(
    (data) => {
      // Only validate if both times are provided
      if (data.startTime && data.endTime) {
        const start = new Date(data.startTime);
        const end = new Date(data.endTime);
        return end > start;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Event list query parameters
 * GET /api/events
 *
 * Filters events by date range and category (FR-024)
 */
export const listEventsQuerySchema = z.object({
  start: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Start date must be a valid ISO 8601 datetime string",
    })
    .optional(),
  end: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "End date must be a valid ISO 8601 datetime string",
    })
    .optional(),
  categoryId: z.string().cuid().optional(),
});
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

/**
 * Send invite schema
 * POST /api/events/[id]/send-invite
 *
 * Sends an email calendar invite with ICS attachment (FR-027)
 */
export const sendInviteSchema = z.object({
  recipientEmail: z.string().email("Invalid email address").max(320),
});
export type SendInviteInput = z.infer<typeof sendInviteSchema>;
