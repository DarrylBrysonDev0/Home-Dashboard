"use client";

/**
 * Category Management Page
 *
 * Client component for managing event categories (FR-034).
 *
 * Features:
 * - List all categories with CategoryList component
 * - Create new categories with CategoryForm in dialog
 * - Edit existing categories
 * - Delete categories with confirmation
 *
 * @see contracts/categories-api.md
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CategoryList, { Category } from "@/components/admin/category-list";
import CategoryForm, {
  CategoryFormCategory,
} from "@/components/admin/category-form";

/**
 * Category Management Page Component
 */
export default function CategoryManagementPage() {
  const router = useRouter();

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryFormCategory | null>(null);

  /**
   * Fetch categories from API
   */
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Handle opening dialog for new category
   */
  function handleAddCategory() {
    setEditingCategory(null);
    setIsDialogOpen(true);
  }

  /**
   * Handle opening dialog for editing category
   */
  function handleEditCategory(category: Category) {
    setEditingCategory({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
    setIsDialogOpen(true);
  }

  /**
   * Handle successful form submission
   */
  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingCategory(null);
    fetchCategories();
    router.refresh();
  }

  /**
   * Handle form cancel
   */
  function handleFormCancel() {
    setIsDialogOpen(false);
    setEditingCategory(null);
  }

  /**
   * Handle category deletion
   */
  async function handleDeleteCategory(categoryId: string) {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete category");
      }

      // Check if any events were uncategorized
      const data = await response.json();
      if (data.data?.eventsUncategorized > 0) {
        console.log(
          `${data.data.eventsUncategorized} events were uncategorized`
        );
      }

      // Refresh the list
      fetchCategories();
      router.refresh();
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  }

  const dialogTitle = editingCategory ? "Edit Category" : "Add New Category";
  const formMode = editingCategory ? "edit" : "create";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Category Management
          </h1>
          <p className="text-muted-foreground">
            Manage event categories for your calendar
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Category List */}
      <div className="rounded-md border">
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          error={error}
        />
      </div>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            mode={formMode}
            category={editingCategory || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
