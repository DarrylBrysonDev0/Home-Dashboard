"use client";

/**
 * Custom Chart Tooltip Component
 *
 * Reusable tooltip component for Recharts visualizations.
 * Displays formatted values with semantic colors based on data type.
 *
 * @example
 * <BarChart>
 *   <Tooltip content={<ChartTooltip valueFormatter={formatCurrency} />} />
 * </BarChart>
 */

import { SEMANTIC_COLORS } from "@/lib/constants/colors";

/**
 * Props for individual tooltip entry
 */
export interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

/**
 * Props passed by Recharts to custom tooltip
 */
export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  /** Custom formatter for values (e.g., currency, percentage) */
  valueFormatter?: (value: number) => string;
  /** Custom formatter for the label (e.g., date formatting) */
  labelFormatter?: (label: string) => string;
}

/**
 * Default currency formatter for USD
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format period label based on granularity pattern
 * - "2024-01" (monthly) → "Jan 2024"
 * - "2024-W03" (weekly) → "Week 3, 2024"
 * - "2024-01-15" (daily) → "Jan 15, 2024"
 */
export function formatPeriodLabel(label: string): string {
  if (!label) return "";

  // Weekly format: "2024-W03"
  const weekMatch = label.match(/^(\d{4})-W(\d{2})$/);
  if (weekMatch) {
    return `Week ${parseInt(weekMatch[2], 10)}, ${weekMatch[1]}`;
  }

  // Monthly format: "2024-01"
  const monthMatch = label.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    const date = new Date(parseInt(monthMatch[1], 10), parseInt(monthMatch[2], 10) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Daily format: "2024-01-15"
  const dayMatch = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const date = new Date(
      parseInt(dayMatch[1], 10),
      parseInt(dayMatch[2], 10) - 1,
      parseInt(dayMatch[3], 10)
    );
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return label;
}

/**
 * Get semantic color for a data series based on its key
 */
function getSemanticColor(dataKey: string): string | undefined {
  const keyLower = dataKey.toLowerCase();
  if (keyLower === "income") return SEMANTIC_COLORS.income;
  if (keyLower === "expenses" || keyLower === "expense") return SEMANTIC_COLORS.expense;
  if (keyLower === "net") return SEMANTIC_COLORS.income;
  if (keyLower === "transfer") return SEMANTIC_COLORS.transfer;
  return undefined;
}

/**
 * Custom tooltip component for Recharts
 *
 * Renders a styled tooltip with:
 * - Period label header
 * - Color-coded data series values
 * - Formatted numbers (currency, percentage, etc.)
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = formatCurrency,
  labelFormatter = formatPeriodLabel,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      {/* Period label header */}
      {label && (
        <p className="mb-1.5 text-sm font-medium text-foreground">
          {labelFormatter(label)}
        </p>
      )}

      {/* Data series values */}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const color = getSemanticColor(entry.dataKey) || entry.color;
          return (
            <div
              key={`tooltip-${entry.dataKey}-${index}`}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground capitalize">
                  {entry.name}
                </span>
              </span>
              <span className="font-medium tabular-nums" style={{ color }}>
                {valueFormatter(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ChartTooltip;
