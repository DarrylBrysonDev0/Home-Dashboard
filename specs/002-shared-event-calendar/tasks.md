# Tasks: Shared Event Calendar and Authentication System

**Feature**: 002-shared-event-calendar  
**Input**: Design documents from `/specs/002-shared-event-calendar/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅  
**Date Generated**: 2026-01-10

**Tests**: Tests ARE included per TDD methodology mandate (spec.md). Write tests FIRST, ensure they FAIL, then implement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and authentication setup

- [X] T001 Install authentication dependencies: next-auth@^4.24, bcryptjs, @types/bcryptjs in package.json
- [X] T002 [P] Install calendar dependencies: @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/luxon3 in package.json
- [X] T003 [P] Install email dependencies: nodemailer @types/nodemailer ics luxon in package.json
- [X] T004 [P] Add NextAuth environment variables to .env.local (NEXTAUTH_URL, NEXTAUTH_SECRET)
- [X] T005 [P] Add SMTP configuration to .env.local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema & Prisma

- [X] T006 Add User, EventCategory, Event, EventAttendee, EventInvite models to prisma/schema.prisma per data-model.md
- [X] T007 Add UserRole and AttendeeStatus enums to prisma/schema.prisma
- [X] T008 Run `npx prisma migrate dev --name add-calendar-auth` to create migration
- [X] T009 Run `npx prisma generate` to generate Prisma Client types
- [X] T010 Create database seed script in prisma/seed.ts (admin user + default 6 categories)

### NextAuth Configuration

- [ ] T011 Create NextAuth configuration with Credentials provider and JWT strategy in lib/auth.ts
- [ ] T012 Create NextAuth API route handler in app/api/auth/[...nextauth]/route.ts
- [ ] T012a Configure NextAuth session strategy with 7-day maxAge and JWT token rotation in lib/auth.ts (FR-003)
- [ ] T013 Create middleware for route protection in middleware.ts (protect /calendar, /admin, /api/events)
- [ ] T014 [P] Create custom session hook wrapper in lib/hooks/use-session.ts

### Validation Schemas

- [ ] T015 [P] Create auth validation schemas (login, create user) in lib/validations/auth.ts
- [ ] T016 [P] Create event validation schemas (create, update) in lib/validations/event.ts
- [ ] T017 [P] Create category validation schema in lib/validations/category.ts

### Shared Services

- [ ] T018 [P] Create password hashing utilities (hash, compare) in lib/utils/password.ts
- [ ] T019 [P] Create email service with Nodemailer in lib/email.ts
- [ ] T020 [P] Create ICS file generation utility in lib/utils/ics-generator.ts
- [ ] T021 [P] Create timezone utility functions in lib/utils/timezone.ts

### UI Foundation

- [ ] T022 [P] Install shadcn Dialog component: `npx shadcn-ui@latest add dialog`
- [ ] T023 [P] Install shadcn Form components: `npx shadcn-ui@latest add form label input textarea checkbox`
- [ ] T024 [P] Install shadcn Badge component: `npx shadcn-ui@latest add badge`
- [ ] T025 [P] Install shadcn Dropdown Menu component: `npx shadcn-ui@latest add dropdown-menu`
- [ ] T026 [P] Install shadcn Alert component: `npx shadcn-ui@latest add alert`
- [ ] T027 Create protected route wrapper component in components/auth/protected-route.tsx

### Testing Infrastructure

- [ ] T028 [P] Create auth test helpers (mock session, mock user) in __tests__/helpers/auth-helpers.ts
- [ ] T029 [P] Create calendar test helpers (mock events, date utilities) in __tests__/helpers/calendar-helpers.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Household Member Login (Priority: P1) 🎯 MVP

**Goal**: Enable secure login with email/password, session management, account lockout protection

**Independent Test**: Verify login with valid/invalid credentials, session persistence, lockout after 5 failed attempts

### Tests for US1 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T030 [P] [US1] Write unit tests for password hashing/comparison in __tests__/unit/utils/password.test.ts
- [ ] T031 [P] [US1] Write unit tests for account lockout logic in __tests__/unit/queries/auth.test.ts
- [ ] T032 [P] [US1] Write integration test for login flow (valid/invalid credentials) in __tests__/integration/api/auth.test.ts
- [ ] T033 [P] [US1] Write integration test for account lockout (5 failed attempts) in __tests__/integration/api/auth-lockout.test.ts
- [ ] T034 [P] [US1] Write component test for LoginForm in __tests__/unit/components/login-form.test.tsx

### API Layer for US1

- [ ] T035 [P] [US1] Create auth query helpers (findUserByEmail, incrementFailedAttempts, resetFailedAttempts) in lib/queries/auth.ts
- [ ] T036 [US1] Implement custom authorize function in lib/auth.ts with lockout and password verification

### UI Components for US1

- [ ] T037 [P] [US1] Create LoginForm component with email/password fields and error display in components/auth/login-form.tsx
- [ ] T038 [P] [US1] Create UserMenu component for authenticated user (name, logout) in components/auth/user-menu.tsx
- [ ] T039 [US1] Create login page with LoginForm in app/login/page.tsx
- [ ] T040 [US1] Add UserMenu to main layout in app/layout.tsx

**Checkpoint**: User Story 1 complete - Users can log in securely with lockout protection

---

## Phase 4: User Story 2 - View Calendar and Browse Events (Priority: P1)

**Goal**: Display calendar in month/week/day views with navigation and event details

**Independent Test**: Verify calendar renders events, switches views, navigates periods, shows event details on click

### Tests for US2 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T041 [P] [US2] Write unit tests for date range query helpers in __tests__/unit/queries/events.test.ts
- [ ] T042 [P] [US2] Write integration test for GET /api/events with date filtering in __tests__/integration/api/events-list.test.ts
- [ ] T043 [P] [US2] Write component test for CalendarView in __tests__/unit/components/calendar-view.test.tsx

### API Layer for US2

- [ ] T044 [US2] Create event query helpers (listEvents with date range, category filter) in lib/queries/events.ts
- [ ] T045 [US2] Implement GET /api/events route with query params in app/api/events/route.ts
- [ ] T046 [P] [US2] Implement GET /api/events/[id] route for single event details in app/api/events/[id]/route.ts

### UI Components for US2

- [ ] T047 [P] [US2] Create CalendarView component wrapping FullCalendar in components/calendar/calendar-view.tsx
- [ ] T048 [P] [US2] Create EventDetails component for viewing event info in components/calendar/event-details.tsx
- [ ] T049 [US2] Create calendar page with CalendarView in app/calendar/page.tsx
- [ ] T050 [US2] Create calendar layout with navigation in app/calendar/layout.tsx

**Checkpoint**: User Story 2 complete - Calendar displays events with view switching and navigation

---

## Phase 5: User Story 3 - Create and Edit Events (Priority: P1)

**Goal**: Enable creating and editing events with all fields, including drag-and-drop rescheduling

**Independent Test**: Verify event creation with required/optional fields, editing, and drag-and-drop updates

### Tests for US3 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T051 [P] [US3] Write unit tests for event validation (end time after start time) in __tests__/unit/validations/event.test.ts
- [ ] T052 [P] [US3] Write integration test for POST /api/events (create) in __tests__/integration/api/events-create.test.ts
- [ ] T053 [P] [US3] Write integration test for PUT /api/events/[id] (update) in __tests__/integration/api/events-update.test.ts
- [ ] T054 [P] [US3] Write component test for EventModal (create/edit) in __tests__/unit/components/event-modal.test.tsx

### API Layer for US3

- [ ] T055 [P] [US3] Create event mutation helpers (createEvent, updateEvent) in lib/queries/events.ts
- [ ] T056 [US3] Implement POST /api/events route with Zod validation in app/api/events/route.ts
- [ ] T057 [US3] Implement PUT /api/events/[id] route with validation in app/api/events/[id]/route.ts

### UI Components for US3

- [ ] T058 [US3] Create EventModal component with form fields (title, description, location, times, all-day, category) in components/calendar/event-modal.tsx
- [ ] T059 [US3] Integrate EventModal with CalendarView (click date to create, click event to edit) in components/calendar/calendar-view.tsx
- [ ] T060 [US3] Add drag-and-drop event handlers to CalendarView in components/calendar/calendar-view.tsx

**Checkpoint**: User Story 3 complete - Users can create and edit events with full functionality

---

## Phase 6: User Story 4 - Delete Events (Priority: P2)

**Goal**: Enable deleting events with confirmation dialog

**Independent Test**: Verify event deletion with confirmation, cancellation preserves event

### Tests for US4 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T061 [P] [US4] Write integration test for DELETE /api/events/[id] in __tests__/integration/api/events-delete.test.ts
- [ ] T062 [P] [US4] Write component test for delete confirmation in __tests__/unit/components/event-modal.test.tsx

### API Layer for US4

- [ ] T063 [US4] Create deleteEvent query helper in lib/queries/events.ts
- [ ] T064 [US4] Implement DELETE /api/events/[id] route in app/api/events/[id]/route.ts

### UI Components for US4

- [ ] T065 [US4] Add delete button with confirmation dialog to EventModal in components/calendar/event-modal.tsx
- [ ] T066 [US4] Add delete functionality to EventDetails in components/calendar/event-details.tsx

**Checkpoint**: User Story 4 complete - Events can be deleted with confirmation

---

## Phase 7: User Story 5 - Filter Events by Category (Priority: P2)

**Goal**: Display category filters with toggles to show/hide events by category

**Independent Test**: Verify category filters toggle visibility of events, "Show All" resets filters

### Tests for US5 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T067 [P] [US5] Write integration test for GET /api/categories in __tests__/integration/api/categories.test.ts
- [ ] T068 [P] [US5] Write component test for CategoryFilter in __tests__/unit/components/category-filter.test.tsx

### API Layer for US5

- [ ] T069 [US5] Create category query helper (listCategories) in lib/queries/categories.ts
- [ ] T070 [US5] Implement GET /api/categories route in app/api/categories/route.ts

### UI Components for US5

- [ ] T071 [US5] Create CategoryFilter component with toggle checkboxes in components/calendar/category-filter.tsx
- [ ] T072 [US5] Integrate CategoryFilter with CalendarView (filter events client-side) in components/calendar/calendar-view.tsx
- [ ] T073 [US5] Add CategoryFilter to calendar layout sidebar in app/calendar/layout.tsx

**Checkpoint**: User Story 5 complete - Category filtering works with toggles

---

## Phase 8: User Story 6 - Send Google Calendar Invite via Email (Priority: P2)

**Goal**: Send ICS calendar invite attachments via email when creating/editing events

**Independent Test**: Verify email sent with ICS attachment, email validation, success/error messages

### Tests for US6 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T074 [P] [US6] Write unit tests for ICS file generation in __tests__/unit/utils/ics-generator.test.ts
- [ ] T075 [P] [US6] Write unit tests for email service in __tests__/unit/email.test.ts
- [ ] T076 [P] [US6] Write integration test for POST /api/events/[id]/send-invite in __tests__/integration/api/send-invite.test.ts

### API Layer for US6

- [ ] T077 [P] [US6] Create event invite tracking helper (logInvite) in lib/queries/invites.ts
- [ ] T078 [US6] Implement POST /api/events/[id]/send-invite route with email validation in app/api/events/[id]/send-invite/route.ts

### UI Components for US6

- [ ] T079 [US6] Create InviteForm component with email input and send button in components/calendar/invite-form.tsx
- [ ] T080 [US6] Add InviteForm to EventModal and EventDetails in components/calendar/event-modal.tsx and components/calendar/event-details.tsx

**Checkpoint**: User Story 6 complete - Email invites with ICS attachments working

---

## Phase 9: User Story 7 - Admin User Management (Priority: P3)

**Goal**: Admin panel for managing household member accounts and SMTP settings

**Independent Test**: Verify admin can view users, create/edit/delete users, configure SMTP settings

### Tests for US7 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T081 [P] [US7] Write integration tests for GET/POST/PUT /api/users in __tests__/integration/api/users.test.ts
- [ ] T082 [P] [US7] Write integration test for role-based access (non-admin blocked) in __tests__/integration/api/admin-access.test.ts
- [ ] T083 [P] [US7] Write component test for UserForm in __tests__/unit/components/user-form.test.tsx

### API Layer for US7

- [ ] T084 [P] [US7] Create user query helpers (listUsers, createUser, updateUser) in lib/queries/users.ts
- [ ] T085 [P] [US7] Create admin middleware to check role in lib/middleware/admin-check.ts
- [ ] T086 [US7] Implement GET /api/users route (admin only) in app/api/users/route.ts
- [ ] T087 [US7] Implement POST /api/users route (admin create user) in app/api/users/route.ts
- [ ] T088 [US7] Implement PUT /api/users/[id] route (admin edit user) in app/api/users/[id]/route.ts

### UI Components for US7

- [ ] T089 [P] [US7] Create UserList component with table in components/admin/user-list.tsx
- [ ] T090 [P] [US7] Create UserForm component for add/edit in components/admin/user-form.tsx
- [ ] T091 [US7] Create admin layout with role check in app/admin/layout.tsx
- [ ] T092 [US7] Create admin dashboard page in app/admin/page.tsx
- [ ] T093 [US7] Create user management page with UserList in app/admin/users/page.tsx
- [ ] T094 [US7] Create SMTP settings page in app/admin/settings/page.tsx

**Checkpoint**: User Story 7 complete - Admin can manage users and settings

---

## Phase 10: User Story 8 - Admin Category Management (Priority: P3)

**Goal**: Admin panel for managing event categories (create, edit, delete)

**Independent Test**: Verify admin can create/edit/delete categories, changes reflect in event creation

### Tests for US8 (TDD: Write FIRST, must FAIL before implementation)

- [ ] T095 [P] [US8] Write integration tests for POST/PUT/DELETE /api/categories in __tests__/integration/api/categories-admin.test.ts
- [ ] T096 [P] [US8] Write component test for CategoryForm in __tests__/unit/components/category-form.test.tsx

### API Layer for US8

- [ ] T097 [P] [US8] Create category mutation helpers (createCategory, updateCategory, deleteCategory) in lib/queries/categories.ts
- [ ] T098 [US8] Implement POST /api/categories route (admin only) in app/api/categories/route.ts
- [ ] T099 [US8] Implement PUT /api/categories/[id] route (admin only) in app/api/categories/[id]/route.ts
- [ ] T100 [US8] Implement DELETE /api/categories/[id] route (admin only) in app/api/categories/[id]/route.ts

### UI Components for US8

- [ ] T101 [P] [US8] Create CategoryList component with table in components/admin/category-list.tsx
- [ ] T102 [P] [US8] Create CategoryForm component for add/edit with color picker in components/admin/category-form.tsx
- [ ] T103 [US8] Create category management page with CategoryList in app/admin/categories/page.tsx

**Checkpoint**: User Story 8 complete - Admin can manage categories

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T104 [P] Add loading states to all forms and calendar operations
- [ ] T105 [P] Add error handling and user-friendly error messages across all API routes
- [ ] T106 [P] Add accessibility attributes (aria-labels) to calendar and form components
- [ ] T107 [P] Add responsive mobile styles for calendar and forms (768px breakpoint)
- [ ] T108 [P] Optimize event queries for performance (<2s calendar load)
- [ ] T109 Run database seeding script to populate admin user and default categories
- [ ] T110 Run quickstart.md validation - verify complete setup flow works
- [ ] T111 Final code cleanup and documentation updates

### Performance & Load Tests (Success Criteria Validation)

- [ ] T115 [P] Write integration test for calendar page load time <2s (SC-003) in __tests__/integration/performance/calendar-load.test.ts
- [ ] T116 [P] Write integration test for login flow completion <10s (SC-001) in __tests__/integration/performance/login-speed.test.ts
- [ ] T117 [P] Write load test for 5 concurrent user sessions (SC-008) in __tests__/integration/performance/concurrent-users.test.ts
- [ ] T118 [P] Write integration test for email delivery <1 minute (SC-004) in __tests__/integration/performance/email-delivery.test.ts

### Code Coverage Verification (Constitution Compliance)

- [ ] T119 Run code coverage report and verify 80% threshold for business logic (lib/, app/api/) meets constitution requirement
- [ ] T120 Run code coverage report for acceptance scenarios and verify 100% coverage for P1 user stories (US1-US3)

### E2E Tests (TDD: After all stories complete)

- [ ] T112 [P] Write E2E test for User Story 1 (Login flow) in __tests__/e2e/user-story-1.spec.ts
- [ ] T113 [P] Write E2E test for User Story 2 (View calendar) in __tests__/e2e/user-story-2.spec.ts
- [ ] T114 [P] Write E2E test for User Story 3 (Create/edit events) in __tests__/e2e/user-story-3.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if team capacity allows
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Dependencies | Can Start After |
|-------|----------|--------------|-----------------|
| US1 - Login | P1 | None | Phase 2 |
| US2 - View Calendar | P1 | US1 (authentication required) | US1 complete |
| US3 - Create/Edit Events | P1 | US2 (calendar UI needed) | US2 complete |
| US4 - Delete Events | P2 | US3 (event modal) | US3 complete |
| US5 - Category Filters | P2 | US2 (calendar view) | US2 complete |
| US6 - Email Invites | P2 | US3 (event creation) | US3 complete |
| US7 - Admin User Mgmt | P3 | US1 (auth system) | US1 complete |
| US8 - Admin Category Mgmt | P3 | US5 (categories) | US5 complete |

### Parallel Opportunities

Within each phase, tasks marked [P] can run in parallel:
- **Setup**: T002-T005 can all run in parallel after T001
- **Foundational**: T015-T029 can run in parallel after T010-T014
- **Each US**: Tasks marked [P] within that US can run in parallel

---

## Parallel Execution Examples

### Setup Phase Parallel Tasks

```bash
# After T001 completes, launch in parallel:
T002: Install calendar dependencies
T003: Install email dependencies
T004: Add NextAuth environment variables
T005: Add SMTP configuration
```

### Foundational Phase Parallel Tasks

```bash
# After T010 (database seed script) completes, launch in parallel:
T015: lib/validations/auth.ts
T016: lib/validations/event.ts
T017: lib/validations/category.ts
T018: lib/utils/password.ts
T019: lib/email.ts
T020: lib/utils/ics-generator.ts
T021: lib/utils/timezone.ts
T022-T027: All shadcn component installations
T028-T029: Test helpers
```

### User Story 4-6 Parallel (After US3)

```bash
# After US3 completes, launch in parallel:
Developer A: US4 (Delete Events) - T061-T066
Developer B: US5 (Category Filters) - T067-T073
Developer C: US6 (Email Invites) - T074-T080
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Login)
4. Complete Phase 4: User Story 2 (View Calendar)
5. Complete Phase 5: User Story 3 (Create/Edit Events)
6. **STOP and VALIDATE**: Core calendar functionality working
7. Deploy/demo if ready - immediate value delivered

### Incremental Delivery by Priority

| Increment | User Stories | Value Delivered |
|-----------|--------------|-----------------|
| MVP | US1-3 | Login + view + create/edit calendar |
| MVP+ | US1-4 | Add delete capability |
| Extended | US1-6 | Category filters + email invites |
| Full | US1-8 | Admin panels for user/category management |

### Recommended Execution Order

1. **Week 1**: Setup + Foundational + US1 (Login working)
2. **Week 2**: US2 + US3 (Calendar MVP complete)
3. **Week 3**: US4 + US5 + US6 (in parallel if possible)
4. **Week 4**: US7 + US8 + Polish

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 120 |
| **Setup Tasks** | 5 |
| **Foundational Tasks** | 24 (includes testing infrastructure) |
| **User Story Tasks** | 74 (includes TDD test tasks) |
| **Polish Tasks** | 17 (includes performance, coverage validation, and E2E tests) |
| **Parallelizable Tasks** | 61 |
| **Test Tasks** | 30 (unit, integration, E2E) |

### Tasks Per User Story

| User Story | Priority | Task Count | Test Tasks |
|------------|----------|------------|------------|
| US1 - Login | P1 | 11 | 5 |
| US2 - View Calendar | P1 | 10 | 3 |
| US3 - Create/Edit Events | P1 | 11 | 4 |
| US4 - Delete Events | P2 | 6 | 2 |
| US5 - Category Filters | P2 | 7 | 2 |
| US6 - Email Invites | P2 | 7 | 3 |
| US7 - Admin User Mgmt | P3 | 14 | 3 |
| US8 - Admin Category Mgmt | P3 | 9 | 2 |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- **TDD Workflow**: Test tasks MUST be completed FIRST and FAIL before implementation tasks
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Database already has 1,117 transactions from feature 001 - this feature adds new tables
- Use existing test infrastructure (Vitest, Playwright) from feature 001
