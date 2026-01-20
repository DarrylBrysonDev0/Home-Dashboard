"use client";

/**
 * NavigationPane Component
 *
 * Container for file tree navigation, search, and quick access sections.
 * Provides the main navigation sidebar for the reader.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";
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
  className,
}: NavigationPaneProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full",
        "border-r border-border bg-background",
        className
      )}
      aria-label="File navigation"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Documents</h2>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <FileTree
          nodes={nodes}
          selectedPath={selectedPath}
          expandedPaths={expandedPaths}
          loadingPaths={loadingPaths}
          onFileSelect={onFileSelect}
          onExpandToggle={onExpandToggle}
        />
      </div>
    </aside>
  );
}
