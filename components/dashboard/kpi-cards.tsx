"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Wallet,
  TrendingUp,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { KPICard } from "./kpi-card";
import { KPICardsSkeleton } from "./loading-skeleton";
import { NoData } from "./empty-states/no-data";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFilters } from "@/lib/contexts/filter-context";
import type { KpiResponse } from "@/lib/validations/analytics";

/**
 * Filter props for KPI data fetching
 */
export interface KPICardsFilterProps {
  /** Start date for the date range filter */
  startDate?: Date;
  /** End date for the date range filter */
  endDate?: Date;
  /** Array of account IDs to filter by */
  accountIds?: string[];
}

/**
 * Props for the KPICards container component
 */
export interface KPICardsProps extends KPICardsFilterProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * API response wrapper
 */
interface KPIApiResponse {
  data?: KpiResponse;
  error?: string;
}

/**
 * Builds the URL with query parameters for the KPI API
 */
function buildKpiUrl(filters: KPICardsFilterProps): string {
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

  const queryString = params.toString();
  return `/api/analytics/kpis${queryString ? `?${queryString}` : ""}`;
}

/**
 * Custom hook for fetching KPI data
 */
function useKpiData(filters: KPICardsFilterProps) {
  const [data, setData] = useState<KpiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildKpiUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch KPI data (${response.status})`
        );
      }

      const json: KPIApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data) {
        throw new Error("Invalid response: missing data");
      }

      setData(json.data);
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
 * KPICards - Container component that fetches and displays KPI metrics
 *
 * Displays 5 key financial health indicators:
 * 1. Net Cash Flow - Total income minus expenses (excludes transfers)
 * 2. Total Balance - Sum of current balances across all accounts
 * 3. Month-over-Month Change - Percentage change from previous period
 * 4. Recurring Expenses - Total of recurring expenses in period
 * 5. Largest Expense - Single largest expense transaction
 */
export function KPICards({
  startDate,
  endDate,
  accountIds,
  className,
}: KPICardsProps) {
  const { data, isLoading, error } = useKpiData({
    startDate,
    endDate,
    accountIds,
  });

  // Show loading skeleton
  if (isLoading) {
    return <KPICardsSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
        role="alert"
      >
        <p className="font-medium">Failed to load financial summary</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  // Show empty state if no data
  if (!data) {
    return (
      <NoData
        title="No financial data"
        description="There are no transactions to calculate metrics for the selected period."
      />
    );
  }

  // Format the largest expense subtitle
  const largestExpenseSubtitle = data.largest_expense
    ? `${data.largest_expense.category} - ${format(new Date(data.largest_expense.date), "MMM d, yyyy")}`
    : undefined;

  return (
    <TooltipProvider>
      <div
        className={`grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${className ?? ""}`}
      >
        {/* Net Cash Flow */}
        <KPICard
          title="Net Cash Flow"
          value={data.net_cash_flow}
          format="currency"
          icon={DollarSign}
          tooltip="Total income minus total expenses (excludes transfers)"
          positiveIsGood={true}
          trend={data.net_cash_flow >= 0 ? "up" : "down"}
        />

        {/* Total Balance */}
        <KPICard
          title="Total Balance"
          value={data.total_balance}
          format="currency"
          icon={Wallet}
          tooltip="Sum of current balances across all accounts"
        />

        {/* Month-over-Month Change */}
        <KPICard
          title="Month-over-Month"
          value={data.month_over_month_change.percentage}
          format="percentage"
          trend={data.month_over_month_change.trend}
          trendValue={data.month_over_month_change.percentage}
          icon={TrendingUp}
          tooltip="Percentage change in net cash flow compared to previous period"
          positiveIsGood={true}
        />

        {/* Recurring Expenses */}
        <KPICard
          title="Recurring Expenses"
          value={Math.abs(data.recurring_expenses)}
          format="currency"
          icon={CalendarClock}
          tooltip="Total of all recurring expenses in the selected period"
          positiveIsGood={false}
        />

        {/* Largest Expense */}
        <KPICard
          title="Largest Expense"
          value={data.largest_expense ? Math.abs(data.largest_expense.amount) : 0}
          format="currency"
          icon={CreditCard}
          subtitle={
            data.largest_expense
              ? data.largest_expense.description
              : "No expenses"
          }
          tooltip={
            data.largest_expense
              ? `${largestExpenseSubtitle}`
              : "No expense transactions in this period"
          }
          positiveIsGood={false}
        />
      </div>
    </TooltipProvider>
  );
}

/**
 * FilteredKPICards - Context-aware KPI cards component
 *
 * Consumes the FilterContext to automatically fetch and display
 * KPI data based on the current filter state. Use this component
 * inside the dashboard where FilterProvider is available.
 *
 * For testing or standalone usage, use KPICards with explicit props.
 */
export interface FilteredKPICardsProps {
  /** Additional CSS classes */
  className?: string;
}

export function FilteredKPICards({ className }: FilteredKPICardsProps) {
  const { dateRange, selectedAccountIds } = useFilters();

  return (
    <KPICards
      startDate={dateRange.start}
      endDate={dateRange.end}
      accountIds={selectedAccountIds.length > 0 ? selectedAccountIds : undefined}
      className={className}
    />
  );
}
