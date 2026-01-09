"use client";

/**
 * CategoryDonut Component
 *
 * Displays category spending breakdown as a donut chart.
 * Shows percentage distribution of expenses across categories.
 *
 * Features:
 * - Donut chart with center hole for total display
 * - WCAG AA compliant color palette
 * - Custom tooltip with category details
 * - Legend with color indicators
 * - Responsive sizing with Recharts ResponsiveContainer
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getChartColor } from "@/lib/constants/colors";
import { formatCurrency } from "./chart-tooltip";
import type { CategoryBreakdown } from "@/lib/validations/analytics";

/**
 * Props for the CategoryDonut component
 */
export interface CategoryDonutProps {
  /** Category spending data from API */
  data: CategoryBreakdown[];
  /** Total expenses amount for center display */
  totalExpenses: number;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Callback when a category segment is clicked */
  onCategoryClick?: (category: string) => void;
}

/**
 * Custom tooltip for the donut chart
 */
interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: CategoryBreakdown & { fill: string };
  }>;
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
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
 * CategoryDonut - Displays category spending as a donut chart
 *
 * Shows proportional spending across categories with:
 * - Color-coded segments
 * - Hover tooltip with details
 * - Optional legend
 * - Click handler for drill-down
 */
export function CategoryDonut({
  data,
  totalExpenses,
  height = 300,
  className,
  showLegend = true,
  onCategoryClick,
}: CategoryDonutProps) {
  // Add fill color to data for chart
  const coloredData = data.map((item, index) => ({
    ...item,
    fill: getChartColor(index),
  }));

  const handleClick = (entry: CategoryBreakdown) => {
    if (onCategoryClick) {
      onCategoryClick(entry.category);
    }
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={coloredData}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            dataKey="amount"
            nameKey="category"
            labelLine={false}
            onClick={(_, index) => handleClick(data[index])}
            style={{ cursor: onCategoryClick ? "pointer" : "default" }}
          >
            {coloredData.map((entry) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={entry.fill}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Center text showing total */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ marginTop: showLegend ? -40 : 0 }}
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xl font-bold text-foreground">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CategoryDonut;
