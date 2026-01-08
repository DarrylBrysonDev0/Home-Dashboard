import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  subMonths,
  subDays,
} from "date-fns";

/**
 * Date Range Constants for Quick-Select Filters
 *
 * Provides predefined date ranges for the dashboard time filter.
 * Each range includes a label, key for URL state, and a function
 * to compute the actual start/end dates.
 */

export interface DateRange {
  /** Start of the date range (inclusive) */
  start: Date;
  /** End of the date range (inclusive) */
  end: Date;
}

export interface QuickDateRange {
  /** Display label for UI button */
  label: string;
  /** URL-safe key for query params (e.g., ?period=last-3-months) */
  key: string;
  /** Function to compute the date range relative to current date */
  getValue: () => DateRange;
}

/**
 * Quick-select date range options.
 * Covers ~90% of typical use cases for financial dashboards.
 * Order matches expected frequency of use.
 */
export const QUICK_DATE_RANGES: readonly QuickDateRange[] = [
  {
    label: "This Month",
    key: "this-month",
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: new Date(),
    }),
  },
  {
    label: "Last Month",
    key: "last-month",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "Last 3 Months",
    key: "last-3-months",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 2)),
      end: new Date(),
    }),
  },
  {
    label: "Last 6 Months",
    key: "last-6-months",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 5)),
      end: new Date(),
    }),
  },
  {
    label: "Year to Date",
    key: "ytd",
    getValue: () => ({
      start: startOfYear(new Date()),
      end: new Date(),
    }),
  },
  {
    label: "Last 12 Months",
    key: "last-12-months",
    getValue: () => ({
      start: startOfMonth(subMonths(new Date(), 11)),
      end: new Date(),
    }),
  },
  {
    label: "All Time",
    key: "all-time",
    getValue: () => ({
      // Use a very old date as "beginning of time"
      start: new Date(2000, 0, 1),
      end: new Date(),
    }),
  },
] as const;

/**
 * Default date range key when no filter is applied.
 */
export const DEFAULT_DATE_RANGE_KEY = "all-time";

/**
 * Find a quick date range by its URL key.
 * Returns undefined if not found.
 */
export function getDateRangeByKey(key: string): QuickDateRange | undefined {
  return QUICK_DATE_RANGES.find((range) => range.key === key);
}

/**
 * Get the computed date range for a given key.
 * Falls back to "All Time" if key is not found.
 */
export function computeDateRange(key: string): DateRange {
  const range = getDateRangeByKey(key);
  if (range) {
    return range.getValue();
  }
  // Fallback to all time
  return QUICK_DATE_RANGES.find((r) => r.key === "all-time")!.getValue();
}

/**
 * Granularity options for time-series data aggregation.
 * Used by cash flow and balance trend charts.
 */
export type TimeGranularity = "day" | "week" | "month";

/**
 * Determines appropriate granularity based on date range span.
 * - Less than 31 days: daily
 * - 31-90 days: weekly
 * - More than 90 days: monthly
 */
export function suggestGranularity(range: DateRange): TimeGranularity {
  const daysDiff = Math.ceil(
    (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff <= 31) {
    return "day";
  } else if (daysDiff <= 90) {
    return "week";
  } else {
    return "month";
  }
}

/**
 * Format a date range for display (e.g., "Jan 1 - Jan 31, 2026")
 */
export function formatDateRangeDisplay(range: DateRange): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const yearOptions: Intl.DateTimeFormatOptions = {
    ...options,
    year: "numeric",
  };

  const startYear = range.start.getFullYear();
  const endYear = range.end.getFullYear();

  if (startYear === endYear) {
    return `${range.start.toLocaleDateString("en-US", options)} - ${range.end.toLocaleDateString("en-US", yearOptions)}`;
  }

  return `${range.start.toLocaleDateString("en-US", yearOptions)} - ${range.end.toLocaleDateString("en-US", yearOptions)}`;
}
