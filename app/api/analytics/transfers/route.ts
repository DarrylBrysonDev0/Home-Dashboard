/**
 * GET /api/analytics/transfers
 *
 * Returns transfer flows between accounts for Sankey diagram visualization
 * Matches source (outgoing) and destination (incoming) transfer pairs
 *
 * Performance: ~200ms uncached, ~5ms cached (30s TTL)
 * Uses self-join query for transfer pair matching.
 *
 * Query params:
 * - start_date: ISO date string for period start
 * - end_date: ISO date string for period end
 *
 * Response shape:
 * {
 *   data: {
 *     transfers: [
 *       {
 *         source_account_id: "ACC-JOINT-CHK",
 *         source_account_name: "Joint Checking",
 *         destination_account_id: "ACC-USER1-SAV",
 *         destination_account_name: "User1 Savings",
 *         total_amount: 1500.00,
 *         transfer_count: 3
 *       }
 *     ]
 *   }
 * }
 *
 * User Story 8: View Transfer Flow Between Accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { transferFlowParamsSchema } from "@/lib/validations/analytics";
import { getTransferFlows } from "@/lib/queries/transfers";
import { validationError, handleApiError } from "@/lib/api-errors";
import { transferCache, generateCacheKey, withCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
    };

    // Validate parameters with Zod
    const parsed = transferFlowParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { start_date, end_date } = parsed.data;

    // Generate cache key from validated params
    const cacheKey = generateCacheKey("transfers", { start_date, end_date });

    // Fetch transfer flows with caching (self-join query)
    const transfers = await withCache(
      transferCache,
      cacheKey,
      () => getTransferFlows({
        startDate: start_date,
        endDate: end_date,
      })
    );

    return NextResponse.json({
      data: {
        transfers,
      },
    });
  } catch (error) {
    return handleApiError(error, "fetch transfer flows", { context: "Transfers API" });
  }
}
