/**
 * POST /api/analytics/recurring/{pattern_id}/confirm
 *
 * Manually confirm a recurring transaction pattern.
 * This marks the pattern as user-verified, boosting its visibility.
 *
 * Path params:
 * - pattern_id: integer ID of the pattern to confirm
 *
 * Response:
 * - 200: { data: { message: "Recurring pattern confirmed", pattern_id: number } }
 * - 400: { error: "Invalid pattern ID" }
 * - 404: { error: "Recurring pattern not found" }
 */

import { NextRequest, NextResponse } from "next/server";
import { patternIdSchema } from "@/lib/validations/recurring";
import { confirmPattern, patternExists } from "@/lib/queries/recurring";
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

    // Confirm the pattern
    await confirmPattern(patternId);

    return NextResponse.json({
      data: {
        message: "Recurring pattern confirmed",
        pattern_id: patternId,
      },
    });
  } catch (error) {
    return handleApiError(error, "confirm recurring pattern", { context: "Recurring Confirm API" });
  }
}
