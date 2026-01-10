import { NextRequest, NextResponse } from "next/server";
import { listEvents } from "@/lib/queries/events";
import { listEventsQuerySchema } from "@/lib/validations/event";

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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
