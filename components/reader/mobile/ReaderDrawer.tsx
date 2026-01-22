"use client";

/**
 * ReaderDrawer Component
 *
 * Mobile slide-out drawer for reader navigation on viewports below 768px.
 * Contains file tree, search, favorites, and recent files.
 *
 * Uses shadcn Sheet component for accessibility and animations.
 *
 * @see specs/005-markdown-reader/spec.md User Story 8
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { FileTree } from "../navigation/FileTree";
import { SearchInput } from "../navigation/SearchInput";
import { RecentFiles } from "../navigation/RecentFiles";
import { Favorites } from "../navigation/Favorites";
import type { FileNode, RecentFile, Favorite } from "@/types/reader";

export interface ReaderDrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Callback to close drawer */
  onClose: () => void;
  /** File tree data */
  nodes: FileNode[];
  /** Currently selected file path */
  selectedPath?: string | null;
  /** Set of expanded directory paths */
  expandedPaths?: Set<string>;
  /** Set of paths currently loading children */
  loadingPaths?: Set<string>;
  /** Handler for file selection */
  onFileSelect: (path: string) => void;
  /** Handler for directory expand/collapse toggle */
  onExpandToggle: (path: string) => void;
  /** Search query string */
  searchQuery?: string;
  /** Search results */
  searchResults?: FileNode[];
  /** Whether search is loading */
  isSearching?: boolean;
  /** Handler for search query changes */
  onSearch?: (query: string) => void;
  /** Handler for clearing search */
  onClearSearch?: () => void;
  /** Recent files list */
  recentFiles?: RecentFile[];
  /** Favorite files list */
  favorites?: Favorite[];
  /** Handler for removing a favorite */
  onRemoveFavorite?: (path: string) => void;
}

export function ReaderDrawer({
  isOpen,
  onClose,
  nodes,
  selectedPath,
  expandedPaths,
  loadingPaths,
  onFileSelect,
  onExpandToggle,
  searchQuery = "",
  searchResults = [],
  isSearching = false,
  onSearch,
  onClearSearch,
  recentFiles = [],
  favorites = [],
  onRemoveFavorite,
}: ReaderDrawerProps) {
  const isSearchActive = searchQuery.trim().length > 0;

  /**
   * Handle file selection - closes drawer after selection
   */
  const handleFileSelect = React.useCallback(
    (path: string) => {
      onFileSelect(path);
      onClose();
    },
    [onFileSelect, onClose]
  );

  /**
   * Handle search result click - closes drawer after selection
   */
  const handleSearchResultClick = React.useCallback(
    (path: string) => {
      onFileSelect(path);
      onClose();
    },
    [onFileSelect, onClose]
  );

  /**
   * Handle recent file selection - closes drawer after selection
   */
  const handleRecentSelect = React.useCallback(
    (path: string) => {
      onFileSelect(path);
      onClose();
    },
    [onFileSelect, onClose]
  );

  /**
   * Handle favorite selection - closes drawer after selection
   */
  const handleFavoriteSelect = React.useCallback(
    (path: string) => {
      onFileSelect(path);
      onClose();
    },
    [onFileSelect, onClose]
  );

  /**
   * Handle clear search
   */
  const handleClearSearch = React.useCallback(() => {
    onClearSearch?.();
  }, [onClearSearch]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        data-testid="reader-drawer"
        className={cn(
          "flex flex-col w-[280px] sm:w-[320px] p-0",
          // Custom animation duration closer to 200ms
          "data-[state=closed]:duration-200 data-[state=open]:duration-200"
        )}
      >
        {/* Header with Search */}
        <SheetHeader className="flex-shrink-0 p-3 border-b border-border">
          <SheetTitle className="text-sm font-semibold text-foreground text-left">
            Documents
          </SheetTitle>
          <SheetDescription className="sr-only">
            Browse documentation files, search, and access favorites
          </SheetDescription>
          {onSearch && (
            <SearchInput
              value={searchQuery}
              onSearch={onSearch}
              onClear={handleClearSearch}
              isLoading={isSearching}
              placeholder="Search files..."
            />
          )}
        </SheetHeader>

        {/* Content Area: Search Results or File Tree + Quick Access */}
        <div className="flex-1 overflow-y-auto">
          {isSearchActive ? (
            <SearchResults
              results={searchResults}
              query={searchQuery}
              selectedPath={selectedPath}
              isLoading={isSearching}
              onResultClick={handleSearchResultClick}
            />
          ) : (
            <div className="flex flex-col">
              {/* Quick Access: Favorites */}
              {favorites.length > 0 && (
                <div className="border-b border-border py-2 px-1">
                  <Favorites
                    favorites={favorites}
                    onSelect={handleFavoriteSelect}
                    onRemove={onRemoveFavorite || (() => {})}
                    currentPath={selectedPath ?? undefined}
                  />
                </div>
              )}

              {/* Quick Access: Recent Files */}
              {recentFiles.length > 0 && (
                <div className="border-b border-border py-2 px-1">
                  <RecentFiles
                    recents={recentFiles}
                    onSelect={handleRecentSelect}
                    currentPath={selectedPath ?? undefined}
                    maxItems={5}
                  />
                </div>
              )}

              {/* File Tree */}
              <div className="py-2">
                <FileTree
                  nodes={nodes}
                  selectedPath={selectedPath}
                  expandedPaths={expandedPaths}
                  loadingPaths={loadingPaths}
                  onFileSelect={handleFileSelect}
                  onExpandToggle={onExpandToggle}
                />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * SearchResults Component
 *
 * Displays search results with match highlighting and empty state.
 * Duplicated from NavigationPane to handle drawer-specific behavior.
 */
interface SearchResultsProps {
  results: FileNode[];
  query: string;
  selectedPath?: string | null;
  isLoading: boolean;
  onResultClick: (path: string) => void;
}

function SearchResults({
  results,
  query,
  selectedPath,
  isLoading,
  onResultClick,
}: SearchResultsProps) {
  // Empty state
  if (!isLoading && results.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center"
        data-testid="search-empty-state"
      >
        <p className="text-sm text-muted-foreground">No files found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ul className="space-y-0.5" role="list" aria-label="Search results">
        {results.map((result) => (
          <li key={result.path}>
            <button
              type="button"
              onClick={() => onResultClick(result.path)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm",
                "hover:bg-muted transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                selectedPath === result.path && "bg-muted/50 text-primary"
              )}
            >
              <div className="flex-1 min-w-0">
                <HighlightedText text={result.name} query={query} />
                <p className="text-xs text-muted-foreground truncate">
                  {result.path}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {!isLoading && (
        <p className="px-3 py-2 text-xs text-muted-foreground">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

/**
 * HighlightedText Component
 *
 * Highlights matching portions of text in search results.
 */
interface HighlightedTextProps {
  text: string;
  query: string;
}

function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query.trim()) {
    return <span className="truncate">{text}</span>;
  }

  // Case-insensitive match
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);

  return (
    <span className="truncate">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default ReaderDrawer;
