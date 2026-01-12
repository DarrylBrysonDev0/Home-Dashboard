# Cemdash Theme System Architecture

## Overview

The Cemdash Theme System provides a comprehensive, type-safe theming solution for the Home Finance Dashboard. It supports multiple themes (Light, Dark, and extensible custom themes) with seamless transitions, persistent user preferences, and deep integration with all UI components including charts and data visualizations.

---

## Design Principles

### 1. CSS Custom Properties First
All theme values are defined as CSS custom properties (variables), enabling runtime theme switching without JavaScript re-renders of styled components.

### 2. Type Safety Throughout
TypeScript interfaces ensure theme configurations are complete and correctly typed, catching missing values at compile time.

### 3. Component Isolation
Each component consumes theme tokens, not raw values. This allows global theme changes to propagate automatically.

### 4. Performance Optimized
Theme switching occurs via CSS class changes on the root element, avoiding React re-renders for color changes.

### 5. Accessibility Aware
All theme combinations maintain WCAG 2.1 AA contrast ratios. System preference detection (`prefers-color-scheme`) is supported.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Theme System Architecture                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Theme Config   │     │  Theme Context  │     │  Theme Storage  │
│  (TypeScript)   │────▶│    (React)      │◀───▶│  (localStorage) │
│                 │     │                 │     │                 │
│ • Light Theme   │     │ • Current theme │     │ • User pref     │
│ • Dark Theme    │     │ • Toggle fn     │     │ • System sync   │
│ • Custom Themes │     │ • System pref   │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CSS Custom Properties Layer                          │
│                                                                              │
│  :root (Light)              .dark (Dark)              .theme-* (Custom)     │
│  ├─ --color-bg-*            ├─ --color-bg-*           ├─ --color-bg-*       │
│  ├─ --color-text-*          ├─ --color-text-*         ├─ --color-text-*     │
│  ├─ --color-accent-*        ├─ --color-accent-*       ├─ --color-accent-*   │
│  ├─ --color-chart-*         ├─ --color-chart-*        ├─ --color-chart-*    │
│  └─ --shadow-*, --radius-*  └─ --shadow-*, --radius-* └─ --shadow-*, etc.   │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Component Consumption                             │
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │   shadcn/ui   │  │   Recharts    │  │ TanStack Table│  │    Custom    │  │
│  │  Components   │  │    Charts     │  │               │  │  Components  │  │
│  │               │  │               │  │               │  │              │  │
│  │ Uses Tailwind │  │ Uses theme    │  │ Uses theme    │  │ Uses CSS     │  │
│  │ CSS variables │  │ hook for      │  │ classes       │  │ variables    │  │
│  │ via classes   │  │ color values  │  │               │  │ directly     │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Integration

| Technology | Theme Integration Method |
|------------|-------------------------|
| **Next.js 14+** | App Router with `ThemeProvider` in root layout |
| **TypeScript** | Strict theme type definitions and inference |
| **Tailwind CSS** | Extended with CSS variable references |
| **shadcn/ui** | Native CSS variable support, no modifications needed |
| **Recharts** | Custom `useChartTheme` hook providing color arrays |
| **TanStack Table** | Theme-aware row/cell className functions |
| **Prisma/MSSQL** | User preference storage (optional) |

---

## File Structure

```
src/
├── lib/
│   └── theme/
│       ├── index.ts                 # Public exports
│       ├── types.ts                 # TypeScript interfaces
│       ├── themes/
│       │   ├── light.ts             # Light theme config
│       │   ├── dark.ts              # Dark theme config
│       │   └── index.ts             # Theme registry
│       ├── context.tsx              # React context provider
│       ├── hooks/
│       │   ├── useTheme.ts          # Main theme hook
│       │   ├── useChartTheme.ts     # Chart-specific colors
│       │   └── useSystemTheme.ts    # System preference detection
│       └── utils/
│           ├── css-variables.ts     # CSS variable helpers
│           └── color-utils.ts       # Color manipulation
├── styles/
│   ├── globals.css                  # Base styles + CSS variables
│   └── themes/
│       ├── light.css                # Light theme variables
│       └── dark.css                 # Dark theme variables
├── components/
│   └── theme/
│       ├── ThemeProvider.tsx        # Provider component
│       ├── ThemeToggle.tsx          # Toggle button component
│       └── ThemeSelect.tsx          # Dropdown selector
└── app/
    └── layout.tsx                   # Root layout with provider
```

---

## Theme Token Categories

### 1. Background Colors
Layered background system for depth and hierarchy.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-bg-page` | `#F2F4F7` | `#050505` | Page background |
| `--color-bg-primary` | `#FFFFFF` | `#0A0A0A` | Primary surfaces |
| `--color-bg-secondary` | `#F9FAFB` | `#111111` | Cards, elevated |
| `--color-bg-tertiary` | `#F2F4F7` | `#1A1A1A` | Sidebar, panels |
| `--color-bg-hover` | `#E5E7EB` | `#222222` | Hover states |
| `--color-bg-active` | `#D1D5DB` | `#2A2A2A` | Active states |

### 2. Text Colors
Hierarchical text system for readability.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-text-primary` | `#101828` | `#FFFFFF` | Headings, emphasis |
| `--color-text-secondary` | `#344054` | `#CCCCCC` | Body text |
| `--color-text-tertiary` | `#667085` | `#888888` | Captions, hints |
| `--color-text-muted` | `#9CA3AF` | `#666666` | Disabled, subtle |
| `--color-text-inverse` | `#FFFFFF` | `#101828` | On accent backgrounds |

### 3. Accent Colors
Brand and semantic colors (consistent across themes).

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-accent-coral` | `#F97066` | Primary accent, negative |
| `--color-accent-mint` | `#12B76A` | Positive, success |
| `--color-accent-teal` | `#14B8A6` | Secondary accent |
| `--color-accent-cyan` | `#22D3EE` | Info, highlights |

### 4. Semantic Colors
Contextual meaning colors.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-positive` | `#12B76A` | `#4ADE80` | Income, success |
| `--color-negative` | `#F97066` | `#F97066` | Expenses, errors |
| `--color-warning` | `#F59E0B` | `#FBBF24` | Warnings, alerts |
| `--color-info` | `#3B82F6` | `#60A5FA` | Information |

### 5. Border Colors
Separation and definition.

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--color-border-subtle` | `#E5E7EB` | `#222222` | Subtle dividers |
| `--color-border-default` | `#D0D5DD` | `#333333` | Standard borders |
| `--color-border-emphasis` | `#9CA3AF` | `#444444` | Emphasized borders |

### 6. Chart Colors
Visualization palette (10 colors for multi-series).

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-chart-1` | `#F97066` | `#FF4444` | Series 1 / Expenses |
| `--color-chart-2` | `#12B76A` | `#00FF7F` | Series 2 / Income |
| `--color-chart-3` | `#3B82F6` | `#1E90FF` | Series 3 |
| `--color-chart-4` | `#F59E0B` | `#FFD700` | Series 4 |
| `--color-chart-5` | `#8B5CF6` | `#9370DB` | Series 5 |
| `--color-chart-6` | `#EC4899` | `#FF00FF` | Series 6 |
| `--color-chart-7` | `#14B8A6` | `#00CED1` | Series 7 |
| `--color-chart-8` | `#F97316` | `#FF8C00` | Series 8 |
| `--color-chart-9` | `#06B6D4` | `#00FFFF` | Series 9 |
| `--color-chart-10` | `#84CC16` | `#ADFF2F` | Series 10 |

### 7. Shadow & Effects

| Token | Light | Dark |
|-------|-------|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.5)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | `0 4px 6px rgba(0,0,0,0.6)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 10px 15px rgba(0,0,0,0.7)` |
| `--shadow-glow-accent` | `none` | `0 0 20px rgba(249,112,102,0.4)` |

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            Theme Initialization                           │
└──────────────────────────────────────────────────────────────────────────┘

1. Page Load
   │
   ├─▶ Check localStorage for saved preference
   │   │
   │   ├─▶ Found: Apply saved theme
   │   │
   │   └─▶ Not Found: Check system preference
   │       │
   │       ├─▶ prefers-color-scheme: dark → Apply dark theme
   │       │
   │       └─▶ Default → Apply light theme
   │
   ▼
2. Apply Theme
   │
   ├─▶ Add theme class to <html> element (e.g., class="dark")
   │
   ├─▶ CSS variables automatically update via cascade
   │
   └─▶ All components inherit new values instantly
   
   
┌──────────────────────────────────────────────────────────────────────────┐
│                            Theme Toggle Flow                              │
└──────────────────────────────────────────────────────────────────────────┘

User clicks toggle
   │
   ├─▶ ThemeContext.setTheme(newTheme)
   │
   ├─▶ Update <html> class attribute
   │
   ├─▶ Persist to localStorage
   │
   └─▶ (Optional) Sync to database via API
```

---

## Performance Considerations

### What's Fast
- **CSS Variable Updates**: Changing the class on `<html>` triggers a style recalculation, but no React re-renders
- **No Flash of Unstyled Content (FOUC)**: Theme script runs before React hydration
- **Minimal Bundle Size**: Theme definitions are small TypeScript objects

### What to Avoid
- ❌ Storing colors in React state (causes re-renders)
- ❌ Inline styles with theme values (can't update without re-render)
- ❌ Importing large color libraries (use CSS variables instead)

### Optimizations Implemented
- Theme script injected in `<head>` before body renders
- CSS variables scoped to avoid specificity conflicts
- Chart colors accessed via hook with memoization
- Lazy loading of theme selector component

---

## Browser Support

| Feature | Support |
|---------|---------|
| CSS Custom Properties | All modern browsers (IE11 excluded) |
| `prefers-color-scheme` | Chrome 76+, Firefox 67+, Safari 12.1+ |
| `localStorage` | Universal |
| `matchMedia` listener | Universal |

---

## Next Steps

1. **[Implementation Guide](./02-IMPLEMENTATION.md)** - Step-by-step setup instructions
2. **[Component Integration](./03-COMPONENTS.md)** - shadcn/ui and custom components
3. **[Chart Theming](./04-CHARTS.md)** - Recharts integration
4. **[Table Theming](./05-TABLES.md)** - TanStack Table integration
5. **[API Reference](./06-API-REFERENCE.md)** - Hooks and utilities documentation
