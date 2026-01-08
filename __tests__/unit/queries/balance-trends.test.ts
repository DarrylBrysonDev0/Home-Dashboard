import { describe, it, expect } from "vitest";
import {
  calculateBalanceAtDate,
  getBalanceTrends,
  aggregateBalancesByPeriod,
} from "@/lib/queries/balance-trends";
import type { Granularity } from "@/lib/validations/analytics";

/**
 * Unit Tests: Balance Trend Query Functions
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/balance-trends.ts is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml, data-model.md
 *
 * Test Categories:
 * - calculateBalanceAtDate: Get balance at a specific point in time from transaction history
 * - getBalanceTrends: Get balance time series for accounts
 * - aggregateBalancesByPeriod: Group balance points by granularity (daily/weekly/monthly)
 *
 * USER STORY 5: Track Account Balance Trends
 * Goal: Display multi-line chart showing balance trends for each account over time
 */

// Mock transaction data structure matching Prisma schema
interface MockTransaction {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  account_name: string;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
  balance_after: number | null;
}

describe("calculateBalanceAtDate", () => {
  it("should return balance_after from the most recent transaction on or before the date", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-01"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-20"),
        balance_after: 1200,
        account_id: "ACC-JOINT-CHK",
      }),
    ];

    // Query for Jan 17 should return balance from Jan 15 (most recent before date)
    const result = calculateBalanceAtDate(
      transactions,
      "ACC-JOINT-CHK",
      new Date("2024-01-17")
    );

    expect(result).toBe(1500);
  });

  it("should return exact balance when transaction exists on the query date", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-20"),
        balance_after: 1200,
        account_id: "ACC-JOINT-CHK",
      }),
    ];

    const result = calculateBalanceAtDate(
      transactions,
      "ACC-JOINT-CHK",
      new Date("2024-01-20")
    );

    expect(result).toBe(1200);
  });

  it("should return null if no transactions exist before the query date", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-02-01"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
      }),
    ];

    const result = calculateBalanceAtDate(
      transactions,
      "ACC-JOINT-CHK",
      new Date("2024-01-15") // Before any transaction
    );

    expect(result).toBeNull();
  });

  it("should filter by account_id when calculating balance", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 3000,
        account_id: "ACC-USER1-SAV",
      }),
    ];

    const checkingBalance = calculateBalanceAtDate(
      transactions,
      "ACC-JOINT-CHK",
      new Date("2024-01-20")
    );
    const savingsBalance = calculateBalanceAtDate(
      transactions,
      "ACC-USER1-SAV",
      new Date("2024-01-20")
    );

    expect(checkingBalance).toBe(1500);
    expect(savingsBalance).toBe(3000);
  });

  it("should return the last transaction's balance when multiple transactions on same day", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_id: "TXN001",
        transaction_date: new Date("2024-01-15"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_id: "TXN002",
        transaction_date: new Date("2024-01-15"),
        balance_after: 1200,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_id: "TXN003",
        transaction_date: new Date("2024-01-15"),
        balance_after: 900,
        account_id: "ACC-JOINT-CHK",
      }),
    ];

    // Should return the balance from the last transaction on that day
    const result = calculateBalanceAtDate(
      transactions,
      "ACC-JOINT-CHK",
      new Date("2024-01-15")
    );

    // Assuming transactions are ordered, return last one's balance
    expect(result).toBe(900);
  });

  it("should handle transactions with null balance_after", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-10"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: null, // Missing balance
        account_id: "ACC-JOINT-CHK",
      }),
    ];

    // Should skip null balances and return the most recent valid one
    const result = calculateBalanceAtDate(
      transactions,
      "ACC-JOINT-CHK",
      new Date("2024-01-20")
    );

    expect(result).toBe(1000);
  });

  it("should return null for empty transactions array", () => {
    const result = calculateBalanceAtDate(
      [],
      "ACC-JOINT-CHK",
      new Date("2024-01-15")
    );

    expect(result).toBeNull();
  });
});

describe("getBalanceTrends", () => {
  it("should return balance trends for all accounts", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 3000,
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
      }),
    ];

    const result = getBalanceTrends(transactions, {});

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.account_id).sort()).toEqual([
      "ACC-JOINT-CHK",
      "ACC-USER1-SAV",
    ]);
    expect(result.find((a) => a.account_id === "ACC-JOINT-CHK")?.account_name).toBe(
      "Joint Checking"
    );
  });

  it("should filter by account_ids when provided", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 3000,
        account_id: "ACC-USER1-SAV",
        account_name: "User1 Savings",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 2000,
        account_id: "ACC-USER2-CHK",
        account_name: "User2 Checking",
      }),
    ];

    const result = getBalanceTrends(transactions, {
      accountIds: ["ACC-JOINT-CHK", "ACC-USER1-SAV"],
    });

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.account_id).sort()).toEqual([
      "ACC-JOINT-CHK",
      "ACC-USER1-SAV",
    ]);
  });

  it("should generate balance points within date range", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-01"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-02-01"),
        balance_after: 2000,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
    ];

    const result = getBalanceTrends(transactions, {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      granularity: "monthly",
    });

    expect(result).toHaveLength(1);
    expect(result[0].account_id).toBe("ACC-JOINT-CHK");
    // Monthly granularity should have one point for January
    expect(result[0].balances.length).toBeGreaterThanOrEqual(1);
  });

  it("should return each account with balance time series", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-02-15"),
        balance_after: 1500,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
    ];

    const result = getBalanceTrends(transactions, {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-02-28"),
      granularity: "monthly",
    });

    expect(result).toHaveLength(1);
    expect(result[0].balances.length).toBe(2); // Jan and Feb
    expect(result[0].balances[0]).toHaveProperty("date");
    expect(result[0].balances[0]).toHaveProperty("balance");
  });

  it("should return empty array when no transactions exist", () => {
    const result = getBalanceTrends([], {});

    expect(result).toEqual([]);
  });

  it("should handle single account with multiple balance points", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        transaction_date: new Date("2024-01-05"),
        balance_after: 1000,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-10"),
        balance_after: 1200,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-15"),
        balance_after: 900,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
      createTransaction({
        transaction_date: new Date("2024-01-20"),
        balance_after: 1100,
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
      }),
    ];

    const result = getBalanceTrends(transactions, {
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-31"),
      granularity: "weekly",
    });

    expect(result).toHaveLength(1);
    // Weekly granularity over ~1 month should produce 4-5 balance points
    expect(result[0].balances.length).toBeGreaterThanOrEqual(3);
  });
});

describe("aggregateBalancesByPeriod", () => {
  describe("monthly granularity", () => {
    it("should return end-of-month balance for each month", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-10"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-01-25"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-02-15"),
          balance_after: 2000,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-02-29"),
        "monthly"
      );

      expect(result).toHaveLength(2);
      // January balance should be 1500 (last transaction in Jan)
      expect(result[0].balance).toBe(1500);
      // February balance should be 2000
      expect(result[1].balance).toBe(2000);
    });

    it("should use previous month's balance when no transactions in a month", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
        // No transactions in February
        createTransaction({
          transaction_date: new Date("2024-03-15"),
          balance_after: 2000,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-03-31"),
        "monthly"
      );

      expect(result).toHaveLength(3);
      expect(result[0].balance).toBe(1500); // January
      expect(result[1].balance).toBe(1500); // February (carried forward)
      expect(result[2].balance).toBe(2000); // March
    });

    it("should format dates as end of month", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
        "monthly"
      );

      expect(result).toHaveLength(1);
      expect(result[0].date.getMonth()).toBe(0); // January
      expect(result[0].date.getDate()).toBe(31); // Last day of January
    });
  });

  describe("weekly granularity", () => {
    it("should return end-of-week balance for each week", () => {
      const transactions: MockTransaction[] = [
        // Week 1: Jan 1-7, 2024
        createTransaction({
          transaction_date: new Date("2024-01-03"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        // Week 2: Jan 8-14, 2024
        createTransaction({
          transaction_date: new Date("2024-01-10"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-01-14"),
        "weekly"
      );

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should carry balance forward to weeks with no transactions", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-03"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        // No transactions in week 2
        createTransaction({
          transaction_date: new Date("2024-01-17"),
          balance_after: 2000,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-01-21"),
        "weekly"
      );

      expect(result.length).toBeGreaterThanOrEqual(3);
      // Week 2 should carry forward week 1's balance
      expect(result[1].balance).toBe(1000);
    });
  });

  describe("daily granularity", () => {
    it("should return balance for each day", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-01-16"),
          balance_after: 1200,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-01-17"),
          balance_after: 900,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-15"),
        new Date("2024-01-17"),
        "daily"
      );

      expect(result).toHaveLength(3);
      expect(result[0].balance).toBe(1000);
      expect(result[1].balance).toBe(1200);
      expect(result[2].balance).toBe(900);
    });

    it("should carry balance forward on days without transactions", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        // No transaction on Jan 16
        createTransaction({
          transaction_date: new Date("2024-01-17"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-15"),
        new Date("2024-01-17"),
        "daily"
      );

      expect(result).toHaveLength(3);
      expect(result[0].balance).toBe(1000); // Jan 15
      expect(result[1].balance).toBe(1000); // Jan 16 (carried forward)
      expect(result[2].balance).toBe(1500); // Jan 17
    });
  });

  describe("edge cases", () => {
    it("should return empty array when no transactions for account", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1000,
          account_id: "ACC-OTHER",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
        "monthly"
      );

      expect(result).toEqual([]);
    });

    it("should handle single transaction", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
        "monthly"
      );

      expect(result).toHaveLength(1);
      expect(result[0].balance).toBe(1500);
    });

    it("should handle transactions spanning multiple years", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2023-12-15"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2023-12-01"),
        new Date("2024-01-31"),
        "monthly"
      );

      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe(1000); // December 2023
      expect(result[1].balance).toBe(1500); // January 2024
    });

    it("should return empty array when date range has no overlap with transactions", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-06-15"),
          balance_after: 1500,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-01-31"),
        "monthly"
      );

      // No transactions in date range means no balance history to show
      expect(result).toEqual([]);
    });

    it("should sort balance points chronologically", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          transaction_date: new Date("2024-03-15"),
          balance_after: 3000,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-01-15"),
          balance_after: 1000,
          account_id: "ACC-JOINT-CHK",
        }),
        createTransaction({
          transaction_date: new Date("2024-02-15"),
          balance_after: 2000,
          account_id: "ACC-JOINT-CHK",
        }),
      ];

      const result = aggregateBalancesByPeriod(
        transactions,
        "ACC-JOINT-CHK",
        new Date("2024-01-01"),
        new Date("2024-03-31"),
        "monthly"
      );

      expect(result).toHaveLength(3);
      expect(result[0].date < result[1].date).toBe(true);
      expect(result[1].date < result[2].date).toBe(true);
    });
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
    transaction_type: "Expense",
    balance_after: 1000,
    ...overrides,
  };
}
