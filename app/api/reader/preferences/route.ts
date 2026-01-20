/**
 * GET/PUT /api/reader/preferences - User preferences endpoint
 *
 * Manages reader preferences (favorites, recents, display mode).
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * TODO: T074 - Implement GET
 * TODO: T075 - Implement PUT
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder - implementation in T074
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}

export async function PUT() {
  // Placeholder - implementation in T075
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
