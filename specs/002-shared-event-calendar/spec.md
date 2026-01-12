# Feature Specification: Shared Event Calendar and Authentication System

**Feature Branch**: `002-shared-event-calendar`  
**Created**: January 10, 2026  
**Status**: Complete  
**Input**: User description: "Shared Event Calendar and Authentication System - includes household member login, local calendar with FullCalendar, event CRUD, and Google Calendar invites via email"

---

## Overview

This feature adds a collaborative Calendar & Events page to the home finance dashboard, enabling household members to share and coordinate schedules. The system includes three core capabilities:

1. **Site Authentication** - Household member login with role-based access (Admin/Member)
2. **Local Calendar** - Event creation, viewing, and management with category filtering
3. **Google Calendar Invites via Email** - Option to send ICS calendar invites when creating events

This approach prioritizes simplicity over complex bidirectional calendar sync, making it suitable for a self-hosted home environment.

---

## Clarifications

### Session 2026-01-10

- Q: Event Editing Permissions - When a household member creates an event, who should be allowed to edit or delete it? → A: Any household member can edit/delete any event
- Q: Session Timeout Duration - How long should a user session remain active before requiring re-authentication? → A: 7 days
- Q: Password Requirements - What complexity rules should passwords meet when creating user accounts? → A: Minimum 8 characters, at least one number
- Q: Failed Login Attempts - Should there be a limit on failed login attempts to protect against brute-force attacks? → A: 5 failed attempts, 15-minute account lockout
- Q: Email Configuration Access - Who should be able to configure the SMTP settings for sending calendar invites? → A: Admin users can configure via admin panel

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Household Member Login (Priority: P1)

As a household member, I want to securely log in to the dashboard so that I can access shared family calendar features and my personal data is protected from unauthorized access.

**Why this priority**: Authentication is the foundation for all other features. Without login, there's no way to identify users, protect data, or enable collaboration.

**Independent Test**: Can be fully tested by attempting login with valid/invalid credentials and verifying access control. Delivers secure access to the dashboard.

**Acceptance Scenarios**:

1. **Given** I am on the login page with valid credentials, **When** I enter my email and password and click login, **Then** I am redirected to the calendar page and see my name displayed.
2. **Given** I am on the login page with invalid credentials, **When** I enter incorrect email or password and click login, **Then** I see an error message "Invalid email or password" and remain on the login page.
3. **Given** I am not logged in, **When** I try to access the calendar page directly, **Then** I am redirected to the login page.
4. **Given** I am logged in, **When** I click the logout button, **Then** my session ends and I am redirected to the login page.
5. **Given** I have entered incorrect credentials 5 times, **When** I attempt to log in again, **Then** I see a message that my account is locked for 15 minutes.

---

### User Story 2 - View Calendar and Browse Events (Priority: P1)

As a household member, I want to view a shared family calendar so that I can see all upcoming events and coordinate schedules with my family.

**Why this priority**: Viewing the calendar is the core value proposition. Users need to see events before they can create or manage them.

**Independent Test**: Can be fully tested by logging in and navigating to the calendar page to view events in different views (month/week/day). Delivers visibility into shared family schedule.

**Acceptance Scenarios**:

1. **Given** I am logged in and on the calendar page, **When** the page loads, **Then** I see a calendar view (month by default) with all events for the visible date range.
2. **Given** I am viewing the calendar, **When** I click on week or day view buttons, **Then** the calendar switches to show that view with appropriate time slots.
3. **Given** there are events on the calendar, **When** I click on an event, **Then** I see event details including title, time, location, description, and category.
4. **Given** I am viewing the calendar, **When** I use navigation arrows, **Then** the calendar moves to the previous/next month/week/day.
5. **Given** I am viewing the calendar, **When** I click "Today" button, **Then** the calendar returns to the current date.

---

### User Story 3 - Create and Edit Events (Priority: P1)

As a household member, I want to create and edit calendar events so that I can add family appointments, activities, and reminders that everyone can see.

**Why this priority**: Event creation is essential for the calendar to have value. Without the ability to add events, the calendar would be empty.

**Independent Test**: Can be fully tested by creating a new event with all fields and verifying it appears on the calendar. Delivers ability to populate the shared calendar.

**Acceptance Scenarios**:

1. **Given** I am on the calendar, **When** I click on a date or time slot, **Then** an event creation form opens with that date/time pre-filled.
2. **Given** I am creating an event with required fields (title, start time, end time), **When** I save the event, **Then** the event appears on the calendar at the correct date/time.
3. **Given** I am creating an event, **When** I fill in optional fields (description, location, category), **Then** those details are saved and visible when viewing the event.
4. **Given** I am creating an event, **When** I toggle "All Day", **Then** the event spans the entire day without specific start/end times displayed.
5. **Given** an existing event created by any household member, **When** I click edit, **Then** I can modify any field and save the changes.
6. **Given** an existing event, **When** I drag and drop it to a new date/time, **Then** the event is rescheduled to the new date/time.

---

### User Story 4 - Delete Events (Priority: P2)

As a household member, I want to delete events I no longer need so that the calendar stays clean and accurate.

**Why this priority**: Deletion is important for maintenance but less critical than creation and viewing for initial MVP value.

**Independent Test**: Can be fully tested by creating an event, deleting it, and confirming it no longer appears on the calendar.

**Acceptance Scenarios**:

1. **Given** an existing event created by any household member, **When** I click delete and confirm, **Then** the event is removed from the calendar.
2. **Given** I click delete on an event, **When** the confirmation dialog appears, **Then** I can cancel to keep the event.

---

### User Story 5 - Filter Events by Category (Priority: P2)

As a household member, I want to filter calendar events by category so that I can focus on specific types of events (e.g., only medical appointments or only family activities).

**Why this priority**: Filtering enhances usability but the calendar functions without it. Useful once there are many events.

**Independent Test**: Can be fully tested by creating events in different categories and toggling category filters to verify correct filtering.

**Acceptance Scenarios**:

1. **Given** events exist in multiple categories, **When** I view the calendar, **Then** I see category filter toggles with color indicators.
2. **Given** all categories are selected, **When** I deselect a category, **Then** events in that category are hidden from the calendar view.
3. **Given** I have filtered categories, **When** I click "Show All", **Then** all events become visible again.

---

### User Story 6 - Send Google Calendar Invite via Email (Priority: P2)

As a household member, I want to send a calendar invite email when creating an event so that family members can easily add the event to their personal Google Calendar.

**Why this priority**: Email invites add convenience but the local calendar works independently. This is an enhancement for external calendar integration.

**Independent Test**: Can be fully tested by creating an event, entering an email address, sending the invite, and checking the recipient's inbox for the ICS attachment.

**Acceptance Scenarios**:

1. **Given** I am creating or viewing an event, **When** I choose to send an invite, **Then** I see an email input field.
2. **Given** I enter a valid email address and click send, **When** the email is sent successfully, **Then** I see a confirmation message "Invite sent successfully".
3. **Given** the recipient receives the email, **When** they open it, **Then** they see event details and an attached .ics file they can open to add to their calendar.
4. **Given** I enter an invalid email format, **When** I click send, **Then** I see a validation error and the invite is not sent.

---

### User Story 7 - Admin User Management (Priority: P3)

As an admin, I want to manage household member accounts and system settings so that I can add new family members, update their information, control access, and configure email functionality.

**Why this priority**: Admin features are important for ongoing management but the system can launch with a pre-seeded admin user.

**Independent Test**: Can be fully tested by logging in as admin, navigating to user management, and performing CRUD operations on user accounts and system configuration.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I navigate to the admin panel, **Then** I see a list of all household member accounts.
2. **Given** I am in the admin panel, **When** I add a new user with email, name, and a password meeting requirements (8+ characters, at least one number), **Then** that user can log in with those credentials.
3. **Given** I am viewing a user in the admin panel, **When** I edit their name or role, **Then** the changes take effect immediately.
4. **Given** I am a regular member (not admin), **When** I try to access the admin panel, **Then** I am redirected away and cannot access admin features.
5. **Given** I am an admin in the settings section, **When** I configure SMTP settings (server, port, credentials), **Then** calendar invite emails can be sent successfully.

---

### User Story 8 - Admin Category Management (Priority: P3)

As an admin, I want to manage event categories so that I can customize the category names, colors, and icons to fit our family's needs.

**Why this priority**: Category customization is nice-to-have. Default categories cover most needs initially.

**Independent Test**: Can be fully tested by logging in as admin, adding/editing categories, and verifying they appear in event creation forms.

**Acceptance Scenarios**:

1. **Given** I am an admin in the category management section, **When** I create a new category with name, color, and icon, **Then** the category becomes available for event creation.
2. **Given** I edit an existing category color, **When** I save changes, **Then** all events in that category display with the new color.
3. **Given** I delete a category, **When** events exist in that category, **Then** those events become uncategorized (not deleted).

---

### Edge Cases

- What happens when a user tries to create an event with end time before start time? System should show validation error.
- What happens when two users edit the same event simultaneously? Last save wins (no real-time collaboration in MVP).
- What happens when email sending fails due to SMTP issues? User sees error message; event is still saved locally.
- What happens when a user's session expires during a long interaction? User is prompted to log in again; unsaved changes may be lost.
- What happens when viewing the calendar across different timezones? Events display in the configured timezone (default: America/New_York).

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication

- **FR-001**: System MUST allow users to log in with email and password.
- **FR-002**: System MUST hash passwords securely before storing.
- **FR-003**: System MUST maintain user sessions for 7 days before requiring re-authentication.
- **FR-004**: System MUST enforce password requirements: minimum 8 characters with at least one number.
- **FR-005**: System MUST lock user accounts for 15 minutes after 5 consecutive failed login attempts.
- **FR-006**: System MUST redirect unauthenticated users to the login page when accessing protected routes.
- **FR-007**: System MUST support two user roles: Admin and Member.
- **FR-008**: System MUST restrict admin panel access to Admin role users only.
- **FR-009**: System MUST allow users to log out and terminate their session.

#### Calendar Display

- **FR-010**: System MUST display events in month, week, and day views.
- **FR-011**: System MUST allow navigation between time periods (previous/next month/week/day).
- **FR-012**: System MUST display events with their assigned category color.
- **FR-013**: System MUST highlight the current day in the calendar view.
- **FR-014**: System MUST show event details when clicking on an event.

#### Event Management

- **FR-015**: System MUST allow creating events with title, start time, and end time (required fields).
- **FR-016**: System MUST allow optional event fields: description, location, and category.
- **FR-017**: System MUST support all-day events.
- **FR-018**: System MUST allow editing existing events.
- **FR-019**: System MUST allow deleting events with confirmation.
- **FR-020**: System MUST allow any logged-in household member to edit or delete any event regardless of who created it.
- **FR-021**: System MUST support drag-and-drop rescheduling of events.
- **FR-022**: System MUST store event times with timezone information.
- **FR-023**: System MUST track who created each event.

#### Category Filtering

- **FR-024**: System MUST provide filter toggles for each event category.
- **FR-025**: System MUST hide/show events based on selected category filters.
- **FR-026**: System MUST provide default event categories: Family, Work, Medical, Social, Finance, Other.

#### Email Invites

- **FR-027**: System MUST allow sending calendar invite emails for any event.
- **FR-028**: System MUST generate valid ICS calendar files attached to invite emails.
- **FR-029**: System MUST validate email addresses before sending invites.
- **FR-030**: System MUST log sent invites for each event.

#### Admin Features

- **FR-031**: Admin users MUST be able to view all household member accounts.
- **FR-032**: Admin users MUST be able to create new user accounts.
- **FR-033**: Admin users MUST be able to edit user details and roles.
- **FR-034**: Admin users MUST be able to add, edit, and delete event categories.
- **FR-035**: Admin users MUST be able to configure SMTP settings for email invites through the admin panel.

### Key Entities

- **User**: A household member who can log in to the system. Has email, name, password, and role (Admin or Member). Creates events and receives invites.

- **Event**: A calendar entry with title, description, location, start/end times, timezone, and optional recurrence. Belongs to a category and is created by a user.

- **EventCategory**: A classification for events with name, color, and icon. Used for visual organization and filtering.

- **EventAttendee**: Links users to events with attendance status (pending, accepted, declined, tentative).

- **EventInvite**: Records of email invites sent for events, tracking recipient and send time.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Household members can complete login in under 10 seconds from page load.
- **SC-002**: Users can create a new event with all fields in under 1 minute.
- **SC-003**: Calendar page loads and displays events within 2 seconds.
- **SC-004**: Email invites are delivered to recipients within 1 minute of sending.
- **SC-005**: 100% of invite emails contain valid ICS attachments that open in calendar applications.
- **SC-006**: Users can switch between month/week/day views without page reload.
- **SC-007**: Admin can add a new household member in under 2 minutes.
- **SC-008**: System supports at least 5 concurrent household members without performance issues.
- **SC-009**: Users can successfully log in on mobile devices (responsive design).
- **SC-010**: Event drag-and-drop updates are reflected immediately without page refresh.

---

## Development Methodology: TDD Red-Green *(mandatory)*

This feature MUST be developed using Test-Driven Development (TDD) with the Red-Green-Refactor cycle.

### TDD Cycle

For each functional requirement and user story acceptance scenario:

1. **RED**: Write a failing test that defines the expected behavior
   - Test should clearly describe the expected outcome
   - Test MUST fail initially (no implementation exists)
   - Commit the failing test

2. **GREEN**: Write the minimum code to make the test pass
   - Implement only what is needed to satisfy the test
   - Do not add extra functionality
   - Commit when test passes

3. **REFACTOR**: Improve code quality while keeping tests green
   - Clean up duplication, improve naming, optimize structure
   - All tests MUST remain passing
   - Commit the refactored code

### Test Categories

| Category | Purpose | Scope | When to Write |
|----------|---------|-------|---------------|
| **Unit Tests** | Verify individual functions/components in isolation | Single function, component, or module | Before implementing any business logic or component |
| **Integration Tests** | Verify components work together correctly | Database queries, API endpoints, component interactions | Before implementing database operations or API routes |
| **End-to-End Tests** | Verify complete user workflows | Full user story from UI to database | Before implementing each P1 user story |

### Acceptance Scenario → Test Mapping

Each **Given/When/Then** acceptance scenario in User Stories maps directly to a test case:

- **Given** → Test setup/preconditions (arrange)
- **When** → Action being tested (act)
- **Then** → Assertion of expected outcome (assert)

Example mapping from User Story 1:
```
Acceptance: Given I am on the login page with valid credentials, When I enter my email and password...
Test: "should redirect to calendar page when valid credentials are provided"
```

### Test Coverage Requirements

- **Minimum 80% code coverage** for business logic (authentication, event CRUD, email sending)
- **100% coverage** for all acceptance scenarios in P1 user stories
- **All edge cases** must have corresponding test cases
- **Database operations** must have integration tests with test container

---

## Assumptions

- Household size is small (2-10 members), so simple authentication without advanced security features is acceptable.
- All household members share the same timezone for typical use cases; per-user timezone preferences are not required for MVP.
- Gmail SMTP with App Passwords provides sufficient email delivery for the expected volume (under 50 invites per day).
- Users have access to modern browsers that support the calendar component requirements.
- The existing dashboard design system (Inter font, coral accent color) will be extended to the calendar UI.
- No bidirectional sync with external calendars is required; one-way ICS email invites are sufficient.
- Event recurrence (repeating events) is captured in the data model but full UI support is deferred post-MVP.

---

## Out of Scope

- Bidirectional Google Calendar sync with OAuth
- Real-time collaborative editing of events
- Push notifications for upcoming events
- Native mobile app
- Multi-household/multi-tenant support
- Event comments or discussion threads
- File attachments on events
- Video conferencing integration
- Advanced recurrence rules UI (weekly, monthly patterns)
