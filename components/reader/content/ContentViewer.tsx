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
import { Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { EmptyState } from "./EmptyState";
import type { FileContent, DisplayMode, DocumentHeading } from "@/types/reader";

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

export function ContentViewer({
  file,
  isLoading,
  error,
  displayMode = "themed",
  onHeadingsExtracted,
  className,
}: ContentViewerProps) {
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

  // Error state
  if (error) {
    return (
      <EmptyState
        type="error"
        errorMessage={error}
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

      {/* Content */}
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
          <div className="mermaid-container">
            {/* Mermaid rendering will be implemented in Phase 5 */}
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{file.content}</code>
            </pre>
            <p className="text-sm text-muted-foreground mt-2">
              Mermaid diagram rendering coming soon
            </p>
          </div>
        )}

        {file.extension === ".txt" && (
          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-md">
            {file.content}
          </pre>
        )}
      </div>
    </article>
  );
}
