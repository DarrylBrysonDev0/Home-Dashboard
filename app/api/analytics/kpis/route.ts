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
 * Query params:
 * - account_id: comma-separated account IDs to filter by
 * - start_date: ISO date string for period start
 * - end_date: ISO date string for period end
 */

import { NextRequest, NextResponse } from "next/server";
import { kpiParamsSchema } from "@/lib/validations/analytics";
import { getKpis } from "@/lib/queries/analytics";

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
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid parameters" },
        { status: 400 }
      );
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
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPI data" },
      { status: 500 }
    );
  }
}
