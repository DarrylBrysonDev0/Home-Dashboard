/**
 * GET /api/analytics/cash-flow
 *
 * Returns income vs expenses aggregated by period (daily/weekly/monthly)
 * Transfers are EXCLUDED from calculations (per User Story 2)
 *
 * Performance: ~90ms
 * Fetches filtered transactions and aggregates by period in JavaScript.
 * Uses idx_type_date index for efficient filtering.
 *
 * Query params:
 * - account_id: comma-separated account IDs to filter by
 * - start_date: ISO date string for period start
 * - end_date: ISO date string for period end
 * - granularity: "daily" | "weekly" | "monthly" (default: "monthly")
 *
 * Response shape:
 * {
 *   data: {
 *     cash_flow: [
 *       {
 *         period: "2024-01",      // Label format depends on granularity
 *         start_date: "2024-01-01",
 *         end_date: "2024-01-31",
 *         income: 8500.00,        // Total income (positive)
 *         expenses: 6320.50,      // Total expenses (positive/absolute)
 *         net: 2179.50            // income - expenses
 *       }
 *     ]
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { cashFlowParamsSchema } from "@/lib/validations/analytics";
import { getCashFlow } from "@/lib/queries/cash-flow";
import { validationError, handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      account_id: searchParams.get("account_id") ?? undefined,
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
      granularity: searchParams.get("granularity") ?? undefined,
    };

    // Validate parameters with Zod
    const parsed = cashFlowParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { account_id, start_date, end_date, granularity } = parsed.data;

    // Fetch cash flow data with filters
    const cashFlowData = await getCashFlow({
      accountIds: account_id,
      startDate: start_date,
      endDate: end_date,
      granularity,
    });

    return NextResponse.json({
      data: {
        cash_flow: cashFlowData,
      },
    });
  } catch (error) {
    return handleApiError(error, "fetch cash flow data", { context: "Cash Flow API" });
  }
}
