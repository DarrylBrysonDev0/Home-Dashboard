"use client";

/**
 * TableOfContents Component
 *
 * Auto-generated table of contents from document headings with
 * hierarchical display and click-to-scroll navigation.
 *
 * @see specs/005-markdown-reader/spec.md User Story 4
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, List } from "lucide-react";
import type { DocumentHeading } from "@/types/reader";

export interface TableOfContentsProps {
  /** Array of headings extracted from the document */
  headings: DocumentHeading[];
  /** Currently active/visible heading ID */
  activeHeadingId?: string;
  /** Callback when a heading is clicked */
  onHeadingClick?: (headingId: string) => void;
  /** Whether the TOC can be collapsed */
  collapsible?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Calculate indentation level based on heading level
 * Level 1 = no indent, Level 2 = 1 unit, etc.
 */
function getIndentClass(level: number): string {
  const indentMap: Record<number, string> = {
    1: "",
    2: "pl-3",
    3: "pl-6",
    4: "pl-9",
    5: "pl-12",
    6: "pl-15",
  };
  return indentMap[level] ?? "";
}

export function TableOfContents({
  headings,
  activeHeadingId,
  onHeadingClick,
  collapsible = false,
  className,
}: TableOfContentsProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const handleHeadingClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, headingId: string) => {
      e.preventDefault();

      // Scroll to the heading element
      const element = document.getElementById(headingId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      // Notify parent component
      onHeadingClick?.(headingId);
    },
    [onHeadingClick]
  );

  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const isEmpty = headings.length === 0;

  return (
    <nav
      data-testid="table-of-contents"
      data-collapsible={collapsible ? "true" : undefined}
      data-collapsed={isCollapsed ? "true" : undefined}
      aria-label="Table of contents"
      className={cn(
        "flex flex-col text-sm",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-foreground flex items-center gap-1.5">
          <List className="h-4 w-4" aria-hidden="true" />
          On this page
        </h2>
        {collapsible && (
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label="Toggle table of contents"
            aria-expanded={!isCollapsed}
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed ? "" : "rotate-90"
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Empty state */}
      {isEmpty && (
        <p className="text-muted-foreground text-sm py-2">No headings found</p>
      )}

      {/* Heading list */}
      {!isEmpty && !isCollapsed && (
        <ul className="space-y-1" role="list">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                data-level={heading.level}
                data-active={activeHeadingId === heading.id ? "true" : undefined}
                onClick={(e) => handleHeadingClick(e, heading.id)}
                className={cn(
                  "block py-1 truncate transition-colors",
                  "hover:text-foreground",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  getIndentClass(heading.level),
                  activeHeadingId === heading.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Collapsed state indicator */}
      {!isEmpty && isCollapsed && (
        <p className="text-muted-foreground text-xs">
          {headings.length} heading{headings.length !== 1 ? "s" : ""}
        </p>
      )}
    </nav>
  );
}

export default TableOfContents;
