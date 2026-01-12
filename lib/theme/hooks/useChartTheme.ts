"use client";

/**
 * useChartTheme Hook
 *
 * Provides chart-specific color values based on the current theme.
 * Returns a memoized ChartThemeColors object that updates when the theme changes.
 *
 * @returns {ChartThemeColors} Chart colors including palette, income/expense colors,
 *                             category colors, account colors, and styling tokens.
 *
 * @example
 * ```tsx
 * const { palette, income, expenses, categories } = useChartTheme();
 *
 * // Use in Recharts
 * <Bar dataKey="amount" fill={palette[0]} />
 * <Line dataKey="income" stroke={income} />
 * ```
 *
 * @see specs/003-theme-style-system/contracts/theme-types.ts
 * @see T033: Create useChartTheme hook
 */

import { useMemo } from "react";
import { useTheme as useNextTheme } from "next-themes";
import type { ChartThemeColors, ResolvedTheme } from "../types";
import { lightTheme } from "../themes/light";
import { darkTheme } from "../themes/dark";

/**
 * Hook for accessing theme-aware chart colors.
 *
 * The hook reads the resolved theme (light or dark) and returns
 * the appropriate color palette for charts and visualizations.
 * Results are memoized for performance.
 */
export function useChartTheme(): ChartThemeColors {
  const { resolvedTheme } = useNextTheme();

  return useMemo(() => {
    const isDark = (resolvedTheme as ResolvedTheme) === "dark";
    const theme = isDark ? darkTheme : lightTheme;

    // Extract colors from theme configuration
    const { colors } = theme;

    // Income is second in palette (green variant), Expenses is first (coral/red variant)
    const income = colors.chart[1];
    const expenses = colors.chart[0];

    return {
      // 10-color palette for multi-series charts
      palette: [...colors.chart],

      // Semantic colors for income/expenses
      income,
      expenses,

      // Category name to color mapping
      categories: { ...colors.category },

      // Account name to color mapping
      accounts: { ...colors.account },

      // Grid line color - uses subtle border color
      grid: colors.border.subtle,

      // Axis label color - uses tertiary text color
      axis: colors.text.tertiary,

      // Tooltip styling
      tooltip: {
        bg: colors.bg.primary,
        text: colors.text.primary,
        border: colors.border.default,
      },

      // Gradient definitions for bar charts
      gradients: {
        // Income gradient: green to teal
        income: [colors.semantic.positive, colors.accent.teal],
        // Expenses gradient: coral/red to orange
        expenses: [colors.semantic.negative, "#F97316"],
      },
    };
  }, [resolvedTheme]);
}
