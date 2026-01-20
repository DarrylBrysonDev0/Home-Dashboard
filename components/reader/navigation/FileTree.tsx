"use client";

/**
 * FileTree Component
 *
 * Displays a hierarchical tree of files and directories with lazy loading.
 * Supports expand/collapse, file selection, and keyboard navigation.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import { FileTreeNode } from "./FileTreeNode";
import { FolderOpen } from "lucide-react";
import type { FileNode } from "@/types/reader";

export interface FileTreeProps {
  /** Array of file nodes to display */
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
}

/**
 * Recursive component to render tree nodes
 */
function TreeNodes({
  nodes,
  level,
  selectedPath,
  expandedPaths,
  loadingPaths,
  onFileSelect,
  onExpandToggle,
}: {
  nodes: FileNode[];
  level: number;
  selectedPath?: string | null;
  expandedPaths: Set<string>;
  loadingPaths: Set<string>;
  onFileSelect: (path: string) => void;
  onExpandToggle: (path: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          level={level}
          isSelected={selectedPath === node.path}
          isExpanded={expandedPaths.has(node.path)}
          isLoading={loadingPaths.has(node.path)}
          onFileSelect={onFileSelect}
          onExpandToggle={onExpandToggle}
          renderChildren={
            node.type === "directory" && node.children
              ? () => (
                  <TreeNodes
                    nodes={node.children!}
                    level={level + 1}
                    selectedPath={selectedPath}
                    expandedPaths={expandedPaths}
                    loadingPaths={loadingPaths}
                    onFileSelect={onFileSelect}
                    onExpandToggle={onExpandToggle}
                  />
                )
              : undefined
          }
        />
      ))}
    </>
  );
}

export function FileTree({
  nodes,
  selectedPath,
  expandedPaths = new Set(),
  loadingPaths = new Set(),
  onFileSelect,
  onExpandToggle,
}: FileTreeProps) {
  // Empty state
  if (nodes.length === 0) {
    return (
      <div
        role="tree"
        className="flex flex-col items-center justify-center py-8 px-4 text-center"
      >
        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground font-medium">
          No files found
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add markdown files to your documentation directory
        </p>
      </div>
    );
  }

  return (
    <div
      role="tree"
      aria-label="File tree"
      className="py-2"
    >
      <TreeNodes
        nodes={nodes}
        level={0}
        selectedPath={selectedPath}
        expandedPaths={expandedPaths}
        loadingPaths={loadingPaths}
        onFileSelect={onFileSelect}
        onExpandToggle={onExpandToggle}
      />
    </div>
  );
}
