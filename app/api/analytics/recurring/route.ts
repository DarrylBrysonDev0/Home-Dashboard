/**
 * GET /api/analytics/recurring
 *
 * Returns automatically detected recurring transaction patterns with confidence scores.
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
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid parameters" },
        { status: 400 }
      );
    }

    // Fetch recurring patterns with filters
    const patterns = await getRecurringPatterns(parsed.data);

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
    console.error("Error fetching recurring patterns:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring transaction patterns" },
      { status: 500 }
    );
  }
}
