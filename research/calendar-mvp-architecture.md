# Calendar & Events Page - MVP Architecture

## Executive Summary

This document outlines the architecture and implementation plan for adding a Calendar & Events collaboration page to the Cemdash home finance dashboard. The MVP scope focuses on three core features:

1. **Site Authentication** - Household member login system
2. **Local Calendar** - Event tracking and management within the site
3. **Google Calendar Invites via Email** - Option to email ICS calendar invites when creating events

This approach deliberately avoids the complexity of full bidirectional Google Calendar sync (OAuth token management, webhooks, background jobs) in favor of a simpler, more maintainable architecture suitable for a home lab environment.

---

## Tech Stack Additions

### Core Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `next-auth` | Authentication framework | ^4.24.x |
| `bcryptjs` | Password hashing | ^2.4.x |
| `@fullcalendar/react` | Calendar UI component | ^6.x |
| `@fullcalendar/daygrid` | Month/day grid views | ^6.x |
| `@fullcalendar/timegrid` | Week/time views | ^6.x |
| `@fullcalendar/interaction` | Drag-drop & click events | ^6.x |
| `ics` | ICS file generation | ^3.x |
| `nodemailer` | Email sending via SMTP | ^6.x |
| `@types/nodemailer` | TypeScript definitions | ^6.x |
| `luxon` | Date/time handling with timezones | ^3.x |

### Why These Choices

**NextAuth.js with Credentials Provider** - Perfect for household authentication where you don't need OAuth complexity. Supports JWT sessions (no session database required), custom login pages, and integrates natively with Next.js App Router. The credentials provider validates against your Prisma/MSSQL user table.

**FullCalendar over React Big Calendar** - While React Big Calendar has more weekly downloads, FullCalendar offers superior features for this use case: built-in drag-and-drop event editing, better timezone handling, customizable event rendering, and extensive documentation. The standard (free) version includes everything needed for the MVP.

**Nodemailer with Gmail SMTP** - For a self-hosted home lab, Nodemailer with Gmail App Passwords provides free, reliable email delivery without external service dependencies. Gmail's 500 emails/day limit is more than sufficient for household calendar invites.

**`ics` Package** - Lightweight, well-maintained library specifically for generating ICS calendar files. Simpler than `ical-generator` for basic event creation with proper timezone support.

---

## Database Schema Additions

Add these models to your existing Prisma schema:

```prisma
// ============================================
// AUTHENTICATION MODELS
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  passwordHash  String
  role          UserRole  @default(MEMBER)
  avatarColor   String?   // For UI avatar generation
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  eventsCreated Event[]   @relation("EventCreator")
  eventsInvited EventAttendee[]
  
  @@map("users")
}

enum UserRole {
  ADMIN
  MEMBER
}

// ============================================
// CALENDAR MODELS
// ============================================

model EventCategory {
  id          String    @id @default(cuid())
  name        String    @unique
  color       String    // Hex color for calendar display
  icon        String?   // Lucide icon name
  createdAt   DateTime  @default(now())
  
  events      Event[]
  
  @@map("event_categories")
}

model Event {
  id              String    @id @default(cuid())
  
  // Core event data
  title           String    @db.NVarChar(200)
  description     String?   @db.NVarChar(2000)
  location        String?   @db.NVarChar(500)
  
  // Timing (stored in UTC)
  startTime       DateTime  @db.DateTime2(3)
  endTime         DateTime  @db.DateTime2(3)
  allDay          Boolean   @default(false)
  timezone        String    @default("America/New_York") // IANA timezone for display
  
  // Recurrence (RRULE format for future expansion)
  recurrenceRule  String?   @db.NVarChar(500)
  
  // Relations
  categoryId      String?
  category        EventCategory? @relation(fields: [categoryId], references: [id])
  
  createdById     String
  createdBy       User      @relation("EventCreator", fields: [createdById], references: [id])
  
  attendees       EventAttendee[]
  invitesSent     EventInvite[]
  
  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([startTime, endTime])
  @@index([categoryId])
  @@index([createdById])
  @@map("events")
}

model EventAttendee {
  id        String   @id @default(cuid())
  eventId   String
  userId    String
  status    AttendeeStatus @default(PENDING)
  
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, userId])
  @@map("event_attendees")
}

enum AttendeeStatus {
  PENDING
  ACCEPTED
  DECLINED
  TENTATIVE
}

model EventInvite {
  id            String    @id @default(cuid())
  eventId       String
  recipientEmail String   @db.NVarChar(320)
  sentAt        DateTime  @default(now())
  
  event         Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@map("event_invites")
}
```

### Default Categories (Seed Data)

```typescript
const defaultCategories = [
  { name: 'Family', color: '#F97316', icon: 'home' },      // Orange
  { name: 'Work', color: '#3B82F6', icon: 'briefcase' },   // Blue
  { name: 'Medical', color: '#EF4444', icon: 'heart' },    // Red
  { name: 'Social', color: '#8B5CF6', icon: 'users' },     // Purple
  { name: 'Finance', color: '#10B981', icon: 'dollar-sign' }, // Green (matches Cemdash theme)
  { name: 'Other', color: '#6B7280', icon: 'calendar' },   // Gray
];
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP ROUTER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   /login     │    │  /calendar   │    │   /admin     │       │
│  │              │    │              │    │   /users     │       │
│  │  Login Form  │    │  FullCalendar│    │  User Mgmt   │       │
│  │  (NextAuth)  │    │  Event Modal │    │  Categories  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API ROUTES (/api)                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │ /auth/[...] │  │  /events    │  │ /events/[id]    │    │  │
│  │  │ NextAuth    │  │  CRUD ops   │  │ /send-invite    │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SERVICE LAYER                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │ AuthService │  │EventService │  │ EmailService    │    │  │
│  │  │ (bcrypt)    │  │ (Prisma)    │  │ (Nodemailer+ICS)│    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                 PRISMA ORM → MSSQL                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │   Gmail SMTP    │
                    │  (App Password) │
                    └─────────────────┘
```

---

## Implementation Plan

### Phase 1: Authentication System (3-4 hours)

#### 1.1 Install Dependencies
```bash
npm install next-auth bcryptjs
npm install -D @types/bcryptjs
```

#### 1.2 Configure NextAuth

**`/app/api/auth/[...nextauth]/route.ts`**
```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  // JWT strategy (no session table needed)
  session: { strategy: "jwt" },
  
  pages: {
    signIn: "/login",
    error: "/login",
  },
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        
        if (!user) {
          throw new Error("Invalid email or password");
        }
        
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        
        if (!isValid) {
          throw new Error("Invalid email or password");
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

#### 1.3 Create Login Page

**`/app/login/page.tsx`** - Styled with Cemdash design system (coral accents, Inter font)

#### 1.4 Protect Routes with Middleware

**`/middleware.ts`**
```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    
    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/calendar", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/calendar/:path*", "/admin/:path*", "/api/events/:path*"],
};
```

#### 1.5 Create Initial Admin User (Seed Script)

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("your-secure-password", 12);
  
  await prisma.user.upsert({
    where: { email: "admin@home.local" },
    update: {},
    create: {
      email: "admin@home.local",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  
  // Seed default categories...
}
```

---

### Phase 2: Calendar UI Component (4-5 hours)

#### 2.1 Install FullCalendar
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction luxon
```

#### 2.2 Calendar Page Structure

```
/app/calendar/
├── page.tsx              # Main calendar page
├── components/
│   ├── CalendarView.tsx  # FullCalendar wrapper
│   ├── EventModal.tsx    # Create/edit event dialog
│   ├── EventDetails.tsx  # Event detail sidebar
│   └── CategoryFilter.tsx # Category toggle filters
└── hooks/
    ├── useEvents.ts      # TanStack Query hooks for events
    └── useCategories.ts  # Category data hooks
```

#### 2.3 FullCalendar Configuration

```typescript
// components/CalendarView.tsx
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DateSelectArg } from "@fullcalendar/core";

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (start: Date, end: Date) => void;
  categoryFilters: string[];
}

export function CalendarView({
  events,
  onEventClick,
  onDateSelect,
  categoryFilters,
}: CalendarViewProps) {
  const filteredEvents = events.filter(
    (e) => categoryFilters.length === 0 || categoryFilters.includes(e.categoryId)
  );

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={filteredEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.startTime,
        end: e.endTime,
        allDay: e.allDay,
        backgroundColor: e.category?.color,
        borderColor: e.category?.color,
        extendedProps: { ...e },
      }))}
      selectable={true}
      selectMirror={true}
      select={(info: DateSelectArg) => {
        onDateSelect(info.start, info.end);
      }}
      eventClick={(info: EventClickArg) => {
        onEventClick(info.event.extendedProps as CalendarEvent);
      }}
      editable={true}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      height="auto"
      // Cemdash styling
      themeSystem="standard"
    />
  );
}
```

#### 2.4 Event Modal with shadcn/ui

Use Dialog component from shadcn/ui with form fields for:
- Title (required)
- Description (optional)
- Location (optional)
- Start date/time
- End date/time
- All-day toggle
- Category select
- "Send Google Calendar Invite" checkbox with email input

---

### Phase 3: Event CRUD API Routes (2-3 hours)

#### 3.1 API Route Structure

```
/app/api/
├── events/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts      # GET, PUT, DELETE
│       └── send-invite/
│           └── route.ts  # POST - send email invite
└── categories/
    └── route.ts          # GET (list)
```

#### 3.2 Events API Example

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  categoryId: z.string().cuid().optional(),
  timezone: z.string().default("America/New_York"),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const events = await prisma.event.findMany({
    where: {
      startTime: { gte: start ? new Date(start) : undefined },
      endTime: { lte: end ? new Date(end) : undefined },
    },
    include: {
      category: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      createdById: session.user.id,
    },
    include: { category: true },
  });

  return NextResponse.json(event, { status: 201 });
}
```

---

### Phase 4: Email Invite System (2-3 hours)

#### 4.1 Install Dependencies
```bash
npm install nodemailer ics
npm install -D @types/nodemailer
```

#### 4.2 Email Service Configuration

**`/lib/email.ts`**
```typescript
import nodemailer from "nodemailer";
import { createEvent, EventAttributes } from "ics";
import { DateTime } from "luxon";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD, // Gmail App Password
  },
});

interface CalendarInviteParams {
  recipientEmail: string;
  event: {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    timezone: string;
  };
  organizerName: string;
  organizerEmail: string;
}

export async function sendCalendarInvite({
  recipientEmail,
  event,
  organizerName,
  organizerEmail,
}: CalendarInviteParams): Promise<void> {
  // Convert dates to ICS format [year, month, day, hour, minute]
  const start = DateTime.fromJSDate(event.startTime).setZone(event.timezone);
  const end = DateTime.fromJSDate(event.endTime).setZone(event.timezone);

  const icsEvent: EventAttributes = {
    start: [start.year, start.month, start.day, start.hour, start.minute],
    end: [end.year, end.month, end.day, end.hour, end.minute],
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    organizer: { name: organizerName, email: organizerEmail },
    attendees: [{ email: recipientEmail, rsvp: true, partstat: "NEEDS-ACTION" }],
    status: "CONFIRMED",
    busyStatus: "BUSY",
    productId: "cemdash-calendar",
  };

  const { error, value: icsContent } = createEvent(icsEvent);
  
  if (error || !icsContent) {
    throw new Error(`Failed to generate ICS: ${error}`);
  }

  await transporter.sendMail({
    from: `"${organizerName}" <${organizerEmail}>`,
    to: recipientEmail,
    subject: `Calendar Invite: ${event.title}`,
    text: `You've been invited to: ${event.title}\n\nWhen: ${start.toFormat("EEEE, MMMM d, yyyy 'at' h:mm a ZZZZ")}\nWhere: ${event.location || "TBD"}\n\nOpen the attached .ics file to add this event to your calendar.`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px;">
        <h2 style="color: #1f2937;">You're Invited!</h2>
        <h3 style="color: #f97316;">${event.title}</h3>
        <p><strong>When:</strong> ${start.toFormat("EEEE, MMMM d, yyyy 'at' h:mm a ZZZZ")}</p>
        <p><strong>Where:</strong> ${event.location || "TBD"}</p>
        ${event.description ? `<p>${event.description}</p>` : ""}
        <p style="color: #6b7280; font-size: 14px;">
          Open the attached .ics file to add this event to your Google Calendar or other calendar app.
        </p>
      </div>
    `,
    icalEvent: {
      method: "REQUEST",
      content: icsContent,
    },
  });
}
```

#### 4.3 Send Invite API Route

```typescript
// app/api/events/[id]/send-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { sendCalendarInvite } from "@/lib/email";
import { z } from "zod";

const sendInviteSchema = z.object({
  recipientEmail: z.string().email(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = sendInviteSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { category: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    await sendCalendarInvite({
      recipientEmail: parsed.data.recipientEmail,
      event: {
        title: event.title,
        description: event.description || undefined,
        location: event.location || undefined,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
      },
      organizerName: session.user.name || "Cemdash Calendar",
      organizerEmail: process.env.SMTP_USER!,
    });

    // Log the invite
    await prisma.eventInvite.create({
      data: {
        eventId: event.id,
        recipientEmail: parsed.data.recipientEmail,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send invite:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
```

---

### Phase 5: Admin Panel (2-3 hours)

#### 5.1 Admin Routes

```
/app/admin/
├── layout.tsx           # Admin layout with sidebar
├── page.tsx             # Dashboard overview
├── users/
│   ├── page.tsx         # User list
│   └── [id]/page.tsx    # Edit user
└── categories/
    └── page.tsx         # Manage categories
```

#### 5.2 User Management Features
- Add household members (email, name, password)
- Edit user details
- Change user roles (Admin/Member)
- Delete users (soft delete recommended)

#### 5.3 Category Management
- Add/edit/delete event categories
- Set colors (color picker using Cemdash palette)
- Assign icons (Lucide icon picker)

---

## Environment Variables

```env
# Database (existing)
DATABASE_URL="sqlserver://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Gmail with App Password)
SMTP_USER="your-email@gmail.com"
SMTP_APP_PASSWORD="your-16-char-app-password"
```

### Gmail App Password Setup
1. Enable 2-Step Verification on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password as `SMTP_APP_PASSWORD`

---

## Cemdash Design Integration

### Color Palette for Calendar
```css
/* Event category colors should complement Cemdash coral accent */
--calendar-family: #F97316;    /* Orange - matches Cemdash primary */
--calendar-work: #3B82F6;      /* Blue */
--calendar-medical: #EF4444;   /* Red */
--calendar-social: #8B5CF6;    /* Purple */
--calendar-finance: #10B981;   /* Green - matches Cemdash success */
--calendar-other: #6B7280;     /* Gray */
```

### FullCalendar Theme Override
```css
/* Match FullCalendar to Cemdash design system */
.fc {
  font-family: 'Inter', sans-serif;
}

.fc-button-primary {
  background-color: #f97316 !important;
  border-color: #f97316 !important;
}

.fc-button-primary:hover {
  background-color: #ea580c !important;
}

.fc-today-button {
  background-color: transparent !important;
  color: #f97316 !important;
  border-color: #f97316 !important;
}

.fc-daygrid-day.fc-day-today {
  background-color: rgba(249, 115, 22, 0.1) !important;
}
```

---

## File Structure Summary

```
/app
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── events/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── send-invite/route.ts
│   ├── categories/route.ts
│   └── users/route.ts
├── login/page.tsx
├── calendar/
│   ├── page.tsx
│   └── components/
│       ├── CalendarView.tsx
│       ├── EventModal.tsx
│       ├── EventDetails.tsx
│       └── CategoryFilter.tsx
├── admin/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── users/page.tsx
│   └── categories/page.tsx
└── layout.tsx

/lib
├── auth.ts              # NextAuth config export
├── prisma.ts            # Prisma client singleton
├── email.ts             # Nodemailer + ICS service
└── validations/
    └── event.ts         # Zod schemas

/prisma
├── schema.prisma        # Updated with new models
└── seed.ts              # Admin user + categories

/components
└── ui/                  # shadcn/ui components
```

---

## Implementation Timeline

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Authentication (NextAuth + Prisma) | 3-4 hours |
| 2 | Calendar UI (FullCalendar + Modal) | 4-5 hours |
| 3 | Event CRUD API | 2-3 hours |
| 4 | Email Invite System | 2-3 hours |
| 5 | Admin Panel | 2-3 hours |
| **Total** | | **13-18 hours** |

---

## Future Expansion Path

When ready to add full Google Calendar sync, the architecture supports gradual expansion:

1. **Add OAuth connection management** - New `GoogleAccount` model for admin-managed OAuth tokens
2. **Implement webhook receiver** - `/api/webhooks/google-calendar` route with Cloudflare Tunnel
3. **Add background sync** - BullMQ workers for bidirectional sync
4. **Extend Event model** - Add `externalId`, `etag`, `syncStatus` fields

The MVP's clean separation of concerns (services, API routes, UI components) makes this expansion straightforward without rewriting existing code.
