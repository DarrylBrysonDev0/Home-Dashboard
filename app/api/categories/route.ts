import { NextRequest, NextResponse } from "next/server";
import { listCategories, createCategory } from "@/lib/queries/categories";
import { checkAdminAuth } from "@/lib/middleware/admin-check";
import { createCategorySchema } from "@/lib/validations/category";
import { Prisma } from "@/generated/prisma/client";

/**
 * GET /api/categories
 *
 * List all event categories
 *
 * Returns all event categories sorted by name (ascending).
 * Categories are used to organize and filter calendar events.
 *
 * Authentication: Required (handled by middleware)
 *
 * Response:
 * {
 *   data: Array<{
 *     id: string;
 *     name: string;
 *     color: string;    // Hex color like #F97316
 *     icon: string | null;  // Lucide icon name
 *     createdAt: string;
 *   }>
 * }
 *
 * @see contracts/categories-api.md
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch all categories from database
    const categories = await listCategories();

    // Transform categories to API response format
    const responseData = categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      createdAt: category.createdAt.toISOString(),
    }));

    return NextResponse.json({ data: responseData });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 *
 * Create a new event category (FR-034)
 *
 * Admin only - requires ADMIN role.
 * Creates a new category with name, color, and optional icon.
 *
 * Request body:
 * {
 *   name: string;     // Required, 1-50 chars, unique
 *   color: string;    // Required, hex color (#RRGGBB)
 *   icon?: string;    // Optional, Lucide icon name
 * }
 *
 * Response 201:
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
export async function POST(request: NextRequest) {
  // Check admin authorization
  const { authorized, response } = await checkAdminAuth();
  if (!authorized) {
    return response;
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, color, icon } = validationResult.data;

    // Create category in database
    const category = await createCategory({ name, color, icon });

    // Return created category
    return NextResponse.json(
      {
        data: {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          createdAt: category.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
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

    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
