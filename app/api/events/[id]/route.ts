import { NextRequest, NextResponse } from "next/server";
import { getEventById } from "@/lib/queries/events";

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
