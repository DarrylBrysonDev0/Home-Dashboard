/**
 * GET /api/filters/date-ranges
 *
 * Returns predefined quick-select date range options with calculated dates.
 * Used for the time filter component in the dashboard.
 *
 * Response includes:
 * - current_date: Server's current date for reference
 * - ranges: Array of date range options with:
 *   - label: Display text (e.g., "This Month")
 *   - key: URL-safe key for query params (e.g., "this-month")
 *   - start_date: Computed start date (ISO format)
 *   - end_date: Computed end date (ISO format)
 */

import { NextRequest, NextResponse } from "next/server";
import { QUICK_DATE_RANGES } from "@/lib/constants/date-ranges";
import { handleApiError } from "@/lib/api-errors";

interface DateRangeResponse {
  label: string;
  key: string;
  start_date: string | null;
  end_date: string | null;
}

export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];

    // Compute each range's actual dates
    const ranges: DateRangeResponse[] = QUICK_DATE_RANGES.map((range) => {
      const computed = range.getValue();

      // Format dates as ISO strings (YYYY-MM-DD)
      // "All Time" might have a very old start date, which is fine
      const startDate = computed.start.toISOString().split("T")[0];
      const endDate = computed.end.toISOString().split("T")[0];

      return {
        label: range.label,
        key: range.key,
        start_date: startDate,
        end_date: endDate,
      };
    });

    return NextResponse.json({
      data: {
        current_date: currentDate,
        ranges,
      },
    });
  } catch (error) {
    return handleApiError(error, "compute date ranges", { context: "Filters/DateRanges API" });
  }
}
