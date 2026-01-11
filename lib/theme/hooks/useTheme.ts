"use client";

/**
 * useTheme Hook
 *
 * A type-safe wrapper around next-themes' useTheme hook.
 * Provides the theme context values with proper TypeScript types.
 *
 * @returns {ThemeContextValue} Theme context with theme, setTheme, resolvedTheme, etc.
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useTheme();
 *
 * // Toggle between light and dark
 * setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
 * ```
 *
 * @see specs/003-theme-style-system/contracts/theme-types.ts
 * @see T018: Create useTheme hook wrapper
 */

import { useTheme as useNextTheme } from "next-themes";
import type { ThemeMode, ResolvedTheme, ThemeContextValue } from "../types";

/**
 * Hook for accessing and modifying the current theme.
 *
 * Returns all values from next-themes with proper TypeScript types
 * matching our ThemeContextValue interface.
 */
export function useTheme(): ThemeContextValue {
  const {
    theme,
    setTheme,
    resolvedTheme,
    themes,
    systemTheme,
  } = useNextTheme();

  return {
    // Current theme mode (may be 'system')
    theme: (theme as ThemeMode) ?? "system",

    // Resolved theme after system preference applied (never 'system')
    resolvedTheme: (resolvedTheme as ResolvedTheme) ?? "light",

    // Function to change theme
    setTheme: setTheme as (theme: ThemeMode) => void,

    // List of available theme names
    themes: themes ?? ["light", "dark", "system"],

    // Current OS color scheme preference
    systemTheme: (systemTheme as ResolvedTheme) ?? "light",
  };
}
