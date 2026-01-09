/**
 * Transfer Flow Query Functions
 * Matches and aggregates transfer transactions between accounts
 *
 * This module exports two types of functions:
 * 1. Pure calculation functions (matchTransferPairs, aggregateTransferFlows) - for unit testing with mock data
 * 2. Database query functions (getTransferFlows) - for API endpoints using Prisma
 *
 * Transfer Matching Logic (from data-model.md):
 * - Transfers occur on the same date
 * - Same absolute amount (source is negative, destination is positive)
 * - Different account_ids
 * - Source transaction: amount < 0 (money leaving)
 * - Destination transaction: amount > 0 (money entering)
 *
 * User Story 8: View Transfer Flow Between Accounts
 * Goal: Display Sankey/flow diagram showing money movement between accounts
 */

import { prisma } from "@/lib/db";
import type { TransferFlow } from "@/lib/validations/analytics";
import type { Decimal } from "@prisma/client/runtime/client";

// ----- TYPES -----

/**
 * Transaction interface for transfer matching
 * Matches both Prisma entity and mock data shapes
 */
export interface TransferTransaction {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  account_name: string;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
  description?: string;
}

/**
 * Matched transfer pair between two accounts
 */
export interface TransferPair {
  source_transaction_id: string;
  destination_transaction_id: string;
  source_account_id: string;
  source_account_name: string;
  destination_account_id: string;
  destination_account_name: string;
  amount: number;
  transfer_date: Date;
}

/**
 * Filters for transfer flow queries
 */
export interface TransferFlowFilters {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Transfer flow summary response
 */
export interface TransferFlowSummary {
  transfers: TransferFlow[];
}

// ----- PURE CALCULATION FUNCTIONS (for unit testing) -----

/**
 * Match transfer pairs from a list of transactions
 *
 * Pairs are matched by:
 * - Same date
 * - Same absolute amount (source negative, destination positive)
 * - Different accounts
 * - Both must be transaction_type = 'Transfer'
 *
 * @param transactions - Array of all transactions
 * @returns Array of matched transfer pairs
 */
export function matchTransferPairs(
  transactions: TransferTransaction[]
): TransferPair[] {
  // Filter to only Transfer type transactions
  const transfers = transactions.filter(
    (t) => t.transaction_type === "Transfer"
  );

  // Separate source (negative) and destination (positive) transactions
  const sources = transfers.filter((t) => t.amount < 0);
  const destinations = transfers.filter((t) => t.amount > 0);

  const pairs: TransferPair[] = [];
  const usedDestinationIds = new Set<string>();

  // Match each source with a destination
  for (const source of sources) {
    // Skip zero amounts
    if (source.amount === 0) continue;

    const sourceAmount = Math.abs(source.amount);
    const sourceDate = source.transaction_date.getTime();

    // Find matching destination
    const matchingDest = destinations.find((dest) => {
      // Already used
      if (usedDestinationIds.has(dest.transaction_id)) return false;
      // Skip zero amounts
      if (dest.amount === 0) return false;
      // Same account - not a valid transfer pair
      if (dest.account_id === source.account_id) return false;
      // Different date
      if (dest.transaction_date.getTime() !== sourceDate) return false;
      // Different amount (with small tolerance for floating point)
      if (Math.abs(dest.amount - sourceAmount) > 0.001) return false;

      return true;
    });

    if (matchingDest) {
      usedDestinationIds.add(matchingDest.transaction_id);
      pairs.push({
        source_transaction_id: source.transaction_id,
        destination_transaction_id: matchingDest.transaction_id,
        source_account_id: source.account_id,
        source_account_name: source.account_name,
        destination_account_id: matchingDest.account_id,
        destination_account_name: matchingDest.account_name,
        amount: sourceAmount,
        transfer_date: source.transaction_date,
      });
    }
  }

  return pairs;
}

/**
 * Aggregate transfer flows between account pairs
 *
 * Groups matched transfer pairs by source/destination account pair
 * and sums the amounts
 *
 * @param transactions - Array of all transactions
 * @param options - Filter options (date range)
 * @returns Array of aggregated transfer flows, sorted by total_amount descending
 */
export function aggregateTransferFlows(
  transactions: TransferTransaction[],
  options: TransferFlowFilters
): TransferFlow[] {
  // Filter by date range if provided
  let filtered = transactions;

  if (options.startDate) {
    const startTime = options.startDate.getTime();
    filtered = filtered.filter(
      (t) => t.transaction_date.getTime() >= startTime
    );
  }

  if (options.endDate) {
    const endTime = options.endDate.getTime();
    filtered = filtered.filter((t) => t.transaction_date.getTime() <= endTime);
  }

  // Match transfer pairs
  const pairs = matchTransferPairs(filtered);

  if (pairs.length === 0) {
    return [];
  }

  // Aggregate by account pair
  const flowMap = new Map<string, TransferFlow>();

  for (const pair of pairs) {
    const key = `${pair.source_account_id}->${pair.destination_account_id}`;

    const existing = flowMap.get(key);
    if (existing) {
      existing.total_amount += pair.amount;
      existing.transfer_count += 1;
    } else {
      flowMap.set(key, {
        source_account_id: pair.source_account_id,
        source_account_name: pair.source_account_name,
        destination_account_id: pair.destination_account_id,
        destination_account_name: pair.destination_account_name,
        total_amount: pair.amount,
        transfer_count: 1,
      });
    }
  }

  // Convert to array and sort by total_amount descending
  const flows = Array.from(flowMap.values());
  flows.sort((a, b) => b.total_amount - a.total_amount);

  return flows;
}

/**
 * Get transfer flow summary for API response
 *
 * @param transactions - Array of all transactions
 * @param options - Filter options
 * @returns Transfer flow summary with transfers array
 */
export function getTransferFlowSummary(
  transactions: TransferTransaction[],
  options: TransferFlowFilters
): TransferFlowSummary {
  const transfers = aggregateTransferFlows(transactions, options);
  return { transfers };
}

// ----- DATABASE QUERY FUNCTIONS (for API endpoints) -----

/**
 * Fetch and aggregate transfer flows from the database
 *
 * Uses a self-join query to match transfer pairs:
 * - Source: negative amount, transaction_type = 'Transfer'
 * - Destination: positive amount, transaction_type = 'Transfer'
 * - Same date, same absolute amount, different accounts
 *
 * @param filters - Date range filters
 * @returns Array of aggregated transfer flows
 */
export async function getTransferFlows(
  filters: TransferFlowFilters
): Promise<TransferFlow[]> {
  // Build WHERE conditions
  const conditions: string[] = [];

  if (filters.startDate) {
    conditions.push(
      `t1.transaction_date >= '${filters.startDate.toISOString().split("T")[0]}'`
    );
  }
  if (filters.endDate) {
    conditions.push(
      `t1.transaction_date <= '${filters.endDate.toISOString().split("T")[0]}'`
    );
  }

  const whereClause =
    conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  // Query for transfer pairs with aggregation
  // This uses the self-join pattern from data-model.md
  const results = await prisma.$queryRawUnsafe<
    Array<{
      source_account_id: string;
      source_account_name: string;
      destination_account_id: string;
      destination_account_name: string;
      total_amount: Decimal;
      transfer_count: bigint;
    }>
  >(`
    SELECT
      t1.account_id AS source_account_id,
      t1.account_name AS source_account_name,
      t2.account_id AS destination_account_id,
      t2.account_name AS destination_account_name,
      SUM(ABS(t1.amount)) AS total_amount,
      COUNT(*) AS transfer_count
    FROM transactions t1
    INNER JOIN transactions t2 ON
      t1.transaction_date = t2.transaction_date AND
      ABS(t1.amount) = ABS(t2.amount) AND
      t1.transaction_type = 'Transfer' AND
      t2.transaction_type = 'Transfer' AND
      t1.amount < 0 AND t2.amount > 0 AND
      t1.account_id <> t2.account_id
    WHERE 1=1 ${whereClause}
    GROUP BY
      t1.account_id, t1.account_name,
      t2.account_id, t2.account_name
    ORDER BY SUM(ABS(t1.amount)) DESC
  `);

  // Convert to typed response
  return results.map((row) => ({
    source_account_id: row.source_account_id,
    source_account_name: row.source_account_name,
    destination_account_id: row.destination_account_id,
    destination_account_name: row.destination_account_name,
    total_amount: Number(row.total_amount),
    transfer_count: Number(row.transfer_count),
  }));
}
