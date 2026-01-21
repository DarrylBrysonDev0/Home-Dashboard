"use client";

/**
 * DisplayModeToggle Component
 *
 * Toggle button for switching between themed and reading display modes.
 * Themed mode uses app aesthetic while reading mode provides clean, neutral styling.
 *
 * @see specs/005-markdown-reader/spec.md User Story 6
 */

import * as React from "react";
import { BookOpen, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DisplayMode } from "@/types/reader";

export interface DisplayModeToggleProps {
  /** Current display mode */
  mode: DisplayMode;
  /** Callback when mode changes */
  onModeChange: (mode: DisplayMode) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DisplayModeToggle component for switching between themed and reading modes
 */
export function DisplayModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: DisplayModeToggleProps) {
  const isReadingMode = mode === "reading";

  const handleToggle = React.useCallback(() => {
    if (disabled) return;
    onModeChange(isReadingMode ? "themed" : "reading");
  }, [disabled, isReadingMode, onModeChange]);

  const label = isReadingMode
    ? "Switch to themed mode"
    : "Switch to reading mode";

  const tooltip = isReadingMode
    ? "Switch to themed mode for app styling"
    : "Switch to reading mode for distraction-free reading";

  return (
    <div
      data-testid="display-mode-toggle"
      data-mode={mode}
      className={cn("inline-flex", className)}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isReadingMode}
        title={tooltip}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isReadingMode
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isReadingMode ? (
          <BookOpen
            data-testid="reading-mode-icon"
            className="h-4 w-4"
            aria-hidden="true"
          />
        ) : (
          <Palette
            data-testid="themed-mode-icon"
            className="h-4 w-4"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}

export default DisplayModeToggle;
