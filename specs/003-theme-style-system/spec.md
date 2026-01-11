# Feature Specification: Theme Style System

**Feature Branch**: `003-theme-style-system`  
**Created**: January 11, 2026  
**Status**: Draft  
**Input**: User description: "Theme Style System defined by research/theme-system-research/01-ARCHITECTURE.md"

## Clarifications

### Session 2026-01-11

- Q: Where should the theme toggle control be placed for users to access it? → A: Directly in the header bar as a standalone icon button

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Between Light and Dark Theme (Priority: P1)

A user viewing the dashboard wants to switch between light and dark mode to match their preference or reduce eye strain in different lighting conditions. They click a theme toggle button, and the entire application instantly updates to the selected theme without page reload or visual glitches.

**Why this priority**: This is the core functionality of a theme system. Users expect instant theme switching as a baseline feature, and it delivers immediate visual value.

**Independent Test**: Can be fully tested by clicking the theme toggle and verifying all UI elements (backgrounds, text, borders, buttons) update to the correct colors for the selected theme.

**Acceptance Scenarios**:

1. **Given** a user is viewing the dashboard in light mode, **When** they click the theme toggle, **Then** the application switches to dark mode within 100ms with no visible flash of unstyled content
2. **Given** a user is viewing any page in dark mode, **When** they click the theme toggle, **Then** the application switches to light mode and all text remains readable (meets WCAG AA contrast)
3. **Given** a user has toggled the theme, **When** they navigate to a different page, **Then** the selected theme persists across all pages

---

### User Story 2 - Persist Theme Preference Across Sessions (Priority: P1)

A user sets their preferred theme and expects it to be remembered when they return to the application later. Their choice is stored locally and applied automatically on subsequent visits.

**Why this priority**: Without persistence, users would need to re-select their theme on every visit, making the feature frustrating rather than helpful.

**Independent Test**: Can be tested by selecting a theme, closing the browser, reopening the application, and verifying the previously selected theme is automatically applied.

**Acceptance Scenarios**:

1. **Given** a user selects dark mode, **When** they close the browser and reopen the application, **Then** dark mode is automatically applied
2. **Given** a user has not previously selected a theme, **When** they visit the application for the first time, **Then** the system respects their operating system's color scheme preference
3. **Given** a user's system preference changes (e.g., scheduled dark mode), **When** they have not explicitly set a preference, **Then** the application follows the updated system preference

---

### User Story 3 - View Theme-Aware Charts and Visualizations (Priority: P2)

A user viewing financial charts and data visualizations sees colors that are optimized for the current theme. In dark mode, chart colors are brighter and more vibrant; in light mode, colors are optimized for white backgrounds.

**Why this priority**: Charts are a core component of the Home Finance Dashboard. Theme-aware charts enhance readability and create a cohesive visual experience.

**Independent Test**: Can be tested by viewing the spending-by-category chart in both themes and verifying colors are distinct, readable, and match the theme's color palette.

**Acceptance Scenarios**:

1. **Given** a user is viewing a pie chart in light mode, **When** they switch to dark mode, **Then** the chart colors update to the dark theme palette with enhanced brightness
2. **Given** a user is viewing a multi-series line chart, **When** in either theme, **Then** all data series are distinguishable from each other (10 distinct colors available)
3. **Given** a user is viewing income vs expenses visualization, **When** in any theme, **Then** income is shown in green tones and expenses in coral/red tones consistently

---

### User Story 4 - Access Theme Toggle from Any Page (Priority: P2)

A user can access the theme toggle control from the header bar across all pages of the application. The toggle appears as a standalone icon button (sun/moon icon) that is immediately visible and accessible.

**Why this priority**: Discoverability is essential for the feature to be useful. Users should not need to hunt for the toggle. A persistent, visible control in the header ensures easy access.

**Independent Test**: Can be tested by navigating to dashboard, calendar, and admin pages and verifying the theme toggle icon button is visible in the header bar.

**Acceptance Scenarios**:

1. **Given** a user is on any page, **When** they look at the header bar, **Then** the theme toggle icon button is visible alongside other header controls
2. **Given** a user clicks the theme toggle icon, **When** the theme changes, **Then** the icon updates to reflect the new theme (sun icon for light mode, moon icon for dark mode)
3. **Given** a user on a mobile viewport, **When** they access the application, **Then** the theme toggle icon remains visible in the mobile header

---

### User Story 5 - Experience Consistent Styling Across All Components (Priority: P2)

When a user switches themes, every UI component in the application updates consistently, including cards, tables, buttons, inputs, badges, and the navigation sidebar.

**Why this priority**: Inconsistent theming creates a broken, unprofessional experience. All components must participate in the theme system.

**Independent Test**: Can be tested by switching themes and systematically checking each component type (cards, tables, forms, modals) for correct styling.

**Acceptance Scenarios**:

1. **Given** a user switches to dark mode, **When** viewing the transaction table, **Then** table rows, headers, and hover states use dark theme colors
2. **Given** a user is in dark mode, **When** they open a modal dialog, **Then** the modal uses dark theme background and text colors
3. **Given** a user is in light mode, **When** viewing form inputs, **Then** input borders, backgrounds, and focus states use light theme colors

---

### Edge Cases

- What happens when localStorage is disabled or cleared? System should fall back to system preference detection.
- How does the system handle a user with no system color-scheme preference set? Default to light theme.
- What happens during theme switch if an animation is in progress? Animation should complete or gracefully transition.
- How does the theme behave in print mode? Print styles should use light theme colors for readability.
- What if a user has high-contrast mode enabled in their OS? Theme should not override accessibility settings.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support at minimum two themes: Light and Dark
- **FR-002**: System MUST allow theme switching without page reload (CSS class-based switching)
- **FR-003**: System MUST persist user theme preference in browser localStorage
- **FR-004**: System MUST detect and respect \`prefers-color-scheme\` system preference when no user preference is stored
- **FR-005**: System MUST apply saved theme before React hydration to prevent flash of unstyled content (FOUC)
- **FR-006**: System MUST expose a ThemeProvider context for components to access current theme
- **FR-007**: System MUST provide a \`useTheme\` hook returning current theme and toggle function
- **FR-008**: System MUST provide a \`useChartTheme\` hook returning theme-appropriate chart color palette
- **FR-009**: System MUST define CSS custom properties for all color tokens (backgrounds, text, borders, accents, chart colors)
- **FR-010**: System MUST ensure all color combinations meet WCAG 2.1 AA contrast requirements
- **FR-011**: Theme toggle component MUST be displayed as a standalone icon button in the application header bar, visible on all pages
- **FR-012**: All shadcn/ui components MUST consume theme tokens via CSS variables
- **FR-013**: All Recharts visualizations MUST use theme-aware colors from the chart palette
- **FR-014**: Data tables MUST apply theme-appropriate styling for rows, headers, and hover states
- **FR-015**: System MUST support real-time theme updates when system preference changes (via matchMedia listener)

### Key Entities

- **Theme Configuration**: Represents a complete theme definition including all color tokens, shadows, and effects. Identified by a unique theme name (e.g., "light", "dark").
- **Color Token**: A semantic color variable with a purpose (e.g., text-primary, bg-secondary) that resolves to different values per theme.
- **User Preference**: The user's selected theme choice, stored locally and optionally synced to their account.
- **Chart Color Palette**: An ordered set of 10 distinct colors optimized for data visualizations within a specific theme.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Theme switching completes in under 100ms with no visible layout shift
- **SC-002**: Zero flash of unstyled content on initial page load regardless of theme
- **SC-003**: Theme preference persists correctly across browser sessions 100% of the time
- **SC-004**: All text/background color combinations achieve WCAG 2.1 AA contrast ratio (4.5:1 for normal text)
- **SC-005**: Chart visualizations remain readable and distinguishable in both themes (10 distinct colors)
- **SC-006**: Theme toggle is discoverable within 3 seconds by first-time users
- **SC-007**: System correctly detects and applies OS color scheme preference when no user preference exists
- **SC-008**: All existing UI components (cards, tables, forms, modals, badges) render correctly in both themes

## Assumptions

- Users are on modern browsers that support CSS custom properties (IE11 is explicitly excluded per architecture doc)
- The application uses Next.js 14+ with App Router
- shadcn/ui components are already in use and support CSS variable theming natively
- Recharts is used for chart visualizations
- TanStack Table is used for data tables
- The initial implementation will support Light and Dark themes; custom theme extensibility is a future enhancement

## Development Methodology

### TDD Red-Green-Refactor Cycle

This feature MUST be implemented using Test-Driven Development:

1. **RED**: Write a failing test for each acceptance scenario before implementation
2. **GREEN**: Write the minimum code required to make the test pass
3. **REFACTOR**: Clean up the code while keeping all tests green
4. **COMMIT**: Commit after each RED, GREEN, and REFACTOR phase

### Test Organization

| Test Type | Framework | Coverage Target | Scope |
|-----------|-----------|-----------------|-------|
| Unit | Vitest | 80% business logic | Hooks, utilities, CSS variable generation |
| Integration | Vitest | All context interactions | ThemeProvider, localStorage, system preference |
| E2E | Playwright | 100% P1 acceptance scenarios | Theme toggle, persistence, FOUC prevention |

### Implementation Order (Per TDD)

1. Write failing E2E test for User Story 1 (theme toggle)
2. Implement ThemeProvider and ThemeToggle to pass test
3. Write failing E2E test for User Story 2 (persistence)
4. Implement localStorage persistence to pass test
5. Write unit tests for useChartTheme hook
6. Implement chart theme hook to pass tests
7. Continue pattern for remaining stories...
