# Data Model: Theme Style System

**Feature**: 003-theme-style-system  
**Date**: 2026-01-11  
**Status**: Design Complete

## Overview

The Theme Style System uses client-side state management with no database entities. This document defines the TypeScript entities, their relationships, and state transitions.

---

## Entities

### 1. ThemeMode

Represents the user's theme preference selection.

| Field | Type | Description |
|-------|------|-------------|
| value | `'light' \| 'dark' \| 'system'` | The selected theme mode |

**Validation Rules**:
- Must be one of exactly three values: 'light', 'dark', or 'system'
- No null or undefined allowed

**Persistence**: localStorage under key `cemdash-theme`

---

### 2. ThemeConfig

A complete theme definition with all visual properties.

| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Unique identifier (e.g., 'light', 'dark') |
| label | `string` | Display name (e.g., 'Light', 'Dark') |
| colors | `ThemeColors` | All color tokens |
| shadows | `ThemeShadows` | Shadow definitions |
| radius | `ThemeRadius` | Border radius scale |

**Validation Rules**:
- Name must be unique across all themes
- All nested objects must be complete (no partial definitions)

**State**: Static configuration objects, defined at build time

---

### 3. ThemeColors

Complete color palette for a theme.

```typescript
interface ThemeColors {
  bg: {
    page: string;      // Page background
    primary: string;   // Primary surface (cards, dialogs)
    secondary: string; // Elevated surfaces
    tertiary: string;  // Sidebar, panels
    hover: string;     // Hover state
    active: string;    // Active/pressed state
  };
  
  text: {
    primary: string;   // Headings, emphasis
    secondary: string; // Body text
    tertiary: string;  // Captions, hints
    muted: string;     // Disabled, subtle
    inverse: string;   // On accent backgrounds
  };
  
  accent: {
    coral: string;      // Primary accent
    coralHover: string; // Coral hover state
    mint: string;       // Success, positive
    mintHover: string;  // Mint hover state
    teal: string;       // Secondary accent
    cyan: string;       // Info, highlights
  };
  
  semantic: {
    positive: string;  // Income, success
    negative: string;  // Expenses, errors
    warning: string;   // Alerts
    info: string;      // Information
  };
  
  border: {
    subtle: string;    // Subtle dividers
    default: string;   // Standard borders
    emphasis: string;  // Emphasized borders
  };
  
  chart: [string, string, string, string, string, 
          string, string, string, string, string]; // 10 colors
  
  category: {
    charity: string;
    daily: string;
    dining: string;
    entertainment: string;
    gifts: string;
    groceries: string;
    healthcare: string;
    financing: string;
    shopping: string;
    subscriptions: string;
    transportation: string;
    travel: string;
    utilities: string;
  };
  
  account: {
    jointChecking: string;
    jointSavings: string;
    user1Checking: string;
    user1Savings: string;
    user2Checking: string;
    user2Savings: string;
  };
}
```

**Validation Rules**:
- All color values must be valid hex colors (`#RRGGBB` or `#RGB`)
- Chart array must have exactly 10 elements
- All 13 category keys must be present
- All 6 account keys must be present

---

### 4. ThemeShadows

Shadow definitions for depth perception.

```typescript
interface ThemeShadows {
  sm: string;     // Subtle elevation
  md: string;     // Card elevation
  lg: string;     // Modal elevation
  xl: string;     // Dropdown elevation
  inner: string;  // Inset shadow
  glow: {
    coral: string;  // Coral glow effect
    mint: string;   // Mint glow effect
    teal: string;   // Teal glow effect
    cyan: string;   // Cyan glow effect
    white: string;  // White glow effect
  };
}
```

**Validation Rules**:
- All values must be valid CSS box-shadow strings
- Glow shadows may be 'none' in light theme

---

### 5. ThemeRadius

Border radius scale.

```typescript
interface ThemeRadius {
  none: string;  // 0px
  sm: string;    // 4px
  md: string;    // 8px
  lg: string;    // 12px
  xl: string;    // 16px
  '2xl': string; // 24px
  full: string;  // 9999px
}
```

**Validation Rules**:
- All values must be valid CSS length values

---

### 6. ThemeContextValue

Runtime state exposed by ThemeProvider.

```typescript
interface ThemeContextValue {
  theme: ThemeMode;                    // Current setting
  resolvedTheme: 'light' | 'dark';     // Actual applied theme
  setTheme: (theme: ThemeMode) => void; // Change theme
  themes: string[];                     // Available themes
  systemTheme: 'light' | 'dark';       // OS preference
}
```

**State Transitions**:
- `setTheme('light')` → resolvedTheme becomes 'light'
- `setTheme('dark')` → resolvedTheme becomes 'dark'
- `setTheme('system')` → resolvedTheme follows systemTheme

---

### 7. ChartThemeColors

Chart-specific color values for Recharts integration.

```typescript
interface ChartThemeColors {
  palette: string[];  // Array of 10 chart colors
  income: string;     // Positive/income color
  expenses: string;   // Negative/expense color
  categories: Record<string, string>; // Category → color
  accounts: Record<string, string>;   // Account → color
  grid: string;       // Grid line color
  axis: string;       // Axis label color
  tooltip: {
    bg: string;       // Tooltip background
    text: string;     // Tooltip text
    border: string;   // Tooltip border
  };
  gradients: {
    income: [string, string];   // Gradient start/end
    expenses: [string, string]; // Gradient start/end
  };
}
```

---

## State Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Theme State Machine                          │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │     Page Load        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Read localStorage    │
                    │ key: 'cemdash-theme' │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │  'light'   │  │   'dark'   │  │  'system'  │
       └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
             │               │               │
             ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────────┐
       │ Apply      │  │ Apply      │  │ Read           │
       │ .light     │  │ .dark      │  │ prefers-color- │
       │ class      │  │ class      │  │ scheme         │
       └────────────┘  └────────────┘  └───────┬────────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                    ▼                     ▼
                             ┌────────────┐        ┌────────────┐
                             │ OS: light  │        │ OS: dark   │
                             │ → .light   │        │ → .dark    │
                             └────────────┘        └────────────┘

                    ┌──────────────────────┐
                    │   User Toggles Theme │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ Light →    │  │ Dark →     │  │ System →   │
       │ Save 'dark'│  │ Save       │  │ Save       │
       │            │  │ 'system'   │  │ 'light'    │
       └────────────┘  └────────────┘  └────────────┘
             │               │               │
             ▼               ▼               ▼
       Update localStorage & Apply new class
```

---

## Relationships

```
ThemeContextValue
       │
       ├── theme: ThemeMode (user selection)
       │
       ├── resolvedTheme ────────────► ThemeConfig (light or dark)
       │                                    │
       │                                    ├── colors: ThemeColors
       │                                    ├── shadows: ThemeShadows
       │                                    └── radius: ThemeRadius
       │
       └── (derived via useChartTheme) ──► ChartThemeColors
```

---

## Storage

### localStorage Schema

| Key | Value Type | Example |
|-----|------------|---------|
| `cemdash-theme` | `ThemeMode` | `"dark"` |

### No Database Storage

Per Constitution Principle V (MVP-First), theme preference is stored client-side only. Future enhancement may add optional sync to user profile:

```prisma
// FUTURE: Not for MVP
model User {
  // ... existing fields
  themePreference String? @default("system") // 'light' | 'dark' | 'system'
}
```

---

## Validation Summary

| Entity | Validation Method |
|--------|------------------|
| ThemeMode | TypeScript union type enforcement |
| ThemeConfig | TypeScript interface completeness check at compile time |
| ThemeColors | Type checking + runtime hex color validation (optional) |
| localStorage | Fallback to 'system' if invalid value stored |
