import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/server/auth-session";
import { getEventById, updateEvent, deleteEvent } from "@/lib/queries/events";
import { updateEventSchema } from "@/lib/validations/event";

/**
 * GET /api/events/[id]
 *
 * Get a single event by ID with all relations
 *
 * Path Parameters:
 * - id: Event ID (cuid)
 *
 * Response includes:
 * - Event details
 * - Category details (if assigned)
 * - Creator details (id, name)
 * - Attendees with user details
 * - Sent invites
 *
 * Authentication: Required (handled by middleware)
 *
 * @see contracts/events-api.md
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch event from database
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Transform event to API response format
    const responseData = {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      allDay: event.allDay,
      timezone: event.timezone,
      recurrenceRule: event.recurrenceRule,
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            color: event.category.color,
            icon: event.category.icon,
          }
        : null,
      createdBy: {
        id: event.createdBy.id,
        name: event.createdBy.name,
      },
      attendees: event.attendees.map((attendee) => ({
        id: attendee.id,
        user: {
          id: attendee.user.id,
          name: attendee.user.name,
        },
        status: attendee.status,
      })),
      invitesSent: event.invitesSent.map((invite) => ({
        id: invite.id,
        recipientEmail: invite.recipientEmail,
        sentAt: invite.sentAt.toISOString(),
      })),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events/[id]
 *
 * Update an existing calendar event
 *
 * Request Body: {
 *   title?, description?, location?,
 *   startTime?, endTime?, allDay?, categoryId?, timezone?
 * }
 *
 * All fields are optional - only provided fields will be updated.
 * Any household member can update any event (FR-018, FR-020).
 *
 * Authentication: Required (handled by middleware)
 *
 * @see contracts/events-api.md
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if event exists first
    const existingEvent = await getEventById(id);
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = updateEventSchema.safeParse(body);

    if (!result.success) {
      // Use the first error from the issues array which has better context
      const firstError = result.error.issues[0];
      const errorMessage = firstError
        ? `${firstError.path.join(".")}: ${firstError.message}`
        : "Validation failed";

      return NextResponse.json(
        {
          error: errorMessage,
          details: {
            fieldErrors: result.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Convert ISO strings to Date objects if present
    const updateData: any = { ...result.data };
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    // Update event in database
    const event = await updateEvent(id, updateData);

    // Transform event to API response format
    const responseData = {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      allDay: event.allDay,
      timezone: event.timezone,
      category: event.category
        ? {
            id: event.category.id,
            name: event.category.name,
            color: event.category.color,
            icon: event.category.icon,
          }
        : null,
      createdBy: {
        id: event.createdBy.id,
        name: event.createdBy.name,
      },
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error updating event:", error);

    // Check for foreign key constraint errors (non-existent categoryId)
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check for record not found errors (event was deleted between check and update)
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 *
 * Delete a calendar event
 *
 * Path Parameters:
 * - id: Event ID (cuid)
 *
 * Any household member can delete any event (FR-020).
 * Related attendees and invites are automatically deleted (cascade).
 *
 * Authentication: Required (handled by middleware)
 *
 * @see contracts/events-api.md
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Delete the event - Prisma will throw if not found
    await deleteEvent(id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting event:", error);

    // Check for record not found errors (Prisma P2025 error code)
    if (
      error instanceof Error &&
      (error.message.includes("Record to delete does not exist") ||
        error.message.includes("No record was found for a delete") ||
        (error as any).code === "P2025")
    ) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
