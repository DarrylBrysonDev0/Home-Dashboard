/**
 * Balance Trend Query Functions
 * Calculates account balance trends over time periods
 *
 * This module exports two types of functions:
 * 1. Pure calculation functions (calculate*, aggregate*) - for unit testing with mock data
 * 2. Database query functions (getAccountBalanceTrends) - for API endpoints using Prisma
 *
 * KEY DIFFERENCE from Cash Flow:
 * - Balance trends use balance_after field (point-in-time snapshots)
 * - Transfers ARE included (they affect individual account balances)
 * - Balances are carried forward when no transactions exist in a period
 *
 * User Story 5: Track Account Balance Trends
 * Goal: Display multi-line chart showing balance trends for each account over time
 */

import { prisma } from "@/lib/db";
import type { Granularity, AccountTrend, BalancePoint } from "@/lib/validations/analytics";
import type { Decimal } from "@prisma/client/runtime/client";

// ----- TYPES -----

/**
 * Transaction interface for balance trend calculations
 * Matches both Prisma entity and mock data shapes
 */
export interface BalanceTrendTransaction {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  account_name: string;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
  balance_after: number | null;
}

/**
 * Balance trend filters for database queries
 */
export interface BalanceTrendFilters {
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
  granularity?: Granularity;
}

// ----- PURE CALCULATION FUNCTIONS (for unit testing) -----

/**
 * Calculate the account balance at a specific point in time
 * Returns the balance_after from the most recent transaction on or before the date
 *
 * @param transactions - Array of all transactions (will be filtered by account)
 * @param accountId - Account ID to get balance for
 * @param date - Date to get balance at
 * @returns Balance at the date, or null if no transactions exist before the date
 */
export function calculateBalanceAtDate(
  transactions: BalanceTrendTransaction[],
  accountId: string,
  date: Date
): number | null {
  // Filter to account and transactions on or before the date
  const accountTxns = transactions
    .filter((t) => t.account_id === accountId)
    .filter((t) => t.transaction_date <= date)
    .filter((t) => t.balance_after !== null)
    .sort((a, b) => {
      // Sort by date descending, then by transaction_id for same-day ordering
      const dateDiff = b.transaction_date.getTime() - a.transaction_date.getTime();
      if (dateDiff !== 0) return dateDiff;
      // For same day, use transaction_id to determine order (later transaction is "last")
      return b.transaction_id.localeCompare(a.transaction_id);
    });

  if (accountTxns.length === 0) {
    return null;
  }

  // Return the most recent valid balance
  return accountTxns[0].balance_after;
}

/**
 * Get balance trends for all accounts (or filtered accounts)
 * Returns account info with balance time series
 *
 * @param transactions - Array of all transactions
 * @param options - Filter and aggregation options
 * @returns Array of account trends with balance time series
 */
export function getBalanceTrends(
  transactions: BalanceTrendTransaction[],
  options: BalanceTrendFilters
): AccountTrend[] {
  if (transactions.length === 0) {
    return [];
  }

  // Get unique accounts from transactions
  const accountMap = new Map<string, string>();
  for (const txn of transactions) {
    if (!accountMap.has(txn.account_id)) {
      accountMap.set(txn.account_id, txn.account_name);
    }
  }

  // Filter accounts if specified
  let accounts = Array.from(accountMap.entries());
  if (options.accountIds && options.accountIds.length > 0) {
    accounts = accounts.filter(([id]) => options.accountIds!.includes(id));
  }

  // Determine date range
  let startDate = options.startDate;
  let endDate = options.endDate;

  if (!startDate || !endDate) {
    // Use transaction date range if not specified
    const dates = transactions.map((t) => t.transaction_date.getTime());
    startDate = startDate ?? new Date(Math.min(...dates));
    endDate = endDate ?? new Date(Math.max(...dates));
  }

  const granularity = options.granularity ?? "monthly";

  // Build trend for each account
  const trends: AccountTrend[] = [];

  for (const [accountId, accountName] of accounts) {
    const balances = aggregateBalancesByPeriod(
      transactions,
      accountId,
      startDate,
      endDate,
      granularity
    );

    if (balances.length > 0) {
      trends.push({
        account_id: accountId,
        account_name: accountName,
        balances,
      });
    }
  }

  return trends;
}

/**
 * Aggregate balances by period for a specific account
 * Returns end-of-period balance for each time bucket
 * Carries forward balance when no transactions exist in a period
 *
 * @param transactions - Array of all transactions
 * @param accountId - Account ID to aggregate
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param granularity - Time period granularity
 * @returns Array of balance points sorted chronologically
 */
export function aggregateBalancesByPeriod(
  transactions: BalanceTrendTransaction[],
  accountId: string,
  startDate: Date,
  endDate: Date,
  granularity: Granularity
): BalancePoint[] {
  // Filter transactions for this account within date range
  const accountTxns = transactions
    .filter((t) => t.account_id === accountId)
    .filter((t) => t.balance_after !== null)
    .sort((a, b) => a.transaction_date.getTime() - b.transaction_date.getTime());

  // Find transactions within the date range or before it (for initial balance)
  const txnsInRange = accountTxns.filter(
    (t) => t.transaction_date >= startDate && t.transaction_date <= endDate
  );

  if (txnsInRange.length === 0) {
    return [];
  }

  // Generate period boundaries
  const periods = generatePeriods(startDate, endDate, granularity);

  // For each period, find the last balance
  const balancePoints: BalancePoint[] = [];
  let lastKnownBalance: number | null = null;

  // Check for balance before start date
  const priorTxn = accountTxns
    .filter((t) => t.transaction_date < startDate)
    .pop();
  if (priorTxn) {
    lastKnownBalance = priorTxn.balance_after;
  }

  for (const period of periods) {
    // Find transactions in this period
    const periodTxns = txnsInRange.filter(
      (t) => t.transaction_date >= period.start && t.transaction_date <= period.end
    );

    if (periodTxns.length > 0) {
      // Use the last transaction's balance in this period
      lastKnownBalance = periodTxns[periodTxns.length - 1].balance_after;
    }

    // Only add point if we have a balance (either from this period or carried forward)
    if (lastKnownBalance !== null) {
      balancePoints.push({
        date: period.end,
        balance: lastKnownBalance,
      });
    }
  }

  return balancePoints;
}

/**
 * Generate period boundaries for a date range
 */
function generatePeriods(
  startDate: Date,
  endDate: Date,
  granularity: Granularity
): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];

  switch (granularity) {
    case "daily":
      return generateDailyPeriods(startDate, endDate);
    case "weekly":
      return generateWeeklyPeriods(startDate, endDate);
    case "monthly":
    default:
      return generateMonthlyPeriods(startDate, endDate);
  }
}

function generateDailyPeriods(
  startDate: Date,
  endDate: Date
): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];
  const current = new Date(startDate);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    periods.push({ start: dayStart, end: dayEnd });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return periods;
}

function generateWeeklyPeriods(
  startDate: Date,
  endDate: Date
): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];

  // Start from the Monday of the week containing startDate
  const current = new Date(startDate);
  const dayOfWeek = current.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setUTCDate(current.getUTCDate() + mondayOffset);
  current.setUTCHours(0, 0, 0, 0);

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    periods.push({ start: weekStart, end: weekEnd });
    current.setUTCDate(current.getUTCDate() + 7);
  }

  return periods;
}

function generateMonthlyPeriods(
  startDate: Date,
  endDate: Date
): Array<{ start: Date; end: Date }> {
  const periods: Array<{ start: Date; end: Date }> = [];

  let year = startDate.getUTCFullYear();
  let month = startDate.getUTCMonth();

  while (true) {
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0)); // Last day of month

    if (monthStart > endDate) break;

    periods.push({ start: monthStart, end: monthEnd });

    // Move to next month
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return periods;
}

// ----- DATABASE QUERY FUNCTIONS (for API endpoints) -----

/**
 * Fetch and aggregate account balance trends from the database
 *
 * @param filters - Filter parameters (dates, accounts, granularity)
 * @returns Array of account trends with balance time series
 */
export async function getAccountBalanceTrends(
  filters: BalanceTrendFilters
): Promise<AccountTrend[]> {
  const granularity = filters.granularity ?? "monthly";

  // Build WHERE conditions
  const conditions: string[] = [];

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
  if (filters.accountIds && filters.accountIds.length > 0) {
    const accountList = filters.accountIds.map((id) => `'${id}'`).join(",");
    conditions.push(`account_id IN (${accountList})`);
  }

  const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "1=1";

  // Fetch transactions
  const transactions = await prisma.$queryRawUnsafe<
    Array<{
      transaction_id: string;
      transaction_date: Date;
      account_id: string;
      account_name: string;
      amount: Decimal;
      transaction_type: string;
      balance_after: Decimal | null;
    }>
  >(`
    SELECT
      transaction_id,
      transaction_date,
      account_id,
      account_name,
      amount,
      transaction_type,
      balance_after
    FROM transactions
    WHERE ${whereClause}
    ORDER BY transaction_date ASC, transaction_id ASC
  `);

  if (transactions.length === 0) {
    return [];
  }

  // Convert to typed transactions
  const typedTransactions: BalanceTrendTransaction[] = transactions.map((t) => ({
    transaction_id: t.transaction_id,
    transaction_date: new Date(t.transaction_date),
    account_id: t.account_id,
    account_name: t.account_name,
    amount: Number(t.amount),
    transaction_type: t.transaction_type as "Income" | "Expense" | "Transfer",
    balance_after: t.balance_after !== null ? Number(t.balance_after) : null,
  }));

  // Determine date range from transactions if not specified
  const dates = typedTransactions.map((t) => t.transaction_date.getTime());
  const startDate = filters.startDate ?? new Date(Math.min(...dates));
  const endDate = filters.endDate ?? new Date(Math.max(...dates));

  // Use pure function to calculate trends
  return getBalanceTrends(typedTransactions, {
    startDate,
    endDate,
    accountIds: filters.accountIds,
    granularity,
  });
}
