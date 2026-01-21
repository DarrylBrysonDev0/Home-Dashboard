"use client";

/**
 * Favorites Component
 *
 * Displays a list of bookmarked files with remove functionality.
 *
 * @see specs/005-markdown-reader/spec.md User Story 7
 */

import * as React from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Favorite } from "@/types/reader";

export interface FavoritesProps {
  /** List of favorite files */
  favorites: Favorite[];
  /** Callback when a file is selected */
  onSelect: (path: string) => void;
  /** Callback when a file is removed from favorites */
  onRemove: (path: string) => void;
  /** Currently selected file path */
  currentPath?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Favorites component - displays bookmarked files
 */
export function Favorites({
  favorites,
  onSelect,
  onRemove,
  currentPath,
  className,
}: FavoritesProps) {
  return (
    <div
      data-testid="favorites"
      className={cn("", className)}
    >
      <h3 className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <Star className="h-3.5 w-3.5" />
        Favorites
      </h3>

      {favorites.length === 0 ? (
        <div className="px-2 py-3 text-sm text-muted-foreground italic">
          <p>No favorites yet</p>
          <p className="text-xs mt-1">Click the star icon to add files to favorites</p>
        </div>
      ) : (
        <ul role="list" className="space-y-0.5">
          {favorites.map((file) => {
            const isActive = currentPath === file.path;

            return (
              <li
                key={file.path}
                role="listitem"
                data-active={isActive ? "true" : "false"}
                className={cn(
                  "flex items-center group rounded-md",
                  isActive && "bg-muted"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(file.path)}
                  aria-label={`Open ${file.name}`}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-2 py-1.5 text-sm",
                    "hover:bg-muted transition-colors rounded-l-md",
                    "text-left",
                    isActive && "text-foreground font-medium"
                  )}
                >
                  <Star
                    data-testid="favorite-icon"
                    className="h-4 w-4 flex-shrink-0 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span className="truncate">{file.name}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(file.path);
                  }}
                  aria-label={`Remove ${file.name} from favorites`}
                  className={cn(
                    "p-1.5 opacity-0 group-hover:opacity-100",
                    "hover:bg-destructive/10 rounded-r-md transition-all",
                    "text-muted-foreground hover:text-destructive"
                  )}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Favorites;
