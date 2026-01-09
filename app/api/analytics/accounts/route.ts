/**
 * GET /api/analytics/accounts
 *
 * Returns account balance trends over time for multi-line chart visualization
 * Unlike cash flow, transfers ARE included (they affect individual account balances)
 *
 * Performance: ~85ms
 * Uses balance_after field for point-in-time snapshots.
 * Optimized with idx_date_account composite index.
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
 *     accounts: [
 *       {
 *         account_id: "ACC-JOINT-CHK",
 *         account_name: "Joint Checking",
 *         balances: [
 *           { date: "2024-01-31", balance: 5000.00 },
 *           { date: "2024-02-29", balance: 10000.00 }
 *         ]
 *       }
 *     ]
 *   }
 * }
 *
 * User Story 5: Track Account Balance Trends
 */

import { NextRequest, NextResponse } from "next/server";
import { accountTrendsParamsSchema } from "@/lib/validations/analytics";
import { getAccountBalanceTrends } from "@/lib/queries/balance-trends";
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
    const parsed = accountTrendsParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { account_id, start_date, end_date, granularity } = parsed.data;

    // Fetch account balance trends with filters
    const accountTrends = await getAccountBalanceTrends({
      accountIds: account_id,
      startDate: start_date,
      endDate: end_date,
      granularity,
    });

    return NextResponse.json({
      data: {
        accounts: accountTrends,
      },
    });
  } catch (error) {
    return handleApiError(error, "fetch account balance trends", { context: "Accounts API" });
  }
}
