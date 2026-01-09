import { describe, it, expect, beforeEach } from "vitest";
import {
  aggregateCashFlow,
  aggregateCashFlowByPeriod,
  calculatePeriodLabel,
} from "@/lib/queries/cash-flow";
import type { Granularity } from "@/lib/validations/analytics";

/**
 * Unit Tests: Cash Flow Aggregation Functions
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/cash-flow.ts is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml, data-model.md
 *
 * Test Categories:
 * - aggregateCashFlow: Calculate income/expenses from transactions
 * - aggregateCashFlowByPeriod: Group transactions by time period (daily/weekly/monthly)
 * - calculatePeriodLabel: Generate human-readable period labels
 *
 * CRITICAL REQUIREMENT: Transfers MUST be excluded from all cash flow calculations
 * (User Story 2: "View Cash Flow Over Time" - "with transfers excluded")
 */

// Mock transaction data structure matching Prisma schema
interface MockTransaction {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  description: string;
  category: string;
  subcategory: string | null;
  amount: number; // positive = income, negative = expense
  transaction_type: "Income" | "Expense" | "Transfer";
  balance_after: number | null;
  is_recurring: boolean;
  recurring_frequency: "Weekly" | "Biweekly" | "Monthly" | null;
}

describe("aggregateCashFlow", () => {
  it("should calculate total income from income transactions", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 3000, transaction_type: "Income" }),
      createTransaction({ amount: 2500, transaction_type: "Income" }),
      createTransaction({ amount: -500, transaction_type: "Expense" }),
    ];

    const result = aggregateCashFlow(transactions);

    expect(result.income).toBe(5500);
  });

  it("should calculate total expenses from expense transactions", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -800, transaction_type: "Expense" }),
      createTransaction({ amount: -200, transaction_type: "Expense" }),
      createTransaction({ amount: 3000, transaction_type: "Income" }),
    ];

    const result = aggregateCashFlow(transactions);

    // Expenses should be returned as positive value for display
    expect(result.expenses).toBe(1000);
  });

  it("should calculate net as income minus expenses", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 5000, transaction_type: "Income" }),
      createTransaction({ amount: -1500, transaction_type: "Expense" }),
      createTransaction({ amount: -500, transaction_type: "Expense" }),
    ];

    const result = aggregateCashFlow(transactions);

    expect(result.net).toBe(3000); // 5000 - 2000 = 3000
  });

  it("should EXCLUDE transfers from income calculation", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 5000, transaction_type: "Income" }),
      createTransaction({ amount: 2000, transaction_type: "Transfer" }), // Incoming transfer - should be excluded
      createTransaction({ amount: -500, transaction_type: "Expense" }),
    ];

    const result = aggregateCashFlow(transactions);

    // Transfer should NOT count as income
    expect(result.income).toBe(5000);
    expect(result.expenses).toBe(500);
    expect(result.net).toBe(4500);
  });

  it("should EXCLUDE transfers from expense calculation", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 5000, transaction_type: "Income" }),
      createTransaction({ amount: -2000, transaction_type: "Transfer" }), // Outgoing transfer - should be excluded
      createTransaction({ amount: -500, transaction_type: "Expense" }),
    ];

    const result = aggregateCashFlow(transactions);

    // Transfer should NOT count as expense
    expect(result.income).toBe(5000);
    expect(result.expenses).toBe(500);
    expect(result.net).toBe(4500);
  });

  it("should handle empty transactions array", () => {
    const result = aggregateCashFlow([]);

    expect(result.income).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.net).toBe(0);
  });

  it("should handle transactions with only expenses", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -1000, transaction_type: "Expense" }),
      createTransaction({ amount: -500, transaction_type: "Expense" }),
    ];

    const result = aggregateCashFlow(transactions);

    expect(result.income).toBe(0);
    expect(result.expenses).toBe(1500);
    expect(result.net).toBe(-1500);
  });

  it("should handle transactions with only income", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 3000, transaction_type: "Income" }),
      createTransaction({ amount: 1500, transaction_type: "Income" }),
    ];

    const result = aggregateCashFlow(transactions);

    expect(result.income).toBe(4500);
    expect(result.expenses).toBe(0);
    expect(result.net).toBe(4500);
  });

  it("should handle transactions with only transfers (return zeros)", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -2000, transaction_type: "Transfer" }),
      createTransaction({ amount: 2000, transaction_type: "Transfer" }),
    ];

    const result = aggregateCashFlow(transactions);

    // All transfers should be excluded, resulting in zeros
    expect(result.income).toBe(0);
    expect(result.expenses).toBe(0);
    expect(result.net).toBe(0);
  });
});

describe("aggregateCashFlowByPeriod", () => {
  describe("monthly granularity", () => {
    it("should group transactions by month", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 3000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: -500,
          transaction_type: "Expense",
          transaction_date: new Date("2024-01-20"),
        }),
        createTransaction({
          amount: 3000,
          transaction_type: "Income",
          transaction_date: new Date("2024-02-15"),
        }),
        createTransaction({
          amount: -800,
          transaction_type: "Expense",
          transaction_date: new Date("2024-02-10"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "monthly");

      expect(result).toHaveLength(2);

      // January
      const jan = result.find((p) => p.period === "2024-01");
      expect(jan).toBeDefined();
      expect(jan!.income).toBe(3000);
      expect(jan!.expenses).toBe(500);
      expect(jan!.net).toBe(2500);

      // February
      const feb = result.find((p) => p.period === "2024-02");
      expect(feb).toBeDefined();
      expect(feb!.income).toBe(3000);
      expect(feb!.expenses).toBe(800);
      expect(feb!.net).toBe(2200);
    });

    it("should include start_date and end_date for each month", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 3000,
          transaction_type: "Income",
          transaction_date: new Date("2024-03-15"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "monthly");

      expect(result).toHaveLength(1);
      expect(result[0].start_date).toEqual(new Date("2024-03-01"));
      expect(result[0].end_date).toEqual(new Date("2024-03-31"));
    });

    it("should exclude transfers from monthly aggregation", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 5000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: -2000,
          transaction_type: "Transfer",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: 2000,
          transaction_type: "Transfer",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: -1000,
          transaction_type: "Expense",
          transaction_date: new Date("2024-01-20"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "monthly");

      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(5000); // Transfers excluded
      expect(result[0].expenses).toBe(1000); // Transfers excluded
      expect(result[0].net).toBe(4000);
    });

    it("should sort periods chronologically", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-03-15"),
        }),
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-02-15"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "monthly");

      expect(result).toHaveLength(3);
      expect(result[0].period).toBe("2024-01");
      expect(result[1].period).toBe("2024-02");
      expect(result[2].period).toBe("2024-03");
    });
  });

  describe("weekly granularity", () => {
    it("should group transactions by week", () => {
      const transactions: MockTransaction[] = [
        // Week 1 (Jan 1-7, 2024)
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-03"),
        }),
        // Week 2 (Jan 8-14, 2024)
        createTransaction({
          amount: 2000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-10"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "weekly");

      expect(result.length).toBeGreaterThanOrEqual(2);
      // Each period should have proper week identifiers
      result.forEach((period) => {
        expect(period.period).toMatch(/^\d{4}-W\d{2}$/);
      });
    });

    it("should calculate weekly start and end dates correctly", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-10"), // Wednesday
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "weekly");

      expect(result).toHaveLength(1);
      // Week should start on Monday and end on Sunday
      expect(result[0].start_date.getDay()).toBe(1); // Monday
      expect(result[0].end_date.getDay()).toBe(0); // Sunday
    });
  });

  describe("daily granularity", () => {
    it("should group transactions by day", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 500,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: 300,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-16"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "daily");

      expect(result).toHaveLength(2);

      const day15 = result.find((p) => p.period === "2024-01-15");
      expect(day15).toBeDefined();
      expect(day15!.income).toBe(800); // 500 + 300

      const day16 = result.find((p) => p.period === "2024-01-16");
      expect(day16).toBeDefined();
      expect(day16!.income).toBe(1000);
    });

    it("should have same start_date and end_date for daily periods", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "daily");

      expect(result).toHaveLength(1);
      expect(result[0].start_date).toEqual(result[0].end_date);
      expect(result[0].period).toBe("2024-01-15");
    });
  });

  describe("edge cases", () => {
    it("should handle empty transactions array", () => {
      const result = aggregateCashFlowByPeriod([], "monthly");
      expect(result).toEqual([]);
    });

    it("should handle transactions spanning multiple years", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 1000,
          transaction_type: "Income",
          transaction_date: new Date("2023-12-15"),
        }),
        createTransaction({
          amount: 2000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "monthly");

      expect(result).toHaveLength(2);
      expect(result[0].period).toBe("2023-12");
      expect(result[1].period).toBe("2024-01");
    });

    it("should handle single transaction", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 5000,
          transaction_type: "Income",
          transaction_date: new Date("2024-06-15"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "monthly");

      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(5000);
      expect(result[0].expenses).toBe(0);
      expect(result[0].net).toBe(5000);
    });

    it("should handle transactions on same day with different types", () => {
      const transactions: MockTransaction[] = [
        createTransaction({
          amount: 5000,
          transaction_type: "Income",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: -1000,
          transaction_type: "Expense",
          transaction_date: new Date("2024-01-15"),
        }),
        createTransaction({
          amount: -500,
          transaction_type: "Expense",
          transaction_date: new Date("2024-01-15"),
        }),
      ];

      const result = aggregateCashFlowByPeriod(transactions, "daily");

      expect(result).toHaveLength(1);
      expect(result[0].income).toBe(5000);
      expect(result[0].expenses).toBe(1500);
      expect(result[0].net).toBe(3500);
    });
  });
});

describe("calculatePeriodLabel", () => {
  describe("monthly labels", () => {
    it("should format monthly label as YYYY-MM", () => {
      const date = new Date("2024-01-15");
      const result = calculatePeriodLabel(date, "monthly");
      expect(result).toBe("2024-01");
    });

    it("should handle December correctly", () => {
      const date = new Date("2024-12-25");
      const result = calculatePeriodLabel(date, "monthly");
      expect(result).toBe("2024-12");
    });

    it("should handle single-digit months with leading zero", () => {
      const date = new Date("2024-03-10");
      const result = calculatePeriodLabel(date, "monthly");
      expect(result).toBe("2024-03");
    });
  });

  describe("weekly labels", () => {
    it("should format weekly label as YYYY-Www", () => {
      const date = new Date("2024-01-15"); // Week 3 of 2024
      const result = calculatePeriodLabel(date, "weekly");
      expect(result).toMatch(/^\d{4}-W\d{2}$/);
    });

    it("should handle first week of year", () => {
      const date = new Date("2024-01-03");
      const result = calculatePeriodLabel(date, "weekly");
      expect(result).toMatch(/^2024-W0[12]$/); // Week 1 or 2 depending on ISO week calculation
    });

    it("should handle last week of year", () => {
      const date = new Date("2024-12-30");
      const result = calculatePeriodLabel(date, "weekly");
      expect(result).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe("daily labels", () => {
    it("should format daily label as YYYY-MM-DD", () => {
      const date = new Date("2024-01-15");
      const result = calculatePeriodLabel(date, "daily");
      expect(result).toBe("2024-01-15");
    });

    it("should handle single-digit days with leading zero", () => {
      const date = new Date("2024-03-05");
      const result = calculatePeriodLabel(date, "daily");
      expect(result).toBe("2024-03-05");
    });
  });
});

// Helper function to create mock transactions with defaults
function createTransaction(overrides: Partial<MockTransaction>): MockTransaction {
  return {
    transaction_id: `TXN-${Math.random().toString(36).substring(7)}`,
    transaction_date: new Date("2024-01-15"),
    account_id: "ACC-JOINT-CHK",
    description: "Test Transaction",
    category: "Uncategorized",
    subcategory: null,
    amount: -100,
    transaction_type: "Expense",
    balance_after: 1000,
    is_recurring: false,
    recurring_frequency: null,
    ...overrides,
  };
}
