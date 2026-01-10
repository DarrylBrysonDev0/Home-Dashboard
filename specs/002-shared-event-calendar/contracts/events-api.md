# Events API Contract

**Version**: 1.0.0  
**Base Path**: `/api/events`  
**Authentication**: Required (NextAuth JWT)

---

## Endpoints Overview

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/events` | List events in date range | Required |
| POST | `/api/events` | Create new event | Required |
| GET | `/api/events/[id]` | Get single event | Required |
| PUT | `/api/events/[id]` | Update event | Required |
| DELETE | `/api/events/[id]` | Delete event | Required |
| POST | `/api/events/[id]/send-invite` | Send email invite | Required |

---

## GET /api/events

List all events within a date range.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start | ISO 8601 string | No | Range start (inclusive) |
| end | ISO 8601 string | No | Range end (inclusive) |
| categoryId | string (cuid) | No | Filter by category |

### Response 200

```typescript
{
  data: Array<{
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: string; // ISO 8601
    endTime: string;   // ISO 8601
    allDay: boolean;
    timezone: string;
    category: {
      id: string;
      name: string;
      color: string;
      icon: string | null;
    } | null;
    createdBy: {
      id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
  }>
}
```

### Response 401

```typescript
{ error: "Unauthorized" }
```

---

## POST /api/events

Create a new calendar event.

### Request Body

```typescript
{
  title: string;          // Required, 1-200 chars
  description?: string;   // Optional, max 2000 chars
  location?: string;      // Optional, max 500 chars
  startTime: string;      // Required, ISO 8601
  endTime: string;        // Required, ISO 8601
  allDay?: boolean;       // Default: false
  categoryId?: string;    // Optional, cuid
  timezone?: string;      // Default: "America/New_York"
}
```

### Zod Schema

```typescript
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  categoryId: z.string().cuid().optional(),
  timezone: z.string().default("America/New_York"),
}).refine(
  data => new Date(data.endTime) > new Date(data.startTime),
  { message: "End time must be after start time", path: ["endTime"] }
);
```

### Response 201

```typescript
{
  data: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: string;
    endTime: string;
    allDay: boolean;
    timezone: string;
    category: { id: string; name: string; color: string; } | null;
    createdBy: { id: string; name: string; };
    createdAt: string;
    updatedAt: string;
  }
}
```

### Response 400

```typescript
{
  error: "Validation failed",
  details: {
    fieldErrors: {
      [field: string]: string[];
    }
  }
}
```

### Response 401

```typescript
{ error: "Unauthorized" }
```

---

## GET /api/events/[id]

Get a single event by ID.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | Event ID |

### Response 200

```typescript
{
  data: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startTime: string;
    endTime: string;
    allDay: boolean;
    timezone: string;
    recurrenceRule: string | null;
    category: {
      id: string;
      name: string;
      color: string;
      icon: string | null;
    } | null;
    createdBy: {
      id: string;
      name: string;
    };
    attendees: Array<{
      id: string;
      user: { id: string; name: string; };
      status: "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
    }>;
    invitesSent: Array<{
      id: string;
      recipientEmail: string;
      sentAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }
}
```

### Response 404

```typescript
{ error: "Event not found" }
```

---

## PUT /api/events/[id]

Update an existing event. Any household member can update any event (FR-020).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | Event ID |

### Request Body

```typescript
{
  title?: string;         // 1-200 chars
  description?: string;   // max 2000 chars
  location?: string;      // max 500 chars
  startTime?: string;     // ISO 8601
  endTime?: string;       // ISO 8601
  allDay?: boolean;
  categoryId?: string | null;
  timezone?: string;
}
```

### Response 200

```typescript
{
  data: {
    id: string;
    title: string;
    // ... same as GET response
  }
}
```

### Response 400

```typescript
{
  error: "Validation failed",
  details: { /* field errors */ }
}
```

### Response 404

```typescript
{ error: "Event not found" }
```

---

## DELETE /api/events/[id]

Delete an event. Any household member can delete any event (FR-020).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | Event ID |

### Response 200

```typescript
{ data: { success: true } }
```

### Response 404

```typescript
{ error: "Event not found" }
```

---

## POST /api/events/[id]/send-invite

Send an email calendar invite for an event (FR-027).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (cuid) | Event ID |

### Request Body

```typescript
{
  recipientEmail: string;  // Required, valid email
}
```

### Zod Schema

```typescript
const sendInviteSchema = z.object({
  recipientEmail: z.string().email(),
});
```

### Response 200

```typescript
{ data: { success: true, message: "Invite sent successfully" } }
```

### Response 400

```typescript
{ error: "Invalid email address" }
```

### Response 404

```typescript
{ error: "Event not found" }
```

### Response 500

```typescript
{ error: "Failed to send invite. Please try again." }
```

---

## Error Response Format

All error responses follow this format:

```typescript
{
  error: string;           // User-friendly message
  details?: object;        // Optional validation details
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Not authorized (admin routes) |
| 404 | Resource not found |
| 500 | Server error |
