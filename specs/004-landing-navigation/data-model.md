# Data Model: Landing Page & Navigation Top Bar

**Feature**: 004-landing-navigation  
**Date**: 2026-01-12  
**Status**: Complete

## Overview

This feature primarily reads existing data models (User, Event) and introduces no new database entities. The data model documentation focuses on TypeScript interfaces for component props and API responses.

## Existing Database Entities (Read Only)

### User (from Prisma schema)

Used for: Avatar display, greeting, session validation

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique @db.NVarChar(320)
  name                String    @db.NVarChar(100)
  role                String    @default("MEMBER") @db.NVarChar(20)
  avatarColor         String?   @db.NVarChar(7)
  // ... other fields not used by this feature
}
```

**Fields used by this feature**:
| Field | Usage |
|-------|-------|
| `name` | Personalized greeting, avatar initials |
| `email` | User menu display |
| `role` | Admin panel link visibility |
| `avatarColor` | Avatar background color |

### Event (from Prisma schema)

Used for: Upcoming events display on landing page

```prisma
model Event {
  id              String    @id
  title           String    @db.NVarChar(200)
  description     String?   @db.NVarChar(2000)
  location        String?   @db.NVarChar(500)
  startTime       DateTime  @db.DateTime
  endTime         DateTime  @db.DateTime
  allDay          Boolean   @default(false)
  timezone        String    @default("America/New_York")
  // ... relations
}
```

**Fields used by this feature**:
| Field | Usage |
|-------|-------|
| `id` | Link to calendar event detail |
| `title` | Event card title |
| `startTime` | Display date/time, sort order |
| `location` | Optional location display |

---

## Component Data Interfaces

### Navigation Components

#### NavBarProps

```typescript
// components/navigation/nav-bar.tsx
export interface NavBarProps {
  className?: string;
}
```

NavBar retrieves user data internally via `useSession()` hook.

#### NavItemProps

```typescript
// components/navigation/nav-item.tsx
import { LucideIcon } from "lucide-react";

export interface NavItemProps {
  /** Target route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Whether navigation is pending (loading state) */
  isPending?: boolean;
  /** Custom class names */
  className?: string;
}
```

**Validation Rules**:
- `href` must be a valid route path starting with `/`
- `label` must be non-empty string

#### NavItemsProps

```typescript
// components/navigation/nav-items.tsx
export interface NavItemsProps {
  /** Whether in mobile drawer context */
  isMobile?: boolean;
  /** Callback when nav item is clicked (for drawer close) */
  onItemClick?: () => void;
}
```

#### MobileDrawerProps

```typescript
// components/navigation/mobile-drawer.tsx
export interface MobileDrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Callback to close drawer */
  onClose: () => void;
}
```

#### LogoProps

```typescript
// components/navigation/logo.tsx
export interface LogoProps {
  className?: string;
}
```

---

### Home/Landing Page Components

#### HeroSectionProps

```typescript
// components/home/hero-section.tsx
export interface HeroSectionProps {
  /** User's first name for greeting */
  userName: string;
  className?: string;
}
```

**Validation Rules**:
- `userName` defaults to "there" if empty/undefined

#### UpcomingEventsProps

```typescript
// components/home/upcoming-events.tsx
export interface UpcomingEventsProps {
  /** Maximum number of events to display */
  maxEvents?: number; // Default: 3
  /** Number of days to look ahead */
  daysAhead?: number; // Default: 7
  className?: string;
}
```

#### EventCardMiniProps

```typescript
// components/home/event-card-mini.tsx
export interface UpcomingEvent {
  id: string;
  title: string;
  startTime: Date;
  location?: string | null;
}

export interface EventCardMiniProps {
  event: UpcomingEvent;
  className?: string;
}
```

**Validation Rules**:
- `id` must be non-empty string (CUID format)
- `title` must be non-empty string
- `startTime` must be valid Date in the future

#### AppSelectionPanelProps

```typescript
// components/home/app-selection-panel.tsx
export interface AppSelectionPanelProps {
  className?: string;
}
```

#### AppCardProps

```typescript
// components/home/app-card.tsx
import { LucideIcon } from "lucide-react";

export interface AppCardProps {
  /** Target route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Card title */
  title: string;
  /** Brief description */
  description: string;
  /** Whether this is the current page */
  isCurrentPage?: boolean;
  className?: string;
}
```

**Validation Rules**:
- `href` must be a valid route path starting with `/`
- `title` must be non-empty string (max 50 chars)
- `description` must be non-empty string (max 100 chars)

---

## API Response Types

### Upcoming Events Response

```typescript
// lib/validations/event.ts (extend existing)
import { z } from "zod";

export const upcomingEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.string().datetime(),
  location: z.string().nullable(),
});

export const upcomingEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).optional().default(3),
  days: z.coerce.number().int().min(1).max(30).optional().default(7),
});

export const upcomingEventsResponseSchema = z.object({
  data: z.array(upcomingEventSchema),
});

export type UpcomingEvent = z.infer<typeof upcomingEventSchema>;
export type UpcomingEventsQuery = z.infer<typeof upcomingEventsQuerySchema>;
export type UpcomingEventsResponse = z.infer<typeof upcomingEventsResponseSchema>;
```

---

## State Transitions

### Navigation Loading State

```
[Idle] --click--> [Pending] --route-change--> [Idle]
                      |
                      +--timeout/error--> [Idle]
```

| State | Visual | Condition |
|-------|--------|-----------|
| Idle | Default styling | No navigation in progress |
| Pending | Loading spinner on clicked item | After click, before pathname changes |

### Mobile Drawer State

```
[Closed] --hamburger-click--> [Open] --nav-click/backdrop/X--> [Closed]
```

| State | Visual | Condition |
|-------|--------|-----------|
| Closed | Drawer off-screen | Default, after navigation or close action |
| Open | Drawer visible with backdrop | After hamburger button click |

---

## Entity Relationships

```
┌─────────────┐         ┌──────────────────┐
│   Session   │         │   Event          │
│   (NextAuth)│         │   (Prisma)       │
├─────────────┤         ├──────────────────┤
│ user.id     │─────┐   │ id               │
│ user.name   │     │   │ title            │
│ user.email  │     │   │ startTime        │
│ user.role   │     │   │ location         │
└─────────────┘     │   └──────────────────┘
      │             │            │
      ▼             │            ▼
┌─────────────┐     │   ┌──────────────────┐
│   NavBar    │◄────┘   │ UpcomingEvents   │
│   UserMenu  │         │ EventCardMini    │
│   HeroGreet │         └──────────────────┘
└─────────────┘
```

---

## Database Changes Required

**None.** This feature reads existing User and Event data. No schema migrations needed.

---

## Summary

| Entity/Interface | Type | New/Existing |
|------------------|------|--------------|
| User | Prisma model | Existing (read) |
| Event | Prisma model | Existing (read) |
| NavItemProps | TypeScript interface | New |
| NavBarProps | TypeScript interface | New |
| MobileDrawerProps | TypeScript interface | New |
| AppCardProps | TypeScript interface | New |
| EventCardMiniProps | TypeScript interface | New |
| UpcomingEventsQuery | Zod schema | New |
| UpcomingEventsResponse | Zod schema | New |
