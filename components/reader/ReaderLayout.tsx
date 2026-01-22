"use client";

/**
 * ReaderLayout Component
 *
 * Main orchestrator component that combines navigation and content areas.
 * Manages the overall reader interface layout with optional table of contents.
 * Includes mobile drawer navigation for viewports below 768px.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1, User Story 4, User Story 8, User Story 9
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { List, X, Menu } from "lucide-react";
import { NavigationPane } from "./navigation/NavigationPane";
import { Breadcrumbs } from "./navigation/Breadcrumbs";
import { ContentViewer } from "./content/ContentViewer";
import { TableOfContents } from "./content/TableOfContents";
import { DisplayModeToggle } from "./controls/DisplayModeToggle";
import { FavoriteToggle } from "./controls/FavoriteToggle";
import { RefreshButton } from "./controls/RefreshButton";
import { ReaderDrawer } from "./mobile/ReaderDrawer";
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
    navPaneVisible,
    headings,
    searchQuery,
    searchResults,
    recentFiles,
    favorites,
    selectFile,
    toggleExpand,
    toggleToc,
    toggleNavPane,
    setHeadings,
    setSearchQuery,
    clearSearch,
    setDisplayMode,
    toggleFavorite,
    isFavorite,
    refreshContent,
  } = useReader();

  // Track refreshing state
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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

  // Handle removing a favorite (looks up name from favorites array)
  const handleRemoveFavorite = React.useCallback(
    (path: string) => {
      const favorite = favorites.find((f) => f.path === path);
      if (favorite) {
        toggleFavorite(path, favorite.name);
      }
    },
    [favorites, toggleFavorite]
  );

  // Determine if TOC should be shown (only for markdown files with headings)
  const showToc =
    currentFile?.extension === ".md" && headings.length > 0 && tocVisible;

  // Handle refresh content with loading state
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshContent();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshContent]);

  // Handle file selection from drawer (closes drawer)
  const handleDrawerFileSelect = React.useCallback(
    (path: string) => {
      selectFile(path);
    },
    [selectFile]
  );

  // Handle close drawer
  const handleCloseDrawer = React.useCallback(() => {
    if (navPaneVisible) {
      toggleNavPane();
    }
  }, [navPaneVisible, toggleNavPane]);

  // Handle open drawer
  const handleOpenDrawer = React.useCallback(() => {
    if (!navPaneVisible) {
      toggleNavPane();
    }
  }, [navPaneVisible, toggleNavPane]);

  return (
    <div
      className={cn(
        "flex h-full bg-background",
        className
      )}
    >
      {/* Mobile Navigation Drawer */}
      <ReaderDrawer
        isOpen={navPaneVisible}
        onClose={handleCloseDrawer}
        nodes={fileTree}
        selectedPath={currentPath}
        expandedPaths={expandedPaths}
        loadingPaths={loadingPaths}
        onFileSelect={handleDrawerFileSelect}
        onExpandToggle={handleExpandToggle}
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isLoading && searchQuery.length > 0}
        onSearch={setSearchQuery}
        onClearSearch={clearSearch}
        recentFiles={recentFiles}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
      />

      {/* Navigation Sidebar - hidden on mobile */}
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
        recentFiles={recentFiles}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
        className="w-64 flex-shrink-0 hidden md:flex"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Breadcrumbs Header with Controls */}
        <header className="flex-shrink-0 border-b border-border px-4 py-2 flex items-center justify-between gap-2">
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            data-testid="reader-menu-button"
            onClick={handleOpenDrawer}
            aria-label="Open navigation menu"
            className={cn(
              "p-1.5 rounded-md transition-colors md:hidden",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <Breadcrumbs
            path={currentPath}
            onNavigate={handleBreadcrumbNavigate}
            className="flex-1 min-w-0"
          />

          {/* Control buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Refresh Button - visible when a file is selected */}
            {currentFile && (
              <RefreshButton
                onRefresh={handleRefresh}
                loading={isRefreshing}
              />
            )}

            {/* Favorite Toggle - visible when a file is selected */}
            {currentFile && currentPath && (
              <FavoriteToggle
                isFavorite={isFavorite(currentPath)}
                onToggle={() => toggleFavorite(currentPath, currentFile.name)}
              />
            )}

            {/* Display Mode Toggle */}
            <DisplayModeToggle
              mode={displayMode}
              onModeChange={setDisplayMode}
            />

            {/* TOC Toggle Button - only visible when there are headings (hidden on mobile) */}
            {currentFile?.extension === ".md" && headings.length > 0 && (
              <button
                type="button"
                onClick={toggleToc}
                aria-label={tocVisible ? "Hide table of contents" : "Show table of contents"}
                aria-pressed={tocVisible}
                className={cn(
                  "p-1.5 rounded-md transition-colors hidden sm:block",
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
          </div>
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
