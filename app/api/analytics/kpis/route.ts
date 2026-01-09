/**
 * GET /api/analytics/kpis
 *
 * Returns KPI metrics for the dashboard:
 * - Net cash flow (income - expenses)
 * - Total balance across accounts
 * - Month-over-month change (percentage + trend)
 * - Recurring expenses total
 * - Largest expense details
 *
 * Performance: ~20ms (5 parallel queries)
 * Uses Promise.all for parallel query execution.
 * Queries optimized with composite indexes: idx_date_account, idx_type_date, idx_recurring
 *
 * Query params:
 * - account_id: comma-separated account IDs to filter by
 * - start_date: ISO date string for period start
 * - end_date: ISO date string for period end
 */

import { NextRequest, NextResponse } from "next/server";
import { kpiParamsSchema } from "@/lib/validations/analytics";
import { getKpis } from "@/lib/queries/analytics";
import { validationError, handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      account_id: searchParams.get("account_id") ?? undefined,
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
    };

    // Validate parameters with Zod
    const parsed = kpiParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { account_id, start_date, end_date } = parsed.data;

    // Fetch KPIs with filters
    const kpis = await getKpis({
      accountIds: account_id,
      startDate: start_date,
      endDate: end_date,
    });

    return NextResponse.json({ data: kpis });
  } catch (error) {
    return handleApiError(error, "fetch KPI data", { context: "KPIs API" });
  }
}
