"use client";

/**
 * CategoryBar Component
 *
 * Displays category spending as a horizontal bar chart.
 * Shows absolute amounts with category labels on the Y-axis.
 *
 * Features:
 * - Horizontal bars sorted by amount (largest at top)
 * - WCAG AA compliant color palette
 * - Custom tooltip with category details
 * - Responsive sizing with Recharts ResponsiveContainer
 * - Click handler for drill-down to subcategories
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getChartColor } from "@/lib/constants/colors";
import { formatCurrency } from "./chart-tooltip";
import type { CategoryBreakdown } from "@/lib/validations/analytics";

/**
 * Props for the CategoryBar component
 */
export interface CategoryBarProps {
  /** Category spending data from API */
  data: CategoryBreakdown[];
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of categories to display */
  maxCategories?: number;
  /** Callback when a category bar is clicked */
  onCategoryClick?: (category: string) => void;
  /** Whether to show the percentage in bars */
  showPercentage?: boolean;
}

/**
 * Custom tooltip for the bar chart
 */
interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: CategoryBreakdown & { fill: string };
  }>;
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const category = data.payload;

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <p className="mb-1 font-medium text-foreground">{category.category}</p>
      <div className="space-y-0.5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(category.amount)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Percentage:</span>
          <span className="font-medium tabular-nums">{category.percentage}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Transactions:</span>
          <span className="font-medium tabular-nums">
            {category.transaction_count}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom Y-axis tick formatter to truncate long category names
 */
function formatCategoryLabel(value: string, maxLength = 15): string {
  if (value.length <= maxLength) return value;
  return `${value.substring(0, maxLength - 1)}…`;
}

/**
 * Custom X-axis tick formatter for currency values
 */
function formatXAxisTick(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

/**
 * Custom bar label showing percentage
 */
interface BarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  percentage?: number;
  index?: number;
}

function renderBarLabel({ x = 0, y = 0, width = 0, height = 0, percentage }: BarLabelProps) {
  // Convert string values to numbers (Recharts can pass either)
  const numX = typeof x === "string" ? parseFloat(x) : x;
  const numY = typeof y === "string" ? parseFloat(y) : y;
  const numWidth = typeof width === "string" ? parseFloat(width) : width;
  const numHeight = typeof height === "string" ? parseFloat(height) : height;
  if (percentage === undefined || numWidth < 40) return null;

  return (
    <text
      x={numX + numWidth - 8}
      y={numY + numHeight / 2}
      fill="white"
      textAnchor="end"
      dominantBaseline="middle"
      className="text-xs font-medium"
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
    >
      {percentage}%
    </text>
  );
}

/**
 * CategoryBar - Displays category spending as a horizontal bar chart
 *
 * Shows spending amounts with:
 * - Category names on Y-axis
 * - Currency amounts on X-axis
 * - Color-coded bars
 * - Hover tooltip with details
 * - Click handler for drill-down
 */
export function CategoryBar({
  data,
  height = 300,
  className,
  maxCategories = 10,
  onCategoryClick,
  showPercentage = true,
}: CategoryBarProps) {
  // Limit data to maxCategories and add colors
  const displayData = data
    .slice(0, maxCategories)
    .map((item, index) => ({
      ...item,
      fill: getChartColor(index),
    }));

  // Calculate dynamic height based on number of categories
  const barHeight = 36;
  const dynamicHeight = Math.max(height, displayData.length * barHeight + 60);

  const handleClick = (entry: CategoryBreakdown) => {
    if (onCategoryClick) {
      onCategoryClick(entry.category);
    }
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={dynamicHeight}>
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            type="number"
            tickFormatter={formatXAxisTick}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            type="category"
            dataKey="category"
            tickFormatter={(value) => formatCategoryLabel(value)}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            content={<BarTooltip />}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          />
          <Bar
            dataKey="amount"
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
            onClick={(_, index) => handleClick(displayData[index])}
            style={{ cursor: onCategoryClick ? "pointer" : "default" }}
            label={
              showPercentage
                ? (props: unknown) => {
                    const labelProps = props as BarLabelProps;
                    return renderBarLabel({
                      x: labelProps.x,
                      y: labelProps.y,
                      width: labelProps.width,
                      height: labelProps.height,
                      index: labelProps.index,
                      percentage:
                        labelProps.index !== undefined
                          ? displayData[labelProps.index]?.percentage
                          : undefined,
                    });
                  }
                : undefined
            }
          >
            {displayData.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={entry.fill}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Show "and X more" if data was truncated */}
      {data.length > maxCategories && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          and {data.length - maxCategories} more categories
        </p>
      )}
    </div>
  );
}

export default CategoryBar;
