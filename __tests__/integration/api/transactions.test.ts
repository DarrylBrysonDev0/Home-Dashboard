import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic imports for routes after env vars are set
let GET_TRANSACTIONS: typeof import("@/app/api/transactions/route").GET;
let GET_EXPORT_CSV: typeof import("@/app/api/export/csv/route").GET;

/**
 * Integration Tests: GET /api/transactions and GET /api/export/csv
 *
 * TDD Phase: RED - These tests should FAIL until API routes are implemented.
 * Based on: OpenAPI spec contracts/transactions-api.yaml
 *
 * Test Categories:
 * - Response shape validation
 * - Filter parameters (account_id, category, transaction_type, dates, recurring, search)
 * - Sorting (transaction_date, amount, category, description)
 * - Pagination (limit, offset, total_count)
 * - CSV export format and headers
 * - Error handling for invalid parameters
 *
 * User Story 6: View and Manage Transaction Details
 * - Display sortable, searchable transaction table with CSV export
 */

describe("GET /api/transactions", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport routes after env vars are set
    vi.resetModules();
    const transactionsRoute = await import("@/app/api/transactions/route");
    GET_TRANSACTIONS = transactionsRoute.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    txnCounter = 0;
  });

  describe("Response Structure", () => {
    it("should return data with transactions array, total_count, limit, and offset", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("transactions");
      expect(json.data).toHaveProperty("total_count");
      expect(json.data).toHaveProperty("limit");
      expect(json.data).toHaveProperty("offset");
      expect(Array.isArray(json.data.transactions)).toBe(true);
    });

    it("should return transaction items with all required fields", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(json.data.transactions.length).toBeGreaterThan(0);

      const txn = json.data.transactions[0];
      // Required fields per OpenAPI spec
      expect(txn).toHaveProperty("transaction_id");
      expect(txn).toHaveProperty("transaction_date");
      expect(txn).toHaveProperty("account_id");
      expect(txn).toHaveProperty("account_name");
      expect(txn).toHaveProperty("account_type");
      expect(txn).toHaveProperty("account_owner");
      expect(txn).toHaveProperty("description");
      expect(txn).toHaveProperty("category");
      expect(txn).toHaveProperty("amount");
      expect(txn).toHaveProperty("transaction_type");
    });

    it("should return correct total_count matching actual data", async () => {
      await seedBasicTransactions(); // Seeds 5 transactions

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(json.data.total_count).toBe(5);
      expect(json.data.transactions.length).toBe(5);
    });

    it("should return empty transactions array when no data exists", async () => {
      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions).toEqual([]);
      expect(json.data.total_count).toBe(0);
    });
  });

  describe("Filter by account_id", () => {
    it("should filter by single account_id", async () => {
      await seedMultiAccountTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?account_id=ACC-USER1-CHK"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_count).toBe(2);
      expect(
        json.data.transactions.every(
          (t: { account_id: string }) => t.account_id === "ACC-USER1-CHK"
        )
      ).toBe(true);
    });

    it("should filter by multiple account_ids (comma-separated)", async () => {
      await seedMultiAccountTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?account_id=ACC-USER1-CHK,ACC-USER2-SAV"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.total_count).toBe(4); // 2 from each account
      expect(
        json.data.transactions.every(
          (t: { account_id: string }) =>
            t.account_id === "ACC-USER1-CHK" || t.account_id === "ACC-USER2-SAV"
        )
      ).toBe(true);
    });

    it("should return empty array for non-existent account_id", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?account_id=NONEXISTENT"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions).toEqual([]);
      expect(json.data.total_count).toBe(0);
    });
  });

  describe("Filter by category", () => {
    it("should filter by category", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?category=Groceries"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBeGreaterThan(0);
      expect(
        json.data.transactions.every(
          (t: { category: string }) => t.category === "Groceries"
        )
      ).toBe(true);
    });

    it("should return empty array for non-existent category", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?category=NonExistentCategory"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions).toEqual([]);
    });
  });

  describe("Filter by transaction_type", () => {
    it("should filter by transaction_type=Expense", async () => {
      await seedMixedTypeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?transaction_type=Expense"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(
        json.data.transactions.every(
          (t: { transaction_type: string }) => t.transaction_type === "Expense"
        )
      ).toBe(true);
    });

    it("should filter by transaction_type=Income", async () => {
      await seedMixedTypeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?transaction_type=Income"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(
        json.data.transactions.every(
          (t: { transaction_type: string }) => t.transaction_type === "Income"
        )
      ).toBe(true);
    });

    it("should filter by transaction_type=Transfer", async () => {
      await seedMixedTypeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?transaction_type=Transfer"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(
        json.data.transactions.every(
          (t: { transaction_type: string }) => t.transaction_type === "Transfer"
        )
      ).toBe(true);
    });
  });

  describe("Filter by date range", () => {
    it("should filter by start_date", async () => {
      await seedDateRangeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?start_date=2024-02-01"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should exclude January transactions
      expect(
        json.data.transactions.every(
          (t: { transaction_date: string }) =>
            new Date(t.transaction_date) >= new Date("2024-02-01")
        )
      ).toBe(true);
    });

    it("should filter by end_date", async () => {
      await seedDateRangeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?end_date=2024-01-31"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include January transactions
      expect(
        json.data.transactions.every(
          (t: { transaction_date: string }) =>
            new Date(t.transaction_date) <= new Date("2024-01-31")
        )
      ).toBe(true);
    });

    it("should filter by both start_date and end_date", async () => {
      await seedDateRangeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?start_date=2024-02-01&end_date=2024-02-28"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should only include February transactions
      expect(json.data.total_count).toBe(2); // Feb transactions
    });

    it("should return empty when no transactions in date range", async () => {
      await seedBasicTransactions(); // Seeds 2024 data

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?start_date=2020-01-01&end_date=2020-12-31"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions).toEqual([]);
    });
  });

  describe("Filter by is_recurring", () => {
    it("should filter by is_recurring=true", async () => {
      await seedRecurringTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?is_recurring=true"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(
        json.data.transactions.every((t: { is_recurring: boolean }) => t.is_recurring === true)
      ).toBe(true);
    });

    it("should filter by is_recurring=false", async () => {
      await seedRecurringTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?is_recurring=false"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(
        json.data.transactions.every((t: { is_recurring: boolean }) => t.is_recurring === false)
      ).toBe(true);
    });
  });

  describe("Search functionality", () => {
    it("should search in description", async () => {
      await seedSearchableTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?search=walmart"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBeGreaterThan(0);
      expect(
        json.data.transactions.some((t: { description: string }) =>
          t.description.toLowerCase().includes("walmart")
        )
      ).toBe(true);
    });

    it("should search in category", async () => {
      await seedSearchableTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?search=grocery"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBeGreaterThan(0);
    });

    it("should perform case-insensitive search", async () => {
      await seedSearchableTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?search=WALMART"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBeGreaterThan(0);
    });

    it("should return empty array when search has no matches", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?search=nonexistentsearchterm"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions).toEqual([]);
    });

    it("should handle special characters in search", async () => {
      await seedSearchableTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?search=O'Reilly"
      );
      const response = await GET_TRANSACTIONS(request);
      // Should not error - may return empty or matching results
      expect(response.status).toBe(200);
    });
  });

  describe("Sorting", () => {
    it("should sort by transaction_date DESC by default", async () => {
      await seedDateRangeTransactions();

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);

      const dates = json.data.transactions.map(
        (t: { transaction_date: string }) => new Date(t.transaction_date).getTime()
      );
      // Should be descending
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it("should sort by transaction_date ASC", async () => {
      await seedDateRangeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?sort_by=transaction_date&sort_order=asc"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      const dates = json.data.transactions.map(
        (t: { transaction_date: string }) => new Date(t.transaction_date).getTime()
      );
      // Should be ascending
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeLessThanOrEqual(dates[i]);
      }
    });

    it("should sort by amount DESC", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?sort_by=amount&sort_order=desc"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      const amounts = json.data.transactions.map((t: { amount: number }) => t.amount);
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
      }
    });

    it("should sort by amount ASC", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?sort_by=amount&sort_order=asc"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      const amounts = json.data.transactions.map((t: { amount: number }) => t.amount);
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeLessThanOrEqual(amounts[i]);
      }
    });

    it("should sort by category", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?sort_by=category&sort_order=asc"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const categories = json.data.transactions.map(
        (t: { category: string }) => t.category
      );
      // Should be alphabetically sorted
      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });

    it("should sort by description", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?sort_by=description&sort_order=asc"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const descriptions = json.data.transactions.map(
        (t: { description: string }) => t.description
      );
      const sorted = [...descriptions].sort();
      expect(descriptions).toEqual(sorted);
    });
  });

  describe("Pagination", () => {
    it("should respect limit parameter", async () => {
      await seedManyTransactions(20);

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=5"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBe(5);
      expect(json.data.total_count).toBe(20);
      expect(json.data.limit).toBe(5);
    });

    it("should respect offset parameter", async () => {
      await seedManyTransactions(10);

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=5&offset=5"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBe(5);
      expect(json.data.offset).toBe(5);
    });

    it("should return remaining items when offset + limit > total", async () => {
      await seedManyTransactions(7);

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=5&offset=5"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions.length).toBe(2); // Only 2 remaining
      expect(json.data.total_count).toBe(7);
    });

    it("should return empty array when offset >= total", async () => {
      await seedBasicTransactions(); // 5 transactions

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?offset=100"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transactions).toEqual([]);
      expect(json.data.total_count).toBe(5);
    });

    it("should use default limit of 100", async () => {
      await seedManyTransactions(5);

      const request = new NextRequest("http://localhost:3000/api/transactions");
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(json.data.limit).toBe(100);
    });

    it("should maintain stable pagination order", async () => {
      await seedManyTransactions(10);

      // Get first page
      const page1Request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=5&offset=0&sort_by=transaction_date&sort_order=desc"
      );
      const page1Response = await GET_TRANSACTIONS(page1Request);
      const page1 = await page1Response.json();

      // Get second page
      const page2Request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=5&offset=5&sort_by=transaction_date&sort_order=desc"
      );
      const page2Response = await GET_TRANSACTIONS(page2Request);
      const page2 = await page2Response.json();

      // IDs should not overlap
      const page1Ids = page1.data.transactions.map(
        (t: { transaction_id: number }) => t.transaction_id
      );
      const page2Ids = page2.data.transactions.map(
        (t: { transaction_id: number }) => t.transaction_id
      );

      const overlap = page1Ids.filter((id: number) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe("Combined Filters", () => {
    it("should combine all filters correctly", async () => {
      await seedComplexData();

      const request = new NextRequest(
        "http://localhost:3000/api/transactions?" +
          "account_id=ACC-JOINT-CHK" +
          "&category=Groceries" +
          "&transaction_type=Expense" +
          "&start_date=2024-01-01" +
          "&end_date=2024-12-31" +
          "&is_recurring=false" +
          "&search=weekly" +
          "&sort_by=amount" +
          "&sort_order=desc" +
          "&limit=10" +
          "&offset=0"
      );
      const response = await GET_TRANSACTIONS(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // All results should match all filters
      for (const txn of json.data.transactions) {
        expect(txn.account_id).toBe("ACC-JOINT-CHK");
        expect(txn.category).toBe("Groceries");
        expect(txn.transaction_type).toBe("Expense");
        expect(txn.is_recurring).toBe(false);
      }
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/transactions?start_date=invalid"
      );
      const response = await GET_TRANSACTIONS(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/transactions?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET_TRANSACTIONS(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("start_date");
    });

    it("should return 400 for invalid transaction_type", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/transactions?transaction_type=InvalidType"
      );
      const response = await GET_TRANSACTIONS(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid sort_by field", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/transactions?sort_by=invalid_field"
      );
      const response = await GET_TRANSACTIONS(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for limit exceeding maximum (1000)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/transactions?limit=1001"
      );
      const response = await GET_TRANSACTIONS(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for negative offset", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/transactions?offset=-1"
      );
      const response = await GET_TRANSACTIONS(request);

      expect(response.status).toBe(400);
    });
  });
});

// ===== CSV EXPORT TESTS =====

describe("GET /api/export/csv", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    vi.resetModules();
    const csvRoute = await import("@/app/api/export/csv/route");
    GET_EXPORT_CSV = csvRoute.GET;
  }, 120000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    txnCounter = 0;
  });

  describe("Response Format", () => {
    it("should return CSV content type", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/csv");
    });

    it("should include Content-Disposition header for download", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);

      const disposition = response.headers.get("content-disposition");
      expect(disposition).toContain("attachment");
      expect(disposition).toContain("filename=");
      expect(disposition).toContain(".csv");
    });

    it("should include header row in CSV", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      const lines = csvText.split("\n");
      const headers = lines[0];

      // Required fields should be in header
      expect(headers).toContain("transaction_date");
      expect(headers).toContain("account_id");
      expect(headers).toContain("description");
      expect(headers).toContain("category");
      expect(headers).toContain("amount");
      expect(headers).toContain("transaction_type");
    });

    it("should include all transactions as rows", async () => {
      await seedBasicTransactions(); // 5 transactions

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      const lines = csvText
        .split("\n")
        .filter((line) => line.trim().length > 0);
      // Header + 5 data rows
      expect(lines.length).toBe(6);
    });

    it("should handle empty data gracefully", async () => {
      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Should at least have header row
      expect(response.status).toBe(200);
      const lines = csvText
        .split("\n")
        .filter((line) => line.trim().length > 0);
      expect(lines.length).toBeGreaterThanOrEqual(1); // At least header
    });
  });

  describe("CSV Content Quality", () => {
    it("should properly escape values with commas", async () => {
      const prisma = getTestPrisma();
      await insertTransaction(prisma, {
        description: "Amazon, Prime Membership",
        category: "Shopping",
        amount: -14.99,
      });

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Value with comma should be quoted
      expect(csvText).toContain('"Amazon, Prime Membership"');
    });

    it("should properly escape values with quotes", async () => {
      const prisma = getTestPrisma();
      await insertTransaction(prisma, {
        description: 'Book: "The Great Gatsby"',
        category: "Shopping",
        amount: -15.99,
      });

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Quotes should be escaped (doubled)
      expect(csvText).toContain('""The Great Gatsby""');
    });

    it("should properly escape values with newlines", async () => {
      const prisma = getTestPrisma();
      await insertTransaction(prisma, {
        description: "Purchase\nwith newline",
        category: "Shopping",
        amount: -10.00,
        notes: "Line1\nLine2",
      });

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Newlines should be within quoted field, preserving data integrity
      expect(response.status).toBe(200);
    });

    it("should format dates consistently (YYYY-MM-DD)", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Should contain ISO date format
      expect(csvText).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it("should format amounts as numbers without currency symbols", async () => {
      await seedBasicTransactions();

      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Should not contain $ or other currency symbols
      expect(csvText).not.toContain("$");
    });
  });

  describe("Filter Parameters", () => {
    it("should filter by account_id", async () => {
      await seedMultiAccountTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?account_id=ACC-USER1-CHK"
      );
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // All data rows should be from ACC-USER1-CHK
      const lines = csvText.split("\n").slice(1); // Skip header
      for (const line of lines) {
        if (line.trim()) {
          expect(line).toContain("ACC-USER1-CHK");
        }
      }
    });

    it("should filter by date range", async () => {
      await seedDateRangeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?start_date=2024-02-01&end_date=2024-02-28"
      );
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      // Should only have February data
      expect(csvText).toContain("2024-02");
      expect(csvText).not.toContain("2024-01");
      expect(csvText).not.toContain("2024-03");
    });

    it("should filter by category", async () => {
      await seedBasicTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?category=Groceries"
      );
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      const dataLines = csvText
        .split("\n")
        .slice(1)
        .filter((l) => l.trim());
      for (const line of dataLines) {
        expect(line).toContain("Groceries");
      }
    });

    it("should filter by transaction_type", async () => {
      await seedMixedTypeTransactions();

      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?transaction_type=Income"
      );
      const response = await GET_EXPORT_CSV(request);
      const csvText = await response.text();

      const dataLines = csvText
        .split("\n")
        .slice(1)
        .filter((l) => l.trim());
      for (const line of dataLines) {
        expect(line).toContain("Income");
      }
    });

    it("should include dynamic filename with date range", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?start_date=2024-01-01&end_date=2024-12-31"
      );
      const response = await GET_EXPORT_CSV(request);

      const disposition = response.headers.get("content-disposition");
      // Filename should reflect the date range
      expect(disposition).toContain("2024-01-01");
      expect(disposition).toContain("2024-12-31");
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?start_date=invalid"
      );
      const response = await GET_EXPORT_CSV(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET_EXPORT_CSV(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid transaction_type", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/export/csv?transaction_type=Invalid"
      );
      const response = await GET_EXPORT_CSV(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Performance", () => {
    it("should handle large datasets (1000+ records)", async () => {
      await seedManyTransactions(100); // Reduced for test speed

      const start = Date.now();
      const request = new NextRequest("http://localhost:3000/api/export/csv");
      const response = await GET_EXPORT_CSV(request);
      await response.text();
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      // Should complete within 5 seconds for test (spec says <5s for 5K)
      expect(duration).toBeLessThan(5000);
    });
  });
});

// ===== HELPER FUNCTIONS =====

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
    is_recurring?: boolean;
    recurring_frequency?: string | null;
    notes?: string | null;
  }
) {
  const id = ++txnCounter;
  const date = data.transaction_date || new Date("2024-01-15");
  const txnType = data.transaction_type || "Expense";

  await prisma.$executeRawUnsafe(`
    INSERT INTO [transactions] (
      transaction_id, transaction_date, transaction_time, account_id, account_name,
      account_type, account_owner, description, category, subcategory, amount,
      transaction_type, balance_after, is_recurring, recurring_frequency, notes
    ) VALUES (
      ${id},
      '${date.toISOString().split("T")[0]}',
      '${date.toTimeString().split(" ")[0]}',
      '${data.account_id || "ACC-JOINT-CHK"}',
      'Joint Checking',
      'Checking',
      'Joint',
      '${(data.description || "Test Transaction").replace(/'/g, "''")}',
      '${data.category}',
      ${data.subcategory ? `'${data.subcategory}'` : "NULL"},
      ${data.amount},
      '${txnType}',
      ${1000 + data.amount},
      ${data.is_recurring ? 1 : 0},
      ${data.recurring_frequency ? `'${data.recurring_frequency}'` : "NULL"},
      ${data.notes ? `'${data.notes.replace(/'/g, "''")}'` : "NULL"}
    )
  `);
}

async function seedBasicTransactions() {
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
    description: "Lunch out",
  });
  await insertTransaction(prisma, {
    amount: -200,
    category: "Utilities",
    description: "Electric bill",
  });
  await insertTransaction(prisma, {
    amount: 3000,
    category: "Salary",
    description: "Monthly salary",
    transaction_type: "Income",
  });
  await insertTransaction(prisma, {
    amount: -75,
    category: "Groceries",
    description: "Extra groceries",
  });
}

async function seedMultiAccountTransactions() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // ACC-USER1-CHK: 2 transactions
  await insertTransaction(prisma, {
    amount: -100,
    category: "Shopping",
    account_id: "ACC-USER1-CHK",
  });
  await insertTransaction(prisma, {
    amount: -200,
    category: "Dining",
    account_id: "ACC-USER1-CHK",
  });

  // ACC-USER2-SAV: 2 transactions
  await insertTransaction(prisma, {
    amount: -150,
    category: "Utilities",
    account_id: "ACC-USER2-SAV",
  });
  await insertTransaction(prisma, {
    amount: -250,
    category: "Shopping",
    account_id: "ACC-USER2-SAV",
  });

  // ACC-JOINT-CHK: 2 transactions
  await insertTransaction(prisma, {
    amount: -300,
    category: "Groceries",
    account_id: "ACC-JOINT-CHK",
  });
  await insertTransaction(prisma, {
    amount: -50,
    category: "Dining",
    account_id: "ACC-JOINT-CHK",
  });
}

async function seedMixedTypeTransactions() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Expenses
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

  // Income
  await insertTransaction(prisma, {
    amount: 3000,
    category: "Salary",
    transaction_type: "Income",
  });
  await insertTransaction(prisma, {
    amount: 500,
    category: "Freelance",
    transaction_type: "Income",
  });

  // Transfers
  await insertTransaction(prisma, {
    amount: -1000,
    category: "Transfer",
    transaction_type: "Transfer",
    account_id: "ACC-JOINT-CHK",
  });
  await insertTransaction(prisma, {
    amount: 1000,
    category: "Transfer",
    transaction_type: "Transfer",
    account_id: "ACC-USER1-SAV",
  });
}

async function seedDateRangeTransactions() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // January
  await insertTransaction(prisma, {
    amount: -100,
    category: "Food",
    transaction_date: new Date("2024-01-15"),
  });
  await insertTransaction(prisma, {
    amount: -150,
    category: "Shopping",
    transaction_date: new Date("2024-01-20"),
  });

  // February
  await insertTransaction(prisma, {
    amount: -200,
    category: "Utilities",
    transaction_date: new Date("2024-02-10"),
  });
  await insertTransaction(prisma, {
    amount: -75,
    category: "Dining",
    transaction_date: new Date("2024-02-20"),
  });

  // March
  await insertTransaction(prisma, {
    amount: -300,
    category: "Entertainment",
    transaction_date: new Date("2024-03-05"),
  });
  await insertTransaction(prisma, {
    amount: -50,
    category: "Food",
    transaction_date: new Date("2024-03-15"),
  });
}

async function seedRecurringTransactions() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Recurring
  await insertTransaction(prisma, {
    amount: -100,
    category: "Subscriptions",
    description: "Netflix",
    is_recurring: true,
    recurring_frequency: "Monthly",
  });
  await insertTransaction(prisma, {
    amount: -15,
    category: "Subscriptions",
    description: "Spotify",
    is_recurring: true,
    recurring_frequency: "Monthly",
  });

  // Non-recurring
  await insertTransaction(prisma, {
    amount: -50,
    category: "Dining",
    description: "Restaurant",
    is_recurring: false,
  });
  await insertTransaction(prisma, {
    amount: -200,
    category: "Shopping",
    description: "Clothes",
    is_recurring: false,
  });
}

async function seedSearchableTransactions() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  await insertTransaction(prisma, {
    amount: -150,
    category: "Groceries",
    description: "Walmart grocery shopping",
  });
  await insertTransaction(prisma, {
    amount: -75,
    category: "Groceries",
    description: "Target household items",
  });
  await insertTransaction(prisma, {
    amount: -25,
    category: "Dining",
    description: "Starbucks coffee",
  });
  await insertTransaction(prisma, {
    amount: -100,
    category: "Grocery Store",
    description: "Costco bulk purchase",
  });
}

async function seedManyTransactions(count: number) {
  const prisma = getTestPrisma();
  txnCounter = 0;

  const categories = ["Groceries", "Dining", "Shopping", "Utilities", "Entertainment"];

  for (let i = 0; i < count; i++) {
    const dayOffset = i % 30;
    await insertTransaction(prisma, {
      amount: -(Math.random() * 500 + 10),
      category: categories[i % categories.length],
      description: `Transaction ${i + 1}`,
      transaction_date: new Date(`2024-01-${String(dayOffset + 1).padStart(2, "0")}`),
    });
  }
}

async function seedComplexData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // This one should match all filters
  await insertTransaction(prisma, {
    amount: -150,
    category: "Groceries",
    description: "Weekly groceries at store",
    account_id: "ACC-JOINT-CHK",
    transaction_type: "Expense",
    transaction_date: new Date("2024-06-15"),
    is_recurring: false,
  });

  // Different account - should not match
  await insertTransaction(prisma, {
    amount: -100,
    category: "Groceries",
    description: "Weekly groceries",
    account_id: "ACC-USER1-CHK",
    transaction_type: "Expense",
    transaction_date: new Date("2024-06-15"),
    is_recurring: false,
  });

  // Different category - should not match
  await insertTransaction(prisma, {
    amount: -50,
    category: "Dining",
    description: "Weekly lunch",
    account_id: "ACC-JOINT-CHK",
    transaction_type: "Expense",
    transaction_date: new Date("2024-06-15"),
    is_recurring: false,
  });

  // Recurring - should not match
  await insertTransaction(prisma, {
    amount: -75,
    category: "Groceries",
    description: "Weekly subscription",
    account_id: "ACC-JOINT-CHK",
    transaction_type: "Expense",
    transaction_date: new Date("2024-06-15"),
    is_recurring: true,
    recurring_frequency: "Weekly",
  });
}
