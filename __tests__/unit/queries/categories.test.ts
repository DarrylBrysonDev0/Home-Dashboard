import { describe, it, expect } from "vitest";
import {
  aggregateCategorySpending,
  calculateCategoryPercentages,
  aggregateWithSubcategories,
  type CategoryTransaction,
  type CategorySpending,
} from "@/lib/queries/categories";

/**
 * Unit Tests: Category Aggregation Functions
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/categories.ts is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml, data-model.md
 *
 * Test Categories:
 * - aggregateCategorySpending: group expenses by category, sum amounts, count transactions
 * - calculateCategoryPercentages: compute percentage of total for each category
 * - aggregateWithSubcategories: include subcategory breakdown when requested
 *
 * CRITICAL: Transfers should be EXCLUDED from category spending (same as cash flow)
 */

// Mock transaction data structure matching the expected interface
describe("aggregateCategorySpending", () => {
  it("should group expenses by category and sum amounts", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Groceries", amount: -150 }),
      createTransaction({ category: "Groceries", amount: -85 }),
      createTransaction({ category: "Dining", amount: -45 }),
      createTransaction({ category: "Dining", amount: -32 }),
      createTransaction({ category: "Utilities", amount: -120 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result).toHaveLength(3);

    const groceries = result.find((c) => c.category === "Groceries");
    expect(groceries).toBeDefined();
    expect(groceries!.amount).toBe(235); // 150 + 85 (absolute value)
    expect(groceries!.transaction_count).toBe(2);

    const dining = result.find((c) => c.category === "Dining");
    expect(dining).toBeDefined();
    expect(dining!.amount).toBe(77); // 45 + 32 (absolute value)
    expect(dining!.transaction_count).toBe(2);

    const utilities = result.find((c) => c.category === "Utilities");
    expect(utilities).toBeDefined();
    expect(utilities!.amount).toBe(120);
    expect(utilities!.transaction_count).toBe(1);
  });

  it("should EXCLUDE transfers from category spending", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Groceries", amount: -100, transaction_type: "Expense" }),
      createTransaction({ category: "Transfer", amount: -500, transaction_type: "Transfer" }),
      createTransaction({ category: "Dining", amount: -50, transaction_type: "Expense" }),
    ];

    const result = aggregateCategorySpending(transactions);

    // Transfer should be excluded
    expect(result.find((c) => c.category === "Transfer")).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it("should EXCLUDE income from category spending", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Salary", amount: 5000, transaction_type: "Income" }),
      createTransaction({ category: "Groceries", amount: -100, transaction_type: "Expense" }),
    ];

    const result = aggregateCategorySpending(transactions);

    // Income should be excluded from expense breakdown
    expect(result.find((c) => c.category === "Salary")).toBeUndefined();
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Groceries");
  });

  it("should return amounts as positive values (absolute)", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Shopping", amount: -250 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result[0].amount).toBe(250);
    expect(result[0].amount).toBeGreaterThan(0);
  });

  it("should sort categories by amount descending", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Small", amount: -10 }),
      createTransaction({ category: "Large", amount: -500 }),
      createTransaction({ category: "Medium", amount: -100 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result[0].category).toBe("Large");
    expect(result[1].category).toBe("Medium");
    expect(result[2].category).toBe("Small");
  });

  it("should return empty array for no transactions", () => {
    const result = aggregateCategorySpending([]);
    expect(result).toEqual([]);
  });

  it("should return empty array when only transfers/income exist", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Salary", amount: 5000, transaction_type: "Income" }),
      createTransaction({ category: "Transfer", amount: -1000, transaction_type: "Transfer" }),
    ];

    const result = aggregateCategorySpending(transactions);
    expect(result).toEqual([]);
  });

  it("should handle single expense correctly", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Entertainment", amount: -75.50 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Entertainment");
    expect(result[0].amount).toBe(75.50);
    expect(result[0].transaction_count).toBe(1);
  });

  it("should handle decimal amounts correctly", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Food", amount: -12.99 }),
      createTransaction({ category: "Food", amount: -8.75 }),
      createTransaction({ category: "Food", amount: -5.50 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result[0].amount).toBeCloseTo(27.24, 2); // 12.99 + 8.75 + 5.50
  });
});

describe("calculateCategoryPercentages", () => {
  it("should calculate percentage of total for each category", () => {
    const categories: CategorySpending[] = [
      { category: "Housing", amount: 500, transaction_count: 1 },
      { category: "Food", amount: 300, transaction_count: 5 },
      { category: "Transport", amount: 200, transaction_count: 3 },
    ];
    const totalExpenses = 1000;

    const result = calculateCategoryPercentages(categories, totalExpenses);

    expect(result.find((c) => c.category === "Housing")!.percentage).toBe(50);
    expect(result.find((c) => c.category === "Food")!.percentage).toBe(30);
    expect(result.find((c) => c.category === "Transport")!.percentage).toBe(20);
  });

  it("should return 0 percentage when total is zero", () => {
    const categories: CategorySpending[] = [
      { category: "Test", amount: 100, transaction_count: 1 },
    ];

    const result = calculateCategoryPercentages(categories, 0);

    expect(result[0].percentage).toBe(0);
  });

  it("should handle empty categories array", () => {
    const result = calculateCategoryPercentages([], 1000);
    expect(result).toEqual([]);
  });

  it("should round percentages to one decimal place", () => {
    const categories: CategorySpending[] = [
      { category: "A", amount: 333.33, transaction_count: 1 },
      { category: "B", amount: 333.33, transaction_count: 1 },
      { category: "C", amount: 333.34, transaction_count: 1 },
    ];
    const totalExpenses = 1000;

    const result = calculateCategoryPercentages(categories, totalExpenses);

    // Percentages should be rounded, e.g., 33.333... -> 33.3
    result.forEach((cat) => {
      const decimalPlaces = (cat.percentage.toString().split(".")[1] || "").length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });
  });

  it("should preserve existing category data", () => {
    const categories: CategorySpending[] = [
      { category: "Test", amount: 100, transaction_count: 5 },
    ];

    const result = calculateCategoryPercentages(categories, 100);

    expect(result[0].category).toBe("Test");
    expect(result[0].amount).toBe(100);
    expect(result[0].transaction_count).toBe(5);
  });
});

describe("aggregateWithSubcategories", () => {
  it("should include subcategory breakdown when requested", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Dining", subcategory: "Fast Food", amount: -25 }),
      createTransaction({ category: "Dining", subcategory: "Restaurants", amount: -75 }),
      createTransaction({ category: "Dining", subcategory: "Fast Food", amount: -20 }),
      createTransaction({ category: "Groceries", subcategory: "Supermarket", amount: -100 }),
    ];

    const result = aggregateWithSubcategories(transactions);

    const dining = result.find((c) => c.category === "Dining");
    expect(dining).toBeDefined();
    expect(dining!.subcategories).toBeDefined();
    expect(dining!.subcategories).toHaveLength(2);

    const fastFood = dining!.subcategories!.find((s) => s.subcategory === "Fast Food");
    expect(fastFood).toBeDefined();
    expect(fastFood!.amount).toBe(45); // 25 + 20
    expect(fastFood!.transaction_count).toBe(2);

    const restaurants = dining!.subcategories!.find((s) => s.subcategory === "Restaurants");
    expect(restaurants).toBeDefined();
    expect(restaurants!.amount).toBe(75);
    expect(restaurants!.transaction_count).toBe(1);
  });

  it("should sort subcategories by amount descending", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Dining", subcategory: "Small", amount: -10 }),
      createTransaction({ category: "Dining", subcategory: "Large", amount: -100 }),
      createTransaction({ category: "Dining", subcategory: "Medium", amount: -50 }),
    ];

    const result = aggregateWithSubcategories(transactions);

    const dining = result[0];
    expect(dining.subcategories![0].subcategory).toBe("Large");
    expect(dining.subcategories![1].subcategory).toBe("Medium");
    expect(dining.subcategories![2].subcategory).toBe("Small");
  });

  it("should handle null subcategories gracefully", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Utilities", subcategory: null, amount: -150 }),
      createTransaction({ category: "Utilities", subcategory: "Electric", amount: -100 }),
    ];

    const result = aggregateWithSubcategories(transactions);

    const utilities = result[0];
    expect(utilities.amount).toBe(250);
    // Should have subcategory entries (null counts as separate or merged with "Other")
    expect(utilities.subcategories).toBeDefined();
  });

  it("should calculate subcategory percentages relative to parent category", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Food", subcategory: "Grocery", amount: -75 }),
      createTransaction({ category: "Food", subcategory: "Restaurant", amount: -25 }),
    ];

    const result = aggregateWithSubcategories(transactions);

    const food = result[0];
    const grocery = food.subcategories!.find((s) => s.subcategory === "Grocery");
    const restaurant = food.subcategories!.find((s) => s.subcategory === "Restaurant");

    expect(grocery!.percentage).toBe(75); // 75/100 * 100
    expect(restaurant!.percentage).toBe(25); // 25/100 * 100
  });

  it("should exclude transfers from subcategory aggregation", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Transfer", subcategory: "Savings", amount: -500, transaction_type: "Transfer" }),
      createTransaction({ category: "Dining", subcategory: "Cafe", amount: -20, transaction_type: "Expense" }),
    ];

    const result = aggregateWithSubcategories(transactions);

    expect(result.find((c) => c.category === "Transfer")).toBeUndefined();
    expect(result).toHaveLength(1);
  });

  it("should return empty array for no expenses", () => {
    const result = aggregateWithSubcategories([]);
    expect(result).toEqual([]);
  });

  it("should handle categories with only null subcategories", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Misc", subcategory: null, amount: -50 }),
      createTransaction({ category: "Misc", subcategory: null, amount: -30 }),
    ];

    const result = aggregateWithSubcategories(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Misc");
    expect(result[0].amount).toBe(80);
  });
});

describe("Edge Cases and Data Integrity", () => {
  it("should handle very large number of categories", () => {
    const categories = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
    const transactions: CategoryTransaction[] = categories.map((cat) =>
      createTransaction({ category: cat, amount: -10 })
    );

    const result = aggregateCategorySpending(transactions);

    expect(result).toHaveLength(15);
    expect(result.every((c) => c.amount === 10)).toBe(true);
  });

  it("should handle zero-amount expenses gracefully", () => {
    // Edge case: technically amount = 0 shouldn't exist per data model rules
    // but if it does, it should be handled gracefully
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Test", amount: 0 }),
      createTransaction({ category: "Valid", amount: -100 }),
    ];

    const result = aggregateCategorySpending(transactions);

    // Zero amount should either be excluded or handled without error
    const valid = result.find((c) => c.category === "Valid");
    expect(valid).toBeDefined();
    expect(valid!.amount).toBe(100);
  });

  it("should handle very small decimal amounts", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Micro", amount: -0.01 }),
      createTransaction({ category: "Micro", amount: -0.02 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result[0].amount).toBeCloseTo(0.03, 2);
  });

  it("should handle very large amounts", () => {
    const transactions: CategoryTransaction[] = [
      createTransaction({ category: "Large", amount: -999999.99 }),
    ];

    const result = aggregateCategorySpending(transactions);

    expect(result[0].amount).toBe(999999.99);
  });
});

// Helper function to create mock transactions with defaults
function createTransaction(overrides: Partial<CategoryTransaction>): CategoryTransaction {
  return {
    transaction_id: `TXN-${Math.random().toString(36).substring(7)}`,
    transaction_date: new Date("2024-01-15"),
    account_id: "ACC-JOINT-CHK",
    description: "Test Transaction",
    category: "Uncategorized",
    subcategory: null,
    amount: -100,
    transaction_type: "Expense",
    ...overrides,
  };
}
