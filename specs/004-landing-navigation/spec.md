# Feature Specification: Landing Page and Cross-Site Navigation Bar

**Feature Branch**: `004-landing-navigation`
**Created**: January 12, 2026
**Status**: ✅ Implementation Complete
**Completed**: January 19, 2026
**Input**: User description: "Landing Page and Cross-Site Navigation Bar"

## Overview

This feature introduces a persistent navigation top bar and a landing page (home) for the Cemdash home finance dashboard. The navigation bar provides consistent wayfinding across all authenticated pages, while the landing page serves as the user's home base with quick access to application modules and upcoming calendar events.

### In Scope

| Included | Excluded |
|----------|----------|
| Persistent top navigation bar | Household member switching |
| App selection panel (landing page) | Global search functionality |
| User avatar dropdown menu | Notification system |
| Dark/light theme toggle integration | Quick action buttons |
| Mobile hamburger menu & drawer | Public marketing page |
| Authentication redirect logic | Logo design/generation |
| Upcoming events hero section | Full calendar integration |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desktop Navigation Across Pages (Priority: P1)

As an authenticated user on a desktop browser, I want to navigate between application modules using a persistent top navigation bar so that I can quickly access any section of Cemdash without losing context.

**Why this priority**: Navigation is the foundational UX element that enables all other interactions. Without functional navigation, users cannot access any features. This is the core infrastructure for the entire application.

**Independent Test**: Can be fully tested by navigating between Home, Finance, Calendar, and Settings pages and verifying the nav bar remains visible with correct active states, delivering seamless wayfinding.

**Acceptance Scenarios**:

1. **Given** I am logged in and on any authenticated page, **When** I view the top of the page, **Then** I see a navigation bar with Logo, Home, Finance, Calendar, Settings links, theme toggle, and my avatar
2. **Given** I am on the Finance page, **When** I look at the navigation bar, **Then** the Finance nav item displays an active state (highlighted text and underline indicator)
3. **Given** I am on any page, **When** I click a different nav item (e.g., Calendar), **Then** I am navigated to that page and the nav bar updates to show the new active item
4. **Given** I am on any page, **When** I click the Logo, **Then** I am navigated to the landing page (Home)

---

### User Story 2 - Landing Page App Selection (Priority: P1)

As an authenticated user, I want to see a landing page with a welcoming hero section and an app selection panel so that I have a central hub to access all application modules.

**Why this priority**: The landing page is the default entry point after login. It establishes the user experience and provides an alternative navigation method via app cards.

**Independent Test**: Can be fully tested by logging in, landing on the home page, and clicking each app card to navigate to the corresponding module.

**Acceptance Scenarios**:

1. **Given** I am logged in and navigate to the home page, **When** the page loads, **Then** I see a personalized greeting "Welcome back, [My First Name]"
2. **Given** I am on the landing page, **When** I look at the app selection panel, **Then** I see cards for Home, Finance, Calendar, and Settings with icons and descriptions
3. **Given** I am on the landing page, **When** I click the Finance app card, **Then** I am navigated to the Finance page
4. **Given** I am viewing the landing page, **When** I hover over an app card, **Then** it displays visual feedback (elevation, glow effect, slight scale)

---

### User Story 3 - Theme Toggle from Navigation (Priority: P2)

As a user, I want to toggle between dark and light themes using a button in the navigation bar so that I can customize my visual experience.

**Why this priority**: Theme preference is a core UX feature for accessibility and user comfort, especially for a finance dashboard that may be used at various times of day.

**Independent Test**: Can be fully tested by clicking the theme toggle button and verifying the entire UI switches themes, with the preference persisting across page reloads.

**Acceptance Scenarios**:

1. **Given** I am in dark mode, **When** I click the theme toggle button in the nav bar, **Then** the theme switches to light mode and the toggle icon changes to a Sun
2. **Given** I am in light mode, **When** I click the theme toggle button, **Then** the theme switches to dark mode and the toggle icon changes to a Moon
3. **Given** I have toggled to light mode, **When** I refresh the page or navigate to another page, **Then** my light mode preference is preserved
4. **Given** I am on any page, **When** I hover over the theme toggle, **Then** I see a tooltip indicating "Switch to dark/light mode"

---

### User Story 4 - User Menu and Sign Out (Priority: P2)

As a user, I want to access my profile, settings, and sign out functionality from an avatar dropdown in the navigation bar so that I have convenient access to account actions.

**Why this priority**: User account controls are essential for security (sign out) and personalization, though secondary to core navigation.

**Independent Test**: Can be fully tested by clicking the avatar to open the dropdown, navigating to Profile or Settings, and successfully signing out.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I view my avatar in the nav bar, **Then** it displays my profile image (or initials if no image, or a default icon if no name)
2. **Given** I am on any page, **When** I click my avatar, **Then** a dropdown menu appears with Profile, Settings, and Sign Out options
3. **Given** the dropdown is open, **When** I click Profile, **Then** I am navigated to `/settings/profile`
4. **Given** the dropdown is open, **When** I click Settings, **Then** I am navigated to `/settings`
5. **Given** the dropdown is open, **When** I click Sign Out, **Then** I am logged out and redirected to the login page

---

### User Story 5 - Mobile Navigation with Hamburger Menu (Priority: P2)

As a mobile user, I want to access navigation through a hamburger menu that opens a slide-out drawer so that I can navigate efficiently on smaller screens.

**Why this priority**: Mobile responsiveness is critical for modern web applications, but desktop is the primary use case. Mobile support ensures accessibility across devices.

**Independent Test**: Can be fully tested on a mobile viewport by tapping the hamburger icon, navigating via drawer links, and closing the drawer.

**Acceptance Scenarios**:

1. **Given** I am viewing the app on a viewport below 768px, **When** I look at the navigation bar, **Then** I see a hamburger icon on the left, centered logo, theme toggle, and avatar on the right
2. **Given** I am on mobile, **When** I tap the hamburger icon, **Then** a slide-out drawer animates in from the left with navigation items
3. **Given** the drawer is open, **When** I tap a navigation item (e.g., Calendar), **Then** I am navigated to that page and the drawer closes
4. **Given** the drawer is open, **When** I tap the overlay backdrop, **Then** the drawer closes
5. **Given** the drawer is open, **When** I tap the X close button, **Then** the drawer closes

---

### User Story 6 - Upcoming Events on Landing Page (Priority: P3)

As a user, I want to see my next 3 upcoming calendar events on the landing page hero section so that I have immediate awareness of my schedule.

**Why this priority**: Surfacing upcoming events adds convenience but is dependent on the Calendar module data. This enhances the landing page but is not critical for initial functionality.

**Independent Test**: Can be fully tested by creating calendar events within the next 7 days and verifying they appear on the landing page hero section.

**Acceptance Scenarios**:

1. **Given** I have upcoming events within the next 7 days, **When** I view the landing page, **Then** I see up to 3 event cards showing title, date/time, and location (if available)
2. **Given** I have no upcoming events, **When** I view the landing page, **Then** I see a friendly empty state message with a link to create an event that navigates to `/calendar` with the creation form opened
3. **Given** I am viewing event cards on the landing page, **When** I click an event card, **Then** I am navigated to the Calendar page with that event highlighted
4. **Given** I am on mobile, **When** I view the upcoming events, **Then** I can horizontally scroll through them with snap points

---

### Edge Cases

- What happens when a user's session expires while navigating? → Redirect to login with a session expired message
- How does the system handle a user with no name set? → Display email or default "User" text in greeting
- What happens if the Calendar API fails to load events? → Display graceful error state message without retry button (requires page refresh)
- How does the nav bar behave during slow page transitions? → Show loading indicator on the clicked nav item
- What happens on very narrow viewports (< 320px)? → Maintain minimum touch targets, allow horizontal scroll if needed

## Clarifications

### Session 2026-01-12

- Q: When the user clicks the Sign Out option, should the system require explicit confirmation before logging out, or proceed immediately? → A: Sign out immediately without confirmation
- Q: When a user has no upcoming events and clicks the "create event" link from the empty state message on the landing page, where should they be taken? → A: Navigate to `/calendar` with the event creation form automatically opened
- Q: When displaying a user's initials in the avatar (when no profile image exists), how should the initials be derived from the user's name? → A: First letter of first name + first letter of last name
- Q: When the Calendar API fails to load upcoming events for the landing page hero section, should the error state allow users to retry loading the events? → A: No, show error message only and require full page refresh
- Q: When a user navigates to a different page by clicking a nav item, should there be any visual feedback during the navigation/loading period? → A: Show loading indicator on the clicked nav item only

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a persistent top navigation bar on all authenticated pages with a height of 64px
- **FR-002**: Navigation bar MUST contain: Logo placeholder (links to Home), nav items (Home, Finance, Calendar, Settings), theme toggle button, and user avatar
- **FR-003**: System MUST highlight the currently active navigation item with distinct visual treatment (primary color text, underline indicator with glow)
- **FR-004**: Theme toggle MUST switch between dark and light modes and persist preference to localStorage
- **FR-005**: User avatar MUST display profile image if available, initials (first letter of first name + first letter of last name) if no image, or default icon if no user data
- **FR-006**: Avatar dropdown MUST provide links to Profile, Settings, and Sign Out functionality
- **FR-007**: Sign Out action MUST trigger NextAuth signOut immediately without confirmation and redirect user to login page
- **FR-008**: Landing page MUST display personalized greeting using authenticated user's first name
- **FR-009**: Landing page MUST show app selection panel with cards for Home, Finance, Calendar, and Settings
- **FR-010**: App cards MUST display icon (48px), title, and brief description
- **FR-011**: App cards MUST respond to hover with elevation, shadow, and subtle scale (1.02) animation
- **FR-012**: Landing page hero section MUST display up to 3 upcoming calendar events from the next 7 days
- **FR-013**: Event cards MUST show title, date/time, and location (if available)
- **FR-014**: Clicking an event card MUST navigate to Calendar page with event context
- **FR-015**: On viewports below 768px, navigation MUST transform to hamburger menu with slide-out drawer
- **FR-016**: Mobile drawer MUST include all nav items, user section, and sign out option
- **FR-017**: Mobile drawer MUST animate from left (200ms ease-out) with semi-transparent backdrop overlay
- **FR-018**: All interactive elements MUST be keyboard accessible with visible focus states
- **FR-019**: Protected routes MUST redirect unauthenticated users to `/login`
- **FR-020**: During page navigation, system MUST display a loading indicator on the clicked nav item until navigation completes

### Key Entities

- **NavItem**: Represents a navigation link with href, icon, label, and active state
- **AppCard**: Represents an application module card with href, icon, title, description, and current page state
- **UpcomingEvent**: Calendar event data containing id, title, startTime, and optional location
- **User**: Authenticated user with name, email, and optional profile image

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to any main section (Home, Finance, Calendar, Settings) within 2 clicks from any page
- **SC-002**: Theme toggle switches UI themes instantly (under 100ms visual feedback)
- **SC-003**: Navigation bar renders consistently across all authenticated pages with no layout shift
- **SC-004**: Mobile drawer opens and closes within 200ms animation duration
- **SC-005**: Landing page loads with personalized greeting and app cards within 500ms on average connection
- **SC-006**: 100% of navigation items are accessible via keyboard (Tab navigation, Enter activation)
- **SC-007**: All interactive elements meet WCAG 2.1 AA contrast requirements in both themes
- **SC-008**: Unauthenticated access attempts are redirected to login within 100ms

## Development Methodology *(mandatory)*

### Test-Driven Development (TDD) Red-Green-Refactor

All implementation MUST follow strict TDD Red-Green-Refactor methodology:

1. **Red Phase**: Write a failing test that defines desired behavior before writing any implementation code
2. **Green Phase**: Write the minimal code necessary to make the test pass
3. **Refactor Phase**: Improve code quality while keeping all tests passing

### TDD Requirements

- **Every** user story acceptance scenario MUST have corresponding automated tests written BEFORE implementation
- Tests MUST be written at the appropriate level:
  - Unit tests for individual components and functions
  - Integration tests for component interactions
  - End-to-end tests for complete user flows
- Implementation MUST NOT begin until failing tests exist for that functionality
- All tests MUST pass before code is considered complete
- Test coverage MUST be maintained at >80% for all new code
- Each commit MUST include both tests and implementation, demonstrating the Red-Green cycle

### Test-First Workflow Example

For User Story 1 (Navigation):
1. Write E2E test verifying nav bar visibility (Red - test fails, nav bar doesn't exist)
2. Create minimal NavBar component rendering basic structure (Green - test passes)
3. Write test for active state detection (Red - test fails, no active state logic)
4. Implement active state logic (Green - test passes)
5. Refactor NavBar for better organization (Green - tests still pass)

This cycle repeats for each acceptance scenario and functional requirement.

## Assumptions

- NextAuth.js is already configured and providing user session data
- The existing Cemdash theme system with CSS custom properties is available for integration
- Lucide React icons library is installed or will be installed
- shadcn/ui components (Button, DropdownMenu, Avatar, Card, Sheet) are available or will be added
- Calendar events are accessible via existing API endpoints
- The user's first name can be extracted from the session user name field
