import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/analytics/cash-flow/route").GET;

/**
 * Integration Tests: GET /api/analytics/cash-flow
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml
 *
 * Test Categories:
 * - Response shape validation
 * - Granularity parameter (daily, weekly, monthly)
 * - Filter parameter handling (account_id, start_date, end_date)
 * - Transfer exclusion verification
 * - Empty data handling
 * - Error handling for invalid parameters
 *
 * CRITICAL: User Story 2 requirement - "Display income vs expenses chart over time with transfers excluded"
 */

describe("GET /api/analytics/cash-flow", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/analytics/cash-flow/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe("Response Structure", () => {
    it("should return data with cash_flow array", async () => {
      await seedCashFlowTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/cash-flow");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("cash_flow");
      expect(Array.isArray(json.data.cash_flow)).toBe(true);
    });

    it("should return cash_flow items with required fields", async () => {
      await seedCashFlowTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/cash-flow");
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.cash_flow.length).toBeGreaterThan(0);

      const period = json.data.cash_flow[0];
      expect(period).toHaveProperty("period");
      expect(period).toHaveProperty("start_date");
      expect(period).toHaveProperty("end_date");
      expect(period).toHaveProperty("income");
      expect(period).toHaveProperty("expenses");
      expect(period).toHaveProperty("net");
    });

    it("should return numeric values for income, expenses, and net", async () => {
      await seedCashFlowTestData();

      const request = new NextRequest("http://localhost:3000/api/analytics/cash-flow");
      const response = await GET(request);
      const json = await response.json();

      const period = json.data.cash_flow[0];
      expect(typeof period.income).toBe("number");
      expect(typeof period.expenses).toBe("number");
      expect(typeof period.net).toBe("number");
    });

    it("should return expenses as positive values (absolute)", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Expense",
        category: "Groceries",
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/cash-flow");
      const response = await GET(request);
      const json = await response.json();

      const period = json.data.cash_flow[0];
      expect(period.expenses).toBe(500); // Should be positive
      expect(period.expenses).toBeGreaterThan(0);
    });
  });

  describe("Granularity Parameter", () => {
    it("should default to monthly granularity", async () => {
      await seedMultiMonthData();

      const request = new NextRequest("http://localhost:3000/api/analytics/cash-flow");
      const response = await GET(request);
      const json = await response.json();

      // Should group by month, period format: YYYY-MM
      expect(json.data.cash_flow.length).toBeGreaterThanOrEqual(1);
      expect(json.data.cash_flow[0].period).toMatch(/^\d{4}-\d{2}$/);
    });

    it("should support monthly granularity explicitly", async () => {
      await seedMultiMonthData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow[0].period).toMatch(/^\d{4}-\d{2}$/);
    });

    it("should support weekly granularity", async () => {
      await seedMultiWeekData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?granularity=weekly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Period format: YYYY-Www (e.g., 2024-W03)
      expect(json.data.cash_flow.length).toBeGreaterThan(0);
      expect(json.data.cash_flow[0].period).toMatch(/^\d{4}-W\d{2}$/);
    });

    it("should support daily granularity", async () => {
      await seedMultiDayData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?granularity=daily"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Period format: YYYY-MM-DD
      expect(json.data.cash_flow.length).toBeGreaterThan(0);
      expect(json.data.cash_flow[0].period).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return 400 for invalid granularity value", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?granularity=invalid"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });

  describe("Filter Parameters", () => {
    it("should filter by account_id", async () => {
      await seedMultiAccountData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?account_id=ACC-USER1-CHK"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include transactions from ACC-USER1-CHK
      expect(json.data.cash_flow.length).toBeGreaterThan(0);
    });

    it("should filter by multiple account_ids", async () => {
      await seedMultiAccountData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?account_id=ACC-USER1-CHK,ACC-USER2-SAV"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it("should filter by date range", async () => {
      await seedDateRangeData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include January data
      json.data.cash_flow.forEach((period: { period: string }) => {
        expect(period.period).toMatch(/^2024-01/);
      });
    });

    it("should combine all filters", async () => {
      await seedMultiAccountData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?account_id=ACC-USER1-CHK&start_date=2024-01-01&end_date=2024-12-31&granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
    });
  });

  describe("Transfer Exclusion (CRITICAL)", () => {
    it("should EXCLUDE transfers from income totals", async () => {
      const prisma = getTestPrisma();
      const date = new Date("2024-01-15");

      // Real income
      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        category: "Salary",
        transaction_date: date,
      });
      // Incoming transfer (should be excluded)
      await insertTransaction(prisma, {
        amount: 2000,
        transaction_type: "Transfer",
        category: "Transfer",
        transaction_date: date,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow.length).toBe(1);
      // Income should be 5000, NOT 7000 (transfer excluded)
      expect(json.data.cash_flow[0].income).toBe(5000);
    });

    it("should EXCLUDE transfers from expense totals", async () => {
      const prisma = getTestPrisma();
      const date = new Date("2024-01-15");

      // Real expense
      await insertTransaction(prisma, {
        amount: -1000,
        transaction_type: "Expense",
        category: "Groceries",
        transaction_date: date,
      });
      // Outgoing transfer (should be excluded)
      await insertTransaction(prisma, {
        amount: -2000,
        transaction_type: "Transfer",
        category: "Transfer",
        transaction_date: date,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Expenses should be 1000, NOT 3000 (transfer excluded)
      expect(json.data.cash_flow[0].expenses).toBe(1000);
    });

    it("should correctly calculate net when transfers are present", async () => {
      const prisma = getTestPrisma();
      const date = new Date("2024-01-15");

      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        category: "Salary",
        transaction_date: date,
      });
      await insertTransaction(prisma, {
        amount: -1500,
        transaction_type: "Expense",
        category: "Groceries",
        transaction_date: date,
      });
      // Transfer pair (should be excluded from net calculation)
      await insertTransaction(prisma, {
        amount: -2000,
        transaction_type: "Transfer",
        category: "Transfer",
        transaction_date: date,
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        amount: 2000,
        transaction_type: "Transfer",
        category: "Transfer",
        transaction_date: date,
        account_id: "ACC-JOINT-SAV",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Net should be 5000 - 1500 = 3500 (transfers excluded)
      expect(json.data.cash_flow[0].net).toBe(3500);
    });

    it("should return zeros when only transfers exist", async () => {
      const prisma = getTestPrisma();
      const date = new Date("2024-01-15");

      await insertTransaction(prisma, {
        amount: -1000,
        transaction_type: "Transfer",
        category: "Transfer",
        transaction_date: date,
      });
      await insertTransaction(prisma, {
        amount: 1000,
        transaction_type: "Transfer",
        category: "Transfer",
        transaction_date: date,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // All transfers, so should have no meaningful cash flow data
      // Could be empty array or period with zeros
      if (json.data.cash_flow.length > 0) {
        expect(json.data.cash_flow[0].income).toBe(0);
        expect(json.data.cash_flow[0].expenses).toBe(0);
        expect(json.data.cash_flow[0].net).toBe(0);
      }
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty array when no transactions exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/analytics/cash-flow");
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow).toEqual([]);
    });

    it("should return empty array when no transactions in date range", async () => {
      await seedCashFlowTestData(); // Seeds 2024 data

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2020-01-01&end_date=2020-12-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow).toEqual([]);
    });

    it("should return empty array when account filter has no matches", async () => {
      await seedCashFlowTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?account_id=NONEXISTENT-ACCOUNT"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=invalid-date"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("start_date");
    });
  });

  describe("Calculation Accuracy", () => {
    it("should correctly aggregate multiple transactions in same period", async () => {
      const prisma = getTestPrisma();
      const date = new Date("2024-01-15");

      // Multiple income transactions in same month
      await insertTransaction(prisma, {
        amount: 3000,
        transaction_type: "Income",
        category: "Salary",
        transaction_date: date,
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Income",
        category: "Bonus",
        transaction_date: new Date("2024-01-20"),
      });
      // Multiple expense transactions in same month
      await insertTransaction(prisma, {
        amount: -800,
        transaction_type: "Expense",
        category: "Groceries",
        transaction_date: date,
      });
      await insertTransaction(prisma, {
        amount: -200,
        transaction_type: "Expense",
        category: "Utilities",
        transaction_date: new Date("2024-01-25"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?start_date=2024-01-01&end_date=2024-01-31&granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow).toHaveLength(1);
      expect(json.data.cash_flow[0].period).toBe("2024-01");
      expect(json.data.cash_flow[0].income).toBe(3500); // 3000 + 500
      expect(json.data.cash_flow[0].expenses).toBe(1000); // 800 + 200
      expect(json.data.cash_flow[0].net).toBe(2500); // 3500 - 1000
    });

    it("should sort periods chronologically", async () => {
      const prisma = getTestPrisma();

      // Insert in reverse order
      await insertTransaction(prisma, {
        amount: 1000,
        transaction_type: "Income",
        category: "Income",
        transaction_date: new Date("2024-03-15"),
      });
      await insertTransaction(prisma, {
        amount: 1000,
        transaction_type: "Income",
        category: "Income",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 1000,
        transaction_type: "Income",
        category: "Income",
        transaction_date: new Date("2024-02-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/cash-flow?granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.cash_flow).toHaveLength(3);
      expect(json.data.cash_flow[0].period).toBe("2024-01");
      expect(json.data.cash_flow[1].period).toBe("2024-02");
      expect(json.data.cash_flow[2].period).toBe("2024-03");
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

async function seedCashFlowTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Income and expenses for cash flow
  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    category: "Salary",
    description: "Monthly Salary",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -1500,
    transaction_type: "Expense",
    category: "Housing",
    description: "Rent Payment",
    transaction_date: new Date("2024-01-01"),
  });
  await insertTransaction(prisma, {
    amount: -500,
    transaction_type: "Expense",
    category: "Groceries",
    description: "Weekly Groceries",
    transaction_date: new Date("2024-01-10"),
  });
}

async function seedMultiMonthData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // January
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Salary",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -800,
    transaction_type: "Expense",
    category: "Groceries",
    transaction_date: new Date("2024-01-20"),
  });

  // February
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Salary",
    transaction_date: new Date("2024-02-15"),
  });
  await insertTransaction(prisma, {
    amount: -900,
    transaction_type: "Expense",
    category: "Groceries",
    transaction_date: new Date("2024-02-20"),
  });
}

async function seedMultiWeekData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Week 1 (Jan 1-7, 2024)
  await insertTransaction(prisma, {
    amount: 1000,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-03"),
  });

  // Week 2 (Jan 8-14, 2024)
  await insertTransaction(prisma, {
    amount: 2000,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-10"),
  });

  // Week 3 (Jan 15-21, 2024)
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-17"),
  });
}

async function seedMultiDayData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 500,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: 600,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-16"),
  });
  await insertTransaction(prisma, {
    amount: 700,
    transaction_type: "Income",
    category: "Income",
    transaction_date: new Date("2024-01-17"),
  });
}

async function seedMultiAccountData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Salary",
    account_id: "ACC-USER1-CHK",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -500,
    transaction_type: "Expense",
    category: "Groceries",
    account_id: "ACC-USER1-CHK",
    transaction_date: new Date("2024-01-20"),
  });
  await insertTransaction(prisma, {
    amount: 2000,
    transaction_type: "Income",
    category: "Salary",
    account_id: "ACC-USER2-SAV",
    transaction_date: new Date("2024-01-15"),
  });
}

async function seedDateRangeData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // January transactions
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    category: "Salary",
    transaction_date: new Date("2024-01-15"),
  });

  // February transactions (outside default range)
  await insertTransaction(prisma, {
    amount: 4000,
    transaction_type: "Income",
    category: "Salary",
    transaction_date: new Date("2024-02-15"),
  });

  // March transactions (outside default range)
  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    category: "Salary",
    transaction_date: new Date("2024-03-15"),
  });
}
