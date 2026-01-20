"use client";

/**
 * ReaderLayout Component
 *
 * Main orchestrator component that combines navigation and content areas.
 * Manages the overall reader interface layout with optional table of contents.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1, User Story 4
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { List, X } from "lucide-react";
import { NavigationPane } from "./navigation/NavigationPane";
import { Breadcrumbs } from "./navigation/Breadcrumbs";
import { ContentViewer } from "./content/ContentViewer";
import { TableOfContents } from "./content/TableOfContents";
import { useReader } from "@/lib/contexts/ReaderContext";
import type { FileNode, DocumentHeading } from "@/types/reader";

export interface ReaderLayoutProps {
  /** Initial file tree data from server */
  initialTree: FileNode[];
  /** Optional className for styling */
  className?: string;
}

export function ReaderLayout({ initialTree, className }: ReaderLayoutProps) {
  const {
    currentPath,
    currentFile,
    expandedPaths,
    isLoading,
    error,
    displayMode,
    tocVisible,
    headings,
    searchQuery,
    searchResults,
    selectFile,
    toggleExpand,
    toggleToc,
    setHeadings,
    setSearchQuery,
    clearSearch,
  } = useReader();

  // Track file tree with loaded children
  const [fileTree, setFileTree] = React.useState<FileNode[]>(initialTree);
  const [loadingPaths, setLoadingPaths] = React.useState<Set<string>>(
    new Set()
  );

  // Track active heading for TOC highlighting
  const [activeHeadingId, setActiveHeadingId] = React.useState<string | undefined>();

  // Handle headings extracted from markdown content
  const handleHeadingsExtracted = React.useCallback(
    (extractedHeadings: DocumentHeading[]) => {
      setHeadings(extractedHeadings);
    },
    [setHeadings]
  );

  // Handle TOC heading click
  const handleTocHeadingClick = React.useCallback((headingId: string) => {
    setActiveHeadingId(headingId);
  }, []);

  // Handle directory expansion with lazy loading
  const handleExpandToggle = React.useCallback(
    async (path: string) => {
      toggleExpand(path);

      // If expanding and directory hasn't been loaded yet, fetch children
      if (!expandedPaths.has(path)) {
        const node = findNodeByPath(fileTree, path);
        if (node && node.type === "directory" && !node.children) {
          setLoadingPaths((prev) => new Set(prev).add(path));

          try {
            const response = await fetch(
              `/api/reader/tree?path=${encodeURIComponent(path)}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.children) {
                setFileTree((prev) =>
                  updateNodeChildren(prev, path, data.data.children)
                );
              }
            }
          } catch (err) {
            console.error("Failed to load directory:", err);
          } finally {
            setLoadingPaths((prev) => {
              const next = new Set(prev);
              next.delete(path);
              return next;
            });
          }
        }
      }
    },
    [expandedPaths, fileTree, toggleExpand]
  );

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = React.useCallback(
    (path: string) => {
      // If navigating to a directory, expand it
      if (path === "/" || !path.includes(".")) {
        handleExpandToggle(path);
      } else {
        // If navigating to a file, select it
        selectFile(path);
      }
    },
    [handleExpandToggle, selectFile]
  );

  // Determine if TOC should be shown (only for markdown files with headings)
  const showToc =
    currentFile?.extension === ".md" && headings.length > 0 && tocVisible;

  return (
    <div
      className={cn(
        "flex h-full bg-background",
        className
      )}
    >
      {/* Navigation Sidebar */}
      <NavigationPane
        nodes={fileTree}
        selectedPath={currentPath}
        expandedPaths={expandedPaths}
        loadingPaths={loadingPaths}
        onFileSelect={selectFile}
        onExpandToggle={handleExpandToggle}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isLoading && searchQuery.length > 0}
        onSearch={setSearchQuery}
        onClearSearch={clearSearch}
        className="w-64 flex-shrink-0 hidden md:flex"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Breadcrumbs Header with TOC Toggle */}
        <header className="flex-shrink-0 border-b border-border px-4 py-2 flex items-center justify-between">
          <Breadcrumbs
            path={currentPath}
            onNavigate={handleBreadcrumbNavigate}
          />

          {/* TOC Toggle Button - only visible when there are headings */}
          {currentFile?.extension === ".md" && headings.length > 0 && (
            <button
              type="button"
              onClick={toggleToc}
              aria-label={tocVisible ? "Hide table of contents" : "Show table of contents"}
              aria-pressed={tocVisible}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tocVisible ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              {tocVisible ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <List className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </header>

        {/* Content Area with optional TOC sidebar */}
        <div className="flex-1 min-h-0 flex">
          {/* Content Viewer */}
          <div className={cn(
            "flex-1 min-w-0 overflow-hidden",
            showToc && "lg:pr-0"
          )}>
            <ContentViewer
              file={currentFile}
              isLoading={isLoading}
              error={error}
              displayMode={displayMode}
              onHeadingsExtracted={handleHeadingsExtracted}
            />
          </div>

          {/* Table of Contents Sidebar - hidden on narrow viewports */}
          {showToc && (
            <aside
              className={cn(
                "w-56 flex-shrink-0 border-l border-border overflow-y-auto p-4",
                "hidden lg:block"
              )}
            >
              <TableOfContents
                headings={headings}
                activeHeadingId={activeHeadingId}
                onHeadingClick={handleTocHeadingClick}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Find a node in the tree by path
 */
function findNodeByPath(
  nodes: FileNode[],
  path: string
): FileNode | undefined {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Update children of a node in the tree (immutable update)
 */
function updateNodeChildren(
  nodes: FileNode[],
  path: string,
  children: FileNode[]
): FileNode[] {
  return nodes.map((node) => {
    if (node.path === path) {
      return { ...node, children, isLoaded: true };
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeChildren(node.children, path, children),
      };
    }
    return node;
  });
}
