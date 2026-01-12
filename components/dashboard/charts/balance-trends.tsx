"use client";

/**
 * BalanceTrendsChart Component
 *
 * Displays account balance trends as a multi-line chart over time.
 * Each account gets its own line with a unique color from the Cemdash account palette.
 *
 * Features:
 * - Multi-line chart with one line per account using Cemdash account colors
 * - Glow effects on lines in dark mode for visual emphasis
 * - Toggleable legend to show/hide individual accounts
 * - Custom tooltip with formatted currency values
 * - Responsive sizing with Recharts ResponsiveContainer
 * - Support for daily, weekly, and monthly granularity
 * - Loading, error, and empty states
 *
 * User Story 5: Track Account Balance Trends
 * T038a: Updated to use Cemdash account colors with glow effects
 */

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceTrendsChartSkeleton } from "../loading-skeleton";
import { NoData } from "../empty-states/no-data";
import { ChartTooltip, formatCurrency } from "./chart-tooltip";
import { useChartTheme } from "@/lib/theme";
import { useTheme } from "next-themes";
import { useFilters } from "@/lib/contexts/filter-context";
import type { Granularity, AccountTrend } from "@/lib/validations/analytics";

/**
 * Filter props for balance trend data fetching
 */
export interface BalanceTrendsChartFilterProps {
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
 * Props for the BalanceTrendsChart component
 */
export interface BalanceTrendsChartProps extends BalanceTrendsChartFilterProps {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * API response wrapper
 */
interface AccountsApiResponse {
  data?: {
    accounts: AccountTrend[];
  };
  error?: string;
}

/**
 * Flattened data point for Recharts
 * Each point has a date and a balance value for each account
 */
interface ChartDataPoint {
  date: string;
  dateLabel: string;
  [accountId: string]: number | string; // Dynamic account balance fields
}

/**
 * Account metadata for legend and line rendering
 */
interface AccountInfo {
  accountId: string;
  accountName: string;
  color: string;
  /** Key for SVG glow filter reference */
  glowFilterId: string;
}

/**
 * Maps account names from API to Cemdash theme account color keys.
 * Falls back to palette colors for unrecognized accounts.
 *
 * Account name patterns:
 * - "Joint Checking" / "Joint Savings" → jointChecking / jointSavings
 * - "User1 Checking" / "User1 Savings" → user1Checking / user1Savings
 * - "User2 Checking" / "User2 Savings" → user2Checking / user2Savings
 */
function getAccountColorKey(accountName: string): string | null {
  const normalized = accountName.toLowerCase().replace(/\s+/g, "");

  const mappings: Record<string, string> = {
    jointchecking: "jointChecking",
    jointsavings: "jointSavings",
    user1checking: "user1Checking",
    user1savings: "user1Savings",
    user2checking: "user2Checking",
    user2savings: "user2Savings",
    // Common variations
    "joint-checking": "jointChecking",
    "joint-savings": "jointSavings",
  };

  return mappings[normalized] || null;
}

/**
 * Get account color from theme, falling back to palette for unknown accounts.
 */
function getAccountColor(
  accountName: string,
  accounts: Record<string, string>,
  palette: string[],
  fallbackIndex: number
): string {
  const colorKey = getAccountColorKey(accountName);
  if (colorKey && accounts[colorKey]) {
    return accounts[colorKey];
  }
  // Fall back to palette color for unknown accounts
  return palette[fallbackIndex % palette.length];
}

/**
 * Builds the URL with query parameters for the accounts API
 */
function buildAccountsUrl(filters: BalanceTrendsChartFilterProps): string {
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
  return `/api/analytics/accounts${queryString ? `?${queryString}` : ""}`;
}

/**
 * Format date for display based on granularity
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  // Check if it's a valid date
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Basic account info from API (without theme colors)
 */
interface RawAccountInfo {
  accountId: string;
  accountName: string;
}

/**
 * Transform API response to chart data format
 * Flattens the nested account/balances structure into rows with date + account columns.
 * Colors are assigned later in the component using theme-aware values.
 */
function transformToChartData(
  accounts: AccountTrend[]
): { data: ChartDataPoint[]; rawAccountInfos: RawAccountInfo[] } {
  if (!accounts || accounts.length === 0) {
    return { data: [], rawAccountInfos: [] };
  }

  // Build account info array (colors assigned later with theme)
  const rawAccountInfos: RawAccountInfo[] = accounts.map((account) => ({
    accountId: account.account_id,
    accountName: account.account_name,
  }));

  // Collect all unique dates across all accounts
  const dateMap = new Map<string, ChartDataPoint>();

  for (const account of accounts) {
    for (const balance of account.balances) {
      const dateKey = typeof balance.date === "string"
        ? balance.date
        : balance.date.toISOString().split("T")[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          dateLabel: formatDateLabel(dateKey),
        });
      }

      const point = dateMap.get(dateKey)!;
      point[account.account_id] = balance.balance;
    }
  }

  // Sort by date and convert to array
  const sortedData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { data: sortedData, rawAccountInfos };
}

/**
 * Custom hook for fetching account balance data
 */
function useAccountBalanceData(filters: BalanceTrendsChartFilterProps) {
  const [data, setData] = useState<ChartDataPoint[] | null>(null);
  const [rawAccountInfos, setRawAccountInfos] = useState<RawAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildAccountsUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch account data (${response.status})`
        );
      }

      const json: AccountsApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data?.accounts) {
        throw new Error("Invalid response: missing accounts data");
      }

      const { data: chartData, rawAccountInfos: infos } = transformToChartData(
        json.data.accounts
      );
      setData(chartData);
      setRawAccountInfos(infos);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setData(null);
      setRawAccountInfos([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, rawAccountInfos, isLoading, error, refetch: fetchData };
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
 * BalanceTrendsChart - Displays account balance trends over time
 *
 * Shows a multi-line chart with:
 * - One line per account with Cemdash account colors
 * - Glow effects on lines in dark mode
 * - Toggleable legend to show/hide accounts
 * - Custom tooltip with account details and formatted amounts
 */
export function BalanceTrendsChart({
  startDate,
  endDate,
  accountIds,
  granularity = "monthly",
  title = "Account Balance Trends",
  description = "Balance trends for each account over time",
  height = 350,
  className,
}: BalanceTrendsChartProps) {
  // Get theme-aware chart colors and current theme mode
  const { accounts, palette, grid, axis } = useChartTheme();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const { data, rawAccountInfos, isLoading, error } = useAccountBalanceData({
    startDate,
    endDate,
    accountIds,
    granularity,
  });

  // Build account infos with theme colors
  const accountInfos: AccountInfo[] = rawAccountInfos.map((raw, index) => ({
    ...raw,
    color: getAccountColor(raw.accountName, accounts, palette, index),
    glowFilterId: `glow-${raw.accountId.replace(/[^a-zA-Z0-9]/g, "")}`,
  }));

  // Track which accounts are visible (for legend toggle)
  const [visibleAccounts, setVisibleAccounts] = useState<Set<string>>(new Set());

  // Initialize visible accounts when rawAccountInfos change
  useEffect(() => {
    if (rawAccountInfos.length > 0) {
      setVisibleAccounts(new Set(rawAccountInfos.map((a) => a.accountId)));
    }
  }, [rawAccountInfos]);

  // Handle legend click to toggle account visibility
  const handleLegendClick = (dataKey: string) => {
    setVisibleAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        // Don't allow hiding all accounts
        if (next.size > 1) {
          next.delete(dataKey);
        }
      } else {
        next.add(dataKey);
      }
      return next;
    });
  };

  // Show loading skeleton
  if (isLoading) {
    return <BalanceTrendsChartSkeleton height={height} />;
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
  if (!data || data.length === 0 || accountInfos.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <NoData
            title="No balance data"
            description="There are no account balance records for the selected period."
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
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
          >
            {/* SVG glow filters for dark mode line effects */}
            <defs>
              {accountInfos.map((account) => (
                <filter
                  key={account.glowFilterId}
                  id={account.glowFilterId}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="3"
                    result="blur"
                  />
                  <feFlood
                    floodColor={account.color}
                    floodOpacity="0.4"
                    result="color"
                  />
                  <feComposite
                    in="color"
                    in2="blur"
                    operator="in"
                    result="glow"
                  />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={grid}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 12, fill: axis }}
              tickLine={false}
              axisLine={{ stroke: grid }}
            />
            <YAxis
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: axis }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={formatCurrency}
                  labelFormatter={(label) => label}
                />
              }
              cursor={{ stroke: "hsl(var(--muted))", strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              onClick={(e) => {
                if (e.dataKey) {
                  handleLegendClick(e.dataKey as string);
                }
              }}
              formatter={(value, entry) => {
                const isVisible = visibleAccounts.has(entry.dataKey as string);
                return (
                  <span
                    className={`cursor-pointer text-sm ${
                      isVisible ? "text-foreground" : "text-muted-foreground line-through"
                    }`}
                  >
                    {value}
                  </span>
                );
              }}
            />
            {accountInfos.map((account) => (
              <Line
                key={account.accountId}
                type="monotone"
                dataKey={account.accountId}
                name={account.accountName}
                stroke={account.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: account.color, strokeWidth: 0 }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: account.color,
                  fill: "var(--color-bg-primary, #fff)",
                }}
                hide={!visibleAccounts.has(account.accountId)}
                connectNulls
                // Apply glow filter only in dark mode for visual emphasis
                filter={isDarkMode ? `url(#${account.glowFilterId})` : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * FilteredBalanceTrendsChart - Context-aware balance trends chart component
 *
 * Consumes the FilterContext to automatically fetch and display
 * balance trend data based on the current filter state. Use this component
 * inside the dashboard where FilterProvider is available.
 *
 * For testing or standalone usage, use BalanceTrendsChart with explicit props.
 */
export interface FilteredBalanceTrendsChartProps {
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Time period granularity (daily, weekly, monthly) */
  granularity?: Granularity;
}

export function FilteredBalanceTrendsChart({
  title = "Account Balance Trends",
  description = "Balance trends for each account over time",
  height = 350,
  className,
  granularity = "monthly",
}: FilteredBalanceTrendsChartProps) {
  const { dateRange, selectedAccountIds } = useFilters();

  return (
    <BalanceTrendsChart
      startDate={dateRange.start}
      endDate={dateRange.end}
      accountIds={selectedAccountIds.length > 0 ? selectedAccountIds : undefined}
      granularity={granularity}
      title={title}
      description={description}
      height={height}
      className={className}
    />
  );
}

export default BalanceTrendsChart;
