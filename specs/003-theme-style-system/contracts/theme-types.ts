/**
 * Theme System Type Contracts
 * 
 * This file defines the TypeScript interfaces that serve as contracts
 * for the Theme Style System. These types ensure type safety across
 * all theme-related code.
 * 
 * @module lib/theme/types
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * User's theme preference selection.
 * - 'light': Force light theme
 * - 'dark': Force dark theme
 * - 'system': Follow OS preference
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Resolved theme after applying system preference logic.
 * Only 'light' or 'dark' - never 'system'.
 */
export type ResolvedTheme = 'light' | 'dark';

// =============================================================================
// Color Token Types
// =============================================================================

/**
 * Background color tokens for surface hierarchy.
 */
export interface BackgroundColors {
  /** Page background - outermost container */
  page: string;
  /** Primary surface - cards, dialogs */
  primary: string;
  /** Secondary surface - elevated elements */
  secondary: string;
  /** Tertiary surface - sidebars, panels */
  tertiary: string;
  /** Hover state background */
  hover: string;
  /** Active/pressed state background */
  active: string;
}

/**
 * Text color tokens for content hierarchy.
 */
export interface TextColors {
  /** Headings, emphasized content */
  primary: string;
  /** Body text, main content */
  secondary: string;
  /** Captions, hints */
  tertiary: string;
  /** Disabled, subtle elements */
  muted: string;
  /** Text on accent/colored backgrounds */
  inverse: string;
}

/**
 * Brand accent colors.
 */
export interface AccentColors {
  /** Primary accent - coral (#F97066) */
  coral: string;
  /** Coral hover state */
  coralHover: string;
  /** Success/positive accent - mint (#12B76A) */
  mint: string;
  /** Mint hover state */
  mintHover: string;
  /** Secondary accent - teal (#14B8A6) */
  teal: string;
  /** Info/highlight accent - cyan (#22D3EE) */
  cyan: string;
}

/**
 * Semantic meaning colors.
 */
export interface SemanticColors {
  /** Income, success, positive values */
  positive: string;
  /** Expenses, errors, negative values */
  negative: string;
  /** Warnings, alerts */
  warning: string;
  /** Informational messages */
  info: string;
}

/**
 * Border color tokens.
 */
export interface BorderColors {
  /** Subtle dividers, barely visible */
  subtle: string;
  /** Standard borders */
  default: string;
  /** Emphasized, prominent borders */
  emphasis: string;
}

/**
 * Spending category colors.
 * Keys match categories from transaction data.
 */
export interface CategoryColors {
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
}

/**
 * Account-specific colors for multi-account visualizations.
 */
export interface AccountColors {
  jointChecking: string;
  jointSavings: string;
  user1Checking: string;
  user1Savings: string;
  user2Checking: string;
  user2Savings: string;
}

/**
 * Complete color palette for a theme.
 */
export interface ThemeColors {
  bg: BackgroundColors;
  text: TextColors;
  accent: AccentColors;
  semantic: SemanticColors;
  border: BorderColors;
  /** 10-color chart palette for multi-series visualizations */
  chart: [string, string, string, string, string, 
          string, string, string, string, string];
  category: CategoryColors;
  account: AccountColors;
}

// =============================================================================
// Shadow Types
// =============================================================================

/**
 * Glow effect shadows (primarily used in dark mode).
 */
export interface GlowShadows {
  coral: string;
  mint: string;
  teal: string;
  cyan: string;
  white: string;
}

/**
 * Shadow definitions for elevation and depth.
 */
export interface ThemeShadows {
  /** Small shadow - subtle elevation */
  sm: string;
  /** Medium shadow - card elevation */
  md: string;
  /** Large shadow - modal elevation */
  lg: string;
  /** Extra large shadow - dropdown elevation */
  xl: string;
  /** Inset shadow - pressed states */
  inner: string;
  /** Glow effects for accent elements */
  glow: GlowShadows;
}

// =============================================================================
// Radius Types
// =============================================================================

/**
 * Border radius scale.
 */
export interface ThemeRadius {
  none: string;   // 0px
  sm: string;     // 4px
  md: string;     // 8px
  lg: string;     // 12px
  xl: string;     // 16px
  '2xl': string;  // 24px
  full: string;   // 9999px
}

// =============================================================================
// Theme Configuration
// =============================================================================

/**
 * Complete theme configuration object.
 */
export interface ThemeConfig {
  /** Unique theme identifier */
  name: string;
  /** Human-readable label */
  label: string;
  /** Complete color palette */
  colors: ThemeColors;
  /** Shadow definitions */
  shadows: ThemeShadows;
  /** Border radius scale */
  radius: ThemeRadius;
}

// =============================================================================
// Context Types
// =============================================================================

/**
 * Values exposed by ThemeContext.
 */
export interface ThemeContextValue {
  /** Current theme setting (may be 'system') */
  theme: ThemeMode;
  /** Resolved theme after system preference applied */
  resolvedTheme: ResolvedTheme;
  /** Function to change theme */
  setTheme: (theme: ThemeMode) => void;
  /** List of available theme names */
  themes: string[];
  /** Current OS color scheme preference */
  systemTheme: ResolvedTheme;
}

// =============================================================================
// Chart Theme Types
// =============================================================================

/**
 * Tooltip styling for charts.
 */
export interface TooltipColors {
  /** Background color */
  bg: string;
  /** Text color */
  text: string;
  /** Border color */
  border: string;
}

/**
 * Gradient definitions for chart fills.
 */
export interface GradientColors {
  /** Income gradient [start, end] */
  income: [string, string];
  /** Expense gradient [start, end] */
  expenses: [string, string];
}

/**
 * Chart-specific colors returned by useChartTheme hook.
 */
export interface ChartThemeColors {
  /** 10-color palette for multi-series charts */
  palette: string[];
  /** Income/positive value color */
  income: string;
  /** Expense/negative value color */
  expenses: string;
  /** Category name to color mapping */
  categories: Record<string, string>;
  /** Account name to color mapping */
  accounts: Record<string, string>;
  /** Grid line color */
  grid: string;
  /** Axis label color */
  axis: string;
  /** Tooltip styling */
  tooltip: TooltipColors;
  /** Gradient definitions */
  gradients: GradientColors;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for ThemeProvider component.
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme before localStorage check */
  defaultTheme?: ThemeMode;
  /** localStorage key for persistence */
  storageKey?: string;
  /** Enable system preference detection */
  enableSystem?: boolean;
  /** Disable CSS transitions during theme change */
  disableTransitionOnChange?: boolean;
}

/**
 * Props for ThemeToggle component.
 */
export interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Category key type for type-safe category access.
 */
export type CategoryKey = keyof CategoryColors;

/**
 * Account key type for type-safe account access.
 */
export type AccountKey = keyof AccountColors;

/**
 * Keys for accessing specific theme colors by path.
 * Used with useThemeColor hook.
 */
export type ThemeColorPath = 
  | `bg.${keyof BackgroundColors}`
  | `text.${keyof TextColors}`
  | `accent.${keyof AccentColors}`
  | `semantic.${keyof SemanticColors}`
  | `border.${keyof BorderColors}`
  | `category.${keyof CategoryColors}`
  | `account.${keyof AccountColors}`;
