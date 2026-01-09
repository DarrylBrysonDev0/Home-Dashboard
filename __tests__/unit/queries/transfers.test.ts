import { describe, it, expect } from "vitest";
import {
  matchTransferPairs,
  aggregateTransferFlows,
  getTransferFlowSummary,
} from "@/lib/queries/transfers";

/**
 * Unit Tests: Transfer Flow Aggregation Query Functions
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/transfers.ts is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml, data-model.md
 *
 * Test Categories:
 * - matchTransferPairs: Match source (outgoing) and destination (incoming) transfer transactions
 * - aggregateTransferFlows: Aggregate transfer amounts between account pairs
 * - getTransferFlowSummary: Get transfer flow data for Sankey diagram
 *
 * USER STORY 8: View Transfer Flow Between Accounts
 * Goal: Display Sankey/flow diagram showing money movement between accounts
 *
 * Transfer Matching Logic (from data-model.md):
 * - Transfers occur on the same date
 * - Same absolute amount (source is negative, destination is positive)
 * - Different account_ids
 * - Source transaction: amount < 0 (money leaving)
 * - Destination transaction: amount > 0 (money entering)
 */

// Mock transaction data structure matching Prisma schema
interface MockTransaction {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  account_name: string;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
  description: string;
}

describe("matchTransferPairs", () => {
  it("should match transfer pairs by date, amount, and different accounts", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500, // Source (outgoing)
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500, // Destination (incoming)
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({
      source_transaction_id: "TXN001",
      destination_transaction_id: "TXN002",
      source_account_id: "ACC-JOINT-CHK",
      source_account_name: "Joint Checking",
      destination_account_id: "ACC-USER1-SAV",
      destination_account_name: "User1 Savings",
      amount: 500,
      transfer_date: new Date("2024-01-15"),
    });
  });

  it("should match multiple transfer pairs on the same date", () => {
    const transactions: MockTransaction[] = [
      // First transfer pair
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 500,
        transaction_type: "Transfer",
      }),
      // Second transfer pair (different amount)
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: -200,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER2-CHK",
        amount: 200,
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(2);
  });

  it("should only match transfers on the same date", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-16"), // Different date
        account_id: "ACC-USER1-SAV",
        amount: 500,
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(0);
  });

  it("should only match transfers with exact matching absolute amounts", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 501, // Different amount
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(0);
  });

  it("should not match transfers between the same account", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK", // Same account
        amount: 500,
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(0);
  });

  it("should only include transfer type transactions", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 500,
        transaction_type: "Income", // Not a transfer
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(0);
  });

  it("should return empty array for empty transactions", () => {
    const pairs = matchTransferPairs([]);

    expect(pairs).toEqual([]);
  });

  it("should return empty array when no transfer transactions exist", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Expense",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 500,
        transaction_type: "Income",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toEqual([]);
  });

  it("should handle unmatched transfers (source without destination)", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Transfer",
      }),
      // No matching destination
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(0);
  });

  it("should handle transfers with decimal amounts", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500.75,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 500.75,
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].amount).toBe(500.75);
  });
});

describe("aggregateTransferFlows", () => {
  it("should aggregate transfers between the same account pair", () => {
    const transactions: MockTransaction[] = [
      // First transfer: Checking -> Savings
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
      // Second transfer: Checking -> Savings (same direction)
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -300,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 300,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {});

    expect(flows).toHaveLength(1);
    expect(flows[0]).toEqual({
      source_account_id: "ACC-JOINT-CHK",
      source_account_name: "Joint Checking",
      destination_account_id: "ACC-USER1-SAV",
      destination_account_name: "User1 Savings",
      total_amount: 800, // 500 + 300
      transfer_count: 2,
    });
  });

  it("should track transfers in opposite directions separately", () => {
    const transactions: MockTransaction[] = [
      // Transfer: Checking -> Savings
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
      // Transfer: Savings -> Checking (opposite direction)
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: -200,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: 200,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {});

    expect(flows).toHaveLength(2);

    // Check Checking -> Savings flow
    const checkingToSavings = flows.find(
      (f) =>
        f.source_account_id === "ACC-JOINT-CHK" &&
        f.destination_account_id === "ACC-USER1-SAV"
    );
    expect(checkingToSavings).toBeDefined();
    expect(checkingToSavings!.total_amount).toBe(500);
    expect(checkingToSavings!.transfer_count).toBe(1);

    // Check Savings -> Checking flow
    const savingsToChecking = flows.find(
      (f) =>
        f.source_account_id === "ACC-USER1-SAV" &&
        f.destination_account_id === "ACC-JOINT-CHK"
    );
    expect(savingsToChecking).toBeDefined();
    expect(savingsToChecking!.total_amount).toBe(200);
    expect(savingsToChecking!.transfer_count).toBe(1);
  });

  it("should filter by date range", () => {
    const transactions: MockTransaction[] = [
      // Transfer in January
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
      // Transfer in March (outside date range)
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-03-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -300,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-03-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 300,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    });

    expect(flows).toHaveLength(1);
    expect(flows[0].total_amount).toBe(500); // Only January transfer
    expect(flows[0].transfer_count).toBe(1);
  });

  it("should return empty array when no transfers exist", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -500,
        transaction_type: "Expense",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {});

    expect(flows).toEqual([]);
  });

  it("should return empty array for empty transactions", () => {
    const flows = aggregateTransferFlows([], {});

    expect(flows).toEqual([]);
  });

  it("should handle transfers between multiple account pairs", () => {
    const transactions: MockTransaction[] = [
      // Checking -> Savings
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
      // Checking -> User2 Checking
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -300,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        amount: 300,
        transaction_type: "Transfer",
      }),
      // Savings -> User2 Checking
      createTransaction({
        transaction_id: "TXN005",
        transaction_date: new Date("2024-01-25"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: -100,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN006",
        transaction_date: new Date("2024-01-25"),
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        amount: 100,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {});

    expect(flows).toHaveLength(3);

    // Verify all flows are present
    const flowKeys = flows.map(
      (f) => `${f.source_account_id}->${f.destination_account_id}`
    );
    expect(flowKeys).toContain("ACC-JOINT-CHK->ACC-USER1-SAV");
    expect(flowKeys).toContain("ACC-JOINT-CHK->ACC-USER2-CHK");
    expect(flowKeys).toContain("ACC-USER1-SAV->ACC-USER2-CHK");
  });

  it("should sort flows by total_amount descending", () => {
    const transactions: MockTransaction[] = [
      // Small transfer
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: -100,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
        amount: 100,
        transaction_type: "Transfer",
      }),
      // Large transfer
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-01-20"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {});

    expect(flows).toHaveLength(2);
    expect(flows[0].total_amount).toBe(500); // Larger amount first
    expect(flows[1].total_amount).toBe(100);
  });
});

describe("getTransferFlowSummary", () => {
  it("should return complete transfer flow summary", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
    ];

    const summary = getTransferFlowSummary(transactions, {});

    expect(summary).toEqual({
      transfers: [
        {
          source_account_id: "ACC-JOINT-CHK",
          source_account_name: "Joint Checking",
          destination_account_id: "ACC-USER1-SAV",
          destination_account_name: "User1 Savings",
          total_amount: 500,
          transfer_count: 1,
        },
      ],
    });
  });

  it("should return empty transfers array when no transfers", () => {
    const summary = getTransferFlowSummary([], {});

    expect(summary).toEqual({
      transfers: [],
    });
  });

  it("should apply date filters correctly", () => {
    const transactions: MockTransaction[] = [
      // In range
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
      // Out of range
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-06-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -1000,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-06-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 1000,
        transaction_type: "Transfer",
      }),
    ];

    const summary = getTransferFlowSummary(transactions, {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    });

    expect(summary.transfers).toHaveLength(1);
    expect(summary.transfers[0].total_amount).toBe(500);
  });
});

describe("edge cases", () => {
  it("should handle large number of transfers", () => {
    const transactions: MockTransaction[] = [];

    // Create 50 transfer pairs
    for (let i = 0; i < 50; i++) {
      const date = new Date(`2024-01-${String((i % 28) + 1).padStart(2, "0")}`);
      const amount = 100 + i;

      transactions.push(
        createTransaction({
          transaction_id: `TXN${i * 2}`,
          transaction_date: date,
          account_id: "ACC-JOINT-CHK",
          account_name: "Joint Checking",
          amount: -amount,
          transaction_type: "Transfer",
        }),
        createTransaction({
          transaction_id: `TXN${i * 2 + 1}`,
          transaction_date: date,
          account_id: "ACC-USER1-SAV",
          account_name: "User1 Savings",
          amount: amount,
          transaction_type: "Transfer",
        })
      );
    }

    const pairs = matchTransferPairs(transactions);

    expect(pairs).toHaveLength(50);
  });

  it("should handle transfers at date boundaries", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-31"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-31"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
    });

    expect(flows).toHaveLength(1);
    expect(flows[0].total_amount).toBe(500);
  });

  it("should handle mixed transaction types correctly", () => {
    const transactions: MockTransaction[] = [
      // Expense (should be ignored)
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: -200,
        transaction_type: "Expense",
      }),
      // Income (should be ignored)
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 200,
        transaction_type: "Income",
      }),
      // Valid transfer pair
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        amount: -500,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN004",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
        amount: 500,
        transaction_type: "Transfer",
      }),
    ];

    const flows = aggregateTransferFlows(transactions, {});

    expect(flows).toHaveLength(1);
    expect(flows[0].total_amount).toBe(500);
  });

  it("should handle zero amount transfers (edge case)", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-JOINT-CHK",
        amount: 0,
        transaction_type: "Transfer",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        account_id: "ACC-USER1-SAV",
        amount: 0,
        transaction_type: "Transfer",
      }),
    ];

    const pairs = matchTransferPairs(transactions);

    // Zero amount transfers shouldn't match (amount validation)
    expect(pairs).toHaveLength(0);
  });
});

// Helper function to create mock transactions with defaults
function createTransaction(
  overrides: Partial<MockTransaction>
): MockTransaction {
  return {
    transaction_id: `TXN-${Math.random().toString(36).substring(7)}`,
    transaction_date: new Date("2024-01-15"),
    account_id: "ACC-JOINT-CHK",
    account_name: "Joint Checking",
    amount: -100,
    transaction_type: "Transfer",
    description: "Transfer",
    ...overrides,
  };
}
