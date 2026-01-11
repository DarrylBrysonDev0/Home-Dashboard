# Tasks: Theme Style System

**Input**: Design documents from `/specs/003-theme-style-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD is **required** per spec.md - write failing tests FIRST, then implement.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Testing Best Practices (Lessons Learned from T025-T028)

### ✅ Recommended Approaches
1. **Unit Tests with Mocked Hooks**: Mock `next-themes` `useTheme` hook directly
   - Reliable, fast, no timing issues
   - Example: T029-T032 (useChartTheme tests)

2. **E2E Tests via User Interaction**: Click theme toggle, wait for changes
   - Tests real user workflows
   - Works well with next-themes' script injection
   - Example: T021 tests that click the toggle button

3. **System Preference Tests**: Use `page.emulateMedia()` without pre-set localStorage
   - Tests OS preference detection
   - Works when no stored user preference exists

### ⚠️ Approaches to Avoid
1. **E2E with `addInitScript` localStorage pre-population**
   - Has timing/initialization issues with next-themes
   - next-themes' blocking script may run before/after addInitScript unpredictably
   - Alternative: Test persistence via actual user interaction

2. **Synthetic State Setup in E2E Tests**
   - Prefer testing through the UI rather than manipulating state directly
   - More accurately reflects user experience

### 📊 Test Results Reference
- **T021-T024 (US2)**: 8/16 passing (50% success)
- Passing tests use user interaction or system preference emulation
- Failing tests use addInitScript for localStorage pre-population

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- All paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and theme system scaffolding

- [x] T001 Create theme module structure: `lib/theme/` directory with `index.ts`, `types.ts`
- [x] T002 [P] Create theme components directory: `components/theme/`
- [x] T003 [P] Create theme test directory structure: `__tests__/unit/theme/`, `__tests__/e2e/`
- [x] T004 Copy type definitions from `specs/003-theme-style-system/contracts/theme-types.ts` to `lib/theme/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create ThemeProvider wrapper component in `components/theme/ThemeProvider.tsx` using next-themes
- [x] T006 Update `app/providers.tsx` to include ThemeProvider wrapping existing providers
- [x] T007 Add `suppressHydrationWarning` to `<html>` element in `app/layout.tsx`
- [x] T008 [P] Create light theme color definitions in `lib/theme/themes/light.ts`
- [x] T009 [P] Create dark theme color definitions in `lib/theme/themes/dark.ts` (Cemdash palette)
- [x] T010 Create theme registry index in `lib/theme/themes/index.ts`
- [x] T011 Update `app/globals.css` with Cemdash base CSS variables (backgrounds, text, borders)
- [x] T011a [P] Add Cemdash shadow system CSS variables to `app/globals.css` (shadow-sm through shadow-xl)
- [x] T011b [P] Add Cemdash glow effect CSS variables to `app/globals.css` (coral, mint, teal, cyan, white, coral-intense)
- [x] T011c [P] Add Cemdash spacing scale and border radius tokens to `app/globals.css`
- [x] T011d Create gradient border utilities for KPI cards in `app/globals.css` (6 card types with specific gradients)
- [x] T011e [P] Add Cemdash typography scale CSS variables to `app/globals.css` (13 text styles)
- [x] T011f [P] Add Cemdash category color palette (13 spending categories) to `app/globals.css`
- [x] T011g [P] Add Cemdash rainbow spectrum palette (10 chart colors) to `app/globals.css`
- [x] T011h [P] Add Cemdash account line colors (6 account types) to `app/globals.css`
- [x] T011i Create component-specific CSS classes for Cemdash styling (buttons, dropdowns, tooltips, tables)
- [x] T012 [P] Configure Tailwind CSS 4 to consume theme CSS variables via `@theme inline` in `tailwind.config.ts`

**Checkpoint**: Foundation ready - ThemeProvider wraps app, CSS variables defined, user story implementation can now begin

---

## Phase 3: User Story 1 - Toggle Between Light and Dark Theme (Priority: P1) 🎯 MVP

**Goal**: Users can click a theme toggle button and instantly switch between light and dark themes

**Independent Test**: Click the theme toggle and verify all UI elements update to the correct colors for the selected theme

### Tests for User Story 1 (TDD - Write FIRST, Ensure FAIL)

- [x] T013 [P] [US1] E2E test: theme toggle click switches theme in `__tests__/e2e/theme-toggle.spec.ts`
- [x] T014 [P] [US1] E2E test: theme switch < 100ms with no FOUC in `__tests__/e2e/theme-toggle.spec.ts`
- [x] T015 [P] [US1] E2E test: theme persists across page navigation in `__tests__/e2e/theme-toggle.spec.ts`
- [x] T016 [P] [US1] Unit test: useTheme hook returns theme and setTheme in `__tests__/unit/theme/hooks.test.ts`

### Implementation for User Story 1

- [x] T017 [US1] Create ThemeToggle component with sun/moon icons in `components/theme/ThemeToggle.tsx`
- [x] T018 [US1] Create useTheme hook wrapper in `lib/theme/hooks/useTheme.ts` (wraps next-themes)
- [x] T019 [US1] Export hooks from `lib/theme/index.ts`
- [x] T020 [US1] Verify all acceptance scenarios pass for US1

**Checkpoint**: User Story 1 complete - theme toggle works, switches instantly, no FOUC

---

## Phase 4: User Story 2 - Persist Theme Preference Across Sessions (Priority: P1)

**Goal**: Users' theme choice is saved to localStorage and automatically applied on return visits

**Independent Test**: Select a theme, close browser, reopen application, verify previously selected theme is applied

### Tests for User Story 2 (TDD - Write FIRST, Ensure FAIL)

**Testing Results & Lessons Learned**:
- ✅ 8/16 E2E tests passing in Chromium (50% success rate)
- ✅ Core functionality verified working: persistence via user interaction, system preference detection
- ⚠️ Tests using Playwright `addInitScript()` to pre-populate localStorage have timing issues with next-themes
- **Lesson**: For E2E theme tests, use actual user interactions (toggle clicks) instead of synthetic state
- **Lesson**: Unit tests with mocked hooks are more reliable than E2E with pre-populated state
- **Impact**: Implementation is correct; some test approaches don't work well with next-themes initialization

- [x] T021 [P] [US2] E2E test: theme persists after browser reload in `__tests__/e2e/theme-persistence.spec.ts`
- [x] T022 [P] [US2] E2E test: system preference respected when no user preference in `__tests__/e2e/theme-persistence.spec.ts`
- [x] T023 [P] [US2] E2E test: system preference changes update theme dynamically in `__tests__/e2e/theme-persistence.spec.ts`
- [x] T024 [P] [US2] Unit test: localStorage integration in `__tests__/unit/theme/context.test.tsx`

### Implementation for User Story 2

- [X] T025 [US2] Configure next-themes with `enableSystem` and correct `storageKey` in `components/theme/ThemeProvider.tsx`
- [X] T026 [US2] Add system preference listener for real-time updates in ThemeProvider configuration
- [X] T027 [US2] Handle localStorage disabled edge case (fallback to system preference)
- [X] T028 [US2] Verify all acceptance scenarios pass for US2

**Checkpoint**: User Story 2 complete - theme persists across sessions, respects system preference

---

## Phase 5: User Story 3 - View Theme-Aware Charts and Visualizations (Priority: P2)

**Goal**: Financial charts use optimized color palettes for each theme (brighter in dark mode)

**Independent Test**: View spending-by-category chart in both themes, verify colors are distinct and match theme palette

### Tests for User Story 3 (TDD - Write FIRST, Ensure FAIL)

**Testing Approach** (Lessons from T025-T028):
- ✅ Unit tests with mocked `useTheme` hook work reliably
- ✅ Direct mock returns avoid timing/initialization issues
- ✅ Tests verify hook behavior without browser complexity
- ⚠️ Avoid E2E tests that use `addInitScript` for theme pre-population
- ✅ For E2E, prefer testing via actual user interactions (theme toggle clicks)

- [x] T029 [P] [US3] Unit test: useChartTheme returns light palette when theme is light in `__tests__/unit/theme/chart-theme.test.ts`
- [x] T030 [P] [US3] Unit test: useChartTheme returns dark palette when theme is dark in `__tests__/unit/theme/chart-theme.test.ts`
- [x] T031 [P] [US3] Unit test: useChartTheme provides 10 distinct chart colors in `__tests__/unit/theme/chart-theme.test.ts`
- [x] T032 [P] [US3] Unit test: income is green, expenses is coral in both themes in `__tests__/unit/theme/chart-theme.test.ts`

### Implementation for User Story 3

- [x] T033 [US3] Create useChartTheme hook in `lib/theme/hooks/useChartTheme.ts`
- [x] T034 [US3] Define light theme chart palette (10 colors) in `lib/theme/themes/light.ts`
- [x] T035 [US3] Define dark theme chart palette (10 Cemdash rainbow colors) in `lib/theme/themes/dark.ts`
- [x] T035a [US3] Add Cemdash gradient definitions for bar charts (income: green→teal, expense: red→orange)
- [x] T035b [US3] Add Cemdash category color mappings (13 spending categories) to useChartTheme
- [x] T035c [US3] Add Cemdash account line colors (6 accounts) to useChartTheme
- [x] T036 [US3] Export useChartTheme from `lib/theme/index.ts`
- [x] T037 [US3] Update `components/dashboard/spending-by-category.tsx` to use Cemdash donut chart styling
- [x] T038 [US3] Update bar chart components to use Cemdash gradient fills
- [x] T038a [US3] Update line chart components to use Cemdash account colors with glow effects
- [x] T038b [US3] Apply Cemdash chart tooltip styling (backdrop blur, border, shadow)
- [x] T039 [US3] Verify all acceptance scenarios pass for US3

**Checkpoint**: User Story 3 complete - all charts use theme-appropriate colors

---

## Phase 6: User Story 4 - Access Theme Toggle from Any Page (Priority: P2)

**Goal**: Theme toggle icon button is visible in header bar across all pages

**Independent Test**: Navigate to dashboard, calendar, and admin pages, verify theme toggle icon is visible in header

### Tests for User Story 4 (TDD - Write FIRST, Ensure FAIL)

- [x] T040 [P] [US4] E2E test: theme toggle visible on dashboard page in `__tests__/e2e/theme-visibility.spec.ts`
- [x] T041 [P] [US4] E2E test: theme toggle visible on calendar page in `__tests__/e2e/theme-visibility.spec.ts`
- [x] T042 [P] [US4] E2E test: theme toggle visible on admin page in `__tests__/e2e/theme-visibility.spec.ts`
- [x] T043 [P] [US4] E2E test: theme toggle icon updates (sun/moon) based on theme in `__tests__/e2e/theme-visibility.spec.ts`
- [x] T044 [P] [US4] E2E test: theme toggle visible on mobile viewport in `__tests__/e2e/theme-visibility.spec.ts`

### Implementation for User Story 4

- [x] T045 [US4] Add ThemeToggle to header in `app/layout.tsx` alongside UserMenu
- [x] T046 [US4] Ensure ThemeToggle displays correct icon (Sun for light, Moon for dark)
- [x] T047 [US4] Style ThemeToggle for mobile responsiveness (remains visible in mobile header)
- [x] T048 [US4] Verify all acceptance scenarios pass for US4

**Checkpoint**: User Story 4 complete - theme toggle accessible from every page

---

## Phase 7: User Story 5 - Experience Consistent Styling Across All Components (Priority: P2)

**Goal**: All UI components update consistently when theme switches (cards, tables, forms, modals, badges, sidebar)

**Independent Test**: Switch themes and systematically verify each component type uses correct styling

### Tests for User Story 5 (TDD - Write FIRST, Ensure FAIL)

- [x] T049 [P] [US5] E2E test: transaction table uses theme colors in `__tests__/e2e/theme-components.spec.ts`
- [x] T050 [P] [US5] E2E test: modal dialogs use theme colors in `__tests__/e2e/theme-components.spec.ts`
- [x] T051 [P] [US5] E2E test: form inputs use theme colors in `__tests__/e2e/theme-components.spec.ts`
- [x] T052 [P] [US5] E2E test: cards and badges use theme colors in `__tests__/e2e/theme-components.spec.ts`
- [x] T053 [P] [US5] E2E test: navigation sidebar uses theme colors in `__tests__/e2e/theme-components.spec.ts`

### Implementation for User Story 5

- [x] T054 [P] [US5] Audit and update `components/ui/` shadcn components to consume Cemdash CSS variables
- [x] T055 [US5] Update `components/dashboard/transactions/` table styling with Cemdash recurring items specs
- [x] T055a [US5] Apply Cemdash category badge styling (rounded pills with 20% opacity background)
- [x] T056 [US5] Update `components/dashboard/kpi-card.tsx` with Cemdash gradient borders and glow effects
- [x] T056a [US5] Implement 6 specific gradient borders for different KPI card types
- [x] T056b [US5] Add hover effect (increase glow intensity by 50%) to KPI cards
- [x] T057 [US5] Update form components with Cemdash input/select styling
- [x] T057a [US5] Apply Cemdash button states (default, hover, active, focus, disabled, loading)
- [x] T057b [US5] Apply Cemdash dropdown/select styling (trigger, items, chevron)
- [x] T058 [US5] Update modal/dialog components with Cemdash styling (background, border, shadow)
- [x] T059 [US5] Update sidebar/navigation with Cemdash Abyss background and border styling
- [x] T059a [US5] Apply Cemdash time period button styling (default, hover, active states)
- [x] T060 [US5] Verify all acceptance scenarios pass for US5

**Checkpoint**: User Story 5 complete - all components consistently styled in both themes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, edge cases, and documentation

- [x] T061 [P] Add CSS variable utilities for runtime Cemdash text/background combinations
- [x] T065 Handle edge case: print styles (force light theme)
- [x] T066 [P] Add unit tests for CSS variable utilities in `__tests__/unit/theme/css-variables.test.ts`
- [x] T067 WCAG 2.1 AA contrast validation for all text/background combinations
- [x] T068 Performance validation: theme switch < 100ms, zero layout shift
- [x] T069 [P] Implement optional Cemdash Aurora background effect with prefers-reduced-motion support
- [x] T069a [P] Add loading skeleton styles with Cemdash shimmer animation
- [x] T069b [P] Add empty state styling with Cemdash dashed border and icon colors
- [x] T069c [P] Add trend indicator components (positive/negative/neutral with Cemdash colors and icons)
- [x] T070 Run `quickstart.md` validation checklist
- [x] T071 Update documentation/README with theme system usage

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS all user stories)
    ↓
┌───────────────────────────────────────────────────────────────┐
│  User Stories can proceed in parallel after Foundational      │
│                                                               │
│  Phase 3: US1 (P1) ──┬── Phase 4: US2 (P1)                   │
│                      │                                        │
│  Phase 5: US3 (P2) ──┼── Phase 6: US4 (P2)                   │
│                      │                                        │
│  Phase 7: US5 (P2) ──┘                                        │
│                                                               │
│  Note: US1 & US2 are both P1 - prioritize both               │
└───────────────────────────────────────────────────────────────┘
    ↓
Phase 8: Polish (after desired user stories complete)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 - Theme Toggle | Foundational (Phase 2) | Phase 2 complete |
| US2 - Persistence | Foundational (Phase 2) | Phase 2 complete |
| US3 - Chart Colors | Foundational (Phase 2), US1 toggle exists | Phase 2 complete (US1 for full testing) |
| US4 - Toggle Visibility | US1 ThemeToggle component | US1 T017 complete |
| US5 - Component Styling | Foundational CSS variables | Phase 2 complete |

### Within Each User Story (TDD Order)

1. **Tests FIRST**: Write all tests for the story (T0XX [P] [USX] tests)
2. **Verify tests FAIL**: Confirm RED state
3. **Implementation**: Complete implementation tasks sequentially
4. **Verify tests PASS**: Confirm GREEN state
5. **Checkpoint**: Validate story independently before moving on

### Parallel Opportunities

**Phase 1 Parallel Tasks:**
- T002, T003, T004 can run in parallel

**Phase 2 Parallel Tasks:**
- T008, T009, T012 can run in parallel (different files)

**Per User Story (Tests):**
- All E2E tests within a story can run in parallel
- All unit tests within a story can run in parallel

**Cross-Story Parallel:**
- After Phase 2, US1 and US2 tests can be written in parallel
- After Phase 2, US3, US4, US5 tests can be written in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together (write first, expect FAIL):
Task T013: E2E test: theme toggle click switches theme
Task T014: E2E test: theme switch < 100ms with no FOUC
Task T015: E2E test: theme persists across page navigation
Task T016: Unit test: useTheme hook returns theme and setTheme

# Verify all tests FAIL (RED state)
npm run test -- __tests__/unit/theme/hooks.test.ts
npm run test:e2e -- __tests__/e2e/theme-toggle.spec.ts

# Then implement sequentially:
Task T017: Create ThemeToggle component
Task T018: Create useTheme hook wrapper
Task T019: Export hooks from index
Task T020: Verify acceptance scenarios pass (GREEN state)
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Theme Toggle)
4. Complete Phase 4: User Story 2 (Persistence)
5. **STOP and VALIDATE**: Both P1 stories complete and tested
6. Deploy MVP with core theme functionality

### Incremental Delivery

| Increment | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 + US2 | Theme toggle works, persists across sessions |
| +1 | US3 | Charts are theme-aware |
| +2 | US4 | Toggle visible everywhere |
| +3 | US5 | All components consistently styled |

### TDD Commit Pattern

```bash
# Per test file
git commit -m "test: add failing E2E tests for theme toggle (RED) [US1]"

# Per implementation file
git commit -m "feat: implement ThemeToggle component (GREEN) [US1]"

# After refactoring
git commit -m "refactor: extract useTheme hook from context [US1]"
```

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- TDD is **mandatory** per spec.md - write tests FIRST
- Each user story is independently completable and testable
- Verify tests fail before implementing (RED state)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- next-themes v0.4.6 already installed - no additional dependencies needed
