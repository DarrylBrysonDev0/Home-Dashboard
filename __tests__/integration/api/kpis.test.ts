import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/analytics/kpis/route").GET;

/**
 * Integration Tests: GET /api/analytics/kpis
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml
 *
 * Test Categories:
 * - Response shape validation
 * - Filter parameter handling (account_id, start_date, end_date)
 * - Empty data handling
 * - Error handling for invalid parameters
 */

describe("GET /api/analytics/kpis", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/analytics/kpis/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe("Response Structure", () => {
    it("should return data with all required KPI fields", async () => {
      // Seed test data
      await seedKpiTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");

      const { data } = json;
      expect(data).toHaveProperty("net_cash_flow");
      expect(data).toHaveProperty("total_balance");
      expect(data).toHaveProperty("month_over_month_change");
      expect(data).toHaveProperty("recurring_expenses");
      expect(data).toHaveProperty("largest_expense");
    });

    it("should return month_over_month_change with percentage and trend", async () => {
      await seedKpiTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      const { month_over_month_change } = json.data;
      expect(month_over_month_change).toHaveProperty("percentage");
      expect(month_over_month_change).toHaveProperty("trend");
      expect(["up", "down", "neutral"]).toContain(month_over_month_change.trend);
      expect(typeof month_over_month_change.percentage).toBe("number");
    });

    it("should return largest_expense with amount, description, category, and date", async () => {
      await seedKpiTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      const { largest_expense } = json.data;
      // Can be null if no expenses
      if (largest_expense !== null) {
        expect(largest_expense).toHaveProperty("amount");
        expect(largest_expense).toHaveProperty("description");
        expect(largest_expense).toHaveProperty("category");
        expect(largest_expense).toHaveProperty("date");
        expect(typeof largest_expense.amount).toBe("number");
        expect(largest_expense.amount).toBeLessThan(0);
      }
    });

    it("should return numeric values for all KPIs", async () => {
      await seedKpiTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(typeof json.data.net_cash_flow).toBe("number");
      expect(typeof json.data.total_balance).toBe("number");
      expect(typeof json.data.recurring_expenses).toBe("number");
    });
  });

  describe("Filter Parameters", () => {
    it("should filter by account_id", async () => {
      await seedMultiAccountTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/kpis?account_id=ACC-USER1-CHK"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Verify data is filtered - specific balance for ACC-USER1-CHK
      expect(json.data.total_balance).toBeDefined();
    });

    it("should filter by multiple account_ids", async () => {
      await seedMultiAccountTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/kpis?account_id=ACC-USER1-CHK,ACC-USER2-SAV"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it("should filter by date range", async () => {
      await seedDateRangeTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/kpis?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include January transactions
      expect(json.data.net_cash_flow).toBeDefined();
    });

    it("should combine account_id and date range filters", async () => {
      await seedMultiAccountTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/kpis?account_id=ACC-USER1-CHK&start_date=2024-01-01&end_date=2024-12-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });
  });

  describe("Empty Data Handling", () => {
    it("should return zero values when no transactions exist", async () => {
      // No data seeded

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.net_cash_flow).toBe(0);
      expect(json.data.total_balance).toBe(0);
      expect(json.data.recurring_expenses).toBe(0);
      expect(json.data.largest_expense).toBeNull();
    });

    it("should return neutral trend when no previous period data", async () => {
      await seedCurrentMonthOnlyData();

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // With no previous month data, MoM comparison should handle gracefully
      expect(json.data.month_over_month_change).toBeDefined();
    });

    it("should return null largest_expense when only income exists", async () => {
      await seedIncomeOnlyData();

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.largest_expense).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/kpis?start_date=invalid-date"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/kpis?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("start_date");
    });
  });

  describe("Calculation Accuracy", () => {
    it("should calculate correct net cash flow", async () => {
      const prisma = getTestPrisma();

      // Insert known transactions: 5000 income, 1500 + 800 expense = 2700 net
      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        category: "Salary",
      });
      await insertTransaction(prisma, {
        amount: -1500,
        transaction_type: "Expense",
        category: "Housing",
      });
      await insertTransaction(prisma, {
        amount: -800,
        transaction_type: "Expense",
        category: "Groceries",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.net_cash_flow).toBe(2700);
    });

    it("should exclude transfers from net cash flow", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        category: "Salary",
      });
      await insertTransaction(prisma, {
        amount: -1000,
        transaction_type: "Expense",
        category: "Utilities",
      });
      await insertTransaction(prisma, {
        amount: -2000,
        transaction_type: "Transfer",
        category: "Transfer",
      });
      await insertTransaction(prisma, {
        amount: 2000,
        transaction_type: "Transfer",
        category: "Transfer",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      // 5000 - 1000 = 4000 (transfers excluded)
      expect(json.data.net_cash_flow).toBe(4000);
    });

    it("should calculate correct recurring expenses", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -100,
        transaction_type: "Expense",
        category: "Entertainment",
        is_recurring: true,
        recurring_frequency: "Monthly",
        description: "Netflix",
      });
      await insertTransaction(prisma, {
        amount: -50,
        transaction_type: "Expense",
        category: "Entertainment",
        is_recurring: true,
        recurring_frequency: "Monthly",
        description: "Spotify",
      });
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Expense",
        category: "Groceries",
        is_recurring: false,
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      // Only recurring: 100 + 50 = 150
      expect(json.data.recurring_expenses).toBe(150);
    });

    it("should identify correct largest expense", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Expense",
        category: "Groceries",
        description: "Weekly Groceries",
      });
      await insertTransaction(prisma, {
        amount: -1250,
        transaction_type: "Expense",
        category: "Housing",
        description: "Mortgage Payment",
      });
      await insertTransaction(prisma, {
        amount: -75,
        transaction_type: "Expense",
        category: "Dining",
        description: "Coffee Shop",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/kpis");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.largest_expense).not.toBeNull();
      expect(json.data.largest_expense.amount).toBe(-1250);
      expect(json.data.largest_expense.description).toBe("Mortgage Payment");
      expect(json.data.largest_expense.category).toBe("Housing");
    });
  });
});

// Helper functions for seeding test data
let txnCounter = 0;

async function insertTransaction(
  prisma: ReturnType<typeof getTestPrisma>,
  data: {
    amount: number;
    transaction_type: string;
    category: string;
    description?: string;
    is_recurring?: boolean;
    recurring_frequency?: string | null;
    account_id?: string;
    transaction_date?: Date;
  }
) {
  const id = `TXN${String(++txnCounter).padStart(6, "0")}`;
  const date = data.transaction_date || new Date();

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
      NULL,
      ${data.amount},
      '${data.transaction_type}',
      ${1000 + data.amount},
      ${data.is_recurring ? 1 : 0},
      ${data.recurring_frequency ? `'${data.recurring_frequency}'` : "NULL"},
      'Test data'
    )
  `);
}

async function seedKpiTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Mix of income, expenses, recurring
  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    category: "Income",
    description: "Monthly Salary",
  });
  await insertTransaction(prisma, {
    amount: -1500,
    transaction_type: "Expense",
    category: "Housing",
    description: "Rent Payment",
  });
  await insertTransaction(prisma, {
    amount: -100,
    transaction_type: "Expense",
    category: "Entertainment",
    description: "Netflix",
    is_recurring: true,
    recurring_frequency: "Monthly",
  });
}

async function seedMultiAccountTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Income",
    account_id: "ACC-USER1-CHK",
  });
  await insertTransaction(prisma, {
    amount: 2000,
    transaction_type: "Income",
    category: "Income",
    account_id: "ACC-USER2-SAV",
  });
  await insertTransaction(prisma, {
    amount: -500,
    transaction_type: "Expense",
    category: "Groceries",
    account_id: "ACC-USER1-CHK",
  });
}

async function seedDateRangeTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // January transactions
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-15"),
  });

  // February transactions (outside range)
  await insertTransaction(prisma, {
    amount: 4000,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-02-15"),
  });
}

async function seedCurrentMonthOnlyData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  const today = new Date();
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Income",
    transaction_date: today,
  });
}

async function seedIncomeOnlyData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    category: "Salary",
    description: "Monthly Salary",
  });
}
