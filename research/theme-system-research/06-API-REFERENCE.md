# API Reference

Complete documentation for all theme system hooks, utilities, and types.

---

## Hooks

### `useTheme`

The primary hook for accessing and controlling the current theme.

```typescript
import { useTheme } from '@/lib/theme';

const {
  theme,           // 'light' | 'dark' | 'system'
  resolvedTheme,   // 'light' | 'dark' (actual theme being used)
  setTheme,        // (theme: ThemeMode) => void
  themes,          // string[] - available theme names
  systemTheme,     // 'light' | 'dark' - OS preference
} = useTheme();
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | Current theme setting |
| `resolvedTheme` | `'light' \| 'dark'` | Actual applied theme |
| `setTheme` | `(theme: ThemeMode) => void` | Function to change theme |
| `themes` | `string[]` | List of available themes |
| `systemTheme` | `'light' \| 'dark'` | Operating system preference |

#### Example Usage

```typescript
function ThemeButton() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button onClick={toggleTheme}>
      Current: {theme} (Resolved: {resolvedTheme})
    </button>
  );
}
```

---

### `useChartTheme`

Hook for accessing chart-specific colors that update with theme changes.

```typescript
import { useChartTheme } from '@/lib/theme';

const {
  palette,      // string[] - 10 chart colors
  income,       // string - income/positive color
  expenses,     // string - expenses/negative color
  categories,   // Record<string, string> - category colors
  accounts,     // Record<string, string> - account colors
  grid,         // string - grid line color
  axis,         // string - axis label color
  tooltip,      // { background, border, text } - tooltip colors
  gradients,    // { income, expenses } - gradient color pairs
} = useChartTheme();
```

#### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `palette` | `string[]` | Array of 10 chart colors for multi-series |
| `income` | `string` | Color for income/positive values |
| `expenses` | `string` | Color for expense/negative values |
| `categories` | `Record<string, string>` | Category name to color mapping |
| `accounts` | `Record<string, string>` | Account name to color mapping |
| `grid` | `string` | Grid line color |
| `axis` | `string` | Axis label color |
| `tooltip` | `TooltipColors` | Tooltip styling object |
| `gradients` | `GradientColors` | Gradient start/end pairs |

#### Example Usage

```typescript
function MyChart({ data }) {
  const { palette, grid, axis } = useChartTheme();

  return (
    <LineChart data={data}>
      <CartesianGrid stroke={grid} />
      <XAxis tick={{ fill: axis }} />
      <Line stroke={palette[0]} />
      <Line stroke={palette[1]} />
    </LineChart>
  );
}
```

---

### `useThemeConfig`

Hook for accessing the full theme configuration object.

```typescript
import { useThemeConfig } from '@/lib/theme';

const config = useThemeConfig();
// Returns: ThemeConfig object with colors, shadows, radius
```

#### Return Value

Returns the complete `ThemeConfig` object for the current theme.

#### Example Usage

```typescript
function DebugTheme() {
  const config = useThemeConfig();
  
  return (
    <pre className="text-xs">
      {JSON.stringify(config.colors.accent, null, 2)}
    </pre>
  );
}
```

---

### `useThemeColor`

Hook for accessing a specific color value by path.

```typescript
import { useThemeColor } from '@/lib/theme';

const coralColor = useThemeColor('accent.coral');
const bgColor = useThemeColor('bg.secondary');
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Dot-notation path to color (e.g., 'accent.coral') |

#### Return Value

Returns the hex color string for the specified path.

#### Example Usage

```typescript
function CustomComponent() {
  const highlightColor = useThemeColor('accent.coral');
  
  return (
    <div style={{ borderColor: highlightColor }}>
      Highlighted content
    </div>
  );
}
```

---

## Components

### `ThemeProvider`

Context provider that must wrap your application.

```typescript
import { ThemeProvider } from '@/lib/theme';

<ThemeProvider
  defaultTheme="system"    // Initial theme: 'light' | 'dark' | 'system'
  storageKey="my-theme"    // localStorage key (default: 'cemdash-theme')
  enableSystem={true}      // Enable system preference detection
>
  {children}
</ThemeProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | App content |
| `defaultTheme` | `ThemeMode` | `'system'` | Initial theme |
| `storageKey` | `string` | `'cemdash-theme'` | localStorage key |
| `enableSystem` | `boolean` | `true` | Listen to OS preference |

---

### `ThemeToggle`

Pre-built toggle button with dropdown menu.

```typescript
import { ThemeToggle } from '@/components/theme/ThemeToggle';

<ThemeToggle />
```

Renders a button that opens a dropdown with Light, Dark, and System options.

---

## Types

### `ThemeMode`

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
```

### `ThemeConfig`

```typescript
interface ThemeConfig {
  name: string;
  label: string;
  colors: ThemeColors;
  shadows: ThemeShadows;
  radius: ThemeRadius;
}
```

### `ThemeColors`

```typescript
interface ThemeColors {
  bg: {
    page: string;
    primary: string;
    secondary: string;
    tertiary: string;
    hover: string;
    active: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    inverse: string;
  };
  accent: {
    coral: string;
    coralHover: string;
    mint: string;
    mintHover: string;
    teal: string;
    cyan: string;
  };
  semantic: {
    positive: string;
    negative: string;
    warning: string;
    info: string;
  };
  border: {
    subtle: string;
    default: string;
    emphasis: string;
  };
  chart: [string, string, string, string, string, string, string, string, string, string];
  category: Record<CategoryKey, string>;
  account: Record<AccountKey, string>;
}
```

### `ThemeShadows`

```typescript
interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
  glow: {
    coral: string;
    mint: string;
    teal: string;
    cyan: string;
    white: string;
  };
}
```

### `ThemeRadius`

```typescript
interface ThemeRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}
```

### `ThemeContextValue`

```typescript
interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  themes: string[];
  systemTheme: 'light' | 'dark';
}
```

---

## Utilities

### `generateCSSVariables`

Generates CSS custom property declarations from a theme config.

```typescript
import { generateCSSVariables } from '@/lib/theme';

const cssText = generateCSSVariables(darkTheme);
// Returns: string of CSS variable declarations
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | `ThemeConfig` | Theme configuration object |

#### Return Value

Returns a string containing CSS custom property declarations.

---

### `hexToRgb`

Converts a hex color to RGB values for use with `rgba()`.

```typescript
import { hexToRgb } from '@/lib/theme';

const rgb = hexToRgb('#F97066');
// Returns: '249, 112, 102'

// Usage in CSS
const style = {
  backgroundColor: `rgba(${rgb}, 0.5)`
};
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `hex` | `string` | Hex color string (with or without #) |

#### Return Value

Returns a string of comma-separated RGB values.

---

## CSS Variables Reference

### Background Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--color-bg-page` | `#F2F4F7` | `#050505` |
| `--color-bg-primary` | `#FFFFFF` | `#0A0A0A` |
| `--color-bg-secondary` | `#F9FAFB` | `#111111` |
| `--color-bg-tertiary` | `#F2F4F7` | `#1A1A1A` |
| `--color-bg-hover` | `#E5E7EB` | `#222222` |
| `--color-bg-active` | `#D1D5DB` | `#2A2A2A` |

### Text Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--color-text-primary` | `#101828` | `#FFFFFF` |
| `--color-text-secondary` | `#344054` | `#CCCCCC` |
| `--color-text-tertiary` | `#667085` | `#888888` |
| `--color-text-muted` | `#9CA3AF` | `#666666` |
| `--color-text-inverse` | `#FFFFFF` | `#101828` |

### Accent Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--color-accent-coral` | `#F97066` | `#F97066` |
| `--color-accent-coral-hover` | `#EF4444` | `#FF8A80` |
| `--color-accent-mint` | `#12B76A` | `#12B76A` |
| `--color-accent-mint-hover` | `#059669` | `#4ADE80` |
| `--color-accent-teal` | `#14B8A6` | `#14B8A6` |
| `--color-accent-cyan` | `#22D3EE` | `#22D3EE` |

### Semantic Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--color-positive` | `#12B76A` | `#4ADE80` |
| `--color-negative` | `#F97066` | `#F97066` |
| `--color-warning` | `#F59E0B` | `#FBBF24` |
| `--color-info` | `#3B82F6` | `#60A5FA` |

### Border Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--color-border-subtle` | `#E5E7EB` | `#222222` |
| `--color-border-default` | `#D0D5DD` | `#333333` |
| `--color-border-emphasis` | `#9CA3AF` | `#444444` |

### Chart Colors

| Variable | Light | Dark |
|----------|-------|------|
| `--color-chart-1` | `#F97066` | `#FF4444` |
| `--color-chart-2` | `#12B76A` | `#00FF7F` |
| `--color-chart-3` | `#3B82F6` | `#1E90FF` |
| `--color-chart-4` | `#F59E0B` | `#FFD700` |
| `--color-chart-5` | `#8B5CF6` | `#9370DB` |
| `--color-chart-6` | `#EC4899` | `#FF00FF` |
| `--color-chart-7` | `#14B8A6` | `#00CED1` |
| `--color-chart-8` | `#F97316` | `#FF8C00` |
| `--color-chart-9` | `#06B6D4` | `#00FFFF` |
| `--color-chart-10` | `#84CC16` | `#ADFF2F` |

### Shadows

| Variable | Light | Dark |
|----------|-------|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.5)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | `0 4px 6px rgba(0,0,0,0.6)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `0 10px 15px rgba(0,0,0,0.7)` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | `0 20px 25px rgba(0,0,0,0.8)` |
| `--shadow-glow-coral` | `none` | `0 0 20px rgba(249,112,102,0.4)` |
| `--shadow-glow-mint` | `none` | `0 0 20px rgba(18,183,106,0.4)` |
| `--shadow-glow-teal` | `none` | `0 0 20px rgba(20,184,166,0.4)` |
| `--shadow-glow-cyan` | `none` | `0 0 20px rgba(34,211,238,0.4)` |

### Border Radius

| Variable | Value |
|----------|-------|
| `--radius-none` | `0px` |
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-2xl` | `24px` |
| `--radius-full` | `9999px` |

---

## Tailwind Classes Reference

### Background Classes

| Class | Maps To |
|-------|---------|
| `bg-bg-page` | `var(--color-bg-page)` |
| `bg-bg-primary` | `var(--color-bg-primary)` |
| `bg-bg-secondary` | `var(--color-bg-secondary)` |
| `bg-bg-tertiary` | `var(--color-bg-tertiary)` |
| `bg-bg-hover` | `var(--color-bg-hover)` |
| `bg-bg-active` | `var(--color-bg-active)` |

### Text Classes

| Class | Maps To |
|-------|---------|
| `text-text-primary` | `var(--color-text-primary)` |
| `text-text-secondary` | `var(--color-text-secondary)` |
| `text-text-tertiary` | `var(--color-text-tertiary)` |
| `text-text-muted` | `var(--color-text-muted)` |
| `text-text-inverse` | `var(--color-text-inverse)` |

### Accent Classes

| Class | Maps To |
|-------|---------|
| `text-accent-coral` | `var(--color-accent-coral)` |
| `bg-accent-coral` | `var(--color-accent-coral)` |
| `border-accent-coral` | `var(--color-accent-coral)` |
| `text-accent-mint` | `var(--color-accent-mint)` |
| `text-accent-teal` | `var(--color-accent-teal)` |
| `text-accent-cyan` | `var(--color-accent-cyan)` |

### Semantic Classes

| Class | Maps To |
|-------|---------|
| `text-positive` | `var(--color-positive)` |
| `text-negative` | `var(--color-negative)` |
| `text-warning` | `var(--color-warning)` |
| `text-info` | `var(--color-info)` |

### Border Classes

| Class | Maps To |
|-------|---------|
| `border-border` | `var(--color-border-default)` |
| `border-border-subtle` | `var(--color-border-subtle)` |
| `border-border-emphasis` | `var(--color-border-emphasis)` |

### Shadow Classes

| Class | Maps To |
|-------|---------|
| `shadow-sm` | `var(--shadow-sm)` |
| `shadow-md` | `var(--shadow-md)` |
| `shadow-lg` | `var(--shadow-lg)` |
| `shadow-xl` | `var(--shadow-xl)` |
| `shadow-glow-coral` | `var(--shadow-glow-coral)` |
| `shadow-glow-mint` | `var(--shadow-glow-mint)` |

### Category Classes

| Class Pattern | Example |
|---------------|---------|
| `bg-category-{name}` | `bg-category-dining` |
| `text-category-{name}` | `text-category-dining` |
| `border-category-{name}` | `border-category-dining` |

Available categories: `charity`, `daily`, `dining`, `entertainment`, `gifts`, `groceries`, `healthcare`, `financing`, `shopping`, `subscriptions`, `transportation`, `travel`, `utilities`

---

## Adding Custom Themes

To add a new theme:

1. Create a new theme config file:

```typescript
// src/lib/theme/themes/midnight.ts
import { ThemeConfig } from '../types';

export const midnightTheme: ThemeConfig = {
  name: 'midnight',
  label: 'Midnight',
  colors: {
    bg: {
      page: '#0F172A',
      primary: '#1E293B',
      // ... rest of colors
    },
    // ... rest of config
  },
  shadows: { /* ... */ },
  radius: { /* ... */ },
};
```

2. Register in the themes index:

```typescript
// src/lib/theme/themes/index.ts
import { midnightTheme } from './midnight';

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  midnight: midnightTheme,
};
```

3. Add CSS variables for the new theme:

```css
/* src/styles/globals.css */
.midnight {
  --color-bg-page: #0F172A;
  --color-bg-primary: #1E293B;
  /* ... rest of variables */
}
```

4. Update the `ThemeMode` type if needed:

```typescript
type ThemeMode = 'light' | 'dark' | 'midnight' | 'system';
```

---

## Troubleshooting

### Theme not persisting on refresh

Ensure the script in `layout.tsx` runs before React hydration:

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `(function() { /* theme init script */ })();`
    }}
  />
</head>
```

### Flash of wrong theme (FOUC)

1. Check that `suppressHydrationWarning` is on `<html>`
2. Verify the theme script runs in `<head>`
3. Ensure no async loading of theme CSS

### Chart colors not updating

Make sure you're using the `useChartTheme` hook and not hardcoded values:

```typescript
// ❌ Wrong
<Bar fill="#F97066" />

// ✅ Correct
const { expenses } = useChartTheme();
<Bar fill={expenses} />
```

### Tailwind classes not working

Verify `tailwind.config.ts` has the extended colors:

```typescript
theme: {
  extend: {
    colors: {
      bg: {
        page: 'var(--color-bg-page)',
        // ...
      }
    }
  }
}
```

### System preference not detected

Check that `enableSystem` is true in `ThemeProvider`:

```tsx
<ThemeProvider enableSystem={true}>
```
