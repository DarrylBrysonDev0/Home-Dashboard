"use client";

/**
 * FileTree Component
 *
 * Displays a hierarchical tree of files and directories with lazy loading.
 * Supports expand/collapse, file selection, and keyboard navigation.
 *
 * Keyboard navigation follows WAI-ARIA Treeview pattern:
 * - ArrowDown: Move to next visible node
 * - ArrowUp: Move to previous visible node
 * - ArrowRight: Expand directory or move to first child
 * - ArrowLeft: Collapse directory or move to parent
 * - Home: Jump to first visible node
 * - End: Jump to last visible node
 * - Enter/Space: Select file or toggle directory
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
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
 * Flattens the tree structure into a list of visible nodes for keyboard navigation.
 * Only includes nodes that are currently visible (parent directories are expanded).
 */
function getVisibleNodes(
  nodes: FileNode[],
  expandedPaths: Set<string>
): FileNode[] {
  const result: FileNode[] = [];

  function traverse(nodeList: FileNode[]) {
    for (const node of nodeList) {
      result.push(node);
      // Only recurse into expanded directories with children
      if (
        node.type === "directory" &&
        expandedPaths.has(node.path) &&
        node.children
      ) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return result;
}

/**
 * Finds the parent path of a given path
 */
function getParentPath(path: string): string | null {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash <= 0) return null;
  return path.substring(0, lastSlash);
}

/**
 * Recursive component to render tree nodes
 */
function TreeNodes({
  nodes,
  level,
  selectedPath,
  focusedPath,
  firstNodePath,
  expandedPaths,
  loadingPaths,
  onFileSelect,
  onExpandToggle,
  onFocus,
}: {
  nodes: FileNode[];
  level: number;
  selectedPath?: string | null;
  focusedPath: string | null;
  firstNodePath: string | null;
  expandedPaths: Set<string>;
  loadingPaths: Set<string>;
  onFileSelect: (path: string) => void;
  onExpandToggle: (path: string) => void;
  onFocus: (path: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => {
        // Determine if this node should be focusable
        // If no node is explicitly focused, make the first node tabbable
        const isFocused = focusedPath === node.path;
        const isFirstAndNoFocus = !focusedPath && node.path === firstNodePath;
        const shouldBeFocusable = isFocused || isFirstAndNoFocus;

        return (
          <FileTreeNode
            key={node.path}
            node={node}
            level={level}
            isSelected={selectedPath === node.path}
            isFocused={shouldBeFocusable}
            isExpanded={expandedPaths.has(node.path)}
            isLoading={loadingPaths.has(node.path)}
            onFileSelect={(path) => {
              onFocus(path);
              onFileSelect(path);
            }}
            onExpandToggle={(path) => {
              onFocus(path);
              onExpandToggle(path);
            }}
            renderChildren={
              node.type === "directory" && node.children
                ? () => (
                    <TreeNodes
                      nodes={node.children!}
                      level={level + 1}
                      selectedPath={selectedPath}
                      focusedPath={focusedPath}
                      firstNodePath={firstNodePath}
                      expandedPaths={expandedPaths}
                      loadingPaths={loadingPaths}
                      onFileSelect={onFileSelect}
                      onExpandToggle={onExpandToggle}
                      onFocus={onFocus}
                    />
                  )
                : undefined
            }
          />
        );
      })}
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
  // Track focused path for keyboard navigation (roving tabindex pattern)
  const [focusedPath, setFocusedPath] = React.useState<string | null>(null);
  const treeRef = React.useRef<HTMLDivElement>(null);

  // Get flattened list of visible nodes for navigation
  const visibleNodes = React.useMemo(
    () => getVisibleNodes(nodes, expandedPaths),
    [nodes, expandedPaths]
  );

  // Find the index of a path in the visible nodes
  const findNodeIndex = React.useCallback(
    (path: string | null): number => {
      if (!path) return -1;
      return visibleNodes.findIndex((n) => n.path === path);
    },
    [visibleNodes]
  );

  // Focus a node by path (updates DOM focus)
  const focusNode = React.useCallback((path: string) => {
    setFocusedPath(path);
    // Use RAF to ensure the DOM has updated
    requestAnimationFrame(() => {
      const element = treeRef.current?.querySelector(
        `[data-path="${CSS.escape(path)}"]`
      ) as HTMLElement | null;
      element?.focus();
    });
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const currentIndex = findNodeIndex(focusedPath);
      if (currentIndex === -1 && visibleNodes.length > 0) {
        // No focus yet, focus first node on any navigation key
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          focusNode(visibleNodes[0].path);
          return;
        }
      }

      const currentNode = visibleNodes[currentIndex];

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          const nextIndex = Math.min(currentIndex + 1, visibleNodes.length - 1);
          focusNode(visibleNodes[nextIndex].path);
          break;
        }

        case "ArrowUp": {
          event.preventDefault();
          const prevIndex = Math.max(currentIndex - 1, 0);
          focusNode(visibleNodes[prevIndex].path);
          break;
        }

        case "ArrowRight": {
          event.preventDefault();
          if (currentNode?.type === "directory") {
            if (!expandedPaths.has(currentNode.path)) {
              // Expand the directory
              onExpandToggle(currentNode.path);
            } else if (currentNode.children && currentNode.children.length > 0) {
              // Move to first child
              focusNode(currentNode.children[0].path);
            }
          }
          break;
        }

        case "ArrowLeft": {
          event.preventDefault();
          if (
            currentNode?.type === "directory" &&
            expandedPaths.has(currentNode.path)
          ) {
            // Collapse the directory
            onExpandToggle(currentNode.path);
          } else {
            // Move to parent
            const parentPath = getParentPath(currentNode?.path ?? "");
            if (parentPath) {
              const parentNode = visibleNodes.find((n) => n.path === parentPath);
              if (parentNode) {
                focusNode(parentPath);
              }
            }
          }
          break;
        }

        case "Home": {
          event.preventDefault();
          if (visibleNodes.length > 0) {
            focusNode(visibleNodes[0].path);
          }
          break;
        }

        case "End": {
          event.preventDefault();
          if (visibleNodes.length > 0) {
            focusNode(visibleNodes[visibleNodes.length - 1].path);
          }
          break;
        }

        case "Enter":
        case " ": {
          event.preventDefault();
          if (currentNode) {
            if (currentNode.type === "directory") {
              onExpandToggle(currentNode.path);
            } else {
              onFileSelect(currentNode.path);
            }
          }
          break;
        }
      }
    },
    [
      focusedPath,
      visibleNodes,
      expandedPaths,
      findNodeIndex,
      focusNode,
      onExpandToggle,
      onFileSelect,
    ]
  );

  // Update focused path when nodes change (e.g., after expand)
  React.useEffect(() => {
    if (focusedPath && findNodeIndex(focusedPath) === -1) {
      // Focused node is no longer visible, reset focus
      setFocusedPath(null);
    }
  }, [focusedPath, findNodeIndex]);

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

  // First node path for initial tab focus
  const firstNodePath = visibleNodes.length > 0 ? visibleNodes[0].path : null;

  return (
    <div
      ref={treeRef}
      role="tree"
      aria-label="File tree"
      className="py-2"
      onKeyDown={handleKeyDown}
    >
      <TreeNodes
        nodes={nodes}
        level={0}
        selectedPath={selectedPath}
        focusedPath={focusedPath}
        firstNodePath={firstNodePath}
        expandedPaths={expandedPaths}
        loadingPaths={loadingPaths}
        onFileSelect={onFileSelect}
        onExpandToggle={onExpandToggle}
        onFocus={setFocusedPath}
      />
    </div>
  );
}
