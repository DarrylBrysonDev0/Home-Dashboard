"use client";

/**
 * CashFlowChart Component
 *
 * Displays income vs expenses as a grouped bar chart over time.
 * Transfers are excluded from calculations (handled by API).
 *
 * Features:
 * - Grouped bars for income (green) and expenses (coral)
 * - Custom tooltip with formatted currency values
 * - Responsive sizing with Recharts ResponsiveContainer
 * - Support for daily, weekly, and monthly granularity
 * - Loading, error, and empty states
 */

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CashFlowChartSkeleton } from "../loading-skeleton";
import { NoData } from "../empty-states/no-data";
import { ChartTooltip, formatCurrency, formatPeriodLabel } from "./chart-tooltip";
import { SEMANTIC_COLORS } from "@/lib/constants/colors";
import { useFilters } from "@/lib/contexts/filter-context";
import type { CashFlowPeriod, Granularity } from "@/lib/validations/analytics";

/**
 * Filter props for cash flow data fetching
 */
export interface CashFlowChartFilterProps {
  /** Start date for the date range filter */
  startDate?: Date;
  /** End date for the date range filter */
  endDate?: Date;
  /** Array of account IDs to filter by */
  accountIds?: string[];
  /** Time period granularity (daily, weekly, monthly) */
  granularity?: Granularity;
}

/**
 * Props for the CashFlowChart component
 */
export interface CashFlowChartProps extends CashFlowChartFilterProps {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the net cash flow line */
  showNet?: boolean;
}

/**
 * API response wrapper
 */
interface CashFlowApiResponse {
  data?: {
    cash_flow: CashFlowPeriod[];
  };
  error?: string;
}

/**
 * Chart data format after transformation
 */
interface ChartDataPoint {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

/**
 * Builds the URL with query parameters for the cash flow API
 */
function buildCashFlowUrl(filters: CashFlowChartFilterProps): string {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set("start_date", format(filters.startDate, "yyyy-MM-dd"));
  }

  if (filters.endDate) {
    params.set("end_date", format(filters.endDate, "yyyy-MM-dd"));
  }

  if (filters.accountIds && filters.accountIds.length > 0) {
    params.set("account_id", filters.accountIds.join(","));
  }

  if (filters.granularity) {
    params.set("granularity", filters.granularity);
  }

  const queryString = params.toString();
  return `/api/analytics/cash-flow${queryString ? `?${queryString}` : ""}`;
}

/**
 * Transform API response to chart data format
 */
function transformToChartData(cashFlow: CashFlowPeriod[]): ChartDataPoint[] {
  return cashFlow.map((period) => ({
    period: period.period,
    income: period.income,
    expenses: period.expenses,
    net: period.net,
  }));
}

/**
 * Custom hook for fetching cash flow data
 */
function useCashFlowData(filters: CashFlowChartFilterProps) {
  const [data, setData] = useState<ChartDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildCashFlowUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch cash flow data (${response.status})`
        );
      }

      const json: CashFlowApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data?.cash_flow) {
        throw new Error("Invalid response: missing cash flow data");
      }

      setData(transformToChartData(json.data.cash_flow));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Custom Y-axis tick formatter for currency values
 */
function formatYAxisTick(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value}`;
}

/**
 * CashFlowChart - Displays income vs expenses over time
 *
 * Shows a grouped bar chart with:
 * - Green bars for income
 * - Coral/red bars for expenses
 * - Custom tooltip with period details and formatted amounts
 */
export function CashFlowChart({
  startDate,
  endDate,
  accountIds,
  granularity = "monthly",
  title = "Cash Flow",
  description = "Income vs expenses over time (transfers excluded)",
  height = 350,
  className,
  showNet = false,
}: CashFlowChartProps) {
  const { data, isLoading, error } = useCashFlowData({
    startDate,
    endDate,
    accountIds,
    granularity,
  });

  // Show loading skeleton
  if (isLoading) {
    return <CashFlowChartSkeleton height={height} />;
  }

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive"
            style={{ height }}
            role="alert"
          >
            <div className="text-center">
              <p className="font-medium">Failed to load chart</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <NoData
            title="No cash flow data"
            description="There are no income or expense transactions for the selected period."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="period"
              tickFormatter={formatPeriodLabel}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={formatCurrency}
                  labelFormatter={formatPeriodLabel}
                />
              }
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={(value) => (
                <span className="text-sm capitalize text-foreground">{value}</span>
              )}
            />
            <Bar
              dataKey="income"
              name="Income"
              fill={SEMANTIC_COLORS.income}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill={SEMANTIC_COLORS.expense}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            {showNet && (
              <Bar
                dataKey="net"
                name="Net"
                fill={SEMANTIC_COLORS.neutral}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * FilteredCashFlowChart - Context-aware cash flow chart component
 *
 * Consumes the FilterContext to automatically fetch and display
 * cash flow data based on the current filter state. Use this component
 * inside the dashboard where FilterProvider is available.
 *
 * For testing or standalone usage, use CashFlowChart with explicit props.
 */
export interface FilteredCashFlowChartProps {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the net cash flow bar */
  showNet?: boolean;
  /** Time period granularity (daily, weekly, monthly) */
  granularity?: Granularity;
}

export function FilteredCashFlowChart({
  title = "Cash Flow",
  description = "Income vs expenses over time (transfers excluded)",
  height = 350,
  className,
  showNet = false,
  granularity = "monthly",
}: FilteredCashFlowChartProps) {
  const { dateRange, selectedAccountIds } = useFilters();

  return (
    <CashFlowChart
      startDate={dateRange.start}
      endDate={dateRange.end}
      accountIds={selectedAccountIds.length > 0 ? selectedAccountIds : undefined}
      granularity={granularity}
      title={title}
      description={description}
      height={height}
      className={className}
      showNet={showNet}
    />
  );
}

export default CashFlowChart;
