"use client";

/**
 * NavigationPane Component
 *
 * Container for file tree navigation, search, and quick access sections.
 * Provides the main navigation sidebar for the reader.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1, User Story 5
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { FileText, Folder } from "lucide-react";
import { FileTree } from "./FileTree";
import { SearchInput } from "./SearchInput";
import type { FileNode } from "@/types/reader";

export interface NavigationPaneProps {
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
  /** Optional className for styling */
  className?: string;
}

export function NavigationPane({
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
  className,
}: NavigationPaneProps) {
  const isSearchActive = searchQuery.trim().length > 0;

  // Handle search result click
  const handleResultClick = React.useCallback(
    (path: string) => {
      onFileSelect(path);
      // Don't clear search - let user see where they clicked from
    },
    [onFileSelect]
  );

  // Handle clear search
  const handleClearSearch = React.useCallback(() => {
    onClearSearch?.();
  }, [onClearSearch]);

  return (
    <aside
      className={cn(
        "flex flex-col h-full",
        "border-r border-border bg-background",
        className
      )}
      aria-label="File navigation"
    >
      {/* Header with Search */}
      <div className="flex-shrink-0 p-3 border-b border-border space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Documents</h2>
        {onSearch && (
          <SearchInput
            value={searchQuery}
            onSearch={onSearch}
            onClear={handleClearSearch}
            isLoading={isSearching}
            placeholder="Search files..."
          />
        )}
      </div>

      {/* Content Area: Search Results or File Tree */}
      <div className="flex-1 overflow-y-auto">
        {isSearchActive ? (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            selectedPath={selectedPath}
            isLoading={isSearching}
            onResultClick={handleResultClick}
          />
        ) : (
          <FileTree
            nodes={nodes}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            loadingPaths={loadingPaths}
            onFileSelect={onFileSelect}
            onExpandToggle={onExpandToggle}
          />
        )}
      </div>
    </aside>
  );
}

/**
 * SearchResults Component
 *
 * Displays search results with match highlighting and empty state.
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

  // Loading state (show results count while loading more)
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
              {result.type === "directory" ? (
                <Folder className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
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

export default NavigationPane;
