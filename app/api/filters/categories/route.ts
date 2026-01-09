/**
 * GET /api/filters/categories
 *
 * Returns all distinct categories and subcategories for filtering purposes.
 * Categories are derived from the transactions table.
 *
 * Response includes:
 * - categories: Array of category objects with:
 *   - category: Category name (e.g., "Groceries", "Dining")
 *   - subcategories: Array of subcategory names within this category
 *   - transaction_count: Total transactions in this category
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CategoryWithSubcategories {
  category: string;
  subcategories: string[];
  transaction_count: number;
}

interface RawCategoryRow {
  category: string;
  subcategory: string | null;
  transaction_count: bigint;
}

export async function GET(_request: NextRequest) {
  try {
    // Get distinct categories with their subcategories and transaction counts
    const rows = await prisma.$queryRaw<RawCategoryRow[]>`
      SELECT
        category,
        subcategory,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE category IS NOT NULL
      GROUP BY category, subcategory
      ORDER BY category ASC, subcategory ASC
    `;

    // Group by category and collect subcategories
    const categoryMap = new Map<
      string,
      { subcategories: Set<string>; count: number }
    >();

    for (const row of rows) {
      const existing = categoryMap.get(row.category);
      const count = Number(row.transaction_count);

      if (existing) {
        existing.count += count;
        if (row.subcategory) {
          existing.subcategories.add(row.subcategory);
        }
      } else {
        const subcategories = new Set<string>();
        if (row.subcategory) {
          subcategories.add(row.subcategory);
        }
        categoryMap.set(row.category, { subcategories, count });
      }
    }

    // Transform to response format
    const categories: CategoryWithSubcategories[] = Array.from(
      categoryMap.entries()
    )
      .map(([category, data]) => ({
        category,
        subcategories: Array.from(data.subcategories).sort(),
        transaction_count: data.count,
      }))
      .sort((a, b) => a.category.localeCompare(b.category));

    return NextResponse.json({
      data: {
        categories,
        total_categories: categories.length,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
