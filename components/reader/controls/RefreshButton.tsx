"use client";

/**
 * RefreshButton Component
 *
 * Button to reload the current file content without full page reload.
 * Shows loading state while refreshing.
 *
 * @see specs/005-markdown-reader/spec.md User Story 9
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Loader2 } from "lucide-react";

export interface RefreshButtonProps {
  /** Callback when refresh is triggered */
  onRefresh: () => void;
  /** Whether refresh is in progress */
  loading?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * RefreshButton Component
 *
 * Provides a button to refresh the current file content.
 * Shows a spinning loader while the refresh is in progress.
 *
 * Features:
 * - Click triggers onRefresh callback
 * - Loading state with spinner
 * - Disabled state support
 * - Accessible with aria-label and aria-busy
 * - Keyboard navigation support
 */
export function RefreshButton({
  onRefresh,
  loading = false,
  disabled = false,
  className,
}: RefreshButtonProps) {
  const isDisabled = disabled || loading;

  const handleClick = React.useCallback(() => {
    if (!isDisabled) {
      onRefresh();
    }
  }, [isDisabled, onRefresh]);

  return (
    <button
      type="button"
      data-testid="refresh-button"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Refresh content"
      aria-busy={loading}
      title="Refresh content"
      className={cn(
        "p-1.5 rounded-md transition-colors",
        "text-muted-foreground",
        "hover:bg-muted hover:text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDisabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <Loader2
          data-testid="refresh-loading"
          className="h-4 w-4 animate-spin"
          aria-hidden="true"
        />
      ) : (
        <RefreshCw
          data-testid="refresh-icon"
          className="h-4 w-4"
          aria-hidden="true"
        />
      )}
    </button>
  );
}

export default RefreshButton;
