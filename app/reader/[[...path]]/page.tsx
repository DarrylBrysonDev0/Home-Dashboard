/**
 * Reader Dynamic Path Page
 *
 * Server component that handles viewing specific files.
 * Pre-loads the requested file content for optimal performance.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import { ReaderLayout } from "@/components/reader/ReaderLayout";
import { FileSystemService } from "@/lib/reader/file-system.service";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";
import { redirect } from "next/navigation";
import type { FileNode } from "@/types/reader";

interface PageProps {
  params: Promise<{
    path?: string[];
  }>;
}

/**
 * Fetch initial file tree from the root directory
 */
async function getInitialTree(): Promise<FileNode[]> {
  try {
    const fsService = new FileSystemService();
    const docsRoot = process.env.DOCS_ROOT;

    if (!docsRoot) {
      return [];
    }

    const entries = await readdir(docsRoot, { withFileTypes: true });
    const children: FileNode[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;

      const entryPath = path.join(docsRoot, entry.name);
      const relativePath = "/" + entry.name;

      if (entry.isDirectory()) {
        const hasChildren = await checkHasChildren(entryPath, fsService);
        children.push({
          name: entry.name,
          path: relativePath,
          type: "directory",
          hasChildren,
        });
      } else if (entry.isFile() && fsService.isValidDocumentPath(entry.name)) {
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

    children.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "directory" ? -1 : 1;
    });

    return children;
  } catch {
    return [];
  }
}

async function checkHasChildren(
  dirPath: string,
  fsService: FileSystemService
): Promise<boolean> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.isDirectory()) return true;
      if (entry.isFile() && fsService.isValidDocumentPath(entry.name)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export default async function ReaderPathPage({ params }: PageProps) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path || [];
  const initialTree = await getInitialTree();

  // If no path segments, show empty state (reader root)
  if (pathSegments.length === 0) {
    return <ReaderLayout initialTree={initialTree} />;
  }

  const requestedPath = "/" + pathSegments.join("/");

  // Validate the path
  const fsService = new FileSystemService();

  try {
    fsService.validatePath(requestedPath);
  } catch {
    // Invalid path - redirect to reader root
    redirect("/reader");
  }

  // Check if the path is a valid document
  if (!fsService.isValidDocumentPath(requestedPath)) {
    // Not a document - might be a directory, redirect to reader root
    redirect("/reader");
  }

  // Try to resolve and verify file exists
  try {
    const absolutePath = fsService.resolvePath(requestedPath);
    const fileStats = await stat(absolutePath);

    if (!fileStats.isFile()) {
      redirect("/reader");
    }
  } catch {
    // File doesn't exist
    redirect("/reader");
  }

  // Note: The actual file loading happens in ReaderContext via selectFile
  // This page just validates the URL and renders the layout
  return <ReaderLayout initialTree={initialTree} />;
}
