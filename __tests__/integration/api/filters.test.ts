import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic imports for routes after env vars are set
let GET_accounts: typeof import("@/app/api/filters/accounts/route").GET;
let GET_dateRanges: typeof import("@/app/api/filters/date-ranges/route").GET;

/**
 * Integration Tests: GET /api/filters/accounts and GET /api/filters/date-ranges
 *
 * TDD Phase: RED - These tests should FAIL until the API routes are implemented.
 * Based on: OpenAPI spec contracts/filters-api.yaml
 *
 * Test Categories:
 * - Response shape validation
 * - Data completeness
 * - Edge cases (empty data)
 * - Error handling
 */

describe("Filters API Integration Tests", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport routes after env vars are set
    vi.resetModules();
    const accountsModule = await import("@/app/api/filters/accounts/route");
    const dateRangesModule = await import("@/app/api/filters/date-ranges/route");
    GET_accounts = accountsModule.GET;
    GET_dateRanges = dateRangesModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  // ============================================
  // GET /api/filters/accounts
  // ============================================

  describe("GET /api/filters/accounts", () => {
    describe("Response Structure", () => {
      it("should return data with accounts array", async () => {
        await seedAccountTestData();

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toHaveProperty("data");
        expect(json.data).toHaveProperty("accounts");
        expect(Array.isArray(json.data.accounts)).toBe(true);
      });

      it("should return accounts with all required fields", async () => {
        await seedAccountTestData();

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.accounts.length).toBeGreaterThan(0);

        const account = json.data.accounts[0];
        expect(account).toHaveProperty("account_id");
        expect(account).toHaveProperty("account_name");
        expect(account).toHaveProperty("account_type");
        expect(account).toHaveProperty("account_owner");
      });

      it("should include current_balance for each account", async () => {
        await seedAccountTestData();

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const account = json.data.accounts[0];
        expect(account).toHaveProperty("current_balance");
        expect(typeof account.current_balance).toBe("number");
      });

      it("should include last_transaction_date for each account", async () => {
        await seedAccountTestData();

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const account = json.data.accounts[0];
        expect(account).toHaveProperty("last_transaction_date");
        // Date should be a valid date string
        expect(new Date(account.last_transaction_date).toString()).not.toBe("Invalid Date");
      });

      it("should include transaction_count for each account", async () => {
        await seedAccountTestData();

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const account = json.data.accounts[0];
        expect(account).toHaveProperty("transaction_count");
        expect(typeof account.transaction_count).toBe("number");
        expect(account.transaction_count).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Data Accuracy", () => {
      it("should return distinct accounts only", async () => {
        await seedMultipleTransactionsForAccount();

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        // Should only return one account despite multiple transactions
        const accountIds = json.data.accounts.map((a: { account_id: string }) => a.account_id);
        const uniqueIds = [...new Set(accountIds)];
        expect(accountIds.length).toBe(uniqueIds.length);
      });

      it("should calculate correct current balance from latest transaction", async () => {
        const prisma = getTestPrisma();

        // Insert transactions with known balance_after values
        await insertAccountTransaction(prisma, {
          account_id: "ACC-JOINT-CHK",
          balance_after: 1000,
          transaction_date: new Date("2024-01-01"),
        });
        await insertAccountTransaction(prisma, {
          account_id: "ACC-JOINT-CHK",
          balance_after: 2500,
          transaction_date: new Date("2024-01-15"),
        });
        await insertAccountTransaction(prisma, {
          account_id: "ACC-JOINT-CHK",
          balance_after: 2300,
          transaction_date: new Date("2024-01-20"),
        });

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const account = json.data.accounts.find(
          (a: { account_id: string }) => a.account_id === "ACC-JOINT-CHK"
        );
        // Current balance should be from the latest transaction (Jan 20)
        expect(account.current_balance).toBe(2300);
      });

      it("should calculate correct transaction count per account", async () => {
        const prisma = getTestPrisma();

        // 3 transactions for ACC-JOINT-CHK
        await insertAccountTransaction(prisma, { account_id: "ACC-JOINT-CHK" });
        await insertAccountTransaction(prisma, { account_id: "ACC-JOINT-CHK" });
        await insertAccountTransaction(prisma, { account_id: "ACC-JOINT-CHK" });

        // 2 transactions for ACC-USER1-SAV
        await insertAccountTransaction(prisma, { account_id: "ACC-USER1-SAV" });
        await insertAccountTransaction(prisma, { account_id: "ACC-USER1-SAV" });

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const jointChecking = json.data.accounts.find(
          (a: { account_id: string }) => a.account_id === "ACC-JOINT-CHK"
        );
        const user1Savings = json.data.accounts.find(
          (a: { account_id: string }) => a.account_id === "ACC-USER1-SAV"
        );

        expect(jointChecking.transaction_count).toBe(3);
        expect(user1Savings.transaction_count).toBe(2);
      });

      it("should return all distinct account types", async () => {
        const prisma = getTestPrisma();

        await insertAccountTransaction(prisma, {
          account_id: "ACC-JOINT-CHK",
          account_type: "Checking",
        });
        await insertAccountTransaction(prisma, {
          account_id: "ACC-USER1-SAV",
          account_type: "Savings",
        });

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const accountTypes = json.data.accounts.map((a: { account_type: string }) => a.account_type);
        expect(accountTypes).toContain("Checking");
        expect(accountTypes).toContain("Savings");
      });
    });

    describe("Empty Data Handling", () => {
      it("should return empty accounts array when no transactions exist", async () => {
        // No data seeded

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.accounts).toEqual([]);
      });
    });

    describe("Sorting", () => {
      it("should return accounts sorted by account_name alphabetically", async () => {
        const prisma = getTestPrisma();

        await insertAccountTransaction(prisma, {
          account_id: "ACC-USER2-CHK",
          account_name: "Zack Checking",
        });
        await insertAccountTransaction(prisma, {
          account_id: "ACC-JOINT-SAV",
          account_name: "Joint Savings",
        });
        await insertAccountTransaction(prisma, {
          account_id: "ACC-USER1-CHK",
          account_name: "Alice Checking",
        });

        const request = new NextRequest("http://localhost:3000/api/filters/accounts");
        const response = await GET_accounts(request);
        const json = await response.json();

        const names = json.data.accounts.map((a: { account_name: string }) => a.account_name);
        const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sortedNames);
      });
    });
  });

  // ============================================
  // GET /api/filters/date-ranges
  // ============================================

  describe("GET /api/filters/date-ranges", () => {
    describe("Response Structure", () => {
      it("should return data with ranges array", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toHaveProperty("data");
        expect(json.data).toHaveProperty("ranges");
        expect(Array.isArray(json.data.ranges)).toBe(true);
      });

      it("should return current_date in response", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        expect(json.data).toHaveProperty("current_date");
        // Should be a valid date string
        expect(new Date(json.data.current_date).toString()).not.toBe("Invalid Date");
      });

      it("should return ranges with label, key, start_date, and end_date", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        expect(json.data.ranges.length).toBeGreaterThan(0);

        const range = json.data.ranges[0];
        expect(range).toHaveProperty("label");
        expect(range).toHaveProperty("key");
        expect(range).toHaveProperty("start_date");
        expect(range).toHaveProperty("end_date");
      });

      it("should have URL-safe keys for query params", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        for (const range of json.data.ranges) {
          // Key should be lowercase, no spaces, URL-friendly
          expect(range.key).toMatch(/^[a-z0-9-]+$/);
        }
      });
    });

    describe("Expected Quick-Select Ranges", () => {
      it("should include 'This Month' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const thisMonth = json.data.ranges.find((r: { key: string }) => r.key === "this-month");
        expect(thisMonth).toBeDefined();
        expect(thisMonth.label).toBe("This Month");
      });

      it("should include 'Last Month' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const lastMonth = json.data.ranges.find((r: { key: string }) => r.key === "last-month");
        expect(lastMonth).toBeDefined();
        expect(lastMonth.label).toBe("Last Month");
      });

      it("should include 'Last 3 Months' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const last3Months = json.data.ranges.find((r: { key: string }) => r.key === "last-3-months");
        expect(last3Months).toBeDefined();
        expect(last3Months.label).toBe("Last 3 Months");
      });

      it("should include 'Last 6 Months' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const last6Months = json.data.ranges.find((r: { key: string }) => r.key === "last-6-months");
        expect(last6Months).toBeDefined();
        expect(last6Months.label).toBe("Last 6 Months");
      });

      it("should include 'Year to Date' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const ytd = json.data.ranges.find((r: { key: string }) => r.key === "ytd");
        expect(ytd).toBeDefined();
        expect(ytd.label).toBe("Year to Date");
      });

      it("should include 'Last 12 Months' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const last12Months = json.data.ranges.find((r: { key: string }) => r.key === "last-12-months");
        expect(last12Months).toBeDefined();
        expect(last12Months.label).toBe("Last 12 Months");
      });

      it("should include 'All Time' range", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const allTime = json.data.ranges.find((r: { key: string }) => r.key === "all-time");
        expect(allTime).toBeDefined();
        expect(allTime.label).toBe("All Time");
        // All Time may have null dates or very old start date
      });
    });

    describe("Date Calculations", () => {
      it("should calculate 'This Month' range correctly", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const thisMonth = json.data.ranges.find((r: { key: string }) => r.key === "this-month");
        const currentDate = new Date(json.data.current_date);

        // start_date should be first day of current month
        const startDate = new Date(thisMonth.start_date);
        expect(startDate.getFullYear()).toBe(currentDate.getFullYear());
        expect(startDate.getMonth()).toBe(currentDate.getMonth());
        expect(startDate.getDate()).toBe(1);
      });

      it("should calculate 'Last Month' range correctly", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const lastMonth = json.data.ranges.find((r: { key: string }) => r.key === "last-month");
        const currentDate = new Date(json.data.current_date);

        const startDate = new Date(lastMonth.start_date);
        const endDate = new Date(lastMonth.end_date);

        // Should be the previous month
        const expectedMonth = currentDate.getMonth() === 0 ? 11 : currentDate.getMonth() - 1;
        expect(startDate.getMonth()).toBe(expectedMonth);
        expect(endDate.getMonth()).toBe(expectedMonth);

        // Start should be first day
        expect(startDate.getDate()).toBe(1);
      });

      it("should calculate 'Year to Date' starting from January 1st", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        const ytd = json.data.ranges.find((r: { key: string }) => r.key === "ytd");
        const currentDate = new Date(json.data.current_date);

        const startDate = new Date(ytd.start_date);
        expect(startDate.getFullYear()).toBe(currentDate.getFullYear());
        expect(startDate.getMonth()).toBe(0); // January
        expect(startDate.getDate()).toBe(1);
      });

      it("should have valid date strings in ISO format", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        for (const range of json.data.ranges) {
          if (range.start_date !== null) {
            expect(range.start_date).toMatch(/^\d{4}-\d{2}-\d{2}/);
          }
          if (range.end_date !== null) {
            expect(range.end_date).toMatch(/^\d{4}-\d{2}-\d{2}/);
          }
        }
      });

      it("should ensure end_date is after or equal to start_date for all ranges", async () => {
        const request = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response = await GET_dateRanges(request);
        const json = await response.json();

        for (const range of json.data.ranges) {
          if (range.start_date !== null && range.end_date !== null) {
            const startDate = new Date(range.start_date);
            const endDate = new Date(range.end_date);
            expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
          }
        }
      });
    });

    describe("Caching Considerations", () => {
      it("should return consistent data for same-day requests", async () => {
        const request1 = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response1 = await GET_dateRanges(request1);
        const json1 = await response1.json();

        const request2 = new NextRequest("http://localhost:3000/api/filters/date-ranges");
        const response2 = await GET_dateRanges(request2);
        const json2 = await response2.json();

        // Same server date should produce same ranges
        expect(json1.data.current_date).toBe(json2.data.current_date);
        expect(json1.data.ranges).toEqual(json2.data.ranges);
      });
    });
  });
});

// ============================================
// Helper Functions for Seeding Test Data
// ============================================

let txnCounter = 0;

interface AccountTransactionInput {
  account_id?: string;
  account_name?: string;
  account_type?: string;
  account_owner?: string;
  balance_after?: number;
  transaction_date?: Date;
}

async function insertAccountTransaction(
  prisma: ReturnType<typeof getTestPrisma>,
  data: AccountTransactionInput
) {
  const id = `TXN${String(++txnCounter).padStart(6, "0")}`;
  const date = data.transaction_date || new Date();

  const accountId = data.account_id || "ACC-JOINT-CHK";
  const accountName = data.account_name || getDefaultAccountName(accountId);
  const accountType = data.account_type || getDefaultAccountType(accountId);
  const accountOwner = data.account_owner || getDefaultAccountOwner(accountId);

  await prisma.$executeRawUnsafe(`
    INSERT INTO [transactions] (
      transaction_id, transaction_date, transaction_time, account_id, account_name,
      account_type, account_owner, description, category, subcategory, amount,
      transaction_type, balance_after, is_recurring, recurring_frequency, notes
    ) VALUES (
      '${id}',
      '${date.toISOString().split("T")[0]}',
      '${date.toTimeString().split(" ")[0]}',
      '${accountId}',
      '${accountName}',
      '${accountType}',
      '${accountOwner}',
      'Test Transaction',
      'Groceries',
      NULL,
      -50.00,
      'Expense',
      ${data.balance_after ?? 1000},
      0,
      NULL,
      'Test data'
    )
  `);
}

function getDefaultAccountName(accountId: string): string {
  const names: Record<string, string> = {
    "ACC-JOINT-CHK": "Joint Checking",
    "ACC-JOINT-SAV": "Joint Savings",
    "ACC-USER1-CHK": "User1 Checking",
    "ACC-USER1-SAV": "User1 Savings",
    "ACC-USER2-CHK": "User2 Checking",
    "ACC-USER2-SAV": "User2 Savings",
  };
  return names[accountId] || "Unknown Account";
}

function getDefaultAccountType(accountId: string): string {
  if (accountId.endsWith("-SAV")) return "Savings";
  return "Checking";
}

function getDefaultAccountOwner(accountId: string): string {
  if (accountId.includes("-JOINT-")) return "Joint";
  if (accountId.includes("-USER1-")) return "User1";
  if (accountId.includes("-USER2-")) return "User2";
  return "Unknown";
}

async function seedAccountTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Create transactions for multiple accounts
  await insertAccountTransaction(prisma, {
    account_id: "ACC-JOINT-CHK",
    account_name: "Joint Checking",
    account_type: "Checking",
    account_owner: "Joint",
    balance_after: 5000,
  });
  await insertAccountTransaction(prisma, {
    account_id: "ACC-USER1-SAV",
    account_name: "User1 Savings",
    account_type: "Savings",
    account_owner: "User1",
    balance_after: 10000,
  });
}

async function seedMultipleTransactionsForAccount() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Multiple transactions for same account
  await insertAccountTransaction(prisma, {
    account_id: "ACC-JOINT-CHK",
    balance_after: 1000,
  });
  await insertAccountTransaction(prisma, {
    account_id: "ACC-JOINT-CHK",
    balance_after: 1500,
  });
  await insertAccountTransaction(prisma, {
    account_id: "ACC-JOINT-CHK",
    balance_after: 1200,
  });
}
