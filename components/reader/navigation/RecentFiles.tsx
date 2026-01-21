"use client";

/**
 * RecentFiles Component
 *
 * Displays a list of recently viewed files for quick access.
 *
 * @see specs/005-markdown-reader/spec.md User Story 7
 */

import * as React from "react";
import { FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecentFile } from "@/types/reader";

export interface RecentFilesProps {
  /** List of recent files */
  recents: RecentFile[];
  /** Callback when a file is selected */
  onSelect: (path: string) => void;
  /** Currently selected file path */
  currentPath?: string;
  /** Maximum number of items to display (default: 10) */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * RecentFiles component - displays recently viewed files
 */
export function RecentFiles({
  recents,
  onSelect,
  currentPath,
  maxItems = 10,
  className,
}: RecentFilesProps) {
  const displayedRecents = recents.slice(0, maxItems);

  return (
    <div
      data-testid="recent-files"
      className={cn("", className)}
    >
      <h3 className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Clock className="h-3.5 w-3.5" />
        Recent Files
      </h3>

      {displayedRecents.length === 0 ? (
        <p className="px-2 py-3 text-sm text-muted-foreground italic">
          No recent files
        </p>
      ) : (
        <ul role="list" className="space-y-0.5">
          {displayedRecents.map((file) => {
            const isActive = currentPath === file.path;

            return (
              <li key={file.path} role="listitem">
                <button
                  type="button"
                  onClick={() => onSelect(file.path)}
                  data-active={isActive ? "true" : "false"}
                  aria-label={`Open ${file.name}`}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md",
                    "hover:bg-muted transition-colors",
                    "text-left",
                    isActive && "bg-muted text-foreground font-medium"
                  )}
                >
                  <FileText
                    data-testid="recent-file-icon"
                    className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{file.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default RecentFiles;
