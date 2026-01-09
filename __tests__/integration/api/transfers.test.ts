import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic import for the route after env vars are set
let GET: typeof import("@/app/api/analytics/transfers/route").GET;

/**
 * Integration Tests: GET /api/analytics/transfers
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml
 *
 * USER STORY 8: View Transfer Flow Between Accounts
 * Goal: Display Sankey/flow diagram showing money movement between accounts
 *
 * Test Categories:
 * - Response shape validation
 * - Filter parameter handling (start_date, end_date)
 * - Transfer flow aggregation
 * - Empty data handling
 * - Error handling for invalid parameters
 *
 * API Contract (from analytics-api.yaml):
 * Response: { data: { transfers: TransferFlow[] } }
 * TransferFlow: {
 *   source_account_id: string,
 *   source_account_name: string,
 *   destination_account_id: string,
 *   destination_account_name: string,
 *   total_amount: number,
 *   transfer_count: number
 * }
 */

describe("GET /api/analytics/transfers", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import("@/app/api/analytics/transfers/route");
    GET = routeModule.GET;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  describe("Response Structure", () => {
    it("should return data with transfers array", async () => {
      await seedTransferTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("transfers");
      expect(Array.isArray(json.data.transfers)).toBe(true);
    });

    it("should return transfers with required fields", async () => {
      await seedTransferTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.transfers.length).toBeGreaterThan(0);

      const transfer = json.data.transfers[0];
      expect(transfer).toHaveProperty("source_account_id");
      expect(transfer).toHaveProperty("source_account_name");
      expect(transfer).toHaveProperty("destination_account_id");
      expect(transfer).toHaveProperty("destination_account_name");
      expect(transfer).toHaveProperty("total_amount");
      expect(transfer).toHaveProperty("transfer_count");
    });

    it("should return total_amount as number", async () => {
      await seedTransferTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.transfers.length).toBeGreaterThan(0);
      expect(typeof json.data.transfers[0].total_amount).toBe("number");
    });

    it("should return transfer_count as integer", async () => {
      await seedTransferTestData();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.transfers.length).toBeGreaterThan(0);
      expect(Number.isInteger(json.data.transfers[0].transfer_count)).toBe(true);
    });
  });

  describe("Transfer Flow Matching", () => {
    it("should match transfer pairs by date and amount", async () => {
      const prisma = getTestPrisma();

      // Create a transfer pair: Checking -> Savings
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
        description: "Transfer to Savings",
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
        description: "Transfer from Checking",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0]).toEqual({
        source_account_id: "ACC-JOINT-CHK",
        source_account_name: "Joint Checking",
        destination_account_id: "ACC-USER1-SAV",
        destination_account_name: "User1 Savings",
        total_amount: 500,
        transfer_count: 1,
      });
    });

    it("should aggregate multiple transfers between same account pair", async () => {
      const prisma = getTestPrisma();

      // First transfer: Checking -> Savings ($500)
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Second transfer: Checking -> Savings ($300)
      await insertTransaction(prisma, {
        amount: -300,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-20"),
      });
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-20"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(800); // 500 + 300
      expect(json.data.transfers[0].transfer_count).toBe(2);
    });

    it("should track transfers in opposite directions separately", async () => {
      const prisma = getTestPrisma();

      // Transfer: Checking -> Savings
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Transfer: Savings -> Checking (opposite direction)
      await insertTransaction(prisma, {
        amount: -200,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-20"),
      });
      await insertTransaction(prisma, {
        amount: 200,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-20"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(2);

      // Find each direction
      const checkingToSavings = json.data.transfers.find(
        (t: { source_account_id: string; destination_account_id: string }) =>
          t.source_account_id === "ACC-JOINT-CHK" &&
          t.destination_account_id === "ACC-USER1-SAV"
      );
      const savingsToChecking = json.data.transfers.find(
        (t: { source_account_id: string; destination_account_id: string }) =>
          t.source_account_id === "ACC-USER1-SAV" &&
          t.destination_account_id === "ACC-JOINT-CHK"
      );

      expect(checkingToSavings).toBeDefined();
      expect(checkingToSavings.total_amount).toBe(500);
      expect(savingsToChecking).toBeDefined();
      expect(savingsToChecking.total_amount).toBe(200);
    });

    it("should not include income or expense transactions", async () => {
      const prisma = getTestPrisma();

      // Expense (should be ignored)
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Expense",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
        category: "Groceries",
      });

      // Income (should be ignored)
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Income",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
        category: "Salary",
      });

      // Valid transfer pair
      await insertTransaction(prisma, {
        amount: -100,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-20"),
      });
      await insertTransaction(prisma, {
        amount: 100,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-20"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(100);
    });

    it("should handle transfers between multiple account pairs", async () => {
      const prisma = getTestPrisma();

      // Transfer: Checking -> Savings
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Transfer: Checking -> User2 Checking
      await insertTransaction(prisma, {
        amount: -300,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-20"),
      });
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        transaction_date: new Date("2024-01-20"),
      });

      // Transfer: Savings -> User2 Checking
      await insertTransaction(prisma, {
        amount: -100,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-25"),
      });
      await insertTransaction(prisma, {
        amount: 100,
        transaction_type: "Transfer",
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        transaction_date: new Date("2024-01-25"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(3);
    });
  });

  describe("Date Filter Parameters", () => {
    it("should filter by start_date", async () => {
      const prisma = getTestPrisma();

      // Transfer in January (before filter)
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Transfer in March (after filter start)
      await insertTransaction(prisma, {
        amount: -300,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-03-15"),
      });
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-03-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?start_date=2024-03-01"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(300); // Only March transfer
    });

    it("should filter by end_date", async () => {
      const prisma = getTestPrisma();

      // Transfer in January
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Transfer in March
      await insertTransaction(prisma, {
        amount: -300,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-03-15"),
      });
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-03-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(500); // Only January transfer
    });

    it("should filter by date range (start_date and end_date)", async () => {
      const prisma = getTestPrisma();

      // Transfer in January (before range)
      await insertTransaction(prisma, {
        amount: -100,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 100,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Transfer in February (in range)
      await insertTransaction(prisma, {
        amount: -200,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-02-15"),
      });
      await insertTransaction(prisma, {
        amount: 200,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-02-15"),
      });

      // Transfer in April (after range)
      await insertTransaction(prisma, {
        amount: -300,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-04-15"),
      });
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-04-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?start_date=2024-02-01&end_date=2024-02-29"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(200); // Only February transfer
    });

    it("should include transfers at date boundaries (inclusive)", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-01"), // Exactly at start
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-01"),
      });

      await insertTransaction(prisma, {
        amount: -300,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-31"), // Exactly at end
      });
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-31"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?start_date=2024-01-01&end_date=2024-01-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(800); // Both transfers included
      expect(json.data.transfers[0].transfer_count).toBe(2);
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty transfers array when no transactions exist", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toEqual([]);
    });

    it("should return empty transfers when no transfer transactions exist", async () => {
      const prisma = getTestPrisma();

      // Only income and expense transactions
      await insertTransaction(prisma, {
        amount: 5000,
        transaction_type: "Income",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
        category: "Salary",
      });
      await insertTransaction(prisma, {
        amount: -200,
        transaction_type: "Expense",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-16"),
        category: "Groceries",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toEqual([]);
    });

    it("should return empty transfers when date range has no matches", async () => {
      await seedTransferTestData(); // Seeds 2024 data

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?start_date=2020-01-01&end_date=2020-12-31"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toEqual([]);
    });

    it("should return empty transfers when only unmatched transfers exist", async () => {
      const prisma = getTestPrisma();

      // Only source transfer (no matching destination)
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      // Only destination transfer (no matching source)
      await insertTransaction(prisma, {
        amount: 300,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-20"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid start_date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?start_date=invalid-date"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 for invalid end_date format", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?end_date=not-a-date"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 when end_date is before start_date", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers?start_date=2024-12-31&end_date=2024-01-01"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain("start_date");
    });
  });

  describe("Response Ordering", () => {
    it("should sort transfers by total_amount descending", async () => {
      const prisma = getTestPrisma();

      // Small transfer
      await insertTransaction(prisma, {
        amount: -100,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 100,
        transaction_type: "Transfer",
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        transaction_date: new Date("2024-01-15"),
      });

      // Large transfer
      await insertTransaction(prisma, {
        amount: -1000,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-20"),
      });
      await insertTransaction(prisma, {
        amount: 1000,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-20"),
      });

      // Medium transfer
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-25"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        transaction_date: new Date("2024-01-25"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(3);

      // Verify descending order by total_amount
      const amounts = json.data.transfers.map(
        (t: { total_amount: number }) => t.total_amount
      );
      expect(amounts).toEqual([1000, 500, 100]);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multiple transfers on the same day with same amount", async () => {
      const prisma = getTestPrisma();

      // Two different transfer pairs, same day, same amount, different accounts
      // Transfer 1: Checking -> Savings
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      // Transfer 2: Savings -> User2 Checking (same amount, different accounts)
      await insertTransaction(prisma, {
        amount: -500,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 500,
        transaction_type: "Transfer",
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        transaction_date: new Date("2024-01-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(2);
    });

    it("should handle decimal amounts correctly", async () => {
      const prisma = getTestPrisma();

      await insertTransaction(prisma, {
        amount: -123.45,
        transaction_type: "Transfer",
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        transaction_date: new Date("2024-01-15"),
      });
      await insertTransaction(prisma, {
        amount: 123.45,
        transaction_type: "Transfer",
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        transaction_date: new Date("2024-01-15"),
      });

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/transfers"
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.transfers).toHaveLength(1);
      expect(json.data.transfers[0].total_amount).toBe(123.45);
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
      '${data.category || "Transfer"}',
      NULL,
      ${data.amount || 0},
      '${data.transaction_type || "Transfer"}',
      ${balanceAfter},
      0,
      NULL,
      'Test data'
    )
  `);
}

async function seedTransferTestData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Create a simple transfer pair for basic tests
  await insertTransaction(prisma, {
    amount: -500,
    transaction_type: "Transfer",
    account_id: "ACC-JOINT-CHK",
    account_name: "Joint Checking",
    transaction_date: new Date("2024-01-15"),
    description: "Transfer to Savings",
  });
  await insertTransaction(prisma, {
    amount: 500,
    transaction_type: "Transfer",
    account_id: "ACC-USER1-SAV",
    account_name: "User1 Savings",
    transaction_date: new Date("2024-01-15"),
    description: "Transfer from Checking",
  });
}
