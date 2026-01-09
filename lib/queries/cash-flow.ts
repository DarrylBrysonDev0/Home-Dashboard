/**
 * Cash Flow Query Functions
 * Aggregates income and expenses over time periods, excluding transfers
 *
 * This module exports two types of functions:
 * 1. Pure calculation functions (aggregate*, calculate*) - for unit testing with mock data
 * 2. Database query functions (getCashFlow) - for API endpoints using Prisma
 *
 * CRITICAL: All calculations EXCLUDE Transfer transactions to avoid double-counting
 * (User Story 2: "Display income vs expenses chart over time with transfers excluded")
 */

import { prisma } from "@/lib/db";
import type { Granularity, CashFlowPeriod } from "@/lib/validations/analytics";
import type { Decimal } from "@prisma/client/runtime/client";

// ----- TYPES -----

/**
 * Transaction interface for cash flow calculations
 * Matches both Prisma entity and mock data shapes
 */
export interface CashFlowTransaction {
  transaction_date: Date;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
}

/**
 * Aggregated cash flow result
 */
export interface CashFlowResult {
  income: number;
  expenses: number;
  net: number;
}

/**
 * Cash flow filters for database queries
 */
export interface CashFlowFilters {
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
  granularity?: Granularity;
}

// ----- PURE CALCULATION FUNCTIONS (for unit testing) -----

/**
 * Aggregate transactions into income/expenses totals
 * Excludes Transfer transactions from calculation
 *
 * @param transactions - Array of transactions to aggregate
 * @returns Object with income (positive), expenses (absolute value), and net
 */
export function aggregateCashFlow(transactions: CashFlowTransaction[]): CashFlowResult {
  let income = 0;
  let expenses = 0;

  for (const txn of transactions) {
    // Skip transfers - they're internal movements, not real income/expenses
    if (txn.transaction_type === "Transfer") {
      continue;
    }

    if (txn.transaction_type === "Income" && txn.amount > 0) {
      income += txn.amount;
    } else if (txn.transaction_type === "Expense" && txn.amount < 0) {
      // Store expenses as positive value for display
      expenses += Math.abs(txn.amount);
    }
  }

  return {
    income,
    expenses,
    net: income - expenses,
  };
}

/**
 * Group transactions by period and aggregate cash flow for each
 * Excludes Transfer transactions from calculation
 *
 * @param transactions - Array of transactions to aggregate
 * @param granularity - Time period granularity (daily, weekly, monthly)
 * @returns Array of cash flow periods sorted chronologically
 */
export function aggregateCashFlowByPeriod(
  transactions: CashFlowTransaction[],
  granularity: Granularity
): CashFlowPeriod[] {
  if (transactions.length === 0) {
    return [];
  }

  // Group transactions by period
  const periodMap = new Map<string, CashFlowTransaction[]>();

  for (const txn of transactions) {
    const periodLabel = calculatePeriodLabel(txn.transaction_date, granularity);
    const existing = periodMap.get(periodLabel) || [];
    existing.push(txn);
    periodMap.set(periodLabel, existing);
  }

  // Convert to array of periods with aggregated data
  const periods: CashFlowPeriod[] = [];

  for (const [period, txns] of periodMap.entries()) {
    const { income, expenses, net } = aggregateCashFlow(txns);
    const { startDate, endDate } = getPeriodDateRange(txns[0].transaction_date, granularity);

    periods.push({
      period,
      start_date: startDate,
      end_date: endDate,
      income,
      expenses,
      net,
    });
  }

  // Sort periods chronologically
  return periods.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Calculate the period label for a given date and granularity
 * Uses UTC methods to ensure consistent behavior across timezones
 *
 * @param date - Transaction date
 * @param granularity - Time period granularity
 * @returns Period label string (e.g., "2024-01", "2024-W03", "2024-01-15")
 */
export function calculatePeriodLabel(date: Date, granularity: Granularity): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  switch (granularity) {
    case "daily":
      return `${year}-${month}-${day}`;

    case "weekly":
      // ISO week number calculation
      const weekNumber = getISOWeekNumber(date);
      const weekYear = getISOWeekYear(date);
      return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;

    case "monthly":
    default:
      return `${year}-${month}`;
  }
}

/**
 * Get the start and end dates for a period based on granularity
 * Returns dates at noon UTC to ensure correct day-of-week in all reasonable timezones
 */
function getPeriodDateRange(
  date: Date,
  granularity: Granularity
): { startDate: Date; endDate: Date } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (granularity) {
    case "daily":
      // Same day for both start and end
      const dayDate = new Date(Date.UTC(year, month, day));
      return { startDate: dayDate, endDate: dayDate };

    case "weekly":
      // Get Monday of the week (ISO week starts on Monday)
      const dayOfWeek = date.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      // Create dates at noon UTC to ensure correct day in ±12hr timezones
      const monday = new Date(Date.UTC(year, month, day + mondayOffset, 12, 0, 0));
      const sunday = new Date(Date.UTC(
        monday.getUTCFullYear(),
        monday.getUTCMonth(),
        monday.getUTCDate() + 6,
        12, 0, 0
      ));
      return { startDate: monday, endDate: sunday };

    case "monthly":
    default:
      // First and last day of month
      const firstDay = new Date(Date.UTC(year, month, 1));
      const lastDay = new Date(Date.UTC(year, month + 1, 0));
      return { startDate: firstDay, endDate: lastDay };
  }
}

/**
 * Calculate ISO week number for a date
 * ISO weeks start on Monday, week 1 is the week containing the first Thursday
 * Uses UTC to ensure consistent behavior across timezones
 */
function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  // Set to nearest Thursday (current date + 4 - current day number)
  // Make Sunday's day number 7
  const dayNumber = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);

  // Get first Thursday of year
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayOfWeek = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayOfWeek + 3);

  // Calculate week number
  const weekDiff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(weekDiff / (7 * 24 * 60 * 60 * 1000));
}

/**
 * Get the ISO week year for a date
 * The year of the Thursday of the ISO week
 * Uses UTC to ensure consistent behavior across timezones
 */
function getISOWeekYear(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  return target.getUTCFullYear();
}

// ----- DATABASE QUERY FUNCTIONS (for API endpoints) -----

/**
 * Build SQL WHERE conditions for cash flow filtering
 */
function buildWhereConditions(filters: CashFlowFilters): string {
  const conditions: string[] = [];

  // Always exclude transfers
  conditions.push("transaction_type != 'Transfer'");

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

  // Account filter
  if (filters.accountIds && filters.accountIds.length > 0) {
    const accountList = filters.accountIds.map((id) => `'${id}'`).join(",");
    conditions.push(`account_id IN (${accountList})`);
  }

  return conditions.join(" AND ");
}

/**
 * Fetch and aggregate cash flow data from the database
 * Groups by period according to granularity
 *
 * @param filters - Filter parameters (dates, accounts, granularity)
 * @returns Array of cash flow periods
 */
export async function getCashFlow(filters: CashFlowFilters): Promise<CashFlowPeriod[]> {
  const granularity = filters.granularity ?? "monthly";
  const whereClause = buildWhereConditions(filters);

  // Fetch filtered transactions
  const transactions = await prisma.$queryRawUnsafe<
    Array<{
      transaction_date: Date;
      amount: Decimal;
      transaction_type: string;
    }>
  >(`
    SELECT
      transaction_date,
      amount,
      transaction_type
    FROM transactions
    WHERE ${whereClause}
    ORDER BY transaction_date ASC
  `);

  // Convert to our interface type
  const typedTransactions: CashFlowTransaction[] = transactions.map((t) => ({
    transaction_date: new Date(t.transaction_date),
    amount: Number(t.amount),
    transaction_type: t.transaction_type as "Income" | "Expense" | "Transfer",
  }));

  // Use pure function to aggregate by period
  return aggregateCashFlowByPeriod(typedTransactions, granularity);
}
