"use client";

/**
 * FavoriteToggle Component
 *
 * Toggle button for adding/removing a file from favorites.
 * Shows filled star when favorited, outline when not.
 *
 * @see specs/005-markdown-reader/spec.md User Story 7
 */

import * as React from "react";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FavoriteToggleProps {
  /** Whether the current file is favorited */
  isFavorite: boolean;
  /** Callback when toggle is clicked */
  onToggle: () => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Whether an operation is in progress */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FavoriteToggle component - star button for favoriting files
 */
export function FavoriteToggle({
  isFavorite,
  onToggle,
  disabled = false,
  loading = false,
  className,
}: FavoriteToggleProps) {
  const isDisabled = disabled || loading;

  const label = isFavorite ? "Remove from favorites" : "Add to favorites";

  const handleClick = React.useCallback(() => {
    if (!isDisabled) {
      onToggle();
    }
  }, [isDisabled, onToggle]);

  return (
    <div
      data-testid="favorite-toggle"
      data-favorited={isFavorite ? "true" : "false"}
      className={cn("inline-flex", className)}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={label}
        aria-pressed={isFavorite}
        title={label}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isFavorite
            ? "text-amber-500 hover:text-amber-600"
            : "text-muted-foreground hover:text-amber-500"
        )}
      >
        {loading ? (
          <Loader2
            data-testid="favorite-loading"
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        ) : isFavorite ? (
          <Star
            data-testid="star-filled-icon"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          />
        ) : (
          <Star
            data-testid="star-outline-icon"
            className="h-4 w-4"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}

export default FavoriteToggle;
