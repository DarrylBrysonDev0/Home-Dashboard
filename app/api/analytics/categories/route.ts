/**
 * GET /api/analytics/categories
 *
 * Returns spending breakdown by category:
 * - total_expenses: Sum of all expense amounts (absolute values)
 * - categories: Array of category breakdowns with amounts and percentages
 *
 * Performance: ~90ms
 * Uses SQL GROUP BY for efficient aggregation.
 * Optimized with idx_category_date composite index.
 *
 * Query params:
 * - account_id: comma-separated account IDs to filter by
 * - start_date: ISO date string for period start
 * - end_date: ISO date string for period end
 * - include_subcategories: "true" to include subcategory breakdown
 *
 * CRITICAL: Only Expense transactions are included.
 * Transfer and Income transactions are EXCLUDED from category breakdown.
 */

import { NextRequest, NextResponse } from "next/server";
import { categoryParamsSchema } from "@/lib/validations/analytics";
import { getCategoryBreakdown } from "@/lib/queries/categories";
import { validationError, handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      account_id: searchParams.get("account_id") ?? undefined,
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
      include_subcategories: searchParams.get("include_subcategories") ?? undefined,
    };

    // Validate parameters with Zod
    const parsed = categoryParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { account_id, start_date, end_date, include_subcategories } = parsed.data;

    // Fetch category breakdown with filters
    const result = await getCategoryBreakdown({
      accountIds: account_id,
      startDate: start_date,
      endDate: end_date,
      includeSubcategories: include_subcategories,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error, "fetch category data", { context: "Categories API" });
  }
}
