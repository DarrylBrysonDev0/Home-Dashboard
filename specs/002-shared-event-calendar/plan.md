# Implementation Plan: Shared Event Calendar and Authentication System

**Branch**: `002-shared-event-calendar` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-shared-event-calendar/spec.md`

## Summary

This feature adds a collaborative Calendar & Events page to the home finance dashboard with three core capabilities: (1) Household member authentication using NextAuth.js with credentials provider and JWT sessions, (2) Local calendar management using FullCalendar with event CRUD operations, and (3) Google Calendar invites via email using Nodemailer and ICS file generation. The approach prioritizes simplicity over complex bidirectional calendar sync, suitable for a self-hosted home environment.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18+  
**Primary Dependencies**: NextAuth.js ^4.24.x (auth), FullCalendar ^6.x (UI), bcryptjs (password hashing), Nodemailer ^6.x (email), ics ^3.x (calendar files), luxon ^3.x (timezone handling)  
**Storage**: MSSQL Server 2025 (existing Docker container via Prisma ORM)  
**Testing**: Vitest (unit), Playwright (e2e) - existing test infrastructure  
**Target Platform**: Linux server (Docker), modern browsers  
**Project Type**: Web application (Next.js 14+ App Router)  
**Performance Goals**: Calendar page loads in <2s, login in <10s, concurrent support for 5-10 users  
**Constraints**: Email delivery <1 minute, responsive design for mobile, 7-day session duration  
**Scale/Scope**: 2-10 household members, 100s of events, <50 email invites/day

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Status | Notes |
|-----------|-------------|--------|-------|
| **I. Component-First** | Features as reusable components in `components/` | ✅ PASS | CalendarView, EventModal, CategoryFilter in `components/calendar/` |
| **II. Type Safety** | TypeScript strict, Zod validation, no `any` | ✅ PASS | Zod schemas for all API inputs, Prisma types for entities |
| **III. Database-First** | Prisma schema before implementation | ✅ PASS | New models: User, Event, EventCategory, EventAttendee, EventInvite |
| **IV. API Contract Clarity** | Explicit validation, consistent responses | ✅ PASS | Contracts defined in `contracts/` directory |
| **V. MVP-First** | Prioritized user stories, simplest solution | ✅ PASS | No OAuth sync, no real-time collab, email invites only |
| **Tech Stack** | Must use mandated technologies | ✅ PASS | Adding NextAuth (optional per constitution), all others mandated |
| **Directory Structure** | Follow established patterns | ✅ PASS | Using `app/calendar/`, `components/calendar/`, `lib/` patterns |

## Project Structure

### Documentation (this feature)

```text
specs/002-shared-event-calendar/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions and best practices
├── data-model.md        # Phase 1: Prisma schema for auth and calendar entities
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: API specifications
│   ├── auth-api.md      # NextAuth endpoints
│   ├── events-api.md    # Event CRUD endpoints
│   ├── categories-api.md # Category endpoints
│   ├── users-api.md     # User management endpoints (admin)
│   └── invites-api.md   # Email invite endpoints
└── tasks.md             # Phase 2: Implementation tasks (from /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts       # NextAuth handler
│   ├── events/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/
│   │       ├── route.ts       # GET, PUT, DELETE
│   │       └── send-invite/
│   │           └── route.ts   # POST - send email invite
│   ├── categories/
│   │   └── route.ts           # GET (list), POST, PUT, DELETE
│   └── users/
│       └── route.ts           # Admin: GET, POST, PUT, DELETE
├── login/
│   └── page.tsx               # Login page
├── calendar/
│   ├── page.tsx               # Calendar page (protected)
│   └── layout.tsx             # Calendar layout
└── admin/
    ├── layout.tsx             # Admin layout (protected, role check)
    ├── page.tsx               # Admin dashboard
    ├── users/
    │   └── page.tsx           # User management
    └── categories/
        └── page.tsx           # Category management

components/
├── calendar/
│   ├── calendar-view.tsx      # FullCalendar wrapper
│   ├── event-modal.tsx        # Create/edit event dialog
│   ├── event-details.tsx      # Event detail view
│   ├── category-filter.tsx    # Category toggle filters
│   └── invite-form.tsx        # Email invite form
├── auth/
│   ├── login-form.tsx         # Login form component
│   ├── user-menu.tsx          # Authenticated user dropdown
│   └── protected-route.tsx    # Route protection wrapper
└── admin/
    ├── user-list.tsx          # User management table
    ├── user-form.tsx          # Add/edit user form
    ├── category-list.tsx      # Category management table
    └── category-form.tsx      # Add/edit category form

lib/
├── auth.ts                    # NextAuth configuration
├── email.ts                   # Nodemailer + ICS service
└── validations/
    ├── auth.ts                # Login, user schemas
    ├── event.ts               # Event CRUD schemas
    └── category.ts            # Category schemas

prisma/
├── schema.prisma              # Updated with User, Event, EventCategory, etc.
└── seed.ts                    # Admin user + default categories

middleware.ts                  # Route protection
```

**Structure Decision**: Using existing Next.js App Router patterns. New routes under `app/calendar/`, `app/login/`, `app/admin/`. Components organized by feature domain (`calendar/`, `auth/`, `admin/`). Services in `lib/` following established patterns.

## Complexity Tracking

> No constitution violations - all principles pass.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |

---

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

| Principle | Requirement | Status | Verification |
|-----------|-------------|--------|--------------|
| **I. Component-First** | Features as reusable components | ✅ PASS | Components defined: `components/calendar/`, `components/auth/`, `components/admin/` |
| **II. Type Safety** | TypeScript strict, Zod validation | ✅ PASS | Zod schemas in all API contracts; TypeScript types in data-model.md |
| **III. Database-First** | Prisma schema before implementation | ✅ PASS | Full schema in data-model.md with 5 new models |
| **IV. API Contract Clarity** | Explicit validation, consistent responses | ✅ PASS | 4 API contracts in `contracts/` with request/response types |
| **V. MVP-First** | Prioritized user stories, simplest solution | ✅ PASS | No OAuth sync, no realtime, JWT sessions, Gmail SMTP |
| **Tech Stack** | Must use mandated technologies | ✅ PASS | NextAuth (constitution-approved optional), all others mandated |
| **Directory Structure** | Follow established patterns | ✅ PASS | Extends existing structure, no new top-level directories |

**All gates pass. Ready for `/speckit.tasks` to generate implementation tasks.**

---

## Generated Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| Plan | [plan.md](./plan.md) | This implementation plan |
| Research | [research.md](./research.md) | Technology decisions and best practices |
| Data Model | [data-model.md](./data-model.md) | Prisma schema additions |
| API Contracts | [contracts/](./contracts/) | Auth, Events, Categories, Users APIs |
| Quickstart | [quickstart.md](./quickstart.md) | Developer setup guide |
