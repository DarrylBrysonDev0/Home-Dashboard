/**
 * Reader Default Page
 *
 * Server component that displays the reader with no file selected.
 * Shows the file tree and empty state for content area.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import { ReaderLayout } from "@/components/reader/ReaderLayout";
import { FileSystemService } from "@/lib/reader/file-system.service";
import { readdir, stat } from "fs/promises";
import path from "path";
import type { FileNode } from "@/types/reader";

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
      // Skip hidden files and directories
      if (entry.name.startsWith(".")) {
        continue;
      }

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

    // Sort: directories first, then files, both alphabetically
    children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
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

export default async function ReaderPage() {
  const initialTree = await getInitialTree();

  return <ReaderLayout initialTree={initialTree} />;
}
