# Implementation Plan: Theme Style System

**Branch**: `003-theme-style-system` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-theme-style-system/spec.md`

## Summary

Implement a comprehensive, type-safe theming solution for the Home Finance Dashboard supporting Light and Dark themes with seamless CSS-class-based switching, localStorage persistence, system preference detection, and deep integration with shadcn/ui components, Recharts visualizations, and TanStack Table. The architecture uses CSS custom properties for runtime theme switching without React re-renders.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled  
**Primary Dependencies**: Next.js 16, React 19, next-themes 0.4.6, Tailwind CSS 4, shadcn/ui, Recharts 3.6, TanStack Table 8.21  
**Storage**: localStorage for user preference (no database required for MVP)  
**Testing**: Vitest for unit tests, Playwright for E2E acceptance scenarios  
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - IE11 excluded)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: Theme switch < 100ms, zero FOUC, zero layout shift  
**Constraints**: All text/background combinations must meet WCAG 2.1 AA (4.5:1 contrast ratio)  
**Scale/Scope**: 2 themes (Light, Dark), ~50 CSS variables, integration with existing components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence / Notes |
|-----------|--------|------------------|
| **I. Component-First Architecture** | ✅ PASS | Theme components in `components/theme/`, hooks in `lib/theme/`, provider in `app/providers.tsx`. Clear boundaries. |
| **II. Type Safety** | ✅ PASS | Full TypeScript interfaces for ThemeConfig, ThemeMode, ThemeColors. Strict mode enabled. No `any` types. |
| **III. Database-First Design** | ✅ PASS (N/A) | No database required for theme persistence. localStorage is sufficient per MVP-First. Future enhancement may add user preference to Prisma schema. |
| **IV. API Contract Clarity** | ✅ PASS | No REST API required. Contracts are React Context + hooks (`useTheme`, `useChartTheme`). TypeScript types serve as contracts. |
| **V. MVP-First, Iterate Second** | ✅ PASS | Light/Dark only. No custom themes. No database sync. localStorage-only persistence. |
| **VI. Authentication & Authorization** | ✅ PASS (N/A) | Theme preference is client-side only. No protected routes or APIs needed. Theme toggle visible to all authenticated users in header. |

**Gate Result**: ✅ ALL PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/003-theme-style-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── theme-types.ts   # TypeScript contracts for theme system
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
lib/
└── theme/
    ├── index.ts                 # Public exports
    ├── types.ts                 # TypeScript interfaces
    ├── context.tsx              # ThemeProvider, useTheme hook
    ├── themes/
    │   ├── index.ts             # Theme registry
    │   ├── light.ts             # Light theme configuration
    │   └── dark.ts              # Dark theme configuration
    ├── hooks/
    │   ├── useChartTheme.ts     # Chart-specific colors hook
    │   └── useThemeValue.ts     # Theme value accessor hooks
    └── utils/
        └── css-variables.ts     # CSS variable generation utilities

components/
└── theme/
    ├── ThemeProvider.tsx        # Provider wrapper component
    └── ThemeToggle.tsx          # Toggle button for header

app/
├── layout.tsx                   # Updated with ThemeProvider, theme toggle in header
├── providers.tsx                # Updated to include ThemeProvider
└── globals.css                  # Updated with theme CSS variables

__tests__/
├── unit/
│   └── theme/
│       ├── context.test.ts      # ThemeProvider tests
│       ├── hooks.test.ts        # useTheme, useChartTheme tests
│       └── css-variables.test.ts
└── e2e/
    └── user-story-theme.spec.ts # Theme switching E2E tests
```

**Structure Decision**: Next.js App Router web application structure. Theme system follows existing `lib/` pattern for utilities and `components/` for UI elements. Extends existing `app/providers.tsx` with ThemeProvider.

## Complexity Tracking

> No violations - all decisions align with Constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| - | - | - |

## TDD Implementation Strategy

### Red-Green-Refactor Cycle

Per Constitution Section "Testing Standards", this feature MUST follow TDD:

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD Cycle Per Story                       │
└─────────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
    │   RED   │────▶│  GREEN  │────▶│ REFACTOR │────▶│ COMMIT │
    │         │     │         │     │          │     │        │
    │ Write   │     │ Minimal │     │ Clean up │     │ feat:  │
    │ failing │     │ code to │     │ keeping  │     │ or     │
    │ test    │     │ pass    │     │ tests    │     │ test:  │
    └─────────┘     └─────────┘     │ green    │     └────────┘
                                    └──────────┘
```

### Test Plan by User Story

| Story | Priority | Test Type | Test File | Key Assertions |
|-------|----------|-----------|-----------|----------------|
| US-1: Toggle Theme | P1 | E2E | `user-story-theme.spec.ts` | Theme switches < 100ms, no FOUC, all elements update |
| US-2: Persist Preference | P1 | E2E + Unit | `user-story-theme.spec.ts`, `context.test.ts` | localStorage read/write, system preference fallback |
| US-3: Chart Colors | P2 | Unit | `hooks.test.ts` | useChartTheme returns correct palette per theme |
| US-4: Toggle Visibility | P2 | E2E | `user-story-theme.spec.ts` | Toggle visible on dashboard, calendar, admin |
| US-5: Component Consistency | P2 | E2E | `user-story-theme.spec.ts` | Cards, tables, forms, modals render correctly |

### Implementation Order (TDD)

1. **Phase 1: Core Infrastructure** (P1 Stories)
   - RED: Write E2E test for theme toggle click → theme changes
   - GREEN: Create ThemeProvider, ThemeToggle, update layout
   - REFACTOR: Extract reusable hooks
   - RED: Write E2E test for persistence across page reload
   - GREEN: Implement localStorage integration
   - REFACTOR: Clean up provider logic

2. **Phase 2: Theme Hooks** (P2 Stories)
   - RED: Write unit tests for useChartTheme
   - GREEN: Implement hook with light/dark palettes
   - REFACTOR: Memoize and optimize

3. **Phase 3: Component Integration** (P2 Stories)
   - RED: Write E2E tests for component theming
   - GREEN: Update globals.css with CSS variables
   - REFACTOR: Consolidate token definitions

### Commit Convention

```
test: add failing E2E test for theme toggle (RED)
feat: implement ThemeProvider and toggle (GREEN)
refactor: extract useTheme hook from context
```
