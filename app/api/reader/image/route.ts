/**
 * GET /api/reader/image - Image serving endpoint
 *
 * Serves images from the documentation directory for relative image paths.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * TODO: T097 - Implement this route
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Placeholder - implementation in T097
  return NextResponse.json(
    { success: false, error: "Not implemented" },
    { status: 501 }
  );
}
