"use client";

/**
 * ContentViewer Component
 *
 * Main content container that displays the selected file.
 * Handles loading states, errors, and renders content based on file type.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import MermaidRenderer from "./MermaidRenderer";
import { EmptyState } from "./EmptyState";
import type { FileContent, DisplayMode, DocumentHeading } from "@/types/reader";

/** Threshold for large file warning (1MB in bytes) */
const LARGE_FILE_THRESHOLD = 1024 * 1024;

export interface ContentViewerProps {
  /** Currently loaded file content */
  file: FileContent | null;
  /** Whether file is currently loading */
  isLoading: boolean;
  /** Error message if file load failed */
  error: string | null;
  /** Display mode (themed or reading) */
  displayMode?: DisplayMode;
  /** Callback to receive extracted headings (for TOC) */
  onHeadingsExtracted?: (headings: DocumentHeading[]) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Formats file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ContentViewer({
  file,
  isLoading,
  error,
  displayMode = "themed",
  onHeadingsExtracted,
  className,
}: ContentViewerProps) {
  // State for dismissing large file warning
  const [largeFileWarningDismissed, setLargeFileWarningDismissed] = React.useState(false);

  // Reset warning dismissal when file changes
  React.useEffect(() => {
    setLargeFileWarningDismissed(false);
  }, [file?.path]);

  // Check if file is large
  const isLargeFile = file && file.size > LARGE_FILE_THRESHOLD;
  const showLargeFileWarning = isLargeFile && !largeFileWarningDismissed;

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state - distinguish between different error types
  if (error) {
    const lowerError = error.toLowerCase();

    // Detect volume unavailable scenarios
    const isVolumeUnavailable =
      lowerError.includes("volume") ||
      lowerError.includes("not configured") ||
      lowerError.includes("not accessible") ||
      lowerError.includes("docs_root");

    // Detect "file not found" or "file deleted" scenarios
    const isNotFound =
      !isVolumeUnavailable && (
        lowerError.includes("not found") ||
        lowerError.includes("deleted") ||
        lowerError.includes("does not exist")
      );

    // Determine empty state type
    let emptyStateType: "volume-unavailable" | "not-found" | "error" = "error";
    if (isVolumeUnavailable) {
      emptyStateType = "volume-unavailable";
    } else if (isNotFound) {
      emptyStateType = "not-found";
    }

    return (
      <EmptyState
        type={emptyStateType}
        errorMessage={emptyStateType === "error" ? error : undefined}
        className={className}
      />
    );
  }

  // No file selected
  if (!file) {
    return <EmptyState type="no-selection" className={className} />;
  }

  // Render content based on file type
  return (
    <article
      className={cn(
        "h-full overflow-y-auto p-6",
        className
      )}
    >
      {/* File metadata header */}
      <header className="mb-6 pb-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">
          {file.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {file.path}
        </p>
      </header>

      {/* Large file warning */}
      {showLargeFileWarning && (
        <div
          role="alert"
          className={cn(
            "mb-6 p-4 rounded-lg border",
            "bg-yellow-50 dark:bg-yellow-950/30",
            "border-yellow-200 dark:border-yellow-900"
          )}
          data-testid="large-file-warning"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                Large File Warning
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This file is {formatFileSize(file.size)} which may cause slow rendering
                and increased memory usage, especially with syntax highlighting and diagrams.
              </p>
              <button
                type="button"
                onClick={() => setLargeFileWarningDismissed(true)}
                className={cn(
                  "mt-3 px-3 py-1.5 text-sm font-medium rounded-md",
                  "bg-yellow-100 dark:bg-yellow-900/50",
                  "text-yellow-800 dark:text-yellow-200",
                  "hover:bg-yellow-200 dark:hover:bg-yellow-900",
                  "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2",
                  "transition-colors"
                )}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content - only render if large file warning is dismissed or file is not large */}
      {!showLargeFileWarning && (
        <div className="content-area">
          {file.extension === ".md" && (
            <MarkdownRenderer
              content={file.content}
              currentPath={file.path}
              displayMode={displayMode}
              onHeadingsExtracted={onHeadingsExtracted}
            />
          )}

          {file.extension === ".mmd" && (
            <MermaidRenderer
              code={file.content}
              theme={displayMode === "reading" ? "light" : "dark"}
              ariaLabel={`Mermaid diagram: ${file.name}`}
            />
          )}

          {file.extension === ".txt" && (
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-md">
              {file.content}
            </pre>
          )}
        </div>
      )}
    </article>
  );
}
