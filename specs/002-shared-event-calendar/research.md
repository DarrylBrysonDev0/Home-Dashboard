# Research: Shared Event Calendar

**Feature**: 002-shared-event-calendar  
**Date**: 2026-01-10  
**Status**: Complete

---

## 1. Authentication with NextAuth.js v4

### Decision
Use NextAuth.js v4 with Credentials Provider and JWT session strategy. Sessions persist for 7 days. Custom login page at `/login`. Middleware-based route protection.

### Rationale
- **JWT Strategy Required**: Credentials provider only works with JWT sessions (no database session table needed)
- **Native App Router Support**: NextAuth v4 has stable App Router support via route handlers
- **Simple for Household Use**: No OAuth complexity needed for internal family authentication
- **Built-in Middleware**: `withAuth` wrapper simplifies protected route implementation

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| NextAuth v5 (Auth.js) | Still in beta; v4 more stable for production |
| Custom JWT implementation | Reinventing wheel; NextAuth handles edge cases |
| Session-based auth | Requires database table; overkill for household scale |
| OAuth providers | Unnecessary complexity for internal-only access |

### Implementation Notes

**NextAuth Configuration** (`lib/auth.ts`):
```typescript
export const authOptions: NextAuthOptions = {
  session: { 
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60 // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        // Validate, check lockout, verify password
        // Return user object or null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
```

**Middleware for Route Protection** (`middleware.ts`):
```typescript
export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute && req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/calendar", req.url));
    }
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

**Environment Variables**:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
```

---

## 2. Password Hashing with bcryptjs

### Decision
Use bcryptjs with 10-12 salt rounds. Always use async methods (`hash`, `compare`) to avoid blocking the event loop.

### Rationale
- **10-12 rounds optimal**: ~100ms hash time balances security vs. user experience
- **Pure JavaScript**: No native bindings, works everywhere (Docker, serverless)
- **bcryptjs over bcrypt**: No node-gyp compilation issues; sufficient for household scale

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| bcrypt (native) | Requires compilation; bcryptjs sufficient for scale |
| Argon2 | More complex setup; bcrypt is standard and well-tested |
| scrypt | Less widely adopted; bcrypt ecosystem better |

### Implementation Notes

**Hashing on User Creation**:
```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Gotchas**:
- bcrypt has 72-byte input limit (truncates longer passwords) - enforce max length in validation
- Salt is embedded in the hash string - no separate storage needed
- Never use sync methods in request handlers

---

## 3. Account Lockout Implementation

### Decision
Track failed login attempts in the User model. Lock account for 15 minutes after 5 consecutive failures. Reset counter on successful login.

### Rationale
- **Simple Database-Based**: No need for Redis or rate limiting middleware
- **Per-Account**: Prevents targeted brute force on specific accounts
- **Self-Healing**: Automatic unlock after timeout period

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Redis-based rate limiting | Overkill for household; adds infrastructure |
| IP-based blocking | Shared IPs in household would block everyone |
| CAPTCHA after failures | UX friction; lockout simpler for small user base |

### Implementation Notes

**User Model Fields**:
```prisma
model User {
  // ... other fields
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
}
```

**Authorize Function Logic**:
```typescript
async authorize(credentials) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Check lockout
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error("Account locked. Try again in 15 minutes.");
  }
  
  const isValid = await verifyPassword(credentials.password, user.passwordHash);
  
  if (!isValid) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lockedUntil: user.failedLoginAttempts >= 4 
          ? new Date(Date.now() + 15 * 60 * 1000) 
          : null,
      },
    });
    throw new Error("Invalid email or password");
  }
  
  // Reset on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
```

---

## 4. FullCalendar v6 React Integration

### Decision
Use FullCalendar v6 with daygrid, timegrid, and interaction plugins. Implement as client component with category-based coloring.

### Rationale
- **Feature-Complete**: Built-in drag-drop, click handling, multiple views
- **React Native**: First-class React support, not a wrapper
- **MIT Licensed Core**: Free for commercial use; no feature limitations for MVP

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| React Big Calendar | Less polished drag-drop; fewer built-in views |
| react-calendar | Too simple; no week/day views or event display |
| Custom implementation | Significant development time; edge cases |

### Implementation Notes

**Required Packages**:
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction luxon
```

**CalendarView Component**:
```typescript
"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export function CalendarView({ events, onEventClick, onDateSelect }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.startTime,
        end: e.endTime,
        allDay: e.allDay,
        backgroundColor: e.category?.color,
        borderColor: e.category?.color,
        extendedProps: e,
      }))}
      selectable={true}
      editable={true}
      select={({ start, end }) => onDateSelect(start, end)}
      eventClick={({ event }) => onEventClick(event.extendedProps)}
      timeZone="America/New_York"
      height="auto"
    />
  );
}
```

**Styling for Cemdash Design System**:
```css
.fc {
  --fc-button-bg-color: #f97316;
  --fc-button-border-color: #f97316;
  --fc-button-hover-bg-color: #ea580c;
  --fc-button-active-bg-color: #c2410c;
  --fc-today-bg-color: rgba(249, 115, 22, 0.1);
  font-family: 'Inter', sans-serif;
}
```

**Gotchas**:
- Must use `'use client'` directive - FullCalendar uses browser APIs
- Set `timeZone` explicitly for consistent display
- Use `datesSet` callback for efficient data fetching (fetch only visible range)

---

## 5. Email Invites with Nodemailer and ICS

### Decision
Use Nodemailer with Gmail SMTP (App Password) and the `ics` package for calendar file generation. Attach ICS files with METHOD: REQUEST for actionable invites.

### Rationale
- **Free and Reliable**: Gmail SMTP with App Password works for low volume (~100/day)
- **No External Services**: Self-hosted solution, no Sendgrid/Mailgun needed
- **ICS Standard**: Universal calendar format works with Google, Outlook, Apple

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Resend/SendGrid | External dependency; cost for paid tiers |
| Direct Google Calendar API | OAuth complexity; overkill for invites |
| ical-generator package | More complex API; `ics` simpler for basic events |

### Implementation Notes

**Gmail App Password Setup**:
1. Enable 2-Step Verification on Google Account
2. Go to Security → App Passwords
3. Generate password for "Mail"
4. Use 16-character password in `SMTP_APP_PASSWORD`

**Environment Variables**:
```env
SMTP_USER=your-email@gmail.com
SMTP_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

**Email Service** (`lib/email.ts`):
```typescript
import nodemailer from "nodemailer";
import { createEvent, EventAttributes } from "ics";
import { DateTime } from "luxon";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_APP_PASSWORD,
  },
});

export async function sendCalendarInvite(params: CalendarInviteParams) {
  const { event, recipientEmail, organizerEmail, organizerName } = params;
  
  // Convert to ICS date format using Luxon for timezone handling
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
    uid: `${event.id}@cemdash.local`, // Globally unique
  };
  
  const { error, value: icsContent } = createEvent(icsEvent);
  if (error) throw new Error(`ICS generation failed: ${error}`);
  
  await transporter.sendMail({
    from: `"${organizerName}" <${organizerEmail}>`,
    to: recipientEmail,
    subject: `Calendar Invite: ${event.title}`,
    text: `You've been invited to: ${event.title}`,
    html: `<h2>${event.title}</h2><p>When: ${start.toFormat("EEEE, MMMM d 'at' h:mm a")}</p>`,
    icalEvent: {
      method: "REQUEST", // REQUEST makes it actionable (Accept/Decline)
      content: icsContent,
    },
  });
}
```

**Gotchas**:
- Use `METHOD: REQUEST` (not PUBLISH) for calendar apps to show accept/decline buttons
- UID must be globally unique - use `eventId@domain` pattern
- Gmail rate limit: ~100 emails/day for App Password (sufficient for household)
- Test with Gmail and Outlook - different parsing behaviors

---

## 6. Prisma with MSSQL for Calendar Entities

### Decision
Extend existing Prisma schema with User, Event, EventCategory, EventAttendee, EventInvite models. Use `NoAction` referential actions for MSSQL compatibility.

### Rationale
- **Existing Infrastructure**: Reuse MSSQL container and Prisma setup from feature 001
- **MSSQL Constraints**: Cascade deletes have restrictions in MSSQL; `NoAction` with manual handling safer
- **Optimized Indexes**: Composite index on date range for efficient calendar queries

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Separate SQLite for auth | Adds complexity; MSSQL handles both fine |
| MongoDB for events | Different paradigm; relational fits calendar domain |
| JSON storage in MSSQL | Harder to query; proper tables more efficient |

### Implementation Notes

**Key Schema Additions**:
```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  name                String
  passwordHash        String
  role                UserRole  @default(MEMBER)
  avatarColor         String?
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  eventsCreated       Event[]   @relation("EventCreator")
  eventsInvited       EventAttendee[]
  
  @@map("users")
}

model Event {
  id              String    @id @default(cuid())
  title           String    @db.NVarChar(200)
  description     String?   @db.NVarChar(2000)
  location        String?   @db.NVarChar(500)
  startTime       DateTime  @db.DateTime2(3)
  endTime         DateTime  @db.DateTime2(3)
  allDay          Boolean   @default(false)
  timezone        String    @default("America/New_York")
  recurrenceRule  String?   @db.NVarChar(500)
  
  categoryId      String?
  category        EventCategory? @relation(fields: [categoryId], references: [id], onDelete: NoAction)
  
  createdById     String
  createdBy       User      @relation("EventCreator", fields: [createdById], references: [id], onDelete: NoAction)
  
  attendees       EventAttendee[]
  invitesSent     EventInvite[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([startTime, endTime])
  @@index([categoryId])
  @@index([createdById])
  @@map("events")
}
```

**Gotchas**:
- Use `onDelete: NoAction` and handle deletions in application code
- `DateTime2(3)` for millisecond precision in MSSQL
- `NVarChar` for Unicode support in title/description
- Composite index on `[startTime, endTime]` for efficient date range queries

---

## 7. Timezone Handling

### Decision
Store all times in UTC in database. Store user's preferred timezone in event record. Use Luxon for display formatting and ICS generation.

### Rationale
- **UTC Storage**: Avoids timezone conversion bugs; single source of truth
- **Per-Event Timezone**: Events can specify display timezone (default: America/New_York)
- **Luxon over date-fns**: Better timezone handling with IANA timezone support

### Implementation Notes

```typescript
import { DateTime } from "luxon";

// Convert local time to UTC for storage
function toUTC(localTime: Date, timezone: string): Date {
  return DateTime.fromJSDate(localTime, { zone: timezone })
    .toUTC()
    .toJSDate();
}

// Format UTC time for display
function formatForDisplay(utcTime: Date, timezone: string): string {
  return DateTime.fromJSDate(utcTime)
    .setZone(timezone)
    .toFormat("EEEE, MMMM d 'at' h:mm a ZZZZ");
}
```

---

## Summary of Technology Decisions

| Component | Decision | Key Packages |
|-----------|----------|--------------|
| Authentication | NextAuth.js v4 + Credentials + JWT | `next-auth` |
| Password Hashing | bcryptjs, 12 rounds | `bcryptjs` |
| Account Lockout | Database-tracked with 15-min timeout | (Prisma) |
| Calendar UI | FullCalendar v6 with interaction plugin | `@fullcalendar/*` |
| Email Invites | Nodemailer + Gmail SMTP + ics | `nodemailer`, `ics` |
| Timezone Handling | Luxon with UTC storage | `luxon` |
| Database | MSSQL via Prisma ORM | `prisma` |
