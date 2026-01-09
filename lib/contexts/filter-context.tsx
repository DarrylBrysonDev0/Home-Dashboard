"use client";

import * as React from "react";
import {
  QUICK_DATE_RANGES,
  DEFAULT_DATE_RANGE_KEY,
  computeDateRange,
  type DateRange,
  type QuickDateRange,
} from "@/lib/constants/date-ranges";
import type { Account } from "@/components/dashboard/filters/account-filter";

/**
 * Filter state structure
 */
export interface FilterState {
  /** Selected date range key (e.g., "this-month", "custom") */
  dateRangeKey: string;
  /** Computed date range from the key or custom selection */
  dateRange: DateRange;
  /** Custom date range when dateRangeKey is "custom" */
  customDateRange?: DateRange;
  /** Selected account IDs (empty array = all accounts) */
  selectedAccountIds: string[];
  /** Available accounts for filtering */
  accounts: Account[];
  /** Whether filters are currently loading */
  isLoading: boolean;
}

/**
 * Filter actions available in context
 */
export interface FilterActions {
  /** Set the date range by key and computed dates */
  setDateRange: (key: string, range: DateRange) => void;
  /** Set selected account IDs */
  setSelectedAccounts: (accountIds: string[]) => void;
  /** Set available accounts (typically from API) */
  setAccounts: (accounts: Account[]) => void;
  /** Reset all filters to defaults */
  resetFilters: () => void;
  /** Set loading state */
  setIsLoading: (loading: boolean) => void;
}

/**
 * Combined context value
 */
export interface FilterContextValue extends FilterState, FilterActions {
  /** Quick date ranges for the TimeFilter component */
  quickDateRanges: readonly QuickDateRange[];
}

/**
 * Default filter state
 */
const defaultState: FilterState = {
  dateRangeKey: DEFAULT_DATE_RANGE_KEY,
  dateRange: computeDateRange(DEFAULT_DATE_RANGE_KEY),
  customDateRange: undefined,
  selectedAccountIds: [],
  accounts: [],
  isLoading: false,
};

/**
 * Filter Context
 */
const FilterContext = React.createContext<FilterContextValue | null>(null);

/**
 * FilterProvider Props
 */
export interface FilterProviderProps {
  children: React.ReactNode;
  /** Initial date range key */
  initialDateRangeKey?: string;
  /** Initial custom date range */
  initialCustomDateRange?: DateRange;
  /** Initial selected account IDs */
  initialAccountIds?: string[];
  /** Initial accounts list */
  initialAccounts?: Account[];
}

/**
 * FilterProvider Component
 *
 * Provides global filter state management for the dashboard.
 * Wrap the dashboard layout with this provider to enable
 * filter state sharing across all dashboard components.
 *
 * Usage:
 * ```tsx
 * <FilterProvider>
 *   <DashboardLayout />
 * </FilterProvider>
 * ```
 */
export function FilterProvider({
  children,
  initialDateRangeKey = DEFAULT_DATE_RANGE_KEY,
  initialCustomDateRange,
  initialAccountIds = [],
  initialAccounts = [],
}: FilterProviderProps) {
  const [state, setState] = React.useState<FilterState>(() => {
    const isCustom = initialDateRangeKey === "custom" && initialCustomDateRange;
    return {
      dateRangeKey: initialDateRangeKey,
      dateRange: isCustom ? initialCustomDateRange : computeDateRange(initialDateRangeKey),
      customDateRange: initialCustomDateRange,
      selectedAccountIds: initialAccountIds,
      accounts: initialAccounts,
      isLoading: false,
    };
  });

  const setDateRange = React.useCallback((key: string, range: DateRange) => {
    setState((prev) => ({
      ...prev,
      dateRangeKey: key,
      dateRange: range,
      customDateRange: key === "custom" ? range : prev.customDateRange,
    }));
  }, []);

  const setSelectedAccounts = React.useCallback((accountIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedAccountIds: accountIds,
    }));
  }, []);

  const setAccounts = React.useCallback((accounts: Account[]) => {
    setState((prev) => ({
      ...prev,
      accounts,
    }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      dateRangeKey: DEFAULT_DATE_RANGE_KEY,
      dateRange: computeDateRange(DEFAULT_DATE_RANGE_KEY),
      customDateRange: undefined,
      selectedAccountIds: [],
    }));
  }, []);

  const setIsLoading = React.useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const value = React.useMemo<FilterContextValue>(
    () => ({
      ...state,
      quickDateRanges: QUICK_DATE_RANGES,
      setDateRange,
      setSelectedAccounts,
      setAccounts,
      resetFilters,
      setIsLoading,
    }),
    [state, setDateRange, setSelectedAccounts, setAccounts, resetFilters, setIsLoading]
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/**
 * useFilters Hook
 *
 * Access the filter context in child components.
 * Must be used within a FilterProvider.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { dateRange, selectedAccountIds, setDateRange } = useFilters();
 *   // Use filter state...
 * }
 * ```
 */
export function useFilters(): FilterContextValue {
  const context = React.useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}

/**
 * Build query params for API calls based on current filter state
 */
export function buildFilterQueryParams(
  dateRange: DateRange,
  selectedAccountIds: string[]
): URLSearchParams {
  const params = new URLSearchParams();

  // Add date range params
  params.set("start_date", dateRange.start.toISOString().split("T")[0]);
  params.set("end_date", dateRange.end.toISOString().split("T")[0]);

  // Add account filter if any accounts are selected
  if (selectedAccountIds.length > 0) {
    params.set("account_id", selectedAccountIds.join(","));
  }

  return params;
}

/**
 * Build query string for API calls based on current filter state
 */
export function buildFilterQueryString(
  dateRange: DateRange,
  selectedAccountIds: string[]
): string {
  const params = buildFilterQueryParams(dateRange, selectedAccountIds);
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export { FilterContext };
