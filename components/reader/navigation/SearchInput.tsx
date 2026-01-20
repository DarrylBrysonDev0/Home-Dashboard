"use client";

/**
 * SearchInput Component
 *
 * Search input with debounced value handling, clear functionality,
 * and loading state display.
 *
 * @see specs/005-markdown-reader/spec.md User Story 5
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "lucide-react";

export interface SearchInputProps {
  /** Callback when search value changes (after debounce) */
  onSearch: (query: string) => void;
  /** Callback when search is cleared */
  onClear?: () => void;
  /** Controlled value */
  value?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Show loading indicator */
  isLoading?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Optional className for styling */
  className?: string;
}

export function SearchInput({
  onSearch,
  onClear,
  value: controlledValue,
  debounceMs = 300,
  isLoading = false,
  disabled = false,
  placeholder = "Search files...",
  className,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? "");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync with controlled value
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounced search handler
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      // Clear existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounce timer
      debounceRef.current = setTimeout(() => {
        if (!disabled) {
          onSearch(newValue);
        }
      }, debounceMs);
    },
    [debounceMs, disabled, onSearch]
  );

  // Clear handler (immediate, no debounce)
  const handleClear = React.useCallback(() => {
    // Clear debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setInternalValue("");
    onSearch("");
    onClear?.();
  }, [onSearch, onClear]);

  // Escape key handler
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && internalValue) {
        handleClear();
      }
    },
    [internalValue, handleClear]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const showClearButton = internalValue.length > 0;

  return (
    <div
      data-testid="search-input-container"
      className={cn(
        "relative flex items-center",
        className
      )}
    >
      {/* Search icon or loading indicator */}
      <div className="absolute left-2.5 text-muted-foreground">
        {isLoading ? (
          <Loader2
            data-testid="search-loading"
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Search
            data-testid="search-icon"
            className="h-4 w-4"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Input */}
      <input
        type="search"
        role="searchbox"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label="Search files"
        className={cn(
          "w-full h-8 pl-8 pr-8 text-sm rounded-md",
          "bg-muted/50 border border-input",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "truncate"
        )}
      />

      {/* Clear button */}
      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            "absolute right-2 p-0.5 rounded-sm",
            "text-muted-foreground hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
