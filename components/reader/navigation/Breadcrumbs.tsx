"use client";

/**
 * Breadcrumbs Component
 *
 * Displays the current file path as clickable breadcrumb segments.
 * Allows navigation to parent directories.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";

export interface BreadcrumbsProps {
  /** Current file path (e.g., "/docs/api/readme.md") */
  path: string | null;
  /** Handler for path segment click */
  onNavigate: (path: string) => void;
  /** Optional className for styling */
  className?: string;
}

interface BreadcrumbSegment {
  name: string;
  path: string;
}

/**
 * Maximum number of visible segments before collapsing middle ones
 * Shows: [first] ... [last N-1 segments]
 */
const MAX_VISIBLE_SEGMENTS = 3;

/**
 * Parse a path into breadcrumb segments
 */
function parsePathSegments(path: string): BreadcrumbSegment[] {
  if (!path || path === "/") {
    return [];
  }

  const segments: BreadcrumbSegment[] = [];
  const parts = path.split("/").filter(Boolean);
  let currentPath = "";

  for (const part of parts) {
    currentPath += `/${part}`;
    segments.push({
      name: part,
      path: currentPath,
    });
  }

  return segments;
}

export function Breadcrumbs({ path, onNavigate, className }: BreadcrumbsProps) {
  const segments = path ? parsePathSegments(path) : [];
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Reset expanded state when path changes
  React.useEffect(() => {
    setIsExpanded(false);
  }, [path]);

  // Determine if we need to collapse segments
  const needsCollapse = segments.length > MAX_VISIBLE_SEGMENTS;
  const shouldCollapse = needsCollapse && !isExpanded;

  // Calculate visible segments
  // When collapsed: show first segment, ellipsis, and last (MAX_VISIBLE_SEGMENTS - 1) segments
  const visibleSegments = React.useMemo(() => {
    if (!shouldCollapse) {
      return segments.map((segment, index) => ({
        ...segment,
        originalIndex: index,
      }));
    }

    // Keep first segment and last (MAX_VISIBLE_SEGMENTS - 1) segments
    const keepFromEnd = MAX_VISIBLE_SEGMENTS - 1;
    const firstSegment = { ...segments[0], originalIndex: 0 };
    const lastSegments = segments.slice(-keepFromEnd).map((segment, idx) => ({
      ...segment,
      originalIndex: segments.length - keepFromEnd + idx,
    }));

    return [firstSegment, ...lastSegments];
  }, [segments, shouldCollapse]);

  // Get collapsed (hidden) segments for the dropdown
  const collapsedSegments = React.useMemo(() => {
    if (!shouldCollapse) return [];
    const keepFromEnd = MAX_VISIBLE_SEGMENTS - 1;
    return segments.slice(1, -keepFromEnd);
  }, [segments, shouldCollapse]);

  return (
    <nav
      aria-label="Breadcrumb"
      data-testid="breadcrumbs"
      className={cn(
        "flex items-center gap-1 text-sm overflow-x-auto",
        "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
        className
      )}
    >
      {/* Home / Root */}
      <button
        type="button"
        onClick={() => onNavigate("/")}
        className={cn(
          "flex items-center gap-1 px-1.5 py-1 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
          "flex-shrink-0"
        )}
        aria-label="Go to root"
      >
        <Home className="h-4 w-4" />
      </button>

      {/* Path segments with collapse handling */}
      {visibleSegments.map((segment, visibleIndex) => {
        const isLast = segment.originalIndex === segments.length - 1;
        const showEllipsis = shouldCollapse && visibleIndex === 0;

        return (
          <React.Fragment key={segment.path}>
            <ChevronRight
              className="h-4 w-4 text-muted-foreground flex-shrink-0"
              aria-hidden="true"
            />
            {isLast ? (
              // Current page - not clickable
              <span
                className="px-1.5 py-1 font-medium text-foreground truncate max-w-[200px]"
                aria-current="page"
                title={segment.name}
              >
                {segment.name}
              </span>
            ) : (
              // Clickable parent segment
              <button
                type="button"
                onClick={() => onNavigate(segment.path)}
                className={cn(
                  "px-1.5 py-1 rounded-md truncate max-w-[150px]",
                  "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                )}
                title={segment.name}
              >
                {segment.name}
              </button>
            )}

            {/* Ellipsis button after first visible segment when collapsed */}
            {showEllipsis && (
              <>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground flex-shrink-0"
                  aria-hidden="true"
                />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className={cn(
                      "flex items-center px-1.5 py-1 rounded-md",
                      "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                    aria-label={`Show ${collapsedSegments.length} hidden path segments`}
                    title={`${collapsedSegments.length} hidden segments: ${collapsedSegments.map((s) => s.name).join(" / ")}`}
                    data-testid="breadcrumb-ellipsis"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
