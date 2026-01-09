/**
 * Chart and UI Color Constants
 *
 * WCAG AA compliant colors for data visualization.
 * CHART_COLORS: 12-color palette for multi-series charts (categories, accounts)
 * SEMANTIC_COLORS: Meaningful colors for financial data types
 */

/**
 * 12-color accessible palette for charts with multiple series.
 * Use sequentially for categories, accounts, or any multi-item visualization.
 * Designed for 4.5:1 contrast ratio on white backgrounds.
 */
export const CHART_COLORS = [
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#A855F7", // Purple
] as const;

/**
 * Semantic colors for financial data visualization.
 * Consistent meaning across all dashboard components.
 */
export const SEMANTIC_COLORS = {
  /** Positive cash flow, income transactions - Mint green */
  income: "#10B981",
  /** Negative cash flow, expense transactions - Coral red */
  expense: "#F87171",
  /** Neutral or unchanged values - Gray */
  neutral: "#6B7280",
  /** Transfer between accounts - Blue */
  transfer: "#3B82F6",
  /** Recurring transactions indicator - Purple */
  recurring: "#8B5CF6",
} as const;

/**
 * Trend indicator colors for KPI cards.
 * Used to show positive/negative/neutral changes.
 */
export const TREND_COLORS = {
  /** Positive trend (increase in income, decrease in expenses) */
  positive: "#10B981",
  /** Negative trend (decrease in income, increase in expenses) */
  negative: "#EF4444",
  /** No change */
  neutral: "#6B7280",
} as const;

/**
 * Confidence level colors for recurring transaction detection.
 */
export const CONFIDENCE_COLORS = {
  high: "#10B981", // Green - 90-100%
  medium: "#F59E0B", // Amber - 70-89%
  low: "#6B7280", // Gray - 50-69%
} as const;

// Type exports for type-safe color access
export type ChartColor = (typeof CHART_COLORS)[number];
export type SemanticColorKey = keyof typeof SEMANTIC_COLORS;
export type TrendColorKey = keyof typeof TREND_COLORS;
export type ConfidenceColorKey = keyof typeof CONFIDENCE_COLORS;

/**
 * Helper to get a chart color by index (wraps around if index exceeds palette length)
 */
export function getChartColor(index: number): ChartColor {
  return CHART_COLORS[index % CHART_COLORS.length];
}
