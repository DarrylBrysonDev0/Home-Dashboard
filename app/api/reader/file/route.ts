/**
 * GET /api/reader/file - File content endpoint
 *
 * Returns the content of a markdown/text file for rendering.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { FileSystemService } from "@/lib/reader/file-system.service";
import { fileQuerySchema } from "@/lib/validations/reader";
import type { FileContent } from "@/types/reader";

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const pathParam = searchParams.get("path");

    const queryResult = fileQuerySchema.safeParse({
      path: pathParam,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Path parameter is required" },
        { status: 400 }
      );
    }

    const { path: requestedPath } = queryResult.data;
    const fsService = new FileSystemService();

    // Validate path for security
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

    // Check if file type is supported
    if (!fsService.isValidDocumentPath(requestedPath)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // Additional check: block .reader-prefs.json
    const filename = fsService.getFilename(requestedPath);
    if (filename === ".reader-prefs.json") {
      return NextResponse.json(
        { success: false, error: "Access to preferences file not allowed" },
        { status: 400 }
      );
    }

    // Resolve to absolute path
    const absolutePath = fsService.resolvePath(requestedPath);

    // Check if path exists
    let fileStats;
    try {
      fileStats = await stat(absolutePath);
    } catch {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    // Check if it's a file (not a directory)
    if (!fileStats.isFile()) {
      return NextResponse.json(
        { success: false, error: "Path is a directory, not a file" },
        { status: 400 }
      );
    }

    // Read file content
    const content = await readFile(absolutePath, "utf-8");
    const extension = fsService.getExtension(requestedPath) as
      | ".md"
      | ".mmd"
      | ".txt";

    const fileContent: FileContent = {
      path: requestedPath,
      name: filename,
      content,
      extension,
      modifiedAt: fileStats.mtime.toISOString(),
      size: fileStats.size,
    };

    return NextResponse.json({
      success: true,
      data: fileContent,
    });
  } catch (error) {
    console.error("Error in /api/reader/file:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
