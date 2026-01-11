# Data Model: Shared Event Calendar

**Feature**: 002-shared-event-calendar  
**Date**: 2026-01-10  
**Status**: Complete

---

## Entity Overview

This feature introduces 5 new entities to support authentication and calendar functionality:

| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| **User** | Household member authentication | Creates events, attends events |
| **EventCategory** | Event classification with colors | Has many events |
| **Event** | Calendar entry | Belongs to category, created by user |
| **EventAttendee** | User-event attendance | Links users to events |
| **EventInvite** | Email invite tracking | Belongs to event |

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│      User       │         │  EventCategory  │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ email (unique)  │         │ name (unique)   │
│ name            │         │ color           │
│ passwordHash    │         │ icon            │
│ role            │         └────────┬────────┘
│ avatarColor     │                  │
│ failedAttempts  │                  │ 1:N
│ lockedUntil     │                  │
│ createdAt       │                  ▼
│ updatedAt       │         ┌─────────────────┐
└────────┬────────┘         │      Event      │
         │                  ├─────────────────┤
         │ 1:N (creator)    │ id (PK)         │
         └─────────────────►│ title           │
                            │ description     │
         ┌─────────────────►│ location        │
         │ N:M (attendees)  │ startTime       │
         │                  │ endTime         │
┌────────┴────────┐         │ allDay          │
│  EventAttendee  │         │ timezone        │
├─────────────────┤         │ recurrenceRule  │
│ id (PK)         │         │ categoryId (FK) │
│ eventId (FK)    │◄────────│ createdById(FK) │
│ userId (FK)     │         │ createdAt       │
│ status          │         │ updatedAt       │
└─────────────────┘         └────────┬────────┘
                                     │
                                     │ 1:N
                                     ▼
                            ┌─────────────────┐
                            │   EventInvite   │
                            ├─────────────────┤
                            │ id (PK)         │
                            │ eventId (FK)    │
                            │ recipientEmail  │
                            │ sentAt          │
                            └─────────────────┘
```

---

## Prisma Schema Additions

Add the following models to `prisma/schema.prisma`:

```prisma
// ============================================
// ENUMS
// ============================================

enum UserRole {
  ADMIN
  MEMBER
}

enum AttendeeStatus {
  PENDING
  ACCEPTED
  DECLINED
  TENTATIVE
}

// ============================================
// AUTHENTICATION MODELS
// ============================================

model User {
  id                  String    @id @default(cuid())
  email               String    @unique @db.NVarChar(320)
  name                String    @db.NVarChar(100)
  passwordHash        String    @db.NVarChar(200)
  role                UserRole  @default(MEMBER)
  avatarColor         String?   @db.NVarChar(7)  // Hex color like #F97316
  
  // Account lockout tracking (FR-005)
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime? @db.DateTime2(3)
  
  createdAt           DateTime  @default(now()) @db.DateTime2(3)
  updatedAt           DateTime  @updatedAt @db.DateTime2(3)
  
  // Relations
  eventsCreated       Event[]   @relation("EventCreator")
  eventsInvited       EventAttendee[]
  
  @@map("users")
}

// ============================================
// CALENDAR MODELS
// ============================================

model EventCategory {
  id          String    @id @default(cuid())
  name        String    @unique @db.NVarChar(50)
  color       String    @db.NVarChar(7)  // Hex color like #F97316
  icon        String?   @db.NVarChar(50) // Lucide icon name
  createdAt   DateTime  @default(now()) @db.DateTime2(3)
  
  events      Event[]
  
  @@map("event_categories")
}

model Event {
  id              String    @id @default(cuid())
  
  // Core event data (FR-015, FR-016)
  title           String    @db.NVarChar(200)
  description     String?   @db.NVarChar(2000)
  location        String?   @db.NVarChar(500)
  
  // Timing - stored in UTC (FR-022)
  startTime       DateTime  @db.DateTime2(3)
  endTime         DateTime  @db.DateTime2(3)
  allDay          Boolean   @default(false)
  timezone        String    @default("America/New_York") @db.NVarChar(50) // IANA timezone
  
  // Recurrence (future expansion, not in MVP UI)
  recurrenceRule  String?   @db.NVarChar(500) // RRULE format
  
  // Relations
  categoryId      String?
  category        EventCategory? @relation(fields: [categoryId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  createdById     String
  createdBy       User      @relation("EventCreator", fields: [createdById], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  attendees       EventAttendee[]
  invitesSent     EventInvite[]
  
  // Timestamps (FR-023)
  createdAt       DateTime  @default(now()) @db.DateTime2(3)
  updatedAt       DateTime  @updatedAt @db.DateTime2(3)
  
  // Indexes for calendar queries
  @@index([startTime, endTime])
  @@index([categoryId])
  @@index([createdById])
  @@map("events")
}

model EventAttendee {
  id        String         @id @default(cuid())
  eventId   String
  userId    String
  status    AttendeeStatus @default(PENDING)
  
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@unique([eventId, userId])
  @@map("event_attendees")
}

model EventInvite {
  id             String    @id @default(cuid())
  eventId        String
  recipientEmail String    @db.NVarChar(320)
  sentAt         DateTime  @default(now()) @db.DateTime2(3)
  
  event          Event     @relation(fields: [eventId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  
  @@index([eventId])
  @@map("event_invites")
}
```

---

## Field Specifications

### User

| Field | Type | Constraints | Description | FR |
|-------|------|-------------|-------------|-----|
| id | cuid | PK | Unique identifier | - |
| email | NVarChar(320) | Unique, Required | Login email | FR-001 |
| name | NVarChar(100) | Required | Display name | - |
| passwordHash | NVarChar(200) | Required | bcrypt hash | FR-002 |
| role | UserRole enum | Default: MEMBER | ADMIN or MEMBER | FR-007 |
| avatarColor | NVarChar(7) | Optional | Hex color for avatar | - |
| failedLoginAttempts | Int | Default: 0 | Consecutive failures | FR-005 |
| lockedUntil | DateTime2 | Optional | Account unlock time | FR-005 |
| createdAt | DateTime2 | Auto | Creation timestamp | - |
| updatedAt | DateTime2 | Auto | Last update timestamp | - |

### EventCategory

| Field | Type | Constraints | Description | FR |
|-------|------|-------------|-------------|-----|
| id | cuid | PK | Unique identifier | - |
| name | NVarChar(50) | Unique, Required | Category name | FR-026 |
| color | NVarChar(7) | Required | Hex color for display | FR-012 |
| icon | NVarChar(50) | Optional | Lucide icon name | - |
| createdAt | DateTime2 | Auto | Creation timestamp | - |

### Event

| Field | Type | Constraints | Description | FR |
|-------|------|-------------|-------------|-----|
| id | cuid | PK | Unique identifier | - |
| title | NVarChar(200) | Required | Event title | FR-015 |
| description | NVarChar(2000) | Optional | Event description | FR-016 |
| location | NVarChar(500) | Optional | Event location | FR-016 |
| startTime | DateTime2 | Required | Start time (UTC) | FR-015 |
| endTime | DateTime2 | Required | End time (UTC) | FR-015 |
| allDay | Boolean | Default: false | All-day event flag | FR-017 |
| timezone | NVarChar(50) | Default: America/New_York | IANA timezone | FR-022 |
| recurrenceRule | NVarChar(500) | Optional | RRULE (future) | - |
| categoryId | cuid | FK, Optional | Category reference | FR-016 |
| createdById | cuid | FK, Required | Creator reference | FR-023 |
| createdAt | DateTime2 | Auto | Creation timestamp | - |
| updatedAt | DateTime2 | Auto | Last update timestamp | - |

### EventAttendee

| Field | Type | Constraints | Description | FR |
|-------|------|-------------|-------------|-----|
| id | cuid | PK | Unique identifier | - |
| eventId | cuid | FK, Required | Event reference | - |
| userId | cuid | FK, Required | User reference | - |
| status | AttendeeStatus | Default: PENDING | Attendance status | - |

### EventInvite

| Field | Type | Constraints | Description | FR |
|-------|------|-------------|-------------|-----|
| id | cuid | PK | Unique identifier | - |
| eventId | cuid | FK, Required | Event reference | FR-030 |
| recipientEmail | NVarChar(320) | Required | Invite recipient | FR-027 |
| sentAt | DateTime2 | Auto | Send timestamp | FR-030 |

---

## Seed Data

### Default Categories (FR-026)

```typescript
// prisma/seed.ts
const defaultCategories = [
  { name: 'Family', color: '#F97316', icon: 'home' },      // Orange (Cemdash primary)
  { name: 'Work', color: '#3B82F6', icon: 'briefcase' },   // Blue
  { name: 'Medical', color: '#EF4444', icon: 'heart' },    // Red
  { name: 'Social', color: '#8B5CF6', icon: 'users' },     // Purple
  { name: 'Finance', color: '#10B981', icon: 'dollar-sign' }, // Green
  { name: 'Other', color: '#6B7280', icon: 'calendar' },   // Gray
];
```

### Initial Admin User

```typescript
const adminUser = {
  email: 'admin@home.local',
  name: 'Admin',
  passwordHash: await bcrypt.hash('ChangeMe123!', 12),
  role: 'ADMIN',
  avatarColor: '#F97316',
};
```

---

## Validation Rules

### Password Requirements (FR-004)
- Minimum 8 characters
- At least one number
- Maximum 72 characters (bcrypt limit)

```typescript
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/\d/, "Password must contain at least one number");
```

### Event Validation
- Title: 1-200 characters, required
- Description: 0-2000 characters, optional
- Location: 0-500 characters, optional
- End time must be after start time

```typescript
const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  categoryId: z.string().cuid().optional(),
  timezone: z.string().default("America/New_York"),
}).refine(data => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});
```

---

## Migration Notes

### MSSQL Considerations
1. Use `NoAction` for referential actions (MSSQL cascade restrictions)
2. Use `DateTime2(3)` for millisecond precision
3. Use `NVarChar` for Unicode support
4. Composite index on `[startTime, endTime]` for efficient date range queries

### Migration Command
```bash
npx prisma migrate dev --name add_calendar_models
```

---

## TypeScript Types

Generated by Prisma, available at `generated/prisma/models.ts`:

```typescript
// Key types that will be generated
type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  avatarColor: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  timezone: string;
  recurrenceRule: string | null;
  categoryId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

type EventCategory = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: Date;
};
```
