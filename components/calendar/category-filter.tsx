"use client";

import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Category data structure for filtering
 */
export interface FilterCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

/**
 * Props for the CategoryFilter component
 */
export interface CategoryFilterProps {
  /** List of available categories */
  categories: FilterCategory[];
  /** Currently selected category IDs */
  selectedCategoryIds: string[];
  /** Callback when filter selection changes */
  onFilterChange: (selectedIds: string[]) => void;
}

/**
 * CategoryFilter - Category toggle component for filtering calendar events
 *
 * Displays checkboxes for each category with color indicators and icons.
 * Includes a "Show All" toggle to select/deselect all categories at once.
 *
 * User Story 5 (FR-024, FR-025):
 * - Display category filters with visual indicators (colors/icons)
 * - Toggle categories to show/hide events
 * - "Show All" functionality
 *
 * Accessibility:
 * - Proper label associations for screen readers
 * - Keyboard navigable checkboxes
 * - ARIA group labeling
 */
export function CategoryFilter({
  categories,
  selectedCategoryIds,
  onFilterChange,
}: CategoryFilterProps) {
  /**
   * Check if all categories are currently selected
   */
  const allSelected = categories.length > 0 && selectedCategoryIds.length === categories.length;

  /**
   * Handle individual category toggle
   */
  const handleCategoryToggle = (categoryId: string) => {
    const isCurrentlySelected = selectedCategoryIds.includes(categoryId);

    if (isCurrentlySelected) {
      // Remove category from selection
      onFilterChange(selectedCategoryIds.filter((id) => id !== categoryId));
    } else {
      // Add category to selection
      onFilterChange([...selectedCategoryIds, categoryId]);
    }
  };

  /**
   * Handle "Show All" toggle
   */
  const handleShowAllToggle = () => {
    if (allSelected) {
      // Deselect all
      onFilterChange([]);
    } else {
      // Select all
      onFilterChange(categories.map((cat) => cat.id));
    }
  };

  /**
   * Get Lucide icon component by name
   */
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return null;

    // Convert icon name to PascalCase (e.g., "dollar-sign" -> "DollarSign")
    const pascalName = iconName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

    const IconComponent = (LucideIcons as any)[pascalName];
    return IconComponent || null;
  };

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No categories available
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Filter events by category"
      className="space-y-3"
    >
      {/* Individual Category Filters */}
      <div className="space-y-2">
        {categories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          const isSelected = selectedCategoryIds.includes(category.id);

          return (
            <div
              key={category.id}
              className="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                id={`category-filter-${category.id}`}
                checked={isSelected}
                onChange={() => handleCategoryToggle(category.id)}
                className={cn(
                  "h-4 w-4 rounded border-gray-300 text-primary",
                  "focus:ring-2 focus:ring-primary focus:ring-offset-0",
                  "cursor-pointer"
                )}
              />
              <label
                htmlFor={`category-filter-${category.id}`}
                className="flex items-center gap-2 text-sm cursor-pointer flex-1 select-none"
              >
                {/* Color indicator */}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />

                {/* Icon */}
                {IconComponent && (
                  <IconComponent
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: category.color }}
                    aria-hidden="true"
                  />
                )}

                {/* Category name */}
                <span className="flex-1">{category.name}</span>
              </label>
            </div>
          );
        })}
      </div>

      {/* Show All Toggle */}
      <div className="flex items-center space-x-2 pt-2 border-t">
        <input
          type="checkbox"
          id="category-filter-all"
          checked={allSelected}
          onChange={handleShowAllToggle}
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-primary",
            "focus:ring-2 focus:ring-primary focus:ring-offset-0",
            "cursor-pointer"
          )}
        />
        <label
          htmlFor="category-filter-all"
          className="text-sm font-medium cursor-pointer select-none"
        >
          Show All
        </label>
      </div>
    </div>
  );
}
