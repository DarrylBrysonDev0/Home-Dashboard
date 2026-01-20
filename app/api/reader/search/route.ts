/**
 * GET /api/reader/search - File search endpoint
 *
 * Searches for files by name within the docs root directory.
 * Supports case-insensitive matching with relevance-based sorting.
 *
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 */

import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";
import { FileSystemService } from "@/lib/reader/file-system.service";
import { searchQuerySchema } from "@/lib/validations/reader";
import type { FileNode } from "@/types/reader";

/**
 * Search result with relevance score for sorting
 */
interface SearchResult extends FileNode {
  relevance: number;
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;

    // Build query object, only including limit if present
    const queryObj: { q: string | null; limit?: string } = {
      q: searchParams.get("q"),
    };

    const limitParam = searchParams.get("limit");
    if (limitParam !== null) {
      queryObj.limit = limitParam;
    }

    const queryResult = searchQuerySchema.safeParse(queryObj);

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    const { q: query, limit } = queryResult.data;
    const fsService = new FileSystemService();

    // Recursively search for matching files
    const results = await searchFiles(
      fsService.getDocsRoot(),
      query.toLowerCase(),
      fsService
    );

    // Sort results by relevance (exact matches first), then alphabetically
    results.sort((a, b) => {
      // Higher relevance first
      if (a.relevance !== b.relevance) {
        return b.relevance - a.relevance;
      }
      // Then alphabetically
      return a.name.localeCompare(b.name);
    });

    // Apply limit
    const totalCount = results.length;
    const limitedResults = results.slice(0, limit);

    // Remove relevance score from response
    const data: FileNode[] = limitedResults.map(
      ({ relevance, ...rest }) => rest
    );

    return NextResponse.json({
      success: true,
      data,
      query,
      total: totalCount,
    });
  } catch (error) {
    console.error("Error in /api/reader/search:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Recursively search for files matching the query
 */
async function searchFiles(
  dirPath: string,
  query: string,
  fsService: FileSystemService,
  basePath: string = ""
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith(".")) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = basePath
        ? `${basePath}/${entry.name}`
        : `/${entry.name}`;

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subResults = await searchFiles(
          fullPath,
          query,
          fsService,
          relativePath
        );
        results.push(...subResults);
      } else if (entry.isFile()) {
        // Only include supported file types
        if (!fsService.isValidDocumentPath(entry.name)) {
          continue;
        }

        // Check if filename matches query (case-insensitive)
        const lowerName = entry.name.toLowerCase();

        if (lowerName.includes(query)) {
          const fileStat = await stat(fullPath);
          const extension = fsService.getExtension(entry.name);

          // Calculate relevance score
          const relevance = calculateRelevance(lowerName, query);

          results.push({
            name: entry.name,
            path: relativePath,
            type: "file",
            extension: extension as ".md" | ".mmd" | ".txt",
            size: fileStat.size,
            modifiedAt: fileStat.mtime.toISOString(),
            relevance,
          });
        }
      }
    }
  } catch (error) {
    // Silently skip directories we can't read
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return results;
}

/**
 * Calculate relevance score for search result sorting
 *
 * Higher score = more relevant:
 * - Exact filename match (without extension): 100
 * - Starts with query: 80
 * - Contains query: 50
 */
function calculateRelevance(filename: string, query: string): number {
  // Remove extension for comparison
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

  // Exact match (filename without extension equals query)
  if (nameWithoutExt === query) {
    return 100;
  }

  // Filename starts with query
  if (nameWithoutExt.startsWith(query)) {
    return 80;
  }

  // Query appears in filename
  return 50;
}
