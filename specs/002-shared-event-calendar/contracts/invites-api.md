# API Contract: Event Invites

**Feature**: 002-shared-event-calendar  
**Base Path**: `/api/events/:id/send-invite`  
**Authentication**: Required (JWT session)

---

## POST /api/events/:id/send-invite

Send calendar invite email with ICS attachment for an event.

### Request

**Path Parameters**:
- `id` (string, required): Event ID (cuid)

**Body** (JSON):
```json
{
  "recipientEmail": "user@example.com"
}
```

**Validation Schema** (Zod):
```typescript
const sendInviteSchema = z.object({
  recipientEmail: z.string().email("Invalid email format").max(320),
});
```

### Response

**Success (200)**:
```json
{
  "data": {
    "inviteId": "clx123...",
    "eventId": "clx456...",
    "recipientEmail": "user@example.com",
    "sentAt": "2026-01-10T15:30:00.000Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Invalid email or event not found:
```json
{
  "error": "Invalid email format"
}
```

**401 Unauthorized** - User not authenticated:
```json
{
  "error": "Authentication required"
}
```

**404 Not Found** - Event doesn't exist:
```json
{
  "error": "Event not found"
}
```

**500 Internal Server Error** - Email sending failure:
```json
{
  "error": "Failed to send email invite. Please check SMTP configuration."
}
```

### Business Logic

1. Validate recipient email format
2. Verify event exists
3. Generate ICS file with event details
4. Send email via Nodemailer with ICS attachment
5. Log invite in EventInvite table
6. Return invite record or error

### Dependencies

- `lib/email.ts`: Email service
- `lib/utils/ics-generator.ts`: ICS file generation
- `lib/queries/invites.ts`: Invite tracking

### Related Requirements

- FR-027: System MUST allow sending calendar invite emails
- FR-028: System MUST generate valid ICS calendar files
- FR-029: System MUST validate email addresses
- FR-030: System MUST log sent invites
