import { NextRequest, NextResponse } from "next/server";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/lib/queries/categories";
import { checkAdminAuth } from "@/lib/middleware/admin-check";
import { updateCategorySchema } from "@/lib/validations/category";
import { Prisma } from "@/generated/prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/categories/[id]
 *
 * Update an existing event category (FR-034)
 *
 * Admin only - requires ADMIN role.
 * Allows partial updates (any combination of fields).
 *
 * Path parameters:
 * - id: Category ID (cuid)
 *
 * Request body (all optional):
 * {
 *   name?: string;     // 1-50 chars, unique
 *   color?: string;    // Hex color (#RRGGBB)
 *   icon?: string | null;
 * }
 *
 * Response 200:
 * {
 *   data: {
 *     id: string;
 *     name: string;
 *     color: string;
 *     icon: string | null;
 *     createdAt: string;
 *   }
 * }
 *
 * @see contracts/categories-api.md
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Check admin authorization
  const { authorized, response } = await checkAdminAuth();
  if (!authorized) {
    return response;
  }

  try {
    const { id } = await params;

    // Check if category exists
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update category in database
    const category = await updateCategory(id, updateData);

    // Return updated category
    return NextResponse.json({
      data: {
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        createdAt: category.createdAt.toISOString(),
      },
    });
  } catch (error) {
    // Handle unique constraint violation (duplicate name)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: {
            fieldErrors: {
              name: ["Category name already exists"],
            },
          },
        },
        { status: 400 }
      );
    }

    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 *
 * Delete an event category (FR-034)
 *
 * Admin only - requires ADMIN role.
 * When a category is deleted, all events with this category
 * have their categoryId set to null (uncategorized).
 *
 * Path parameters:
 * - id: Category ID (cuid)
 *
 * Response 200:
 * {
 *   data: {
 *     success: true,
 *     eventsUncategorized: number
 *   }
 * }
 *
 * @see contracts/categories-api.md
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // Check admin authorization
  const { authorized, response } = await checkAdminAuth();
  if (!authorized) {
    return response;
  }

  try {
    const { id } = await params;

    // Check if category exists
    const existingCategory = await getCategoryById(id);
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Delete category (also uncategorizes associated events)
    const result = await deleteCategory(id);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
