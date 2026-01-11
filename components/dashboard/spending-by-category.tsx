"use client";

/**
 * SpendingByCategory Component
 *
 * Container component that displays spending breakdown by category
 * with both donut and bar chart visualizations.
 *
 * Features:
 * - Toggle between donut chart and bar chart views
 * - Drill-down modal for subcategory details
 * - Filter context integration for date/account filtering
 * - Loading, error, and empty states
 */

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { PieChart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpendingByCategorySkeleton } from "./loading-skeleton";
import { NoData } from "./empty-states/no-data";
import { CategoryDonut } from "./charts/category-donut";
import { CategoryBar } from "./charts/category-bar";
import { formatCurrency } from "./charts/chart-tooltip";
import { useChartTheme } from "@/lib/theme";
import { useFilters } from "@/lib/contexts/filter-context";
import type { CategoryBreakdown } from "@/lib/validations/analytics";

/**
 * View mode for the chart display
 */
type ViewMode = "donut" | "bar";

/**
 * Filter props for category data fetching
 */
export interface SpendingByCategoryFilterProps {
  /** Start date for the date range filter */
  startDate?: Date;
  /** End date for the date range filter */
  endDate?: Date;
  /** Array of account IDs to filter by */
  accountIds?: string[];
}

/**
 * Props for the SpendingByCategory component
 */
export interface SpendingByCategoryProps extends SpendingByCategoryFilterProps {
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Default view mode */
  defaultView?: ViewMode;
  /** Maximum categories to show in bar chart */
  maxCategories?: number;
}

/**
 * API response for categories
 */
interface CategoriesApiResponse {
  data?: {
    total_expenses: number;
    categories: CategoryBreakdown[];
  };
  error?: string;
}

/**
 * Builds the URL with query parameters for the categories API
 */
function buildCategoriesUrl(
  filters: SpendingByCategoryFilterProps,
  includeSubcategories: boolean
): string {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set("start_date", format(filters.startDate, "yyyy-MM-dd"));
  }

  if (filters.endDate) {
    params.set("end_date", format(filters.endDate, "yyyy-MM-dd"));
  }

  if (filters.accountIds && filters.accountIds.length > 0) {
    params.set("account_id", filters.accountIds.join(","));
  }

  if (includeSubcategories) {
    params.set("include_subcategories", "true");
  }

  const queryString = params.toString();
  return `/api/analytics/categories${queryString ? `?${queryString}` : ""}`;
}

/**
 * Custom hook for fetching category data
 */
function useCategoryData(filters: SpendingByCategoryFilterProps, includeSubcategories = false) {
  const [data, setData] = useState<{
    total_expenses: number;
    categories: CategoryBreakdown[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildCategoriesUrl(filters, includeSubcategories);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch category data (${response.status})`
        );
      }

      const json: CategoriesApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data) {
        throw new Error("Invalid response: missing category data");
      }

      setData(json.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, includeSubcategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Subcategory drill-down modal content
 * Uses theme-aware Cemdash category colors
 */
interface SubcategoryModalProps {
  category: CategoryBreakdown | null;
  isOpen: boolean;
  onClose: () => void;
}

function SubcategoryModal({ category, isOpen, onClose }: SubcategoryModalProps) {
  // Get theme-aware chart colors
  const { categories, palette } = useChartTheme();

  if (!category) return null;

  const subcategories = category.subcategories || [];

  /**
   * Get color for a category - uses category-specific colors when available,
   * falls back to palette colors for unrecognized categories
   */
  const getCategoryColor = (categoryName: string, index: number): string => {
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '') as keyof typeof categories;
    return categories[normalizedName] || palette[index % palette.length];
  };

  const categoryColor = getCategoryColor(category.category, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            {category.category}
          </DialogTitle>
          <DialogDescription>
            {formatCurrency(category.amount)} ({category.percentage}% of total) •{" "}
            {category.transaction_count} transactions
          </DialogDescription>
        </DialogHeader>

        {subcategories.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No subcategory breakdown available
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Subcategory Breakdown
            </h4>
            <div className="space-y-2">
              {subcategories.map((sub, index) => (
                <div
                  key={sub.subcategory}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: palette[index % palette.length] }}
                    />
                    <span className="font-medium">{sub.subcategory}</span>
                    <span className="text-sm text-muted-foreground">
                      ({sub.transaction_count})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium tabular-nums">
                      {formatCurrency(sub.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sub.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * SpendingByCategory - Main container component
 *
 * Displays category spending with:
 * - View toggle (donut/bar)
 * - Interactive charts with click-to-drill-down
 * - Subcategory modal
 */
export function SpendingByCategory({
  startDate,
  endDate,
  accountIds,
  title = "Spending by Category",
  description = "Expense breakdown across categories",
  height = 300,
  className,
  defaultView = "donut",
  maxCategories = 10,
}: SpendingByCategoryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [selectedCategory, setSelectedCategory] = useState<CategoryBreakdown | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data with subcategories for drill-down
  const { data, isLoading, error } = useCategoryData(
    { startDate, endDate, accountIds },
    true // Always fetch subcategories for drill-down capability
  );

  const handleCategoryClick = (categoryName: string) => {
    const category = data?.categories.find((c) => c.category === categoryName);
    if (category) {
      setSelectedCategory(category);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  // Show loading skeleton
  if (isLoading) {
    return <SpendingByCategorySkeleton height={height} />;
  }

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive"
            style={{ height }}
            role="alert"
          >
            <div className="text-center">
              <p className="font-medium">Failed to load chart</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (!data || data.categories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <NoData
            title="No category data"
            description="There are no expense transactions for the selected period."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {/* View toggle buttons */}
          <div className="flex gap-1">
            <Button
              variant={viewMode === "donut" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("donut")}
              aria-label="Donut chart view"
              aria-pressed={viewMode === "donut"}
            >
              <PieChart className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "bar" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("bar")}
              aria-label="Bar chart view"
              aria-pressed={viewMode === "bar"}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {viewMode === "donut" ? (
            <CategoryDonut
              data={data.categories}
              totalExpenses={data.total_expenses}
              height={height}
              onCategoryClick={handleCategoryClick}
              showLegend
            />
          ) : (
            <CategoryBar
              data={data.categories}
              height={height}
              maxCategories={maxCategories}
              onCategoryClick={handleCategoryClick}
              showPercentage
            />
          )}

          {/* Hint text */}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Click a category to see subcategory breakdown
          </p>
        </CardContent>
      </Card>

      {/* Drill-down modal */}
      <SubcategoryModal
        category={selectedCategory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

/**
 * FilteredSpendingByCategory - Context-aware spending breakdown component
 *
 * Consumes the FilterContext to automatically fetch and display
 * category data based on the current filter state. Use this component
 * inside the dashboard where FilterProvider is available.
 *
 * For testing or standalone usage, use SpendingByCategory with explicit props.
 */
export interface FilteredSpendingByCategoryProps {
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Chart height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Default view mode */
  defaultView?: ViewMode;
  /** Maximum categories to show in bar chart */
  maxCategories?: number;
}

export function FilteredSpendingByCategory({
  title = "Spending by Category",
  description = "Expense breakdown across categories",
  height = 300,
  className,
  defaultView = "donut",
  maxCategories = 10,
}: FilteredSpendingByCategoryProps) {
  const { dateRange, selectedAccountIds } = useFilters();

  return (
    <SpendingByCategory
      startDate={dateRange.start}
      endDate={dateRange.end}
      accountIds={selectedAccountIds.length > 0 ? selectedAccountIds : undefined}
      title={title}
      description={description}
      height={height}
      className={className}
      defaultView={defaultView}
      maxCategories={maxCategories}
    />
  );
}

export default SpendingByCategory;
