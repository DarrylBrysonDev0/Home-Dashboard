/**
 * GET/PUT /api/reader/preferences - User preferences endpoint
 *
 * Manages reader preferences (favorites, recents, display mode).
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 * @see specs/005-markdown-reader/spec.md User Story 7
 */

import { NextRequest, NextResponse } from "next/server";
import { PreferencesService } from "@/lib/reader/preferences.service";
import {
  preferencesUpdateSchema,
  type PreferencesResponse,
  type ErrorResponse,
} from "@/lib/validations/reader";

/**
 * GET /api/reader/preferences
 *
 * Returns current user preferences (favorites, recents, display mode).
 */
export async function GET(): Promise<NextResponse<PreferencesResponse | ErrorResponse>> {
  try {
    const service = new PreferencesService();
    const preferences = await service.getPreferences();

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load preferences";

    // Check if DOCS_ROOT is not configured
    if (message.includes("DOCS_ROOT")) {
      return NextResponse.json(
        { success: false, error: "Documentation root not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reader/preferences
 *
 * Updates user preferences with partial data.
 * Merges provided fields with existing preferences.
 */
export async function PUT(
  request: NextRequest
): Promise<NextResponse<PreferencesResponse | ErrorResponse>> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate request body
    const parseResult = preferencesUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      // Zod uses 'issues' property for validation errors
      const issues = parseResult.error.issues || [];
      const firstIssue = issues[0];
      const errorMessage = firstIssue?.message || parseResult.error.message || "Validation failed";

      return NextResponse.json(
        {
          success: false,
          error: `Invalid preferences: ${errorMessage}`,
        },
        { status: 400 }
      );
    }

    const update = parseResult.data;
    const service = new PreferencesService();

    // If recents are provided, enforce max 10 limit
    if (update.recents && update.recents.length > 10) {
      update.recents = update.recents.slice(0, 10);
    }

    // Update preferences
    await service.updatePreferences(update);

    // Return updated preferences
    const preferences = await service.getPreferences();

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update preferences";

    // Check if DOCS_ROOT is not configured
    if (message.includes("DOCS_ROOT")) {
      return NextResponse.json(
        { success: false, error: "Documentation root not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
