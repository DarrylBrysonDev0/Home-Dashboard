"use client";

/**
 * ThemeProvider Component
 *
 * Wraps next-themes ThemeProvider with app-specific configuration.
 * Provides theme context to the entire application.
 *
 * Features:
 * - Light/Dark/System theme modes
 * - localStorage persistence (key: 'cemdash-theme')
 * - System preference detection and real-time updates
 * - Zero FOUC via class-based switching
 *
 * @see lib/theme/types.ts for type definitions
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "@/lib/theme/types";

/**
 * Theme storage key for localStorage persistence.
 * Matches the key expected by data-model.md.
 */
const THEME_STORAGE_KEY = "cemdash-theme";

/**
 * ThemeProvider component
 *
 * Wraps children with theme context. Must be used within a client component.
 * Typically wrapped around the entire app in providers.tsx.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
