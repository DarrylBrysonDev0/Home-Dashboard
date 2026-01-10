/**
 * Category spending query helpers for spending breakdown analytics
 * All calculations EXCLUDE Transfer and Income transactions - only Expenses count
 *
 * This module exports two types of functions:
 * 1. Pure calculation functions (aggregate*, calculate*) - for unit testing with mock data
 * 2. Database query functions (get*) - for API endpoints using Prisma
 */

import { prisma } from "@/lib/db";
import type { CategoryBreakdown } from "@/lib/validations/analytics";
import type { Decimal } from "@prisma/client/runtime/client";

// ----- TYPE DEFINITIONS -----

/**
 * Transaction interface for category aggregation
 * Used by pure calculation functions
 */
export interface CategoryTransaction {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  description: string;
  category: string;
  subcategory: string | null;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer" | string;
}

/**
 * Aggregated category spending without percentage
 */
export interface CategorySpending {
  category: string;
  amount: number;
  transaction_count: number;
}

/**
 * Aggregated category with percentage
 */
export interface CategorySpendingWithPercentage extends CategorySpending {
  percentage: number;
}

/**
 * Subcategory breakdown item
 */
export interface SubcategorySpending {
  subcategory: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}

/**
 * Category with optional subcategory breakdown
 */
export interface CategoryWithSubcategories extends CategorySpendingWithPercentage {
  subcategories?: SubcategorySpending[];
}

export interface CategoryFilters {
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
  includeSubcategories?: boolean;
}

// ----- PURE CALCULATION FUNCTIONS (for unit testing) -----

/**
 * Aggregate transactions by category, summing amounts and counting transactions
 * Only includes Expense transactions (excludes Transfer and Income)
 * Returns amounts as positive values, sorted by amount descending
 */
export function aggregateCategorySpending(
  transactions: CategoryTransaction[]
): CategorySpending[] {
  // Filter to expenses only (transaction_type === "Expense" and amount < 0)
  const expenses = transactions.filter(
    (t) => t.transaction_type === "Expense" && t.amount < 0
  );

  // Group by category
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const txn of expenses) {
    const existing = categoryMap.get(txn.category);
    const absAmount = Math.abs(txn.amount);

    if (existing) {
      existing.amount += absAmount;
      existing.count += 1;
    } else {
      categoryMap.set(txn.category, { amount: absAmount, count: 1 });
    }
  }

  // Convert to array and sort by amount descending
  const result: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      transaction_count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  return result;
}

/**
 * Calculate percentage of total for each category
 * Rounds to 1 decimal place
 * Preserves existing category data
 */
export function calculateCategoryPercentages(
  categories: CategorySpending[],
  totalExpenses: number
): CategorySpendingWithPercentage[] {
  if (categories.length === 0) {
    return [];
  }

  return categories.map((cat) => {
    let percentage = 0;
    if (totalExpenses > 0) {
      percentage = (cat.amount / totalExpenses) * 100;
      // Round to 1 decimal place
      percentage = Math.round(percentage * 10) / 10;
    }

    return {
      ...cat,
      percentage,
    };
  });
}

/**
 * Aggregate expenses by category with subcategory breakdown
 * Only includes Expense transactions
 * Subcategory percentages are relative to their parent category total
 */
export function aggregateWithSubcategories(
  transactions: CategoryTransaction[]
): CategoryWithSubcategories[] {
  // Filter to expenses only
  const expenses = transactions.filter(
    (t) => t.transaction_type === "Expense" && t.amount < 0
  );

  if (expenses.length === 0) {
    return [];
  }

  // Group by category, then by subcategory
  const categoryMap = new Map<
    string,
    {
      amount: number;
      count: number;
      subcategories: Map<string, { amount: number; count: number }>;
    }
  >();

  for (const txn of expenses) {
    const absAmount = Math.abs(txn.amount);
    const subcategoryKey = txn.subcategory ?? "(Uncategorized)";

    let catData = categoryMap.get(txn.category);
    if (!catData) {
      catData = { amount: 0, count: 0, subcategories: new Map() };
      categoryMap.set(txn.category, catData);
    }

    catData.amount += absAmount;
    catData.count += 1;

    const subData = catData.subcategories.get(subcategoryKey);
    if (subData) {
      subData.amount += absAmount;
      subData.count += 1;
    } else {
      catData.subcategories.set(subcategoryKey, { amount: absAmount, count: 1 });
    }
  }

  // Calculate total for overall percentages
  const totalExpenses = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.amount,
    0
  );

  // Convert to result array
  const result: CategoryWithSubcategories[] = Array.from(categoryMap.entries())
    .map(([category, catData]) => {
      // Calculate category percentage
      const categoryPercentage =
        totalExpenses > 0
          ? Math.round((catData.amount / totalExpenses) * 1000) / 10
          : 0;

      // Build subcategories array
      const subcategories: SubcategorySpending[] = Array.from(
        catData.subcategories.entries()
      )
        .map(([subcategory, subData]) => {
          // Subcategory percentage is relative to parent category
          const subPercentage =
            catData.amount > 0
              ? Math.round((subData.amount / catData.amount) * 1000) / 10
              : 0;

          return {
            subcategory,
            amount: subData.amount,
            percentage: subPercentage,
            transaction_count: subData.count,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      return {
        category,
        amount: catData.amount,
        percentage: categoryPercentage,
        transaction_count: catData.count,
        subcategories,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return result;
}

// ----- DATABASE QUERY FUNCTIONS (for API endpoints) -----

/**
 * Build WHERE clause conditions for category queries
 */
function buildWhereConditions(filters: CategoryFilters): string {
  const conditions: string[] = [
    "transaction_type = 'Expense'",
    "amount < 0",
  ];

  if (filters.startDate) {
    conditions.push(
      `transaction_date >= '${filters.startDate.toISOString().split("T")[0]}'`
    );
  }

  if (filters.endDate) {
    conditions.push(
      `transaction_date <= '${filters.endDate.toISOString().split("T")[0]}'`
    );
  }

  if (filters.accountIds && filters.accountIds.length > 0) {
    const accountList = filters.accountIds.map((id) => `'${id}'`).join(",");
    conditions.push(`account_id IN (${accountList})`);
  }

  return conditions.join(" AND ");
}

interface RawCategoryRow {
  category: string;
  total_amount: Decimal;
  transaction_count: bigint;
}

interface RawSubcategoryRow extends RawCategoryRow {
  subcategory: string | null;
}

/**
 * Get category spending breakdown from database
 * Returns aggregated spending by category with percentages
 */
export async function getCategoryBreakdown(
  filters: CategoryFilters
): Promise<{ total_expenses: number; categories: CategoryBreakdown[] }> {
  const whereClause = buildWhereConditions(filters);

  if (filters.includeSubcategories) {
    // Query with subcategory grouping
    const rows = await prisma.$queryRawUnsafe<RawSubcategoryRow[]>(`
      SELECT
        category,
        subcategory,
        SUM(ABS(amount)) AS total_amount,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY category, subcategory
      ORDER BY category, SUM(ABS(amount)) DESC
    `);

    return buildCategoryResponseWithSubcategories(rows);
  } else {
    // Simple category-only query
    const rows = await prisma.$queryRawUnsafe<RawCategoryRow[]>(`
      SELECT
        category,
        SUM(ABS(amount)) AS total_amount,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY SUM(ABS(amount)) DESC
    `);

    return buildCategoryResponse(rows);
  }
}

/**
 * Build response from simple category rows
 */
function buildCategoryResponse(rows: RawCategoryRow[]): {
  total_expenses: number;
  categories: CategoryBreakdown[];
} {
  if (rows.length === 0) {
    return { total_expenses: 0, categories: [] };
  }

  // Calculate total
  const total_expenses = rows.reduce(
    (sum, row) => sum + Number(row.total_amount),
    0
  );

  // Build categories with percentages
  const categories: CategoryBreakdown[] = rows.map((row) => {
    const amount = Number(row.total_amount);
    const percentage =
      total_expenses > 0
        ? Math.round((amount / total_expenses) * 1000) / 10
        : 0;

    return {
      category: row.category,
      amount,
      percentage,
      transaction_count: Number(row.transaction_count),
    };
  });

  return { total_expenses, categories };
}

/**
 * Build response from subcategory rows
 * Groups rows by category and creates nested subcategory arrays
 */
function buildCategoryResponseWithSubcategories(rows: RawSubcategoryRow[]): {
  total_expenses: number;
  categories: CategoryBreakdown[];
} {
  if (rows.length === 0) {
    return { total_expenses: 0, categories: [] };
  }

  // Group by category
  const categoryMap = new Map<
    string,
    {
      amount: number;
      count: number;
      subcategories: Array<{
        subcategory: string;
        amount: number;
        count: number;
      }>;
    }
  >();

  for (const row of rows) {
    const amount = Number(row.total_amount);
    const count = Number(row.transaction_count);
    const subcategoryName = row.subcategory ?? "(Uncategorized)";

    let catData = categoryMap.get(row.category);
    if (!catData) {
      catData = { amount: 0, count: 0, subcategories: [] };
      categoryMap.set(row.category, catData);
    }

    catData.amount += amount;
    catData.count += count;
    catData.subcategories.push({
      subcategory: subcategoryName,
      amount,
      count,
    });
  }

  // Calculate total
  const total_expenses = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.amount,
    0
  );

  // Build categories with subcategories
  const categories: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, catData]) => {
      const categoryPercentage =
        total_expenses > 0
          ? Math.round((catData.amount / total_expenses) * 1000) / 10
          : 0;

      // Build subcategories with percentages relative to parent
      const subcategories = catData.subcategories
        .map((sub) => ({
          subcategory: sub.subcategory,
          amount: sub.amount,
          percentage:
            catData.amount > 0
              ? Math.round((sub.amount / catData.amount) * 1000) / 10
              : 0,
          transaction_count: sub.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        category,
        amount: catData.amount,
        percentage: categoryPercentage,
        transaction_count: catData.count,
        subcategories,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return { total_expenses, categories };
}

// ============================================
// EVENT CATEGORY QUERIES (for calendar feature)
// ============================================

/**
 * List all event categories
 *
 * Retrieves all event categories from the database.
 * Categories are used to organize and filter calendar events.
 *
 * Returns:
 * - All categories sorted by name (ascending)
 * - Includes: id, name, color, icon, createdAt
 *
 * Used by:
 * - GET /api/categories - Category filter component data
 * - Event creation/edit forms - Category selection dropdown
 *
 * @returns Promise resolving to array of event categories
 */
export async function listCategories() {
  return prisma.eventCategory.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Get a single event category by ID
 *
 * Used by:
 * - PUT /api/categories/[id] - Verify category exists before update
 * - DELETE /api/categories/[id] - Verify category exists before delete
 *
 * @param id - Category ID (cuid)
 * @returns Category or null if not found
 */
export async function getCategoryById(id: string) {
  return prisma.eventCategory.findUnique({
    where: { id },
  });
}

/**
 * Create a new event category (FR-034)
 *
 * Admin only - categories are used to organize calendar events.
 * Validates uniqueness of name via database constraint.
 *
 * Used by:
 * - POST /api/categories - Admin category creation
 *
 * @param data - Category data (name, color, icon)
 * @returns Created category
 */
export async function createCategory(data: {
  name: string;
  color: string;
  icon?: string | null;
}) {
  return prisma.eventCategory.create({
    data: {
      name: data.name,
      color: data.color,
      icon: data.icon ?? null,
    },
  });
}

/**
 * Update an existing event category (FR-034)
 *
 * Admin only - allows partial updates.
 * Validates uniqueness of name via database constraint.
 *
 * Used by:
 * - PUT /api/categories/[id] - Admin category update
 *
 * @param id - Category ID (cuid)
 * @param data - Partial category data to update
 * @returns Updated category
 */
export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: string;
    icon?: string | null;
  }
) {
  return prisma.eventCategory.update({
    where: { id },
    data,
  });
}

/**
 * Delete an event category (FR-034)
 *
 * Admin only - when a category is deleted, all events
 * with this category have their categoryId set to null.
 *
 * Uses a transaction to ensure atomic operation:
 * 1. Count events that will be uncategorized
 * 2. Set categoryId to null on affected events
 * 3. Delete the category
 *
 * Used by:
 * - DELETE /api/categories/[id] - Admin category deletion
 *
 * @param id - Category ID (cuid)
 * @returns Object with success status and count of uncategorized events
 */
export async function deleteCategory(id: string): Promise<{
  success: boolean;
  eventsUncategorized: number;
}> {
  return prisma.$transaction(async (tx) => {
    // Count events that will be uncategorized
    const affectedEventsCount = await tx.event.count({
      where: { categoryId: id },
    });

    // Set categoryId to null on affected events
    if (affectedEventsCount > 0) {
      await tx.event.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
    }

    // Delete the category
    await tx.eventCategory.delete({
      where: { id },
    });

    return {
      success: true,
      eventsUncategorized: affectedEventsCount,
    };
  });
}
