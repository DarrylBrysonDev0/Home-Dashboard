# API Contract: Upcoming Events

**Feature**: 004-landing-navigation  
**Date**: 2026-01-12  
**Status**: Draft

## Overview

New endpoint to fetch upcoming calendar events for the landing page hero section. Returns a limited set of events occurring within a specified number of days from the current date.

---

## GET /api/events/upcoming

Fetch upcoming calendar events for landing page display.

### Authentication

**Required**: Yes (protected by NextAuth middleware)

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 3 | Maximum number of events to return (1-10) |
| `days` | integer | No | 7 | Number of days to look ahead (1-30) |

### Request Example

```http
GET /api/events/upcoming?limit=3&days=7 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

### Response

#### Success (200 OK)

```typescript
interface UpcomingEventsResponse {
  data: Array<{
    id: string;
    title: string;
    startTime: string; // ISO 8601 datetime
    location: string | null;
  }>;
}
```

**Example**:

```json
{
  "data": [
    {
      "id": "clw8x7k9d0001abcd1234efgh",
      "title": "Team Meeting",
      "startTime": "2026-01-13T14:00:00.000Z",
      "location": "Conference Room A"
    },
    {
      "id": "clw8x7k9d0002abcd5678ijkl",
      "title": "Doctor Appointment",
      "startTime": "2026-01-14T10:30:00.000Z",
      "location": null
    },
    {
      "id": "clw8x7k9d0003abcd9012mnop",
      "title": "Birthday Party",
      "startTime": "2026-01-15T18:00:00.000Z",
      "location": "123 Main Street"
    }
  ]
}
```

**Empty Response** (no upcoming events):

```json
{
  "data": []
}
```

#### Error Responses

##### 400 Bad Request

Invalid query parameters.

```json
{
  "error": "Invalid query parameters",
  "details": {
    "fieldErrors": {
      "limit": ["Number must be less than or equal to 10"],
      "days": ["Number must be greater than or equal to 1"]
    }
  }
}
```

##### 401 Unauthorized

User not authenticated (handled by middleware redirect).

##### 500 Internal Server Error

Database or server error.

```json
{
  "error": "Unable to load upcoming events. Please try again."
}
```

---

## Implementation Notes

### Sorting & Filtering

Events are:
1. Filtered to those with `startTime` between now and now + `days`
2. Sorted by `startTime` ascending (soonest first)
3. Limited to `limit` results

### Query Optimization

Use Prisma query with:
- `where: { startTime: { gte: now, lte: endDate } }`
- `orderBy: { startTime: 'asc' }`
- `take: limit`
- `select`: Only required fields (id, title, startTime, location)

### Timezone Handling

Events are stored in UTC. The client is responsible for displaying times in the user's local timezone.

---

## Zod Validation Schemas

```typescript
// lib/validations/event.ts

import { z } from "zod";

export const upcomingEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).optional().default(3),
  days: z.coerce.number().int().min(1).max(30).optional().default(7),
});

export const upcomingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.string().datetime(),
  location: z.string().nullable(),
});

export const upcomingEventsResponseSchema = z.object({
  data: z.array(upcomingEventSchema),
});
```

---

## Route File

**Path**: `app/api/events/upcoming/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/queries/events";
import { upcomingEventsQuerySchema } from "@/lib/validations/event";

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    
    const limit = searchParams.get("limit");
    const days = searchParams.get("days");
    
    if (limit) queryParams.limit = limit;
    if (days) queryParams.days = days;

    // Validate
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

    // Fetch events
    const events = await getUpcomingEvents(result.data);

    // Transform to response format
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
```

---

## Query Function

**Path**: `lib/queries/events.ts` (add to existing file)

```typescript
/**
 * Get upcoming events for landing page
 * 
 * @param options.limit - Max events to return (default: 3)
 * @param options.days - Days to look ahead (default: 7)
 */
export async function getUpcomingEvents(options: {
  limit?: number;
  days?: number;
} = {}) {
  const { limit = 3, days = 7 } = options;
  
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return prisma.event.findMany({
    where: {
      startTime: {
        gte: now,
        lte: endDate,
      },
    },
    orderBy: {
      startTime: "asc",
    },
    take: limit,
    select: {
      id: true,
      title: true,
      startTime: true,
      location: true,
    },
  });
}
```

---

## Middleware Update

Add to protected routes in `middleware.ts`:

```typescript
export const config = {
  matcher: [
    // ... existing routes
    "/api/events/upcoming",
  ],
};
```

(Note: Already covered by `/api/events/:path*` pattern)
