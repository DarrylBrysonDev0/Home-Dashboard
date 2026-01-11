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

// Hooks - Phase 3 (User Story 1)
export { useTheme } from './hooks/useTheme';
