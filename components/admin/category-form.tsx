"use client";

/**
 * CategoryForm Component
 *
 * Form for creating and editing event categories.
 *
 * Features:
 * - Create mode (new category)
 * - Edit mode (existing category)
 * - Color picker with visual preview and hex input
 * - Client-side validation matching server-side Zod schemas
 * - Loading and error states
 * - Accessible form controls with ARIA attributes
 *
 * @see contracts/categories-api.md
 * @see lib/validations/category.ts
 */

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

/**
 * Category data for edit mode
 */
export interface CategoryFormCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

/**
 * Props for CategoryForm component
 */
export interface CategoryFormProps {
  /** Form mode - create for new categories, edit for existing */
  mode: "create" | "edit";
  /** Existing category data (required for edit mode) */
  category?: CategoryFormCategory;
  /** Callback after successful submission */
  onSuccess?: () => void;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Field validation errors
 */
interface FieldErrors {
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * Validate category name
 */
function validateName(name: string): string | undefined {
  if (!name) return "Category name is required";
  if (name.length > 50) return "Category name must be at most 50 characters";
  return undefined;
}

/**
 * Validate hex color format
 */
function validateColor(color: string): string | undefined {
  if (!color) return "Color is required";
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return "Invalid hex color format (must be #RRGGBB)";
  }
  return undefined;
}

/**
 * Validate icon name (optional)
 */
function validateIcon(icon: string): string | undefined {
  if (!icon) return undefined; // Optional field
  if (icon.length > 50) return "Icon name must be at most 50 characters";
  return undefined;
}

/**
 * Default category colors for quick selection
 */
const presetColors = [
  "#F97316", // Orange (primary)
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#10B981", // Green
  "#6B7280", // Gray
  "#EC4899", // Pink
  "#F59E0B", // Amber
];

/**
 * CategoryForm component for creating and editing categories
 */
export default function CategoryForm({
  mode,
  category,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const router = useRouter();

  // Form state
  const [name, setName] = useState(category?.name || "");
  const [color, setColor] = useState(category?.color || "#F97316");
  const [icon, setIcon] = useState(category?.icon || "");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setIcon(category.icon || "");
    }
  }, [category]);

  // Clear field error when user types
  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError(null);
  }

  // Validate all fields and return whether form is valid
  function validateForm(): boolean {
    const errors: FieldErrors = {};

    errors.name = validateName(name);
    errors.color = validateColor(color);
    errors.icon = validateIcon(icon);

    setFieldErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(Boolean);
  }

  // Handle form blur for individual field validation
  function handleBlur(field: keyof FieldErrors) {
    let error: string | undefined;

    switch (field) {
      case "name":
        error = validateName(name);
        break;
      case "color":
        error = validateColor(color);
        break;
      case "icon":
        error = validateIcon(icon);
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }

  // Handle color input change (from text input)
  function handleColorTextChange(value: string) {
    // Allow partial input while typing
    setColor(value);
    clearFieldError("color");
  }

  // Handle color picker change
  function handleColorPickerChange(value: string) {
    setColor(value.toUpperCase());
    clearFieldError("color");
  }

  // Handle preset color selection
  function handlePresetColor(presetColor: string) {
    setColor(presetColor);
    clearFieldError("color");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Build request body
      const body: Record<string, unknown> = {
        name,
        color: color.toUpperCase(),
      };

      // Only include icon if provided (for create) or explicitly set (for edit)
      if (mode === "create" && icon) {
        body.icon = icon;
      } else if (mode === "edit") {
        // In edit mode, include icon even if empty (to clear it)
        body.icon = icon || null;
      }

      // Determine URL and method based on mode
      const url =
        mode === "create"
          ? "/api/categories"
          : `/api/categories/${category?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.details?.fieldErrors) {
          const apiFieldErrors: FieldErrors = {};
          for (const [field, messages] of Object.entries(
            data.details.fieldErrors
          )) {
            apiFieldErrors[field as keyof FieldErrors] = (
              messages as string[]
            )[0];
          }
          setFieldErrors(apiFieldErrors);
        }
        setError(data.error || "An error occurred");
        return;
      }

      // Success - reset form in create mode
      if (mode === "create") {
        setName("");
        setColor("#F97316");
        setIcon("");
      }

      // Call success callback
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    onCancel?.();
  }

  const isCreateMode = mode === "create";
  const submitLabel = isCreateMode ? "Create Category" : "Update Category";
  const loadingLabel = isCreateMode ? "Creating..." : "Saving...";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert">
          <p className="text-sm font-medium">{error}</p>
        </Alert>
      )}

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError("name");
          }}
          onBlur={() => handleBlur("name")}
          placeholder="e.g., Family, Work, Medical"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Color Field with Picker */}
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-3">
          {/* Color Preview */}
          <div
            data-testid="color-preview"
            className="h-9 w-9 rounded border"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          {/* Color Picker (main labeled element) */}
          <input
            id="color"
            name="color"
            type="color"
            value={color}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            disabled={isLoading}
            className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent p-0.5"
            aria-required="true"
            aria-invalid={!!fieldErrors.color}
            aria-describedby={fieldErrors.color ? "color-error" : "color-help"}
          />
          {/* Hex Input (secondary) */}
          <Input
            type="text"
            value={color}
            onChange={(e) => handleColorTextChange(e.target.value)}
            onBlur={() => handleBlur("color")}
            placeholder="#F97316"
            disabled={isLoading}
            className="flex-1 font-mono"
            aria-label="Hex value"
          />
        </div>
        {fieldErrors.color && (
          <p id="color-error" className="text-sm text-destructive">
            {fieldErrors.color}
          </p>
        )}
        <p id="color-help" className="text-xs text-muted-foreground">
          Select a color or enter a hex value (#RRGGBB)
        </p>

        {/* Preset Colors */}
        <div className="flex flex-wrap gap-2 pt-1" data-testid="color-presets">
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              onClick={() => handlePresetColor(presetColor)}
              disabled={isLoading}
              className={`h-6 w-6 rounded border-2 transition-all hover:scale-110 ${
                color.toUpperCase() === presetColor.toUpperCase()
                  ? "border-foreground ring-2 ring-offset-2"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: presetColor }}
              aria-label={`Preset ${presetColor}`}
            />
          ))}
        </div>
      </div>

      {/* Icon Field (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="icon">
          Icon <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="icon"
          name="icon"
          type="text"
          value={icon}
          onChange={(e) => {
            setIcon(e.target.value);
            clearFieldError("icon");
          }}
          onBlur={() => handleBlur("icon")}
          placeholder="e.g., home, briefcase, heart"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.icon}
          aria-describedby={fieldErrors.icon ? "icon-error" : "icon-help"}
        />
        {fieldErrors.icon && (
          <p id="icon-error" className="text-sm text-destructive">
            {fieldErrors.icon}
          </p>
        )}
        <p id="icon-help" className="text-xs text-muted-foreground">
          Lucide icon name (see lucide.dev/icons)
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} aria-busy={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {loadingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
