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
 * - Graceful fallback when localStorage is unavailable
 *
 * Configuration (T025-T027):
 * - enableSystem: true - Listens to OS color scheme changes
 * - storageKey: 'cemdash-theme' - localStorage key for persistence
 * - defaultTheme: 'system' - Follows OS preference by default
 * - attribute: 'class' - Uses class-based theme switching for Tailwind
 * - next-themes handles localStorage errors internally with automatic fallback
 *
 * @see lib/theme/types.ts for type definitions
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "@/lib/theme/types";

/**
 * Theme storage key for localStorage persistence.
 * Matches the key expected by data-model.md and E2E tests.
 */
const THEME_STORAGE_KEY = "cemdash-theme";

/**
 * ThemeProvider component
 *
 * Wraps children with theme context. Must be used within a client component.
 * Typically wrapped around the entire app in providers.tsx.
 *
 * T025: Configures next-themes with enableSystem and correct storageKey
 * T026: next-themes automatically listens to matchMedia changes when enableSystem=true
 * T027: next-themes handles localStorage errors gracefully with built-in fallback to system
 *
 * next-themes injects a blocking <script> in the document head that:
 * 1. Reads from localStorage before page renders
 * 2. Applies theme class immediately to prevent FOUC
 * 3. Falls back to system preference if localStorage fails or is unavailable
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
      // T025: Use class attribute for Tailwind CSS dark mode
      attribute="class"
      // T025: Default to system preference when no user choice exists
      defaultTheme={defaultTheme}
      // T025: Use correct localStorage key for persistence
      storageKey={storageKey}
      // T025 & T026: Enable system preference detection and real-time listening
      // next-themes automatically sets up a matchMedia listener when true
      enableSystem={enableSystem}
      // Define available theme names (required for proper theme resolution)
      themes={["light", "dark"]}
      // Smooth transitions when theme changes (false = enable transitions)
      disableTransitionOnChange={disableTransitionOnChange}
      // T027: next-themes handles localStorage errors internally:
      // - Catches localStorage access errors
      // - Falls back to system preference automatically
      // - Works in private browsing mode and when storage is disabled
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
