/**
 * Theme Registry
 *
 * Central registry for all available themes. Provides:
 * - Named exports for individual themes
 * - Record lookup by theme name string
 * - Helper to get theme configuration by name
 *
 * @module lib/theme/themes
 */

import type { ThemeConfig } from '../types';
import { lightTheme } from './light';
import { darkTheme } from './dark';

/**
 * Record of all registered themes, keyed by theme name.
 * Used for dynamic theme lookup by the theme context.
 */
export const themes: Record<string, ThemeConfig> = {
  light: lightTheme,
  dark: darkTheme,
};

/**
 * Get a theme configuration by name.
 * Falls back to light theme if the requested theme doesn't exist.
 *
 * @param name - The theme name to look up
 * @returns The theme configuration
 */
export function getTheme(name: string): ThemeConfig {
  return themes[name] ?? lightTheme;
}

/**
 * List of available theme names.
 * Useful for building theme selector UIs.
 */
export const themeNames = Object.keys(themes) as Array<keyof typeof themes>;

// Re-export individual themes for direct imports
export { lightTheme } from './light';
export { darkTheme } from './dark';
