import { NextRequest, NextResponse } from "next/server";
import { listCategories } from "@/lib/queries/categories";

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
