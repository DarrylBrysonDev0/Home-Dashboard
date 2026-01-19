# Implementation Plan: Landing Page & Navigation Top Bar

**Branch**: `004-landing-navigation` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-landing-navigation/spec.md`

## Summary

This feature introduces a persistent navigation top bar and a landing page (home) for the Cemdash home finance dashboard. The navigation bar provides consistent wayfinding across all authenticated pages with logo, nav items, theme toggle, and user avatar dropdown. The landing page serves as the user's home base with personalized greeting, upcoming calendar events (next 7 days), and an app selection panel. Mobile responsive design transforms navigation to hamburger menu with slide-out drawer.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)  
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, next-auth (v4), next-themes, Tailwind CSS, shadcn/ui, Lucide React  
**Storage**: MSSQL Server 2025 via Prisma ORM (existing Event and User models)  
**Testing**: Vitest (unit/integration), Playwright (E2E), TDD Red-Green-Refactor mandatory  
**Target Platform**: Web (Desktop primary, Mobile responsive)
**Project Type**: Web (Next.js App Router)  
**Performance Goals**: Theme toggle <100ms, Landing page <500ms, Mobile drawer animation 200ms  
**Constraints**: WCAG 2.1 AA contrast, Keyboard accessible, 80%+ test coverage  
**Scale/Scope**: Single-user household dashboard, 4 main navigation routes, 3 upcoming events display

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Component-First Architecture | ✅ PASS | All features built as reusable React components in `components/navigation/` and `components/home/`. Clear boundaries with defined prop interfaces. |
| II. Type Safety (NON-NEGOTIABLE) | ✅ PASS | TypeScript strict mode. All component props have explicit interfaces (NavItemProps, AppCardProps, EventCardMiniProps). Zod schemas for any API inputs. |
| III. Database-First Design | ✅ PASS | Prisma schema already defines User and Event models. No new database changes needed - this feature reads existing data only. |
| IV. API Contract Clarity | ✅ PASS | Existing `/api/events` endpoint provides calendar event data. New endpoint `/api/events/upcoming` will follow standard response format `{ data: T }`. Contracts documented in `contracts/`. |
| V. MVP-First, Iterate Second | ✅ PASS | User stories prioritized P1-P3. Phase 1 implements core navigation/landing only. Future features (notifications, search, household switching) explicitly deferred. |
| VI. Authentication & Authorization (NON-NEGOTIABLE) | ✅ PASS | All routes protected by NextAuth middleware. Landing page and navigation only visible to authenticated users. Sign out uses NextAuth `signOut()`. |

**Gate Result**: ✅ ALL PRINCIPLES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/004-landing-navigation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── upcoming-events-api.md  # New API endpoint contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js Web Application Structure

app/
├── layout.tsx                 # Root layout (update: integrate NavBar)
├── page.tsx                   # Landing page (update: new home content)
├── providers.tsx              # Session + Theme providers (existing)
├── (auth)/                    # Auth route group (no nav) - new
│   └── login/page.tsx         # Moved from app/login
├── dashboard/                 # Finance dashboard (existing)
├── calendar/                  # Calendar (existing)
└── admin/                     # Admin (existing)

components/
├── navigation/                # NEW - navigation components
│   ├── nav-bar.tsx            # Main persistent navigation
│   ├── nav-item.tsx           # Individual nav link with active state
│   ├── nav-items.tsx          # Nav items collection
│   ├── mobile-drawer.tsx      # Slide-out mobile navigation
│   └── logo.tsx               # Logo placeholder component
├── home/                      # NEW - landing page components
│   ├── hero-section.tsx       # Welcome greeting + events preview
│   ├── upcoming-events.tsx    # Events container with fetch
│   ├── event-card-mini.tsx    # Compact event display card
│   ├── app-selection-panel.tsx # App card grid container
│   └── app-card.tsx           # Individual app card
├── auth/
│   └── user-menu.tsx          # Existing (enhance dropdown)
├── theme/
│   └── ThemeToggle.tsx        # Existing (already implemented)
└── ui/
    └── sheet.tsx              # NEW - shadcn sheet for mobile drawer

lib/
├── hooks/
│   └── use-media-query.ts     # NEW - responsive breakpoint hook
└── queries/
    └── events.ts              # Existing (add getUpcomingEvents)

__tests__/
├── unit/
│   └── components/
│       ├── navigation/        # NEW - nav component tests
│       └── home/              # NEW - home component tests
├── integration/
│   └── api/
│       └── events-upcoming.test.ts  # NEW - API test
└── e2e/
    ├── navigation.spec.ts     # NEW - nav E2E tests
    └── landing.spec.ts        # NEW - landing page E2E tests
```

**Structure Decision**: Using existing Next.js App Router structure. New components organized by feature (`navigation/`, `home/`). Route groups used to separate authenticated layout from auth pages.

## Complexity Tracking

> No violations requiring justification. All implementation follows constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion.*

| Principle | Status | Post-Design Evidence |
|-----------|--------|---------------------|
| I. Component-First | ✅ PASS | 10 new components defined with clear props interfaces in data-model.md. Components are self-contained in `navigation/` and `home/` directories. |
| II. Type Safety | ✅ PASS | All interfaces documented: NavItemProps, AppCardProps, EventCardMiniProps, etc. Zod schemas defined for API validation (upcomingEventsQuerySchema). |
| III. Database-First | ✅ PASS | No schema changes required. Reads existing User and Event models. Query function `getUpcomingEvents` uses Prisma typed queries. |
| IV. API Contract Clarity | ✅ PASS | New `/api/events/upcoming` endpoint fully documented in contracts/upcoming-events-api.md with request/response types, error cases, and Zod validation. |
| V. MVP-First | ✅ PASS | Design focuses on P1/P2 user stories. Future features (notifications, search, household switching) remain out of scope. No premature optimization. |
| VI. Authentication | ✅ PASS | Middleware updated to protect `/` route. All new API endpoints inherit existing `/api/events/:path*` protection. Sign out flow documented. |

**Post-Design Gate Result**: ✅ ALL PRINCIPLES PASS - Ready for Phase 2 task generation

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/004-landing-navigation/plan.md` | ✅ Complete |
| Research Notes | `specs/004-landing-navigation/research.md` | ✅ Complete |
| Data Model | `specs/004-landing-navigation/data-model.md` | ✅ Complete |
| API Contract | `specs/004-landing-navigation/contracts/upcoming-events-api.md` | ✅ Complete |
| Quickstart Guide | `specs/004-landing-navigation/quickstart.md` | ✅ Complete |