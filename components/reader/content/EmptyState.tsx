"use client";

/**
 * EmptyState Component
 *
 * Displays a friendly empty state when no file is selected.
 * Provides guidance for users to select a file from the tree.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { FileText, FolderOpen, ArrowLeft, ServerOff } from "lucide-react";

export interface EmptyStateProps {
  /** Type of empty state to display */
  type?: "no-selection" | "empty-folder" | "error" | "not-found" | "volume-unavailable";
  /** Error message to display (for error type) */
  errorMessage?: string;
  /** Optional className for styling */
  className?: string;
}

export function EmptyState({
  type = "no-selection",
  errorMessage,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      data-type={type}
      className={cn(
        "flex flex-col items-center justify-center h-full p-8 text-center",
        className
      )}
    >
      {type === "no-selection" && (
        <>
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Select a document
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Choose a file from the navigation panel to view its contents. You
            can browse folders by clicking on them to expand.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Click a file in the sidebar</span>
          </div>
        </>
      )}

      {type === "empty-folder" && (
        <>
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No documents yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            This folder is empty. Add markdown (.md), Mermaid (.mmd), or text
            (.txt) files to your documentation directory to view them here.
          </p>
        </>
      )}

      {type === "not-found" && (
        <>
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <FileText className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            File not found
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            The requested file could not be found. It may have been moved or
            deleted.
          </p>
        </>
      )}

      {type === "error" && (
        <>
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <FileText className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Unable to load file
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            {errorMessage || "An error occurred while loading the file. Please try again."}
          </p>
        </>
      )}

      {type === "volume-unavailable" && (
        <>
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <ServerOff className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Documentation unavailable
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            The documentation volume is not accessible. This may be because the
            storage is not mounted or the DOCS_ROOT path is misconfigured.
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-sm">
            Please check your Docker volume mounts and environment configuration.
          </p>
        </>
      )}
    </div>
  );
}
