import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/queries/events";
import { upcomingEventsQuerySchema } from "@/lib/validations/event";

/**
 * GET /api/events/upcoming
 *
 * Fetches upcoming calendar events for landing page display.
 * Returns a limited set of events occurring within a specified number of days.
 *
 * Query Parameters:
 * - limit: Maximum events to return (1-10, default: 3)
 * - days: Days to look ahead (1-30, default: 7)
 *
 * Response: { data: Array<{ id, title, startTime, location }> }
 *
 * @see contracts/upcoming-events-api.md
 * @see User Story 6: Upcoming Events on Landing Page
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};

    const limit = searchParams.get("limit");
    const days = searchParams.get("days");

    if (limit) queryParams.limit = limit;
    if (days) queryParams.days = days;

    // Validate query parameters with Zod
    const result = upcomingEventsQuerySchema.safeParse(queryParams);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: { fieldErrors: result.error.flatten().fieldErrors },
        },
        { status: 400 }
      );
    }

    // Fetch events from database
    const events = await getUpcomingEvents(result.data);

    // Transform to response format (startTime as ISO string)
    const responseData = events.map((event) => ({
      id: event.id,
      title: event.title,
      startTime: event.startTime.toISOString(),
      location: event.location,
    }));

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return NextResponse.json(
      { error: "Unable to load upcoming events. Please try again." },
      { status: 500 }
    );
  }
}
