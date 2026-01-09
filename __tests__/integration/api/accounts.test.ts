import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/analytics/accounts/route").GET;

/**
 * Integration Tests: GET /api/analytics/accounts
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml
 *
 * USER STORY 5: Track Account Balance Trends
 * Goal: Display multi-line chart showing balance trends for each account over time
 *
 * Test Categories:
 * - Response shape validation
 * - Granularity parameter (daily, weekly, monthly)
 * - Filter parameter handling (account_id, start_date, end_date)
 * - Balance trend calculation
 * - Empty data handling
 * - Error handling for invalid parameters
 */

describe("GET /api/analytics/accounts", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/analytics/accounts/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe("Response Structure", () => {
    it("should return data with accounts array", async () => {
      await seedBalanceTrendTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("accounts");
      expect(Array.isArray(json.data.accounts)).toBe(true);
    });

    it("should return accounts with required fields", async () => {
      await seedBalanceTrendTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.accounts.length).toBeGreaterThan(0);

      const account = json.data.accounts[0];
      expect(account).toHaveProperty("account_id");
      expect(account).toHaveProperty("account_name");
      expect(account).toHaveProperty("balances");
      expect(Array.isArray(account.balances)).toBe(true);
    });

    it("should return balance points with date and balance fields", async () => {
      await seedBalanceTrendTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.accounts.length).toBeGreaterThan(0);
      expect(json.data.accounts[0].balances.length).toBeGreaterThan(0);

      const balancePoint = json.data.accounts[0].balances[0];
      expect(balancePoint).toHaveProperty("date");
      expect(balancePoint).toHaveProperty("balance");
      expect(typeof balancePoint.balance).toBe("number");
    });

    it("should return all distinct accounts from transactions", async () => {
      await seedMultiAccountData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts.length).toBeGreaterThanOrEqual(2);

      const accountIds = json.data.accounts.map(
        (a: { account_id: string }) => a.account_id
      );
      expect(accountIds).toContain("ACC-JOINT-CHK");
      expect(accountIds).toContain("ACC-USER1-SAV");
    });
  });

  describe("Granularity Parameter", () => {
    it("should default to monthly granularity", async () => {
      await seedMultiMonthData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts.length).toBeGreaterThan(0);
      // Should group by month - check that balance points span months
      const account = json.data.accounts[0];
      expect(account.balances.length).toBeGreaterThanOrEqual(1);
    });

    it("should support monthly granularity explicitly", async () => {
      await seedMultiMonthData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts[0].balances.length).toBeGreaterThan(0);
    });

    it("should support weekly granularity", async () => {
      await seedMultiWeekData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=weekly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const account = json.data.accounts[0];
      // Weekly granularity should produce more data points than monthly
      expect(account.balances.length).toBeGreaterThanOrEqual(2);
    });

    it("should support daily granularity", async () => {
      await seedMultiDayData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=daily"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const account = json.data.accounts[0];
      // Daily granularity should show each day's balance
      expect(account.balances.length).toBeGreaterThanOrEqual(3);
    });

    it("should return 400 for invalid granularity value", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=invalid"
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
        "http://localhost:3000/api/analytics/accounts?account_id=ACC-USER1-SAV"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toHaveLength(1);
      expect(json.data.accounts[0].account_id).toBe("ACC-USER1-SAV");
    });

    it("should filter by multiple account_ids", async () => {
      await seedMultiAccountData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?account_id=ACC-JOINT-CHK,ACC-USER1-SAV"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toHaveLength(2);
      const accountIds = json.data.accounts.map(
        (a: { account_id: string }) => a.account_id
      );
      expect(accountIds).toContain("ACC-JOINT-CHK");
      expect(accountIds).toContain("ACC-USER1-SAV");
    });

    it("should filter by date range", async () => {
      await seedDateRangeData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include January balance points
      if (json.data.accounts.length > 0 && json.data.accounts[0].balances.length > 0) {
        const dates = json.data.accounts[0].balances.map(
          (b: { date: string }) => new Date(b.date).getMonth()
        );
        dates.forEach((month: number) => expect(month).toBe(0)); // January = 0
      }
    });

    it("should combine all filters", async () => {
      await seedMultiAccountData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?account_id=ACC-JOINT-CHK&start_date=2024-01-01&end_date=2024-12-31&granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toHaveLength(1);
      expect(json.data.accounts[0].account_id).toBe("ACC-JOINT-CHK");
    });
  });

  describe("Balance Trend Calculation", () => {
    it("should use balance_after field for balance values", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Expense",
        balance_after: 4500, // This is what should appear in the trend
        transaction_date: new Date("2024-01-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts[0].balances[0].balance).toBe(4500);
    });

    it("should show balance progression over time", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        balance_after: 5000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        balance_after: 10000,
        transaction_date: new Date("2024-02-15"),
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        amount: -2000,
        transaction_type: "Expense",
        balance_after: 8000,
        transaction_date: new Date("2024-03-15"),
        account_id: "ACC-JOINT-CHK",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=monthly&start_date=2024-01-01&end_date=2024-03-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const account = json.data.accounts[0];
      expect(account.balances).toHaveLength(3);

      // Verify balance progression
      const balances = account.balances.map((b: { balance: number }) => b.balance);
      expect(balances).toEqual([5000, 10000, 8000]);
    });

    it("should carry balance forward when no transaction in a period", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        balance_after: 5000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
      });
      // No transaction in February
      await insertTransaction(prisma, {
        amount: 1000,
        transaction_type: "Income",
        balance_after: 6000,
        transaction_date: new Date("2024-03-15"),
        account_id: "ACC-JOINT-CHK",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=monthly&start_date=2024-01-01&end_date=2024-03-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const account = json.data.accounts[0];
      expect(account.balances).toHaveLength(3);

      // February should carry forward January's balance
      expect(account.balances[1].balance).toBe(5000);
    });

    it("should include transfers in balance (they affect account balance)", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        balance_after: 5000,
        transaction_date: new Date("2024-01-10"),
        account_id: "ACC-JOINT-CHK",
      });
      // Transfer out - balance decreases
      await insertTransaction(prisma, {
        amount: -2000,
        transaction_type: "Transfer",
        balance_after: 3000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Balance should reflect the transfer (unlike cash flow which excludes transfers)
      expect(json.data.accounts[0].balances[0].balance).toBe(3000);
    });

    it("should sort balance points chronologically", async () => {
      const prisma = getTestPrisma();

      // Insert in reverse order
      await insertTransaction(prisma, {
        balance_after: 3000,
        transaction_date: new Date("2024-03-15"),
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        balance_after: 1000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        balance_after: 2000,
        transaction_date: new Date("2024-02-15"),
        account_id: "ACC-JOINT-CHK",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=monthly"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const balances = json.data.accounts[0].balances;

      // Verify chronological order
      for (let i = 1; i < balances.length; i++) {
        expect(new Date(balances[i].date).getTime()).toBeGreaterThanOrEqual(
          new Date(balances[i - 1].date).getTime()
        );
      }
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty accounts array when no transactions exist", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toEqual([]);
    });

    it("should return empty accounts when date range has no matches", async () => {
      await seedBalanceTrendTestData(); // Seeds 2024 data

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?start_date=2020-01-01&end_date=2020-12-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toEqual([]);
    });

    it("should return empty accounts when account filter has no matches", async () => {
      await seedBalanceTrendTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?account_id=NONEXISTENT-ACCOUNT"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?start_date=invalid-date"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("start_date");
    });
  });

  describe("Multiple Accounts", () => {
    it("should return separate balance trends for each account", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        balance_after: 1000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      });
      await insertTransaction(prisma, {
        balance_after: 5000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toHaveLength(2);

      const checking = json.data.accounts.find(
        (a: { account_id: string }) => a.account_id === "ACC-JOINT-CHK"
      );
      const savings = json.data.accounts.find(
        (a: { account_id: string }) => a.account_id === "ACC-USER1-SAV"
      );

      expect(checking).toBeDefined();
      expect(savings).toBeDefined();
      expect(checking.account_name).toBe("Joint Checking");
      expect(savings.account_name).toBe("User1 Savings");
      expect(checking.balances[0].balance).toBe(1000);
      expect(savings.balances[0].balance).toBe(5000);
    });

    it("should handle accounts with different transaction frequencies", async () => {
      const prisma = getTestPrisma();

      // Account A: transactions every month
      await insertTransaction(prisma, {
        balance_after: 1000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        balance_after: 1500,
        transaction_date: new Date("2024-02-15"),
        account_id: "ACC-JOINT-CHK",
      });
      await insertTransaction(prisma, {
        balance_after: 2000,
        transaction_date: new Date("2024-03-15"),
        account_id: "ACC-JOINT-CHK",
      });

      // Account B: only one transaction
      await insertTransaction(prisma, {
        balance_after: 10000,
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/accounts?granularity=monthly&start_date=2024-01-01&end_date=2024-03-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.accounts).toHaveLength(2);

      const checking = json.data.accounts.find(
        (a: { account_id: string }) => a.account_id === "ACC-JOINT-CHK"
      );
      const savings = json.data.accounts.find(
        (a: { account_id: string }) => a.account_id === "ACC-USER1-SAV"
      );

      // Checking should have 3 balance points
      expect(checking.balances).toHaveLength(3);
      // Savings should carry forward the balance
      expect(savings.balances).toHaveLength(3);
      expect(savings.balances[0].balance).toBe(10000);
      expect(savings.balances[1].balance).toBe(10000); // Carried forward
      expect(savings.balances[2].balance).toBe(10000); // Carried forward
    });
  });
});

// Helper functions for seeding test data
let txnCounter = 0;

async function insertTransaction(
  prisma: ReturnType<typeof getTestPrisma>,
  data: {
    amount?: number;
    transaction_type?: string;
    category?: string;
    description?: string;
    account_id?: string;
    account_name?: string;
    transaction_date?: Date;
    balance_after?: number;
  }
) {
  const id = `TXN${String(++txnCounter).padStart(6, "0")}`;
  const date = data.transaction_date || new Date();
  const balanceAfter = data.balance_after ?? 1000;

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
      '${data.account_name || "Joint Checking"}',
      'Checking',
      'Joint',
      '${data.description || "Test Transaction"}',
      '${data.category || "Uncategorized"}',
      NULL,
      ${data.amount || 0},
      '${data.transaction_type || "Expense"}',
      ${balanceAfter},
      0,
      NULL,
      'Test data'
    )
  `);
}

async function seedBalanceTrendTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    balance_after: 5000,
    description: "Monthly Salary",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -1500,
    transaction_type: "Expense",
    balance_after: 3500,
    description: "Rent Payment",
    transaction_date: new Date("2024-01-20"),
  });
}

async function seedMultiAccountData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    balance_after: 3000,
    account_id: "ACC-JOINT-CHK",
    account_name: "Joint Checking",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    balance_after: 5000,
    account_id: "ACC-USER1-SAV",
    account_name: "User1 Savings",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: 2000,
    transaction_type: "Income",
    balance_after: 2000,
    account_id: "ACC-USER2-CHK",
    account_name: "User2 Checking",
    transaction_date: new Date("2024-01-15"),
  });
}

async function seedMultiMonthData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    balance_after: 5000,
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -800,
    transaction_type: "Expense",
    balance_after: 4200,
    transaction_date: new Date("2024-01-25"),
  });
  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    balance_after: 9200,
    transaction_date: new Date("2024-02-15"),
  });
  await insertTransaction(prisma, {
    amount: -900,
    transaction_type: "Expense",
    balance_after: 8300,
    transaction_date: new Date("2024-02-25"),
  });
}

async function seedMultiWeekData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Week 1 (Jan 1-7, 2024)
  await insertTransaction(prisma, {
    amount: 1000,
    transaction_type: "Income",
    balance_after: 1000,
    transaction_date: new Date("2024-01-03"),
  });

  // Week 2 (Jan 8-14, 2024)
  await insertTransaction(prisma, {
    amount: 2000,
    transaction_type: "Income",
    balance_after: 3000,
    transaction_date: new Date("2024-01-10"),
  });

  // Week 3 (Jan 15-21, 2024)
  await insertTransaction(prisma, {
    amount: -500,
    transaction_type: "Expense",
    balance_after: 2500,
    transaction_date: new Date("2024-01-17"),
  });
}

async function seedMultiDayData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: 500,
    transaction_type: "Income",
    balance_after: 1500,
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -100,
    transaction_type: "Expense",
    balance_after: 1400,
    transaction_date: new Date("2024-01-16"),
  });
  await insertTransaction(prisma, {
    amount: 200,
    transaction_type: "Income",
    balance_after: 1600,
    transaction_date: new Date("2024-01-17"),
  });
  await insertTransaction(prisma, {
    amount: -50,
    transaction_type: "Expense",
    balance_after: 1550,
    transaction_date: new Date("2024-01-18"),
  });
}

async function seedDateRangeData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // January transactions
  await insertTransaction(prisma, {
    amount: 3000,
    transaction_type: "Income",
    balance_after: 3000,
    transaction_date: new Date("2024-01-15"),
  });

  // February transactions
  await insertTransaction(prisma, {
    amount: 4000,
    transaction_type: "Income",
    balance_after: 7000,
    transaction_date: new Date("2024-02-15"),
  });

  // March transactions
  await insertTransaction(prisma, {
    amount: 5000,
    transaction_type: "Income",
    balance_after: 12000,
    transaction_date: new Date("2024-03-15"),
  });
}
