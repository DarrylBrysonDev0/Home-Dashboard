/**
 * GET /api/reader/search - File search endpoint
 *
 * Searches files by name within the documentation directory.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * TODO: T058 - Implement this route
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder - implementation in T058
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
