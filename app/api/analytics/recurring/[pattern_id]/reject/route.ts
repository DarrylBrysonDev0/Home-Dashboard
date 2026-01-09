/**
 * POST /api/analytics/recurring/{pattern_id}/reject
 *
 * Manually reject a recurring transaction pattern.
 * This marks the pattern as a false positive, potentially excluding it from future detection.
 *
 * Path params:
 * - pattern_id: integer ID of the pattern to reject
 *
 * Response:
 * - 200: { data: { message: "Recurring pattern rejected", pattern_id: number } }
 * - 400: { error: "Invalid pattern ID" }
 * - 404: { error: "Recurring pattern not found" }
 */

import { NextRequest, NextResponse } from "next/server";
import { patternIdSchema } from "@/lib/validations/recurring";
import { rejectPattern, patternExists } from "@/lib/queries/recurring";
import { validationError, notFoundError, handleApiError } from "@/lib/api-errors";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ pattern_id: string }> }
) {
  try {
    const { pattern_id } = await context.params;

    // Validate pattern_id is a valid positive integer
    const parsed = patternIdSchema.safeParse(pattern_id);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const patternId = parsed.data;

    // Check if pattern exists
    const exists = await patternExists(patternId);
    if (!exists) {
      return notFoundError("Recurring pattern");
    }

    // Reject the pattern
    await rejectPattern(patternId);

    return NextResponse.json({
      data: {
        message: "Recurring pattern rejected",
        pattern_id: patternId,
      },
    });
  } catch (error) {
    return handleApiError(error, "reject recurring pattern", { context: "Recurring Reject API" });
  }
}
