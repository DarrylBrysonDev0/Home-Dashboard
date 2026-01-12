# Theme System Implementation Guide

## Prerequisites

Ensure your project has the following dependencies installed:

```bash
# Core dependencies (should already exist)
npm install next@14 react@18 typescript tailwindcss

# shadcn/ui (if not already set up)
npx shadcn-ui@latest init
```

---

## Step 1: Define Theme Types

Create the TypeScript interfaces that define the structure of a theme.

### `src/lib/theme/types.ts`

```typescript
/**
 * Theme System Type Definitions
 * 
 * These interfaces ensure type safety across all theme configurations
 * and provide excellent IDE autocompletion.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background layers (6 levels of depth)
  bg: {
    page: string;
    primary: string;
    secondary: string;
    tertiary: string;
    hover: string;
    active: string;
  };

  // Text hierarchy
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
    inverse: string;
  };

  // Brand accents (consistent across themes)
  accent: {
    coral: string;
    coralHover: string;
    mint: string;
    mintHover: string;
    teal: string;
    cyan: string;
  };

  // Semantic colors
  semantic: {
    positive: string;
    negative: string;
    warning: string;
    info: string;
  };

  // Border colors
  border: {
    subtle: string;
    default: string;
    emphasis: string;
  };

  // Chart palette (10 colors for multi-series)
  chart: [string, string, string, string, string, string, string, string, string, string];

  // Category-specific colors (for spending categories)
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

  // Account-specific colors (for line charts)
  account: {
    jointChecking: string;
    jointSavings: string;
    user1Checking: string;
    user1Savings: string;
    user2Checking: string;
    user2Savings: string;
  };
}

export interface ThemeShadows {
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

export interface ThemeRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface ThemeConfig {
  name: string;
  label: string;
  colors: ThemeColors;
  shadows: ThemeShadows;
  radius: ThemeRadius;
}

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  themes: string[];
  systemTheme: 'light' | 'dark';
}
```

---

## Step 2: Create Theme Configurations

### `src/lib/theme/themes/light.ts`

```typescript
import { ThemeConfig } from '../types';

export const lightTheme: ThemeConfig = {
  name: 'light',
  label: 'Light',
  colors: {
    bg: {
      page: '#F2F4F7',
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F2F4F7',
      hover: '#E5E7EB',
      active: '#D1D5DB',
    },
    text: {
      primary: '#101828',
      secondary: '#344054',
      tertiary: '#667085',
      muted: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    accent: {
      coral: '#F97066',
      coralHover: '#EF4444',
      mint: '#12B76A',
      mintHover: '#059669',
      teal: '#14B8A6',
      cyan: '#22D3EE',
    },
    semantic: {
      positive: '#12B76A',
      negative: '#F97066',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    border: {
      subtle: '#E5E7EB',
      default: '#D0D5DD',
      emphasis: '#9CA3AF',
    },
    chart: [
      '#F97066', // Coral - Expenses
      '#12B76A', // Mint - Income
      '#3B82F6', // Blue
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ],
    category: {
      charity: '#60A5FA',
      daily: '#34D399',
      dining: '#FBBF24',
      entertainment: '#F97066',
      gifts: '#A78BFA',
      groceries: '#4ADE80',
      healthcare: '#FB7185',
      financing: '#38BDF8',
      shopping: '#C084FC',
      subscriptions: '#2DD4BF',
      transportation: '#FB923C',
      travel: '#FACC15',
      utilities: '#818CF8',
    },
    account: {
      jointChecking: '#12B76A',
      jointSavings: '#14B8A6',
      user1Checking: '#F59E0B',
      user1Savings: '#F97316',
      user2Checking: '#8B5CF6',
      user2Savings: '#EC4899',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    glow: {
      coral: 'none',
      mint: 'none',
      teal: 'none',
      cyan: 'none',
      white: 'none',
    },
  },
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
};
```

### `src/lib/theme/themes/dark.ts`

```typescript
import { ThemeConfig } from '../types';

export const darkTheme: ThemeConfig = {
  name: 'dark',
  label: 'Dark',
  colors: {
    bg: {
      page: '#050505',
      primary: '#0A0A0A',
      secondary: '#111111',
      tertiary: '#1A1A1A',
      hover: '#222222',
      active: '#2A2A2A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      tertiary: '#888888',
      muted: '#666666',
      inverse: '#101828',
    },
    accent: {
      coral: '#F97066',
      coralHover: '#FF8A80',
      mint: '#12B76A',
      mintHover: '#4ADE80',
      teal: '#14B8A6',
      cyan: '#22D3EE',
    },
    semantic: {
      positive: '#4ADE80',
      negative: '#F97066',
      warning: '#FBBF24',
      info: '#60A5FA',
    },
    border: {
      subtle: '#222222',
      default: '#333333',
      emphasis: '#444444',
    },
    chart: [
      '#FF4444', // Neon Red - Expenses
      '#00FF7F', // Neon Green - Income
      '#1E90FF', // Neon Blue
      '#FFD700', // Neon Yellow
      '#9370DB', // Neon Purple
      '#FF00FF', // Neon Magenta
      '#00CED1', // Neon Teal
      '#FF8C00', // Neon Orange
      '#00FFFF', // Neon Cyan
      '#ADFF2F', // Neon Lime
    ],
    category: {
      charity: '#60A5FA',
      daily: '#34D399',
      dining: '#FBBF24',
      entertainment: '#F97066',
      gifts: '#A78BFA',
      groceries: '#4ADE80',
      healthcare: '#FB7185',
      financing: '#38BDF8',
      shopping: '#C084FC',
      subscriptions: '#2DD4BF',
      transportation: '#FB923C',
      travel: '#FACC15',
      utilities: '#818CF8',
    },
    account: {
      jointChecking: '#4ADE80',
      jointSavings: '#22D3EE',
      user1Checking: '#FBBF24',
      user1Savings: '#FB923C',
      user2Checking: '#A78BFA',
      user2Savings: '#F472B6',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.6)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.8)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
    glow: {
      coral: '0 0 20px rgba(249, 112, 102, 0.4)',
      mint: '0 0 20px rgba(18, 183, 106, 0.4)',
      teal: '0 0 20px rgba(20, 184, 166, 0.4)',
      cyan: '0 0 20px rgba(34, 211, 238, 0.4)',
      white: '0 0 15px rgba(255, 255, 255, 0.2)',
    },
  },
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
};
```

### `src/lib/theme/themes/index.ts`

```typescript
import { ThemeConfig } from '../types';
import { lightTheme } from './light';
import { darkTheme } from './dark';

export const themes: Record<string, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
};

export { lightTheme, darkTheme };
```

---

## Step 3: Create CSS Variable Generator

### `src/lib/theme/utils/css-variables.ts`

```typescript
import { ThemeConfig } from '../types';

/**
 * Generates CSS custom property declarations from a theme config
 */
export function generateCSSVariables(theme: ThemeConfig): string {
  const { colors, shadows, radius } = theme;

  return `
    /* Background Colors */
    --color-bg-page: ${colors.bg.page};
    --color-bg-primary: ${colors.bg.primary};
    --color-bg-secondary: ${colors.bg.secondary};
    --color-bg-tertiary: ${colors.bg.tertiary};
    --color-bg-hover: ${colors.bg.hover};
    --color-bg-active: ${colors.bg.active};

    /* Text Colors */
    --color-text-primary: ${colors.text.primary};
    --color-text-secondary: ${colors.text.secondary};
    --color-text-tertiary: ${colors.text.tertiary};
    --color-text-muted: ${colors.text.muted};
    --color-text-inverse: ${colors.text.inverse};

    /* Accent Colors */
    --color-accent-coral: ${colors.accent.coral};
    --color-accent-coral-hover: ${colors.accent.coralHover};
    --color-accent-mint: ${colors.accent.mint};
    --color-accent-mint-hover: ${colors.accent.mintHover};
    --color-accent-teal: ${colors.accent.teal};
    --color-accent-cyan: ${colors.accent.cyan};

    /* Semantic Colors */
    --color-positive: ${colors.semantic.positive};
    --color-negative: ${colors.semantic.negative};
    --color-warning: ${colors.semantic.warning};
    --color-info: ${colors.semantic.info};

    /* Border Colors */
    --color-border-subtle: ${colors.border.subtle};
    --color-border-default: ${colors.border.default};
    --color-border-emphasis: ${colors.border.emphasis};

    /* Chart Colors */
    --color-chart-1: ${colors.chart[0]};
    --color-chart-2: ${colors.chart[1]};
    --color-chart-3: ${colors.chart[2]};
    --color-chart-4: ${colors.chart[3]};
    --color-chart-5: ${colors.chart[4]};
    --color-chart-6: ${colors.chart[5]};
    --color-chart-7: ${colors.chart[6]};
    --color-chart-8: ${colors.chart[7]};
    --color-chart-9: ${colors.chart[8]};
    --color-chart-10: ${colors.chart[9]};

    /* Category Colors */
    --color-category-charity: ${colors.category.charity};
    --color-category-daily: ${colors.category.daily};
    --color-category-dining: ${colors.category.dining};
    --color-category-entertainment: ${colors.category.entertainment};
    --color-category-gifts: ${colors.category.gifts};
    --color-category-groceries: ${colors.category.groceries};
    --color-category-healthcare: ${colors.category.healthcare};
    --color-category-financing: ${colors.category.financing};
    --color-category-shopping: ${colors.category.shopping};
    --color-category-subscriptions: ${colors.category.subscriptions};
    --color-category-transportation: ${colors.category.transportation};
    --color-category-travel: ${colors.category.travel};
    --color-category-utilities: ${colors.category.utilities};

    /* Account Colors */
    --color-account-joint-checking: ${colors.account.jointChecking};
    --color-account-joint-savings: ${colors.account.jointSavings};
    --color-account-user1-checking: ${colors.account.user1Checking};
    --color-account-user1-savings: ${colors.account.user1Savings};
    --color-account-user2-checking: ${colors.account.user2Checking};
    --color-account-user2-savings: ${colors.account.user2Savings};

    /* Shadows */
    --shadow-sm: ${shadows.sm};
    --shadow-md: ${shadows.md};
    --shadow-lg: ${shadows.lg};
    --shadow-xl: ${shadows.xl};
    --shadow-inner: ${shadows.inner};
    --shadow-glow-coral: ${shadows.glow.coral};
    --shadow-glow-mint: ${shadows.glow.mint};
    --shadow-glow-teal: ${shadows.glow.teal};
    --shadow-glow-cyan: ${shadows.glow.cyan};
    --shadow-glow-white: ${shadows.glow.white};

    /* Border Radius */
    --radius-none: ${radius.none};
    --radius-sm: ${radius.sm};
    --radius-md: ${radius.md};
    --radius-lg: ${radius.lg};
    --radius-xl: ${radius.xl};
    --radius-2xl: ${radius['2xl']};
    --radius-full: ${radius.full};
  `;
}

/**
 * Converts a hex color to RGB values for use with rgba()
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
```

---

## Step 4: Create Theme Context

### `src/lib/theme/context.tsx`

```typescript
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { ThemeMode, ThemeContextValue } from './types';

const STORAGE_KEY = 'cemdash-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = STORAGE_KEY,
  enableSystem = true,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Resolve system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey) as ThemeMode | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setThemeState(saved);
    }
    setMounted(true);
  }, [storageKey]);

  // Calculate resolved theme
  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(resolvedTheme);
    
    // Update color-scheme for native elements
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme, mounted]);

  // Theme setter with persistence
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  }, [storageKey]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme,
    themes: ['light', 'dark', 'system'],
    systemTheme,
  }), [theme, resolvedTheme, setTheme, systemTheme]);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={value}>
        <div style={{ visibility: 'hidden' }}>{children}</div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

---

## Step 5: Create Theme Hooks

### `src/lib/theme/hooks/useChartTheme.ts`

```typescript
'use client';

import { useMemo } from 'react';
import { useTheme } from '../context';
import { themes } from '../themes';

export interface ChartThemeColors {
  // Primary chart palette
  palette: string[];
  
  // Specific use cases
  income: string;
  expenses: string;
  
  // Category colors
  categories: Record<string, string>;
  
  // Account colors
  accounts: Record<string, string>;
  
  // UI elements
  grid: string;
  axis: string;
  tooltip: {
    background: string;
    border: string;
    text: string;
  };
  
  // Gradients for bar charts
  gradients: {
    income: [string, string];
    expenses: [string, string];
  };
}

export function useChartTheme(): ChartThemeColors {
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    const theme = themes[resolvedTheme];
    const isDark = resolvedTheme === 'dark';

    return {
      palette: theme.colors.chart,
      
      income: theme.colors.chart[1],
      expenses: theme.colors.chart[0],
      
      categories: theme.colors.category,
      accounts: theme.colors.account,
      
      grid: isDark ? '#222222' : '#E5E7EB',
      axis: isDark ? '#666666' : '#667085',
      
      tooltip: {
        background: isDark ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: isDark ? '#333333' : '#D0D5DD',
        text: isDark ? '#CCCCCC' : '#344054',
      },
      
      gradients: {
        income: isDark 
          ? ['#00FF7F', '#00CED1'] 
          : ['#12B76A', '#14B8A6'],
        expenses: isDark 
          ? ['#FF4444', '#FF8C00'] 
          : ['#F97066', '#F59E0B'],
      },
    };
  }, [resolvedTheme]);
}
```

### `src/lib/theme/hooks/useThemeValue.ts`

```typescript
'use client';

import { useMemo } from 'react';
import { useTheme } from '../context';
import { themes } from '../themes';
import { ThemeConfig } from '../types';

/**
 * Access the current theme configuration object
 */
export function useThemeConfig(): ThemeConfig {
  const { resolvedTheme } = useTheme();
  return useMemo(() => themes[resolvedTheme], [resolvedTheme]);
}

/**
 * Get a specific color value from the current theme
 */
export function useThemeColor(
  path: string
): string {
  const config = useThemeConfig();
  
  return useMemo(() => {
    const parts = path.split('.');
    let value: any = config.colors;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.warn(`Theme color path "${path}" not found`);
        return '#FF00FF'; // Return magenta for missing colors (debug)
      }
    }
    
    return value;
  }, [config, path]);
}
```

---

## Step 6: Create Global CSS

### `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * ============================================
 * CEMDASH THEME SYSTEM - CSS CUSTOM PROPERTIES
 * ============================================
 */

@layer base {
  /* ==========================================
   * LIGHT THEME (Default)
   * ========================================== */
  :root {
    /* Background Colors */
    --color-bg-page: #F2F4F7;
    --color-bg-primary: #FFFFFF;
    --color-bg-secondary: #F9FAFB;
    --color-bg-tertiary: #F2F4F7;
    --color-bg-hover: #E5E7EB;
    --color-bg-active: #D1D5DB;

    /* Text Colors */
    --color-text-primary: #101828;
    --color-text-secondary: #344054;
    --color-text-tertiary: #667085;
    --color-text-muted: #9CA3AF;
    --color-text-inverse: #FFFFFF;

    /* Accent Colors */
    --color-accent-coral: #F97066;
    --color-accent-coral-hover: #EF4444;
    --color-accent-mint: #12B76A;
    --color-accent-mint-hover: #059669;
    --color-accent-teal: #14B8A6;
    --color-accent-cyan: #22D3EE;

    /* Semantic Colors */
    --color-positive: #12B76A;
    --color-negative: #F97066;
    --color-warning: #F59E0B;
    --color-info: #3B82F6;

    /* Border Colors */
    --color-border-subtle: #E5E7EB;
    --color-border-default: #D0D5DD;
    --color-border-emphasis: #9CA3AF;

    /* Chart Colors */
    --color-chart-1: #F97066;
    --color-chart-2: #12B76A;
    --color-chart-3: #3B82F6;
    --color-chart-4: #F59E0B;
    --color-chart-5: #8B5CF6;
    --color-chart-6: #EC4899;
    --color-chart-7: #14B8A6;
    --color-chart-8: #F97316;
    --color-chart-9: #06B6D4;
    --color-chart-10: #84CC16;

    /* Category Colors */
    --color-category-charity: #60A5FA;
    --color-category-daily: #34D399;
    --color-category-dining: #FBBF24;
    --color-category-entertainment: #F97066;
    --color-category-gifts: #A78BFA;
    --color-category-groceries: #4ADE80;
    --color-category-healthcare: #FB7185;
    --color-category-financing: #38BDF8;
    --color-category-shopping: #C084FC;
    --color-category-subscriptions: #2DD4BF;
    --color-category-transportation: #FB923C;
    --color-category-travel: #FACC15;
    --color-category-utilities: #818CF8;

    /* Account Colors */
    --color-account-joint-checking: #12B76A;
    --color-account-joint-savings: #14B8A6;
    --color-account-user1-checking: #F59E0B;
    --color-account-user1-savings: #F97316;
    --color-account-user2-checking: #8B5CF6;
    --color-account-user2-savings: #EC4899;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    --shadow-glow-coral: none;
    --shadow-glow-mint: none;
    --shadow-glow-teal: none;
    --shadow-glow-cyan: none;
    --shadow-glow-white: none;

    /* Border Radius */
    --radius-none: 0px;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-2xl: 24px;
    --radius-full: 9999px;

    /* Transition */
    --transition-colors: color 150ms, background-color 150ms, border-color 150ms;
  }

  /* ==========================================
   * DARK THEME
   * ========================================== */
  .dark {
    /* Background Colors */
    --color-bg-page: #050505;
    --color-bg-primary: #0A0A0A;
    --color-bg-secondary: #111111;
    --color-bg-tertiary: #1A1A1A;
    --color-bg-hover: #222222;
    --color-bg-active: #2A2A2A;

    /* Text Colors */
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #CCCCCC;
    --color-text-tertiary: #888888;
    --color-text-muted: #666666;
    --color-text-inverse: #101828;

    /* Accent Colors (mostly consistent, hover states brighter) */
    --color-accent-coral: #F97066;
    --color-accent-coral-hover: #FF8A80;
    --color-accent-mint: #12B76A;
    --color-accent-mint-hover: #4ADE80;
    --color-accent-teal: #14B8A6;
    --color-accent-cyan: #22D3EE;

    /* Semantic Colors (brighter for dark backgrounds) */
    --color-positive: #4ADE80;
    --color-negative: #F97066;
    --color-warning: #FBBF24;
    --color-info: #60A5FA;

    /* Border Colors */
    --color-border-subtle: #222222;
    --color-border-default: #333333;
    --color-border-emphasis: #444444;

    /* Chart Colors (Neon palette for dark theme) */
    --color-chart-1: #FF4444;
    --color-chart-2: #00FF7F;
    --color-chart-3: #1E90FF;
    --color-chart-4: #FFD700;
    --color-chart-5: #9370DB;
    --color-chart-6: #FF00FF;
    --color-chart-7: #00CED1;
    --color-chart-8: #FF8C00;
    --color-chart-9: #00FFFF;
    --color-chart-10: #ADFF2F;

    /* Account Colors (brighter for dark theme) */
    --color-account-joint-checking: #4ADE80;
    --color-account-joint-savings: #22D3EE;
    --color-account-user1-checking: #FBBF24;
    --color-account-user1-savings: #FB923C;
    --color-account-user2-checking: #A78BFA;
    --color-account-user2-savings: #F472B6;

    /* Shadows (deeper for dark theme) */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.6);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.7);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.8);
    --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    
    /* Glow Effects (dark theme only) */
    --shadow-glow-coral: 0 0 20px rgba(249, 112, 102, 0.4);
    --shadow-glow-mint: 0 0 20px rgba(18, 183, 106, 0.4);
    --shadow-glow-teal: 0 0 20px rgba(20, 184, 166, 0.4);
    --shadow-glow-cyan: 0 0 20px rgba(34, 211, 238, 0.4);
    --shadow-glow-white: 0 0 15px rgba(255, 255, 255, 0.2);
  }

  /* ==========================================
   * BASE STYLES
   * ========================================== */
  html {
    color-scheme: light;
  }

  html.dark {
    color-scheme: dark;
  }

  body {
    background-color: var(--color-bg-page);
    color: var(--color-text-secondary);
    transition: var(--transition-colors);
  }

  /* Smooth theme transitions */
  *,
  *::before,
  *::after {
    transition: background-color 150ms ease, border-color 150ms ease;
  }

  /* Disable transitions on page load to prevent flash */
  .no-transitions *,
  .no-transitions *::before,
  .no-transitions *::after {
    transition: none !important;
  }
}
```

---

## Step 7: Extend Tailwind Config

### `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          page: 'var(--color-bg-page)',
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary: 'var(--color-bg-tertiary)',
          hover: 'var(--color-bg-hover)',
          active: 'var(--color-bg-active)',
        },
        // Text colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        // Accent colors
        accent: {
          coral: 'var(--color-accent-coral)',
          'coral-hover': 'var(--color-accent-coral-hover)',
          mint: 'var(--color-accent-mint)',
          'mint-hover': 'var(--color-accent-mint-hover)',
          teal: 'var(--color-accent-teal)',
          cyan: 'var(--color-accent-cyan)',
        },
        // Semantic colors
        positive: 'var(--color-positive)',
        negative: 'var(--color-negative)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        // Border colors
        border: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          emphasis: 'var(--color-border-emphasis)',
        },
        // Chart colors
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
          5: 'var(--color-chart-5)',
          6: 'var(--color-chart-6)',
          7: 'var(--color-chart-7)',
          8: 'var(--color-chart-8)',
          9: 'var(--color-chart-9)',
          10: 'var(--color-chart-10)',
        },
        // Category colors
        category: {
          charity: 'var(--color-category-charity)',
          daily: 'var(--color-category-daily)',
          dining: 'var(--color-category-dining)',
          entertainment: 'var(--color-category-entertainment)',
          gifts: 'var(--color-category-gifts)',
          groceries: 'var(--color-category-groceries)',
          healthcare: 'var(--color-category-healthcare)',
          financing: 'var(--color-category-financing)',
          shopping: 'var(--color-category-shopping)',
          subscriptions: 'var(--color-category-subscriptions)',
          transportation: 'var(--color-category-transportation)',
          travel: 'var(--color-category-travel)',
          utilities: 'var(--color-category-utilities)',
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        inner: 'var(--shadow-inner)',
        'glow-coral': 'var(--shadow-glow-coral)',
        'glow-mint': 'var(--shadow-glow-mint)',
        'glow-teal': 'var(--shadow-glow-teal)',
        'glow-cyan': 'var(--shadow-glow-cyan)',
        'glow-white': 'var(--shadow-glow-white)',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## Step 8: Create Theme Components

### `src/components/theme/ThemeToggle.tsx`

```typescript
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme/context';
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
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 rounded-md"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'bg-bg-hover' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'bg-bg-hover' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'bg-bg-hover' : ''}
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### `src/components/theme/ThemeProvider.tsx`

```typescript
'use client';

import { ThemeProvider as BaseThemeProvider } from '@/lib/theme/context';

interface Props {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: Props) {
  return (
    <BaseThemeProvider defaultTheme="system" enableSystem>
      {children}
    </BaseThemeProvider>
  );
}
```

---

## Step 9: Integrate with App Layout

### `src/app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cemdash - Home Finance Dashboard',
  description: 'Track and visualize your household finances',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('cemdash-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored === 'dark' || (stored === 'system' && prefersDark) || (!stored && prefersDark) ? 'dark' : 'light';
                document.documentElement.classList.add(theme);
                document.documentElement.style.colorScheme = theme;
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Step 10: Export Public API

### `src/lib/theme/index.ts`

```typescript
// Context & Provider
export { ThemeProvider, useTheme } from './context';

// Types
export type { 
  ThemeMode, 
  ThemeConfig, 
  ThemeColors, 
  ThemeContextValue 
} from './types';

// Hooks
export { useChartTheme } from './hooks/useChartTheme';
export { useThemeConfig, useThemeColor } from './hooks/useThemeValue';

// Theme configs (for advanced use)
export { themes, lightTheme, darkTheme } from './themes';

// Utilities
export { generateCSSVariables, hexToRgb } from './utils/css-variables';
```

---

## Next Steps

Continue to the following guides:
- **[Component Integration](./03-COMPONENTS.md)** - Theming shadcn/ui and custom components
- **[Chart Theming](./04-CHARTS.md)** - Recharts color integration
- **[Table Theming](./05-TABLES.md)** - TanStack Table styling
