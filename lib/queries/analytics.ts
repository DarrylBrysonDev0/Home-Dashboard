/**
 * Analytics query helpers for KPI calculations
 * All monetary calculations exclude Transfer transactions to avoid double-counting
 *
 * This module exports two types of functions:
 * 1. Pure calculation functions (calculate*) - for unit testing with mock data
 * 2. Database query functions (get*) - for API endpoints using Prisma
 */

import { prisma } from "@/lib/db";
import { getTotalBalance } from "./accounts";
import type { KpiResponse, Trend } from "@/lib/validations/analytics";
import type { Decimal } from "@prisma/client/runtime/client";

export interface KpiFilters {
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
}

// ----- PURE CALCULATION FUNCTIONS (for unit testing) -----

/**
 * Transaction interface matching mock data shape for pure functions
 */
interface Transaction {
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
  is_recurring?: boolean;
  recurring_frequency?: "Weekly" | "Biweekly" | "Monthly" | null;
  description?: string;
  category?: string;
  transaction_date?: Date;
}

interface AccountBalance {
  account_id: string;
  balance: number;
}

interface LargestExpenseResult {
  amount: number;
  description: string;
  category: string;
  date: Date;
}

/**
 * Calculate net cash flow from transactions (income - expenses)
 * Excludes transfers from calculation
 */
export function calculateNetCashFlow(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.transaction_type !== "Transfer")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate month-over-month percentage change and trend direction
 */
export function calculateMonthOverMonthChange(
  currentPeriodTotal: number,
  previousPeriodTotal: number
): { percentage: number; trend: Trend } {
  let percentage: number;

  if (previousPeriodTotal === 0 && currentPeriodTotal === 0) {
    percentage = 0;
  } else if (previousPeriodTotal === 0) {
    percentage = currentPeriodTotal > 0 ? 100 : -100;
  } else {
    percentage =
      ((currentPeriodTotal - previousPeriodTotal) / Math.abs(previousPeriodTotal)) * 100;
  }

  // Round to 1 decimal place
  percentage = Math.round(percentage * 10) / 10;

  // Determine trend direction
  let trend: Trend;
  if (percentage > 0.5) {
    trend = "up";
  } else if (percentage < -0.5) {
    trend = "down";
  } else {
    trend = "neutral";
  }

  return { percentage, trend };
}

/**
 * Calculate total recurring expenses from transactions
 * Returns absolute value (positive number)
 */
export function calculateRecurringExpenses(transactions: Transaction[]): number {
  return transactions
    .filter(
      (t) =>
        t.is_recurring === true &&
        t.transaction_type === "Expense" &&
        t.amount < 0
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Find the largest expense transaction
 * Returns null if no expenses found
 */
export function findLargestExpense(
  transactions: Transaction[]
): LargestExpenseResult | null {
  const expenses = transactions.filter(
    (t) => t.transaction_type === "Expense" && t.amount < 0
  );

  if (expenses.length === 0) {
    return null;
  }

  // Find the expense with the most negative amount (largest expense)
  const largest = expenses.reduce((max, t) =>
    t.amount < max.amount ? t : max
  );

  return {
    amount: largest.amount,
    description: largest.description ?? "Unknown",
    category: largest.category ?? "Uncategorized",
    date: largest.transaction_date ?? new Date(),
  };
}

/**
 * Calculate total balance from account balances
 */
export function calculateTotalBalance(accountBalances: AccountBalance[]): number {
  return accountBalances.reduce((sum, acc) => sum + acc.balance, 0);
}

// ----- DATABASE QUERY FUNCTIONS (for API endpoints) -----

/**
 * Build the base WHERE clause for date and account filtering
 * Returns SQL conditions as string for use in raw queries
 */
function buildWhereConditions(filters: KpiFilters): {
  dateCondition: string;
  accountCondition: string;
  prevDateCondition: string;
} {
  const conditions: string[] = [];
  const prevConditions: string[] = [];

  // Date range filter
  if (filters.startDate) {
    conditions.push(
      `transaction_date >= '${filters.startDate.toISOString().split("T")[0]}'`
    );
  }
  if (filters.endDate) {
    conditions.push(
      `transaction_date <= '${filters.endDate.toISOString().split("T")[0]}'`
    );
  }

  // For previous period comparison (same duration, shifted back)
  if (filters.startDate && filters.endDate) {
    const duration =
      filters.endDate.getTime() - filters.startDate.getTime();
    const prevEndDate = new Date(filters.startDate.getTime() - 1); // Day before current start
    const prevStartDate = new Date(prevEndDate.getTime() - duration);
    prevConditions.push(
      `transaction_date >= '${prevStartDate.toISOString().split("T")[0]}'`
    );
    prevConditions.push(
      `transaction_date <= '${prevEndDate.toISOString().split("T")[0]}'`
    );
  } else if (filters.endDate) {
    // Default to comparing current month with previous month
    const endDate = filters.endDate;
    const startOfMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const prevMonthEnd = new Date(startOfMonth.getTime() - 1);
    const prevMonthStart = new Date(
      prevMonthEnd.getFullYear(),
      prevMonthEnd.getMonth(),
      1
    );
    prevConditions.push(
      `transaction_date >= '${prevMonthStart.toISOString().split("T")[0]}'`
    );
    prevConditions.push(
      `transaction_date <= '${prevMonthEnd.toISOString().split("T")[0]}'`
    );
  }

  // Account filter
  if (filters.accountIds && filters.accountIds.length > 0) {
    const accountList = filters.accountIds.map((id) => `'${id}'`).join(",");
    conditions.push(`account_id IN (${accountList})`);
    prevConditions.push(`account_id IN (${accountList})`);
  }

  return {
    dateCondition: conditions.length > 0 ? conditions.join(" AND ") : "1=1",
    accountCondition:
      filters.accountIds && filters.accountIds.length > 0
        ? `account_id IN (${filters.accountIds.map((id) => `'${id}'`).join(",")})`
        : "1=1",
    prevDateCondition:
      prevConditions.length > 0 ? prevConditions.join(" AND ") : "1=1",
  };
}

/**
 * Calculate net cash flow (income - expenses) for the period
 * Excludes Transfer transactions
 */
export async function getNetCashFlow(filters: KpiFilters): Promise<number> {
  const { dateCondition, accountCondition } = buildWhereConditions(filters);
  const whereClause = [dateCondition, accountCondition, "transaction_type != 'Transfer'"]
    .filter(Boolean)
    .join(" AND ");

  const result = await prisma.$queryRawUnsafe<[{ net_cash_flow: Decimal }]>(`
    SELECT COALESCE(SUM(amount), 0) AS net_cash_flow
    FROM transactions
    WHERE ${whereClause}
  `);

  return Number(result[0]?.net_cash_flow ?? 0);
}

/**
 * Calculate month-over-month change in net cash flow
 * Returns percentage change and trend direction
 */
export async function getMonthOverMonthChange(
  filters: KpiFilters
): Promise<{ percentage: number; trend: Trend }> {
  const currentNetCashFlow = await getNetCashFlow(filters);

  const { prevDateCondition, accountCondition } = buildWhereConditions(filters);
  const prevWhereClause = [prevDateCondition, accountCondition, "transaction_type != 'Transfer'"]
    .filter(Boolean)
    .join(" AND ");

  const prevResult = await prisma.$queryRawUnsafe<
    [{ net_cash_flow: Decimal }]
  >(`
    SELECT COALESCE(SUM(amount), 0) AS net_cash_flow
    FROM transactions
    WHERE ${prevWhereClause}
  `);

  const previousNetCashFlow = Number(prevResult[0]?.net_cash_flow ?? 0);

  // Calculate percentage change
  let percentage: number;
  let trend: Trend;

  if (previousNetCashFlow === 0) {
    // Can't calculate percentage if previous is 0
    percentage = currentNetCashFlow > 0 ? 100 : currentNetCashFlow < 0 ? -100 : 0;
  } else {
    percentage =
      ((currentNetCashFlow - previousNetCashFlow) / Math.abs(previousNetCashFlow)) *
      100;
  }

  // Determine trend direction
  if (percentage > 0.5) {
    trend = "up";
  } else if (percentage < -0.5) {
    trend = "down";
  } else {
    trend = "neutral";
  }

  return {
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    trend,
  };
}

/**
 * Get total recurring expenses for the period
 * Only includes transactions marked as recurring with negative amounts (expenses)
 */
export async function getRecurringExpenses(filters: KpiFilters): Promise<number> {
  const { dateCondition, accountCondition } = buildWhereConditions(filters);
  const whereClause = [
    dateCondition,
    accountCondition,
    "is_recurring = 1",
    "amount < 0",
    "transaction_type = 'Expense'",
  ]
    .filter(Boolean)
    .join(" AND ");

  const result = await prisma.$queryRawUnsafe<[{ total: Decimal }]>(`
    SELECT COALESCE(SUM(ABS(amount)), 0) AS total
    FROM transactions
    WHERE ${whereClause}
  `);

  return Number(result[0]?.total ?? 0);
}

/**
 * Get the largest expense in the period
 * Returns null if no expenses found
 */
export async function getLargestExpense(
  filters: KpiFilters
): Promise<{
  amount: number;
  description: string;
  category: string;
  date: Date;
} | null> {
  const { dateCondition, accountCondition } = buildWhereConditions(filters);
  const whereClause = [
    dateCondition,
    accountCondition,
    "amount < 0",
    "transaction_type = 'Expense'",
  ]
    .filter(Boolean)
    .join(" AND ");

  const result = await prisma.$queryRawUnsafe<
    Array<{
      amount: Decimal;
      description: string | null;
      category: string | null;
      transaction_date: Date;
    }>
  >(`
    SELECT TOP 1
      amount,
      description,
      category,
      transaction_date
    FROM transactions
    WHERE ${whereClause}
    ORDER BY amount ASC
  `);

  if (result.length === 0) {
    return null;
  }

  const expense = result[0];
  return {
    amount: Number(expense.amount),
    description: expense.description ?? "Unknown",
    category: expense.category ?? "Uncategorized",
    date: expense.transaction_date,
  };
}

/**
 * Get all KPIs in a single response
 * This is the main function called by the /api/analytics/kpis endpoint
 */
export async function getKpis(filters: KpiFilters): Promise<KpiResponse> {
  // Run queries in parallel for performance
  const [netCashFlow, totalBalance, momChange, recurringExpenses, largestExpense] =
    await Promise.all([
      getNetCashFlow(filters),
      getTotalBalance(filters.accountIds),
      getMonthOverMonthChange(filters),
      getRecurringExpenses(filters),
      getLargestExpense(filters),
    ]);

  return {
    net_cash_flow: netCashFlow,
    total_balance: totalBalance,
    month_over_month_change: momChange,
    recurring_expenses: recurringExpenses,
    largest_expense: largestExpense,
  };
}
