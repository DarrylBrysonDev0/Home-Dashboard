import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateNetCashFlow,
  calculateMonthOverMonthChange,
  calculateRecurringExpenses,
  findLargestExpense,
  calculateTotalBalance,
} from "@/lib/queries/analytics";
import type { Trend } from "@/lib/validations/analytics";

/**
 * Unit Tests: KPI Calculation Functions
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/analytics.ts is implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml, data-model.md
 *
 * Test Categories:
 * - calculateNetCashFlow: income - expenses (excludes transfers)
 * - calculateMonthOverMonthChange: percentage change with trend direction
 * - calculateRecurringExpenses: sum of recurring expense transactions
 * - findLargestExpense: max single expense in period
 * - calculateTotalBalance: sum of current account balances
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

describe("calculateNetCashFlow", () => {
  it("should calculate net cash flow as income minus expenses", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 5000, transaction_type: "Income" }),
      createTransaction({ amount: -1500, transaction_type: "Expense" }),
      createTransaction({ amount: -800, transaction_type: "Expense" }),
    ];

    const result = calculateNetCashFlow(transactions);

    // 5000 - 1500 - 800 = 2700
    expect(result).toBe(2700);
  });

  it("should exclude transfers from net cash flow calculation", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 5000, transaction_type: "Income" }),
      createTransaction({ amount: -1500, transaction_type: "Expense" }),
      createTransaction({ amount: -2000, transaction_type: "Transfer" }),
      createTransaction({ amount: 2000, transaction_type: "Transfer" }),
    ];

    const result = calculateNetCashFlow(transactions);

    // 5000 - 1500 = 3500 (transfers excluded)
    expect(result).toBe(3500);
  });

  it("should return 0 for empty transactions", () => {
    const result = calculateNetCashFlow([]);
    expect(result).toBe(0);
  });

  it("should handle negative net cash flow", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 1000, transaction_type: "Income" }),
      createTransaction({ amount: -2500, transaction_type: "Expense" }),
    ];

    const result = calculateNetCashFlow(transactions);
    expect(result).toBe(-1500);
  });

  it("should handle transactions with only expenses", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -500, transaction_type: "Expense" }),
      createTransaction({ amount: -750, transaction_type: "Expense" }),
    ];

    const result = calculateNetCashFlow(transactions);
    expect(result).toBe(-1250);
  });

  it("should handle transactions with only income", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 3000, transaction_type: "Income" }),
      createTransaction({ amount: 1500, transaction_type: "Income" }),
    ];

    const result = calculateNetCashFlow(transactions);
    expect(result).toBe(4500);
  });
});

describe("calculateMonthOverMonthChange", () => {
  it("should calculate positive percentage change correctly", () => {
    const currentPeriodTotal = 5000;
    const previousPeriodTotal = 4000;

    const result = calculateMonthOverMonthChange(currentPeriodTotal, previousPeriodTotal);

    expect(result.percentage).toBe(25); // (5000 - 4000) / 4000 * 100 = 25%
    expect(result.trend).toBe("up" as Trend);
  });

  it("should calculate negative percentage change correctly", () => {
    const currentPeriodTotal = 3000;
    const previousPeriodTotal = 4000;

    const result = calculateMonthOverMonthChange(currentPeriodTotal, previousPeriodTotal);

    expect(result.percentage).toBe(-25); // (3000 - 4000) / 4000 * 100 = -25%
    expect(result.trend).toBe("down" as Trend);
  });

  it("should return neutral when no change", () => {
    const currentPeriodTotal = 4000;
    const previousPeriodTotal = 4000;

    const result = calculateMonthOverMonthChange(currentPeriodTotal, previousPeriodTotal);

    expect(result.percentage).toBe(0);
    expect(result.trend).toBe("neutral" as Trend);
  });

  it("should handle zero previous period (new activity)", () => {
    const currentPeriodTotal = 5000;
    const previousPeriodTotal = 0;

    const result = calculateMonthOverMonthChange(currentPeriodTotal, previousPeriodTotal);

    // When previous is 0 and current is positive, should be 100% up
    expect(result.percentage).toBe(100);
    expect(result.trend).toBe("up" as Trend);
  });

  it("should handle zero current period", () => {
    const currentPeriodTotal = 0;
    const previousPeriodTotal = 5000;

    const result = calculateMonthOverMonthChange(currentPeriodTotal, previousPeriodTotal);

    expect(result.percentage).toBe(-100);
    expect(result.trend).toBe("down" as Trend);
  });

  it("should handle both periods being zero", () => {
    const result = calculateMonthOverMonthChange(0, 0);

    expect(result.percentage).toBe(0);
    expect(result.trend).toBe("neutral" as Trend);
  });

  it("should round percentage to reasonable precision", () => {
    const currentPeriodTotal = 3333;
    const previousPeriodTotal = 3000;

    const result = calculateMonthOverMonthChange(currentPeriodTotal, previousPeriodTotal);

    // 11.1% - should be rounded to 1 decimal place
    expect(result.percentage).toBeCloseTo(11.1, 1);
    expect(result.trend).toBe("up" as Trend);
  });
});

describe("calculateRecurringExpenses", () => {
  it("should sum only recurring expense transactions", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -100, is_recurring: true, transaction_type: "Expense" }),
      createTransaction({ amount: -150, is_recurring: true, transaction_type: "Expense" }),
      createTransaction({ amount: -200, is_recurring: false, transaction_type: "Expense" }),
      createTransaction({ amount: 3000, is_recurring: true, transaction_type: "Income" }),
    ];

    const result = calculateRecurringExpenses(transactions);

    // Only recurring expenses: 100 + 150 = 250 (absolute value)
    expect(result).toBe(250);
  });

  it("should return 0 when no recurring expenses", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -500, is_recurring: false, transaction_type: "Expense" }),
      createTransaction({ amount: 3000, is_recurring: true, transaction_type: "Income" }),
    ];

    const result = calculateRecurringExpenses(transactions);
    expect(result).toBe(0);
  });

  it("should return 0 for empty transactions", () => {
    const result = calculateRecurringExpenses([]);
    expect(result).toBe(0);
  });

  it("should handle various recurring frequencies", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -50, is_recurring: true, recurring_frequency: "Weekly" }),
      createTransaction({ amount: -100, is_recurring: true, recurring_frequency: "Biweekly" }),
      createTransaction({ amount: -200, is_recurring: true, recurring_frequency: "Monthly" }),
    ];

    const result = calculateRecurringExpenses(transactions);
    expect(result).toBe(350);
  });
});

describe("findLargestExpense", () => {
  it("should find the single largest expense", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        amount: -500,
        description: "Groceries",
        category: "Food",
        transaction_date: new Date("2024-01-15"),
      }),
      createTransaction({
        amount: -1250,
        description: "Mortgage Payment",
        category: "Housing",
        transaction_date: new Date("2024-01-01"),
      }),
      createTransaction({
        amount: -75,
        description: "Coffee",
        category: "Dining",
        transaction_date: new Date("2024-01-10"),
      }),
    ];

    const result = findLargestExpense(transactions);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-1250);
    expect(result!.description).toBe("Mortgage Payment");
    expect(result!.category).toBe("Housing");
    expect(result!.date).toEqual(new Date("2024-01-01"));
  });

  it("should exclude income transactions", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 5000, transaction_type: "Income", description: "Salary" }),
      createTransaction({ amount: -200, transaction_type: "Expense", description: "Groceries" }),
    ];

    const result = findLargestExpense(transactions);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-200);
    expect(result!.description).toBe("Groceries");
  });

  it("should exclude transfer transactions", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: -2000, transaction_type: "Transfer", description: "To Savings" }),
      createTransaction({ amount: -150, transaction_type: "Expense", description: "Electric Bill" }),
    ];

    const result = findLargestExpense(transactions);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-150);
  });

  it("should return null for empty transactions", () => {
    const result = findLargestExpense([]);
    expect(result).toBeNull();
  });

  it("should return null when no expenses exist", () => {
    const transactions: MockTransaction[] = [
      createTransaction({ amount: 3000, transaction_type: "Income" }),
      createTransaction({ amount: -500, transaction_type: "Transfer" }),
    ];

    const result = findLargestExpense(transactions);
    expect(result).toBeNull();
  });

  it("should handle tie by returning first occurrence", () => {
    const transactions: MockTransaction[] = [
      createTransaction({
        amount: -500,
        description: "First Large Expense",
        transaction_date: new Date("2024-01-01"),
      }),
      createTransaction({
        amount: -500,
        description: "Second Large Expense",
        transaction_date: new Date("2024-01-15"),
      }),
    ];

    const result = findLargestExpense(transactions);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(-500);
    // Should return the first one encountered
    expect(result!.description).toBe("First Large Expense");
  });
});

describe("calculateTotalBalance", () => {
  it("should sum latest balance for each account", () => {
    // Transactions from multiple accounts, each with their final balance
    const accountBalances = [
      { account_id: "ACC-001", balance: 5000 },
      { account_id: "ACC-002", balance: 10000 },
      { account_id: "ACC-003", balance: 2500 },
    ];

    const result = calculateTotalBalance(accountBalances);
    expect(result).toBe(17500);
  });

  it("should return 0 for empty accounts", () => {
    const result = calculateTotalBalance([]);
    expect(result).toBe(0);
  });

  it("should handle negative balances (overdraft)", () => {
    const accountBalances = [
      { account_id: "ACC-001", balance: 5000 },
      { account_id: "ACC-002", balance: -500 },
    ];

    const result = calculateTotalBalance(accountBalances);
    expect(result).toBe(4500);
  });

  it("should handle single account", () => {
    const accountBalances = [
      { account_id: "ACC-001", balance: 8500 },
    ];

    const result = calculateTotalBalance(accountBalances);
    expect(result).toBe(8500);
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
