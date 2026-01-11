# Quickstart: Theme Style System

**Feature**: 003-theme-style-system  
**Date**: 2026-01-11

## Prerequisites

- Next.js 16+ with App Router
- Tailwind CSS 4
- next-themes 0.4.6 (already installed)
- shadcn/ui components

---

## Implementation Steps

### Step 1: Create Theme Type Definitions

Create `/lib/theme/types.ts`:

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  themes: string[];
  systemTheme: ResolvedTheme;
}
```

See [contracts/theme-types.ts](./contracts/theme-types.ts) for complete type definitions.

---

### Step 2: Create Theme Provider Wrapper

Create `/components/theme/ThemeProvider.tsx`:

```typescript
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

---

### Step 3: Create Theme Toggle Component

Create `/components/theme/ThemeToggle.tsx`:

```typescript
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Step 4: Update Providers

Modify `/app/providers.tsx` to include ThemeProvider:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

---

### Step 5: Update Root Layout

Modify `/app/layout.tsx`:

```typescript
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          <header className="...">
            <div className="container flex h-14 items-center justify-between">
              <h1>Home Dashboard</h1>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

Note: `suppressHydrationWarning` on `<html>` prevents React warnings from next-themes class injection.

---

### Step 6: Add Theme CSS Variables

Update `/app/globals.css` to include theme-specific CSS variables:

```css
:root {
  /* Existing shadcn/ui variables... */
  
  /* Cemdash Theme Variables - Light */
  --color-bg-page: #F2F4F7;
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tertiary: #F2F4F7;
  --color-bg-hover: #E5E7EB;
  --color-bg-active: #D1D5DB;
  
  --color-text-primary: #101828;
  --color-text-secondary: #344054;
  --color-text-tertiary: #667085;
  --color-text-muted: #9CA3AF;
  
  --color-accent-coral: #F97066;
  --color-accent-mint: #12B76A;
  --color-accent-teal: #14B8A6;
  --color-accent-cyan: #22D3EE;
  
  /* ... additional variables */
}

.dark {
  /* Cemdash Theme Variables - Dark */
  --color-bg-page: #050505;
  --color-bg-primary: #0A0A0A;
  --color-bg-secondary: #111111;
  --color-bg-tertiary: #1A1A1A;
  --color-bg-hover: #222222;
  --color-bg-active: #2A2A2A;
  
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #CCCCCC;
  --color-text-tertiary: #888888;
  --color-text-muted: #666666;
  
  /* Accents stay the same, but some semantic colors change */
  --color-positive: #4ADE80;
  --color-info: #60A5FA;
  
  /* ... additional variables */
}
```

See [research/theme-system-research/06-API-REFERENCE.md](../../research/theme-system-research/06-API-REFERENCE.md) for complete variable list.

---

### Step 7: Create Chart Theme Hook (Optional)

For Recharts integration, create `/lib/theme/hooks/useChartTheme.ts`:

```typescript
'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useMemo(() => ({
    palette: isDark
      ? ['#FF4444', '#00FF7F', '#1E90FF', '#FFD700', '#9370DB', 
         '#FF00FF', '#00CED1', '#FF8C00', '#00FFFF', '#ADFF2F']
      : ['#F97066', '#12B76A', '#3B82F6', '#F59E0B', '#8B5CF6',
         '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'],
    income: isDark ? '#00FF7F' : '#12B76A',
    expenses: isDark ? '#FF4444' : '#F97066',
    grid: isDark ? '#222222' : '#E5E7EB',
    axis: isDark ? '#888888' : '#667085',
    tooltip: {
      bg: isDark ? '#1A1A1A' : '#FFFFFF',
      text: isDark ? '#FFFFFF' : '#101828',
      border: isDark ? '#333333' : '#E5E7EB',
    },
  }), [isDark]);
}
```

---

## Usage Examples

### Using Theme in Components

```tsx
import { useTheme } from 'next-themes';

function MyComponent() {
  const { resolvedTheme, setTheme } = useTheme();
  
  return (
    <div className="bg-bg-primary text-text-primary">
      Current theme: {resolvedTheme}
      <button onClick={() => setTheme('dark')}>Go Dark</button>
    </div>
  );
}
```

### Using Chart Theme

```tsx
import { useChartTheme } from '@/lib/theme/hooks/useChartTheme';
import { BarChart, Bar } from 'recharts';

function MyChart({ data }) {
  const { income, expenses, grid } = useChartTheme();
  
  return (
    <BarChart data={data}>
      <CartesianGrid stroke={grid} />
      <Bar dataKey="income" fill={income} />
      <Bar dataKey="expenses" fill={expenses} />
    </BarChart>
  );
}
```

### Theme-Aware Tailwind Classes

```tsx
// These classes automatically update when theme changes
<div className="bg-bg-secondary border border-border-subtle">
  <p className="text-text-primary">Heading</p>
  <p className="text-text-secondary">Body text</p>
  <span className="text-accent-coral">Accent color</span>
</div>
```

---

## Testing

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

test('theme toggle renders', () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
  
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('theme toggle switches to dark mode', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Click theme toggle
  await page.getByRole('button', { name: /toggle theme/i }).click();
  await page.getByRole('menuitem', { name: /dark/i }).click();
  
  // Verify dark class applied
  const html = await page.$('html');
  expect(await html?.getAttribute('class')).toContain('dark');
});
```

---

## Troubleshooting

### Flash of Light Theme

If you see a flash of light theme on page load:
1. Ensure `suppressHydrationWarning` is on `<html>` element
2. Verify next-themes is v0.4.0+ (earlier versions had issues)
3. Check that ThemeProvider wraps all content

### Theme Not Persisting

1. Check localStorage in DevTools for `theme` key
2. Verify `storageKey` prop matches if customized
3. Ensure not in incognito mode (localStorage may be restricted)

### Tailwind Classes Not Updating

1. Verify Tailwind config extends colors with CSS variables
2. Check that `.dark` variant is properly configured
3. Ensure `@custom-variant dark (&:is(.dark *));` is in globals.css

---

## References

- [Feature Spec](./spec.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [Type Contracts](./contracts/theme-types.ts)
- [Architecture Research](../../research/theme-system-research/01-ARCHITECTURE.md)
