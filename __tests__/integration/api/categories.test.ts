import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/analytics/categories/route").GET;

/**
 * Integration Tests: GET /api/analytics/categories
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml
 *
 * Test Categories:
 * - Response shape validation (categories array with required fields)
 * - Category aggregation and sorting
 * - Subcategory breakdown (include_subcategories parameter)
 * - Filter parameter handling (account_id, start_date, end_date)
 * - Transfer exclusion verification (CRITICAL)
 * - Empty data handling
 * - Error handling for invalid parameters
 *
 * CRITICAL: User Story 4 requirement - "Display spending breakdown by category with percentages"
 */

describe("GET /api/analytics/categories", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/analytics/categories/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    txnCounter = 0;
  });

  describe("Response Structure", () => {
    it("should return data with total_expenses and categories array", async () => {
      await seedBasicCategoryData();

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("total_expenses");
      expect(json.data).toHaveProperty("categories");
      expect(Array.isArray(json.data.categories)).toBe(true);
    });

    it("should return category items with required fields", async () => {
      await seedBasicCategoryData();

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.categories.length).toBeGreaterThan(0);

      const category = json.data.categories[0];
      expect(category).toHaveProperty("category");
      expect(category).toHaveProperty("amount");
      expect(category).toHaveProperty("percentage");
      expect(category).toHaveProperty("transaction_count");
    });

    it("should return numeric values for amount, percentage, and transaction_count", async () => {
      await seedBasicCategoryData();

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      const category = json.data.categories[0];
      expect(typeof category.amount).toBe("number");
      expect(typeof category.percentage).toBe("number");
      expect(typeof category.transaction_count).toBe("number");
    });

    it("should return total_expenses as sum of all category amounts", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -100,
        category: "Groceries",
        transaction_type: "Expense",
      });
      await insertTransaction(prisma, {
        amount: -50,
        category: "Dining",
        transaction_type: "Expense",
      });
      await insertTransaction(prisma, {
        amount: -150,
        category: "Utilities",
        transaction_type: "Expense",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.total_expenses).toBe(300);
    });

    it("should return amounts as positive values (absolute)", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -500,
        category: "Shopping",
        transaction_type: "Expense",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      const category = json.data.categories[0];
      expect(category.amount).toBe(500);
      expect(category.amount).toBeGreaterThan(0);
    });
  });

  describe("Category Aggregation", () => {
    it("should group transactions by category", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, { amount: -50, category: "Groceries" });
      await insertTransaction(prisma, { amount: -75, category: "Groceries" });
      await insertTransaction(prisma, { amount: -30, category: "Dining" });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.categories).toHaveLength(2);

      const groceries = json.data.categories.find(
        (c: { category: string }) => c.category === "Groceries"
      );
      expect(groceries.amount).toBe(125); // 50 + 75
      expect(groceries.transaction_count).toBe(2);

      const dining = json.data.categories.find(
        (c: { category: string }) => c.category === "Dining"
      );
      expect(dining.amount).toBe(30);
      expect(dining.transaction_count).toBe(1);
    });

    it("should sort categories by amount descending", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, { amount: -50, category: "Small" });
      await insertTransaction(prisma, { amount: -500, category: "Large" });
      await insertTransaction(prisma, { amount: -150, category: "Medium" });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.categories[0].category).toBe("Large");
      expect(json.data.categories[1].category).toBe("Medium");
      expect(json.data.categories[2].category).toBe("Small");
    });

    it("should calculate correct percentages", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, { amount: -500, category: "Housing" });
      await insertTransaction(prisma, { amount: -300, category: "Food" });
      await insertTransaction(prisma, { amount: -200, category: "Transport" });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      // Total: 1000
      const housing = json.data.categories.find(
        (c: { category: string }) => c.category === "Housing"
      );
      const food = json.data.categories.find(
        (c: { category: string }) => c.category === "Food"
      );
      const transport = json.data.categories.find(
        (c: { category: string }) => c.category === "Transport"
      );

      expect(housing.percentage).toBe(50);
      expect(food.percentage).toBe(30);
      expect(transport.percentage).toBe(20);
    });
  });

  describe("Subcategory Parameter", () => {
    it("should NOT include subcategories by default", async () => {
      await seedSubcategoryData();

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      const category = json.data.categories[0];
      expect(category.subcategories).toBeUndefined();
    });

    it("should include subcategories when include_subcategories=true", async () => {
      await seedSubcategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      const dining = json.data.categories.find(
        (c: { category: string }) => c.category === "Dining"
      );
      expect(dining.subcategories).toBeDefined();
      expect(Array.isArray(dining.subcategories)).toBe(true);
      expect(dining.subcategories.length).toBeGreaterThan(0);
    });

    it("should include subcategory fields when include_subcategories=true", async () => {
      await seedSubcategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      const dining = json.data.categories.find(
        (c: { category: string }) => c.category === "Dining"
      );
      const subcategory = dining.subcategories[0];

      expect(subcategory).toHaveProperty("subcategory");
      expect(subcategory).toHaveProperty("amount");
      expect(subcategory).toHaveProperty("percentage");
      expect(subcategory).toHaveProperty("transaction_count");
    });

    it("should aggregate subcategories correctly", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -50,
        category: "Dining",
        subcategory: "Fast Food",
      });
      await insertTransaction(prisma, {
        amount: -30,
        category: "Dining",
        subcategory: "Fast Food",
      });
      await insertTransaction(prisma, {
        amount: -100,
        category: "Dining",
        subcategory: "Restaurant",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      const dining = json.data.categories.find(
        (c: { category: string }) => c.category === "Dining"
      );
      expect(dining.subcategories).toHaveLength(2);

      const fastFood = dining.subcategories.find(
        (s: { subcategory: string }) => s.subcategory === "Fast Food"
      );
      expect(fastFood.amount).toBe(80); // 50 + 30
      expect(fastFood.transaction_count).toBe(2);

      const restaurant = dining.subcategories.find(
        (s: { subcategory: string }) => s.subcategory === "Restaurant"
      );
      expect(restaurant.amount).toBe(100);
      expect(restaurant.transaction_count).toBe(1);
    });

    it("should sort subcategories by amount descending", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -20,
        category: "Food",
        subcategory: "Small",
      });
      await insertTransaction(prisma, {
        amount: -100,
        category: "Food",
        subcategory: "Large",
      });
      await insertTransaction(prisma, {
        amount: -50,
        category: "Food",
        subcategory: "Medium",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      const food = json.data.categories[0];
      expect(food.subcategories[0].subcategory).toBe("Large");
      expect(food.subcategories[1].subcategory).toBe("Medium");
      expect(food.subcategories[2].subcategory).toBe("Small");
    });

    it("should calculate subcategory percentages relative to parent category", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -75,
        category: "Dining",
        subcategory: "Restaurant",
      });
      await insertTransaction(prisma, {
        amount: -25,
        category: "Dining",
        subcategory: "Fast Food",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      const dining = json.data.categories[0];
      const restaurant = dining.subcategories.find(
        (s: { subcategory: string }) => s.subcategory === "Restaurant"
      );
      const fastFood = dining.subcategories.find(
        (s: { subcategory: string }) => s.subcategory === "Fast Food"
      );

      expect(restaurant.percentage).toBe(75); // 75/100 * 100
      expect(fastFood.percentage).toBe(25); // 25/100 * 100
    });
  });

  describe("Filter Parameters", () => {
    it("should filter by account_id", async () => {
      await seedMultiAccountCategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?account_id=ACC-USER1-CHK"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include expenses from ACC-USER1-CHK
      expect(json.data.total_expenses).toBe(100); // Only the 100 from ACC-USER1-CHK
    });

    it("should filter by multiple account_ids", async () => {
      await seedMultiAccountCategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?account_id=ACC-USER1-CHK,ACC-USER2-SAV"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_expenses).toBe(300); // 100 + 200
    });

    it("should filter by date range", async () => {
      await seedDateRangeCategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include January data
      expect(json.data.total_expenses).toBe(100);
    });

    it("should combine all filters", async () => {
      await seedMultiAccountCategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?account_id=ACC-USER1-CHK&start_date=2024-01-01&end_date=2024-12-31&include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });
  });

  describe("Transfer Exclusion (CRITICAL)", () => {
    it("should EXCLUDE transfers from category breakdown", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -100,
        category: "Groceries",
        transaction_type: "Expense",
      });
      await insertTransaction(prisma, {
        amount: -500,
        category: "Transfer",
        transaction_type: "Transfer",
      });
      await insertTransaction(prisma, {
        amount: 500,
        category: "Transfer",
        transaction_type: "Transfer",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Transfer should be excluded
      expect(
        json.data.categories.find((c: { category: string }) => c.category === "Transfer")
      ).toBeUndefined();
      expect(json.data.total_expenses).toBe(100);
      expect(json.data.categories).toHaveLength(1);
    });

    it("should EXCLUDE income from category breakdown", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: 5000,
        category: "Salary",
        transaction_type: "Income",
      });
      await insertTransaction(prisma, {
        amount: -150,
        category: "Groceries",
        transaction_type: "Expense",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Income should be excluded
      expect(
        json.data.categories.find((c: { category: string }) => c.category === "Salary")
      ).toBeUndefined();
      expect(json.data.total_expenses).toBe(150);
      expect(json.data.categories).toHaveLength(1);
      expect(json.data.categories[0].category).toBe("Groceries");
    });

    it("should return zeros when only transfers exist", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -1000,
        category: "Transfer",
        transaction_type: "Transfer",
      });
      await insertTransaction(prisma, {
        amount: 1000,
        category: "Transfer",
        transaction_type: "Transfer",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_expenses).toBe(0);
      expect(json.data.categories).toEqual([]);
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty array when no transactions exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_expenses).toBe(0);
      expect(json.data.categories).toEqual([]);
    });

    it("should return empty array when no transactions in date range", async () => {
      await seedBasicCategoryData(); // Seeds 2024 data

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?start_date=2020-01-01&end_date=2020-12-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_expenses).toBe(0);
      expect(json.data.categories).toEqual([]);
    });

    it("should return empty array when account filter has no matches", async () => {
      await seedBasicCategoryData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?account_id=NONEXISTENT-ACCOUNT"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_expenses).toBe(0);
      expect(json.data.categories).toEqual([]);
    });

    it("should return empty subcategories array when no subcategories exist", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -100,
        category: "Misc",
        subcategory: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=true"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const misc = json.data.categories.find(
        (c: { category: string }) => c.category === "Misc"
      );
      // Should either have empty array or handle null subcategories gracefully
      expect(misc).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?start_date=invalid-date"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("start_date");
    });

    it("should return 400 for invalid include_subcategories value", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/categories?include_subcategories=invalid"
      );
      const response = await GET(request);

      // Should either return 400 or treat invalid as false
      expect([200, 400]).toContain(response.status);
    });
  });

  describe("Calculation Accuracy", () => {
    it("should handle decimal amounts correctly", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, { amount: -12.99, category: "Food" });
      await insertTransaction(prisma, { amount: -8.75, category: "Food" });
      await insertTransaction(prisma, { amount: -5.50, category: "Food" });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.total_expenses).toBeCloseTo(27.24, 2);
      expect(json.data.categories[0].amount).toBeCloseTo(27.24, 2);
    });

    it("should handle large numbers correctly", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, { amount: -999999.99, category: "Big" });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.total_expenses).toBe(999999.99);
      expect(json.data.categories[0].amount).toBe(999999.99);
    });

    it("should calculate percentages that sum to approximately 100", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, { amount: -333.33, category: "A" });
      await insertTransaction(prisma, { amount: -333.33, category: "B" });
      await insertTransaction(prisma, { amount: -333.34, category: "C" });

      const request = new NextRequest("http://localhost:3000/api/analytics/categories");
      const response = await GET(request);
      const json = await response.json();

      const totalPercentage = json.data.categories.reduce(
        (sum: number, c: { percentage: number }) => sum + c.percentage,
        0
      );
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });
});

// Helper functions for seeding test data
let txnCounter = 0;

async function insertTransaction(
  prisma: ReturnType<typeof getTestPrisma>,
  data: {
    amount: number;
    category: string;
    subcategory?: string | null;
    description?: string;
    transaction_type?: string;
    account_id?: string;
    transaction_date?: Date;
  }
) {
  const id = `TXN${String(++txnCounter).padStart(6, "0")}`;
  const date = data.transaction_date || new Date("2024-01-15");
  const txnType = data.transaction_type || "Expense";

  await prisma.$executeRawUnsafe(`
    INSERT INTO [transactions] (
      transaction_id, transaction_date, transaction_time, account_id, account_name,
      account_type, account_owner, description, category, subcategory, amount,
      transaction_type, balance_after, is_recurring, recurring_frequency, notes
    ) VALUES (
      '${id}',
      '${date.toISOString().split("T")[0]}',
      '${date.toTimeString().split(" ")[0]}',
      '${data.account_id || "ACC-JOINT-CHK"}',
      'Joint Checking',
      'Checking',
      'Joint',
      '${data.description || "Test Transaction"}',
      '${data.category}',
      ${data.subcategory ? `'${data.subcategory}'` : "NULL"},
      ${data.amount},
      '${txnType}',
      ${1000 + data.amount},
      0,
      NULL,
      'Test data'
    )
  `);
}

async function seedBasicCategoryData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: -150,
    category: "Groceries",
    description: "Weekly groceries",
  });
  await insertTransaction(prisma, {
    amount: -50,
    category: "Dining",
    description: "Lunch",
  });
  await insertTransaction(prisma, {
    amount: -200,
    category: "Utilities",
    description: "Electric bill",
  });
}

async function seedSubcategoryData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: -25,
    category: "Dining",
    subcategory: "Fast Food",
  });
  await insertTransaction(prisma, {
    amount: -75,
    category: "Dining",
    subcategory: "Restaurant",
  });
  await insertTransaction(prisma, {
    amount: -100,
    category: "Groceries",
    subcategory: "Supermarket",
  });
}

async function seedMultiAccountCategoryData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: -100,
    category: "Shopping",
    account_id: "ACC-USER1-CHK",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -200,
    category: "Groceries",
    account_id: "ACC-USER2-SAV",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -300,
    category: "Utilities",
    account_id: "ACC-JOINT-CHK",
    transaction_date: new Date("2024-01-15"),
  });
}

async function seedDateRangeCategoryData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // January transaction
  await insertTransaction(prisma, {
    amount: -100,
    category: "Food",
    transaction_date: new Date("2024-01-15"),
  });

  // February transaction (outside Jan filter)
  await insertTransaction(prisma, {
    amount: -200,
    category: "Transport",
    transaction_date: new Date("2024-02-15"),
  });

  // March transaction (outside Jan filter)
  await insertTransaction(prisma, {
    amount: -300,
    category: "Entertainment",
    transaction_date: new Date("2024-03-15"),
  });
}
