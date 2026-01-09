/**
 * GET /api/analytics/recurring
 *
 * Returns automatically detected recurring transaction patterns with confidence scores.
 *
 * Performance: ~200ms uncached, ~5ms cached (30s TTL)
 * This is the most expensive analytics endpoint due to the pattern detection algorithm.
 *
 * Query params:
 * - account_id: comma-separated account IDs to filter by
 * - confidence_level: filter by High, Medium, or Low
 * - frequency: filter by Weekly, Biweekly, or Monthly
 *
 * Response:
 * - data.recurring_transactions: array of detected patterns with:
 *   - pattern_id, description_pattern, account_id, category
 *   - avg_amount, frequency, next_expected_date
 *   - confidence_level, confidence_score, occurrence_count
 *   - last_occurrence_date, is_confirmed, is_rejected
 */

import { NextRequest, NextResponse } from "next/server";
import { recurringParamsSchema } from "@/lib/validations/recurring";
import { getRecurringPatterns } from "@/lib/queries/recurring";
import { validationError, handleApiError } from "@/lib/api-errors";
import { recurringCache, generateCacheKey, withCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const rawParams = {
      account_id: searchParams.get("account_id") ?? undefined,
      confidence_level: searchParams.get("confidence_level") ?? undefined,
      frequency: searchParams.get("frequency") ?? undefined,
    };

    // Validate parameters with Zod
    const parsed = recurringParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    // Generate cache key from validated params
    const cacheKey = generateCacheKey("recurring", parsed.data);

    // Fetch recurring patterns with caching (expensive algorithm)
    const patterns = await withCache(
      recurringCache,
      cacheKey,
      () => getRecurringPatterns(parsed.data)
    );

    // Format dates as ISO strings for JSON serialization
    const formattedPatterns = patterns.map((pattern) => ({
      ...pattern,
      next_expected_date: pattern.next_expected_date.toISOString().split("T")[0],
      last_occurrence_date: pattern.last_occurrence_date.toISOString().split("T")[0],
    }));

    return NextResponse.json({
      data: {
        recurring_transactions: formattedPatterns,
      },
    });
  } catch (error) {
    return handleApiError(error, "fetch recurring transaction patterns", { context: "Recurring API" });
  }
}
