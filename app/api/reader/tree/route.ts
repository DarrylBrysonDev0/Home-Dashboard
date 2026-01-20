/**
 * GET /api/reader/tree - Directory tree structure endpoint
 *
 * Returns the file/directory tree for navigation.
 * Supports lazy loading of subdirectories via path parameter.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * TODO: T018 - Implement this route
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder - implementation in T018
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
