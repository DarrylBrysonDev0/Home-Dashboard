/**
 * GET /api/reader/tree - Directory tree structure endpoint
 *
 * Returns the file/directory tree for navigation.
 * Supports lazy loading of subdirectories via path parameter.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 */

import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { FileSystemService } from "@/lib/reader/file-system.service";
import { treeQuerySchema } from "@/lib/validations/reader";
import type { FileNode } from "@/types/reader";

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryResult = treeQuerySchema.safeParse({
      path: searchParams.get("path") ?? "/",
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
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

    // Resolve to absolute path
    const absolutePath = fsService.resolvePath(requestedPath);

    // Check if path exists and is a directory
    let stats;
    try {
      stats = await stat(absolutePath);
    } catch {
      return NextResponse.json(
        { success: false, error: "Directory not found" },
        { status: 404 }
      );
    }

    if (!stats.isDirectory()) {
      return NextResponse.json(
        { success: false, error: "Path is a file, not a directory" },
        { status: 400 }
      );
    }

    // Read directory contents
    const entries = await readdir(absolutePath, { withFileTypes: true });

    // Filter and transform entries to FileNode[]
    const children: FileNode[] = [];

    for (const entry of entries) {
      // Skip hidden files and directories (starting with .)
      if (entry.name.startsWith(".")) {
        continue;
      }

      const entryPath = path.join(absolutePath, entry.name);
      const relativePath = fsService.normalizePath(
        "/" + path.relative(fsService["docsRoot"], entryPath)
      );

      if (entry.isDirectory()) {
        // Check if directory has children (supported files or subdirectories)
        const hasChildren = await checkHasChildren(entryPath, fsService);

        children.push({
          name: entry.name,
          path: relativePath,
          type: "directory",
          hasChildren,
        });
      } else if (entry.isFile()) {
        // Only include supported file types
        if (!fsService.isValidDocumentPath(entry.name)) {
          continue;
        }

        const fileStat = await stat(entryPath);
        const extension = fsService.getExtension(entry.name);

        children.push({
          name: entry.name,
          path: relativePath,
          type: "file",
          extension: extension as ".md" | ".mmd" | ".txt",
          size: fileStat.size,
          modifiedAt: fileStat.mtime.toISOString(),
        });
      }
    }

    // Sort: directories first, then files, both alphabetically
    children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "directory" ? -1 : 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        path: requestedPath,
        children,
      },
    });
  } catch (error) {
    console.error("Error in /api/reader/tree:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check if a directory has any supported children (files or subdirectories)
 */
async function checkHasChildren(
  dirPath: string,
  fsService: FileSystemService
): Promise<boolean> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden entries
      if (entry.name.startsWith(".")) {
        continue;
      }

      // Has subdirectory
      if (entry.isDirectory()) {
        return true;
      }

      // Has supported file
      if (entry.isFile() && fsService.isValidDocumentPath(entry.name)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
