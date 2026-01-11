/**
 * Theme System - Public API
 *
 * This module provides the theme infrastructure for the Home Dashboard.
 * It exports types, hooks, and utilities for theme management.
 *
 * @module lib/theme
 */

// Types - all TypeScript interfaces for the theme system
export * from './types';

// Theme definitions - Phase 2 complete
export * from './themes';

// Hooks - Phase 3 (User Story 1) and Phase 5 (User Story 3)
export { useTheme } from './hooks/useTheme';
export { useChartTheme } from './hooks/useChartTheme';

// Utilities - Phase 8 (CSS Variable Utilities)
export {
  getCssVariable,
  setCssVariable,
  getCssVariables,
  cssVar,
  cssVarWithFallback,
  textOnBackground,
  isAccessibleCombination,
  getAccessibleTextColors,
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  VALID_COMBINATIONS,
} from './utils/css-variables';
export type {
  CssVariableName,
  BackgroundVariableName,
  TextVariableName,
  ValidCombination,
} from './utils/css-variables';
