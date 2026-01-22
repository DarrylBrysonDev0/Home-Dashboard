"use client";

/**
 * FileTreeNode Component
 *
 * Renders a single node in the file tree (file or directory).
 * Supports expand/collapse for directories and selection for files.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  Loader2,
} from "lucide-react";
import type { FileNode } from "@/types/reader";

export interface FileTreeNodeProps {
  /** The file node data */
  node: FileNode;
  /** Current nesting level (for indentation) */
  level: number;
  /** Whether this node is selected */
  isSelected: boolean;
  /** Whether this node has keyboard focus (for roving tabindex) */
  isFocused?: boolean;
  /** Whether this directory is expanded */
  isExpanded: boolean;
  /** Whether this directory is currently loading children */
  isLoading: boolean;
  /** Handler for file selection */
  onFileSelect: (path: string) => void;
  /** Handler for directory expand/collapse toggle */
  onExpandToggle: (path: string) => void;
  /** Render function for children (for recursive rendering) */
  renderChildren?: () => React.ReactNode;
}

/**
 * Get the appropriate icon for a file based on its extension
 */
function getFileIcon(extension?: string): React.ReactNode {
  switch (extension?.toLowerCase()) {
    case ".md":
      return <FileCode className="h-4 w-4" data-icon="file-markdown" />;
    case ".mmd":
      return <FileCode className="h-4 w-4" data-icon="file-mermaid" />;
    case ".txt":
      return <FileText className="h-4 w-4" data-icon="file-text" />;
    default:
      return <FileText className="h-4 w-4" data-icon="file" />;
  }
}

export function FileTreeNode({
  node,
  level,
  isSelected,
  isFocused = false,
  isExpanded,
  isLoading,
  onFileSelect,
  onExpandToggle,
  renderChildren,
}: FileTreeNodeProps) {
  const isDirectory = node.type === "directory";
  const hasExpandArrow = isDirectory && node.hasChildren;

  const handleClick = () => {
    if (isDirectory) {
      onExpandToggle(node.path);
    } else {
      onFileSelect(node.path);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Only handle Enter/Space here - arrow keys are handled at FileTree level
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  // Generate a test ID based on the node name
  const testId = `tree-node-${node.name}`;

  // Roving tabindex: only focused node has tabIndex=0
  // If no node is focused yet, make all tabbable (tabIndex=0)
  const tabIndex = isFocused ? 0 : -1;

  return (
    <>
      <div
        role="treeitem"
        tabIndex={tabIndex}
        data-testid={testId}
        data-path={node.path}
        data-level={level}
        data-selected={isSelected ? "true" : "false"}
        data-expanded={isDirectory ? (isExpanded ? "true" : "false") : undefined}
        aria-selected={isSelected}
        aria-expanded={isDirectory ? isExpanded : undefined}
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 cursor-pointer",
          "hover:bg-accent/50 rounded-md transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          isSelected && "bg-accent text-accent-foreground font-medium"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Expand arrow for directories with children */}
        {hasExpandArrow ? (
          <button
            type="button"
            className="p-0.5 -ml-1"
            tabIndex={-1}
            data-expand-arrow
          >
            {isLoading ? (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-muted-foreground"
                data-loading-spinner
              />
            ) : (
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </button>
        ) : (
          <span className="w-4" /> // Spacer when no arrow
        )}

        {/* Icon */}
        <span className="flex-shrink-0 text-muted-foreground">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4" data-icon="folder-open" />
            ) : (
              <Folder className="h-4 w-4" data-icon="folder" />
            )
          ) : (
            getFileIcon(node.extension)
          )}
        </span>

        {/* Name */}
        <span className="truncate text-sm">{node.name}</span>
      </div>

      {/* Render children if directory is expanded */}
      {isDirectory && isExpanded && renderChildren && (
        <div role="group" aria-label={`Contents of ${node.name}`}>
          {renderChildren()}
        </div>
      )}
    </>
  );
}
