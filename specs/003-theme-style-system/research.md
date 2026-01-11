# Research: Theme Style System

**Feature**: 003-theme-style-system  
**Date**: 2026-01-11  
**Status**: Complete

## Overview

This document consolidates research findings for implementing the Theme Style System. All NEEDS CLARIFICATION items have been resolved based on existing architecture documentation and codebase analysis.

---

## Research Tasks & Findings

### 1. Theme Library Selection

**Task**: Evaluate options for theme management in Next.js App Router

**Decision**: Use `next-themes` library (already installed v0.4.6)

**Rationale**:
- Already a project dependency, no additional installation needed
- Purpose-built for Next.js with App Router support
- Handles FOUC prevention with built-in script injection
- Supports system preference detection out of the box
- Minimal footprint (~2KB)

**Alternatives Considered**:
- Custom implementation: Rejected - more code to maintain, next-themes solves common edge cases
- Theme-ui: Rejected - heavier, designed for different styling approach

---

### 2. CSS Architecture Pattern

**Task**: Determine CSS variable strategy for theme tokens

**Decision**: CSS Custom Properties with Tailwind CSS 4 integration

**Rationale**:
- CSS variables enable runtime theme switching without React re-renders
- Tailwind CSS 4 natively supports `@theme inline` for variable mapping
- Existing `globals.css` already uses this pattern with shadcn/ui
- OKLCH color space in existing setup provides perceptually uniform colors

**Implementation Pattern**:
```css
:root {
  --color-bg-page: #F2F4F7;
  /* ... light theme variables */
}

.dark {
  --color-bg-page: #050505;
  /* ... dark theme variables */
}

@theme inline {
  --color-background: var(--color-bg-page);
}
```

**Alternatives Considered**:
- CSS-in-JS (styled-components, emotion): Rejected - runtime overhead, not aligned with server components
- Tailwind theme extension only: Rejected - cannot change at runtime without rebuild

---

### 3. Color Token Structure

**Task**: Define the taxonomy of color tokens

**Decision**: Semantic token hierarchy from architecture documentation

**Token Categories** (from [01-ARCHITECTURE.md](../../research/theme-system-research/01-ARCHITECTURE.md)):

| Category | Purpose | Token Count |
|----------|---------|-------------|
| Background | Layered surfaces (page, primary, secondary, tertiary, hover, active) | 6 |
| Text | Hierarchy (primary, secondary, tertiary, muted, inverse) | 5 |
| Accent | Brand colors (coral, mint, teal, cyan) | 4 |
| Semantic | Meaning (positive, negative, warning, info) | 4 |
| Border | Definition (subtle, default, emphasis) | 3 |
| Chart | Visualization palette | 10 |
| Category | Spending categories | 13 |
| Account | Account-specific colors | 6 |
| Shadows | Depth (sm, md, lg, xl, glow variants) | 10 |
| Radius | Border radius scale | 7 |

**Total**: ~68 CSS variables per theme

---

### 4. FOUC Prevention Strategy

**Task**: Ensure theme applies before React hydration

**Decision**: Use next-themes built-in script injection

**Rationale**:
- next-themes injects a blocking script in `<head>` that reads localStorage and applies the theme class before body renders
- This is the standard solution for Next.js apps
- No custom implementation needed

**Implementation**:
```tsx
// app/layout.tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  </body>
</html>
```

The `suppressHydrationWarning` on `<html>` prevents React warnings from the class attribute being modified before hydration.

---

### 5. Theme Toggle UI Placement

**Task**: Determine optimal location for theme toggle control

**Decision**: Standalone icon button in application header bar (per spec clarification)

**Rationale**:
- User clarified: "Directly in the header bar as a standalone icon button"
- Visible on all pages without extra navigation
- Consistent with common patterns (GitHub, VS Code, etc.)
- Icon: Sun for light mode, Moon for dark mode

**Implementation**:
- Component: `components/theme/ThemeToggle.tsx`
- Integration: Add to header in `app/layout.tsx` alongside `UserMenu`

---

### 6. Chart Theme Integration

**Task**: Determine how Recharts will consume theme colors

**Decision**: Custom `useChartTheme` hook providing resolved color values

**Rationale**:
- Recharts accepts color props directly, not CSS variables
- Hook reads theme state and returns appropriate color palette
- Memoization prevents unnecessary re-renders

**Implementation Pattern** (from [04-CHARTS.md](../../research/theme-system-research/04-CHARTS.md)):
```typescript
const { palette, income, expenses, grid, axis } = useChartTheme();

<BarChart>
  <Bar dataKey="income" fill={income} />
  <Bar dataKey="expenses" fill={expenses} />
</BarChart>
```

---

### 7. TanStack Table Integration

**Task**: Apply theme styling to data tables

**Decision**: Tailwind CSS classes consuming theme variables

**Rationale**:
- TanStack Table is headless, styling is via className
- Theme variables exposed through Tailwind utility classes
- Row hover, selected, zebra striping all use CSS variables

**Implementation Pattern** (from [05-TABLES.md](../../research/theme-system-research/05-TABLES.md)):
```tsx
<tr className="hover:bg-bg-hover border-b border-border-subtle">
```

---

### 8. shadcn/ui Compatibility

**Task**: Ensure shadcn/ui components adopt theme changes

**Decision**: Map Cemdash theme variables to shadcn/ui expected variables

**Rationale**:
- shadcn/ui already uses CSS variables (--background, --foreground, etc.)
- Existing globals.css already defines these mappings
- Need to extend with additional Cemdash-specific tokens

**Current State**:
- `globals.css` has shadcn/ui variables defined for both `:root` and `.dark`
- Theme toggle will switch the `.dark` class, automatically updating shadcn components

**Required Updates**:
- Add Cemdash extended tokens (category colors, account colors, chart colors)
- Update Tailwind config to expose these via utility classes

---

### 9. Performance Benchmarks

**Task**: Validate theme switching performance requirements

**Decision**: CSS class-based switching meets <100ms requirement

**Rationale**:
- Theme switch only changes class on `<html>` element
- CSS cascade updates all variables instantly
- No React re-renders for color changes
- Only components using `useTheme` hook re-render (minimal: toggle button)

**Benchmark Approach**:
- Use `performance.now()` in E2E test before/after toggle click
- Assert elapsed time < 100ms

---

### 10. System Preference Detection

**Task**: Implement OS color scheme preference detection

**Decision**: Use next-themes `enableSystem` + `defaultTheme="system"`

**Rationale**:
- next-themes provides built-in `prefers-color-scheme` media query listener
- Automatically updates when user changes OS preference
- No custom implementation needed

**Behavior**:
1. User has no saved preference → follow OS preference
2. User explicitly selects theme → persist choice, ignore OS
3. User selects "system" → re-enable OS preference following

---

## Technology Best Practices

### next-themes Best Practices

1. **Always use `attribute="class"`** for Tailwind CSS compatibility
2. **Set `disableTransitionOnChange={false}`** for smooth theme transitions
3. **Wrap children in a mounted check** to avoid hydration mismatches
4. **Use `suppressHydrationWarning`** on html element

### Tailwind CSS 4 Theme Variables

1. **Use `@theme inline`** block to expose CSS variables to Tailwind
2. **Prefix custom colors** to avoid conflicts (e.g., `bg-`, `text-`)
3. **Extend rather than replace** existing color palette

### Accessibility Compliance

1. **Test contrast ratios** using WebAIM Contrast Checker
2. **Provide sufficient color distinction** in charts (not just hue)
3. **Don't rely on color alone** - use shape/text labels as secondary indicators

---

## Open Questions (All Resolved)

| Question | Resolution |
|----------|------------|
| Where should theme toggle be placed? | Header bar as standalone icon button (user clarification) |
| Should we use next-themes or build custom? | Use next-themes (already installed) |
| Database storage for preference? | localStorage only for MVP (Constitution: MVP-First) |
| Support for custom themes? | Not in MVP, extensibility planned for future |

---

## References

- [01-ARCHITECTURE.md](../../research/theme-system-research/01-ARCHITECTURE.md) - System architecture
- [02-IMPLEMENTATION.md](../../research/theme-system-research/02-IMPLEMENTATION.md) - Implementation guide
- [03-COMPONENTS.md](../../research/theme-system-research/03-COMPONENTS.md) - Component integration
- [04-CHARTS.md](../../research/theme-system-research/04-CHARTS.md) - Recharts theming
- [05-TABLES.md](../../research/theme-system-research/05-TABLES.md) - TanStack Table theming
- [06-API-REFERENCE.md](../../research/theme-system-research/06-API-REFERENCE.md) - Hook & utility docs
