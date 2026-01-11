import { z } from "zod";

/**
 * Event category validation schemas
 * Used for category management API routes (admin only)
 */

/**
 * Hex color validation schema
 * Validates format: #RRGGBB
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format (must be #RRGGBB)");

/**
 * Create category schema
 * POST /api/categories
 *
 * Creates a new event category (FR-034)
 * Admin only - categories are used to organize events
 * - Name: Required, 1-50 characters, unique
 * - Color: Required, hex color (#RRGGBB) for visual display
 * - Icon: Optional, Lucide icon name for visual representation
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(50, "Category name must be at most 50 characters"),
  color: hexColorSchema,
  icon: z.string().max(50, "Icon name must be at most 50 characters").optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/**
 * Update category schema
 * PUT /api/categories/[id]
 *
 * Updates an existing category (FR-034)
 * Admin only - all fields are optional
 * Only provided fields will be updated
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: hexColorSchema.optional(),
  icon: z.string().max(50).nullable().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
