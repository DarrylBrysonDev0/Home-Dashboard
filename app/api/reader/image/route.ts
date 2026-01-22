/**
 * GET /api/reader/image - Image serving endpoint
 *
 * Serves images from the documentation directory for relative image paths.
 * Only local images within DOCS_ROOT are allowed - external URLs are blocked.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, stat, access, constants } from "fs/promises";
import path from "path";
import { FileSystemService } from "@/lib/reader/file-system.service";
import { imageQuerySchema } from "@/lib/validations/reader";

/**
 * MIME types for supported image formats
 */
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const pathParam = searchParams.get("path");

    const queryResult = imageQuerySchema.safeParse({
      path: pathParam,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Image path parameter is required" },
        { status: 400 }
      );
    }

    const { path: requestedPath } = queryResult.data;

    // Initialize file system service
    let fsService: FileSystemService;
    try {
      fsService = new FileSystemService();
    } catch (error) {
      // DOCS_ROOT not configured - volume unavailable
      console.error("DOCS_ROOT not configured:", error);
      return NextResponse.json(
        { success: false, error: "Documentation volume is not available" },
        { status: 503 }
      );
    }

    // Check if DOCS_ROOT is accessible
    try {
      await access(fsService.getDocsRoot(), constants.R_OK);
    } catch {
      return NextResponse.json(
        { success: false, error: "Documentation volume is not accessible" },
        { status: 503 }
      );
    }

    // Validate path for security (path traversal, null bytes, etc.)
    try {
      fsService.validatePath(requestedPath);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Path traversal detected",
        },
        { status: 400 }
      );
    }

    // Check if file type is a supported image
    if (!fsService.isValidImagePath(requestedPath)) {
      return NextResponse.json(
        { success: false, error: "Unsupported image type" },
        { status: 400 }
      );
    }

    // Resolve to absolute path
    const absolutePath = fsService.resolvePath(requestedPath);

    // Check if file exists and is a file
    let fileStats;
    try {
      fileStats = await stat(absolutePath);
    } catch {
      return NextResponse.json(
        { success: false, error: "Image not found" },
        { status: 404 }
      );
    }

    if (!fileStats.isFile()) {
      return NextResponse.json(
        { success: false, error: "Path is not a file" },
        { status: 400 }
      );
    }

    // Read image file
    const imageBuffer = await readFile(absolutePath);

    // Get MIME type from extension
    const ext = path.extname(requestedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Return image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error in /api/reader/image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
