"use client";

/**
 * CategoryList Component
 *
 * Displays event categories in a table with management actions.
 *
 * Features:
 * - Table view of all categories
 * - Color preview with hex value
 * - Icon display (Lucide icon name)
 * - Edit and delete actions
 * - Delete confirmation with event count warning
 * - Loading and empty states
 *
 * @see contracts/categories-api.md
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert } from "@/components/ui/alert";

/**
 * Category data structure from API
 */
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  createdAt: string;
}

/**
 * Props for CategoryList component
 */
export interface CategoryListProps {
  /** Array of categories to display */
  categories: Category[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when edit is clicked */
  onEdit?: (category: Category) => void;
  /** Callback when delete is clicked */
  onDelete?: (categoryId: string) => void;
  /** Optional error message to display */
  error?: string | null;
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * CategoryList component for displaying and managing event categories
 */
export default function CategoryList({
  categories,
  isLoading = false,
  onEdit,
  onDelete,
  error,
}: CategoryListProps) {
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryToDelete = categories.find((c) => c.id === deleteCategoryId);

  async function handleDelete() {
    if (!deleteCategoryId || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(deleteCategoryId);
    } finally {
      setIsDeleting(false);
      setDeleteCategoryId(null);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <p className="text-sm font-medium">{error}</p>
      </Alert>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No categories found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new category to organize your events.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Color</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Icon</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              {/* Color Preview */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: category.color }}
                    aria-label={`Category color: ${category.color}`}
                  />
                  <span className="text-xs font-mono text-muted-foreground">
                    {category.color}
                  </span>
                </div>
              </TableCell>

              {/* Name */}
              <TableCell className="font-medium">{category.name}</TableCell>

              {/* Icon */}
              <TableCell className="text-sm text-muted-foreground">
                {category.icon || "—"}
              </TableCell>

              {/* Created Date */}
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(category.createdAt)}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteCategoryId(category.id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteCategoryId !== null}
        onOpenChange={(open) => !open && setDeleteCategoryId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the &quot;{categoryToDelete?.name}&quot;
              category? This action cannot be undone.
              <span className="mt-2 block text-yellow-600">
                Warning: Events using this category will become uncategorized.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
