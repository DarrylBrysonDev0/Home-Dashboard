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
import { ChevronRight, Home } from "lucide-react";

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

  return (
    <nav
      aria-label="Breadcrumb"
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

      {/* Path segments */}
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;

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
          </React.Fragment>
        );
      })}
    </nav>
  );
}
