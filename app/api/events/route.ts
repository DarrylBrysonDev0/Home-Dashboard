import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/server/auth-session";
import { listEvents, createEvent } from "@/lib/queries/events";
import { listEventsQuerySchema, createEventSchema } from "@/lib/validations/event";

/**
 * GET /api/events
 *
 * List calendar events with optional filters
 *
 * Query Parameters:
 * - start: ISO 8601 date string (optional) - Filter events ending after this date
 * - end: ISO 8601 date string (optional) - Filter events starting before this date
 * - categoryId: string (optional) - Filter events by category ID
 *
 * Authentication: Required (handled by middleware)
 *
 * @see contracts/events-api.md
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters - only include params that are actually present
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};

    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const categoryId = searchParams.get("categoryId");

    if (start) queryParams.start = start;
    if (end) queryParams.end = end;
    if (categoryId) queryParams.categoryId = categoryId;

    // Validate query parameters
    const result = listEventsQuerySchema.safeParse(queryParams);
    if (!result.success) {
      console.error("Validation failed:", result.error, "Query params:", queryParams);
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: {
            fieldErrors: result.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Fetch events from database
    const events = await listEvents(result.data);

    // Transform events to API response format
    const responseData = events.map((event) => ({
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
    }));

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Unable to load events. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 *
 * Create a new calendar event
 *
 * Request Body: {
 *   title, description?, location?,
 *   startTime, endTime, allDay?, categoryId?, timezone?
 * }
 *
 * Authentication: Required (handled by middleware)
 *
 * @see contracts/events-api.md
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createEventSchema.safeParse(body);

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

    // Convert ISO strings to Date objects
    const eventData = {
      ...result.data,
      startTime: new Date(result.data.startTime),
      endTime: new Date(result.data.endTime),
    };

    // Create event in database
    const event = await createEvent(eventData, session.user.id);

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

    return NextResponse.json({ data: responseData }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);

    // Check for foreign key constraint errors (non-existent categoryId)
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create event. Please try again." },
      { status: 500 }
    );
  }
}
