# Tasks: Landing Page & Navigation Top Bar

**Input**: Design documents from `/specs/004-landing-navigation/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD Red-Green-Refactor is required per spec.md. Tests are included for each user story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create directory structure

- [X] T001 Install shadcn Sheet and Tooltip components via `npx shadcn@latest add sheet tooltip`
- [X] T002 [P] Create navigation components directory at components/navigation/
- [X] T003 [P] Create home components directory at components/home/
- [X] T004 [P] Create navigation test directory at __tests__/unit/components/navigation/
- [X] T005 [P] Create home test directory at __tests__/unit/components/home/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Update middleware.ts to protect root `/` route for authenticated users only
- [X] T007 [P] Create use-media-query hook at lib/hooks/use-media-query.ts for responsive behavior
- [X] T008 [P] Add Zod schemas for upcoming events API at lib/validations/event.ts (upcomingEventsQuerySchema, upcomingEventsResponseSchema)
- [X] T009 Add getUpcomingEvents query function in lib/queries/events.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Desktop Navigation Across Pages (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated users to navigate between app modules using a persistent top navigation bar

**Independent Test**: Navigate between Home, Finance, Calendar, and Settings pages - nav bar remains visible with correct active states

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T010 [P] [US1] E2E test for nav bar visibility across pages in __tests__/e2e/navigation.spec.ts
- [X] T011 [P] [US1] Unit test for Logo component in __tests__/unit/components/navigation/logo.test.tsx
- [X] T012 [P] [US1] Unit test for NavItem component (active state detection) in __tests__/unit/components/navigation/nav-item.test.tsx
- [X] T013 [P] [US1] Unit test for NavItems collection in __tests__/unit/components/navigation/nav-items.test.tsx
- [X] T014 [P] [US1] Unit test for NavBar component in __tests__/unit/components/navigation/nav-bar.test.tsx

### Implementation for User Story 1

- [X] T015 [P] [US1] Create Logo component at components/navigation/logo.tsx (links to Home `/`)
- [X] T016 [P] [US1] Create NavItem component at components/navigation/nav-item.tsx (active state with usePathname, loading spinner support)
- [X] T017 [US1] Create NavItems component at components/navigation/nav-items.tsx (Home, Finance, Calendar, Settings links)
- [X] T018 [US1] Create NavBar component at components/navigation/nav-bar.tsx (64px height, desktop layout, integrates Logo, NavItems, ThemeToggle placeholder, UserMenu placeholder)
- [X] T019 [US1] Integrate NavBar into app/layout.tsx for authenticated pages (replace/update current header)

**Checkpoint**: User Story 1 complete - navigation works across all authenticated pages with active states

---

## Phase 4: User Story 2 - Landing Page App Selection (Priority: P1)

**Goal**: Provide a landing page with personalized greeting and app card panel for module access

**Independent Test**: Log in, land on home page, verify greeting with user name, click each app card to navigate

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T020 [P] [US2] E2E test for landing page content and app card navigation in __tests__/e2e/landing.spec.ts
- [X] T021 [P] [US2] Unit test for AppCard component (hover effects, navigation) in __tests__/unit/components/home/app-card.test.tsx
- [X] T022 [P] [US2] Unit test for AppSelectionPanel in __tests__/unit/components/home/app-selection-panel.test.tsx
- [X] T023 [P] [US2] Unit test for HeroSection (greeting display) in __tests__/unit/components/home/hero-section.test.tsx

### Implementation for User Story 2

- [X] T024 [P] [US2] Create AppCard component at components/home/app-card.tsx (icon 48px, title, description, hover animation scale 1.02)
- [X] T025 [US2] Create AppSelectionPanel component at components/home/app-selection-panel.tsx (grid with Home, Finance, Calendar, Settings cards)
- [X] T026 [US2] Create HeroSection component at components/home/hero-section.tsx (greeting "Welcome back, [Name]", events placeholder slot)
- [X] T027 [US2] Update app/page.tsx to render landing page with HeroSection and AppSelectionPanel (remove redirect to /dashboard)

**Checkpoint**: User Story 2 complete - landing page shows greeting and app cards, navigation works

---

## Phase 5: User Story 3 - Theme Toggle from Navigation (Priority: P2)

**Goal**: Allow users to toggle dark/light theme from navigation bar with tooltip feedback

**Independent Test**: Click theme toggle, verify UI switches themes and preference persists across page reloads

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T028 [P] [US3] Unit test for ThemeToggle with Tooltip wrapper in __tests__/unit/components/navigation/theme-toggle-nav.test.tsx

### Implementation for User Story 3

- [X] T029 [US3] Wrap existing ThemeToggle with Tooltip in NavBar (tooltip text: "Switch to dark/light mode")
- [X] T030 [US3] Verify existing theme persistence works from navigation context

**Checkpoint**: User Story 3 complete - theme toggle in nav bar with tooltip, persistence verified

---

## Phase 6: User Story 4 - User Menu and Sign Out (Priority: P2)

**Goal**: Provide avatar dropdown with Profile, Settings, and Sign Out options

**Independent Test**: Click avatar, verify dropdown opens with all options, test navigation and sign out

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T031 [P] [US4] Unit test for enhanced UserMenu with Profile and Settings links in __tests__/unit/components/auth/user-menu.test.tsx
- [ ] T032 [P] [US4] E2E test for sign out flow (no confirmation, redirect to login) in __tests__/e2e/navigation.spec.ts

### Implementation for User Story 4

- [ ] T033 [US4] Enhance UserMenu at components/auth/user-menu.tsx (enable Profile link → /settings/profile, add Settings link → /settings)
- [ ] T034 [US4] Integrate UserMenu into NavBar component (avatar display with initials logic)
- [ ] T035 [US4] Verify sign out works immediately without confirmation and redirects to /login

**Checkpoint**: User Story 4 complete - avatar dropdown with Profile, Settings, Sign Out all functional

---

## Phase 7: User Story 5 - Mobile Navigation with Hamburger Menu (Priority: P2)

**Goal**: Transform navigation to hamburger menu with slide-out drawer on viewports < 768px

**Independent Test**: Resize to mobile viewport, tap hamburger, verify drawer opens with nav items, close via X/backdrop/navigation

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T036 [P] [US5] Unit test for MobileDrawer component (open/close, backdrop, nav items) in __tests__/unit/components/navigation/mobile-drawer.test.tsx
- [ ] T037 [P] [US5] E2E test for mobile navigation flow in __tests__/e2e/navigation.spec.ts (viewport 375px)

### Implementation for User Story 5

- [ ] T038 [US5] Create MobileDrawer component at components/navigation/mobile-drawer.tsx using shadcn Sheet (side="left", 200ms animation)
- [ ] T039 [US5] Update NavBar to show hamburger on mobile (md:hidden), hide desktop nav (hidden md:flex)
- [ ] T040 [US5] Add drawer close behavior on navigation item click and backdrop tap
- [ ] T041 [US5] Include user section and sign out in mobile drawer

**Checkpoint**: User Story 5 complete - mobile navigation fully functional with drawer

---

## Phase 8: User Story 6 - Upcoming Events on Landing Page (Priority: P3)

**Goal**: Display next 3 upcoming calendar events in landing page hero section

**Independent Test**: Create calendar events within 7 days, verify they appear on landing page, click to navigate to Calendar

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T042 [P] [US6] Integration test for /api/events/upcoming endpoint in __tests__/integration/api/events-upcoming.test.ts
- [ ] T043 [P] [US6] Unit test for EventCardMini component in __tests__/unit/components/home/event-card-mini.test.tsx
- [ ] T044 [P] [US6] Unit test for UpcomingEvents component (loading, empty, error, data states) in __tests__/unit/components/home/upcoming-events.test.tsx

### Implementation for User Story 6

- [ ] T045 [US6] Create /api/events/upcoming API route at app/api/events/upcoming/route.ts (limit, days params, Zod validation)
- [ ] T046 [P] [US6] Create EventCardMini component at components/home/event-card-mini.tsx (title, date/time, location)
- [ ] T047 [US6] Create UpcomingEvents component at components/home/upcoming-events.tsx (fetch, display max 3, empty state with link to /calendar?create=true)
- [ ] T048 [US6] Integrate UpcomingEvents into HeroSection on landing page
- [ ] T049 [US6] Add horizontal scroll with snap points for mobile events display
- [ ] T050 [US6] Handle API error state (show error message, no retry button per clarification)

**Checkpoint**: User Story 6 complete - upcoming events display on landing page with all states handled

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T051 [P] Add keyboard accessibility verification for all navigation elements (Tab, Enter, focus states)
- [ ] T052 [P] Verify WCAG 2.1 AA contrast requirements in both themes for all new components
- [ ] T053 [P] Update ARCHITECTURE.md with navigation and landing page component documentation
- [ ] T054 Run quickstart.md validation to verify all setup steps work
- [ ] T055 Performance verification: theme toggle <100ms, landing page <500ms, drawer animation 200ms
- [ ] T056 Final E2E test pass for all user stories in __tests__/e2e/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - Can proceed in parallel by different developers
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 - Desktop Navigation | P1 | Foundational | Phase 2 complete |
| US2 - Landing Page | P1 | Foundational | Phase 2 complete |
| US3 - Theme Toggle | P2 | US1 (NavBar exists) | Phase 3 complete |
| US4 - User Menu | P2 | US1 (NavBar exists) | Phase 3 complete |
| US5 - Mobile Navigation | P2 | US1 (NavBar exists) | Phase 3 complete |
| US6 - Upcoming Events | P3 | US2 (HeroSection exists), Foundational (API schemas) | Phase 4 complete |

### Within Each User Story

1. Tests MUST be written and FAIL before implementation
2. Components before integration
3. Core implementation before edge cases
4. Story complete before moving to next priority (if sequential)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- US1 and US2 can run in parallel (both P1, no dependencies on each other)
- US3, US4, US5 can run in parallel once US1 completes (all P2)
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Launch all tests for US1 together:
T010: E2E test for nav bar visibility
T011: Unit test for Logo component
T012: Unit test for NavItem component
T013: Unit test for NavItems collection
T014: Unit test for NavBar component

# After tests fail, launch independent components:
T015: Create Logo component
T016: Create NavItem component
# T017, T018, T019 must be sequential (dependencies)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Desktop Navigation)
4. Complete Phase 4: User Story 2 (Landing Page)
5. **STOP and VALIDATE**: Both stories should work independently
6. Deploy/demo if ready - users can navigate and see landing page

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Desktop Navigation) → Test independently → Basic navigation works
3. Add US2 (Landing Page) → Test independently → MVP complete!
4. Add US3 (Theme Toggle) → Test independently → Theme control from nav
5. Add US4 (User Menu) → Test independently → Full user account control
6. Add US5 (Mobile Navigation) → Test independently → Mobile responsive
7. Add US6 (Upcoming Events) → Test independently → Full feature complete

### Suggested MVP Scope

**US1 + US2 delivers**:
- Persistent navigation bar across all pages
- Active state detection for current page
- Landing page with greeting
- App selection cards for all modules
- Logo linking to home

This is a complete, usable increment without mobile or advanced features.

---

## Notes

- All tests follow TDD Red-Green-Refactor as required by spec.md
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Theme toggle reuses existing component - just adds tooltip wrapper
- UserMenu enhancement, not replacement
- No database schema changes required - reads existing User and Event models
- Mobile breakpoint: 768px (Tailwind `md:` prefix)
- shadcn Sheet provides drawer with accessibility built-in
