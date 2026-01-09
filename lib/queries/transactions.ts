/**
 * Transaction query helpers for listing, filtering, sorting, and pagination
 * User Story 6: View and Manage Transaction Details
 *
 * Exports:
 * - buildTransactionWhereClause: Pure function for unit testing WHERE generation
 * - buildTransactionOrderBy: Pure function for unit testing ORDER BY generation
 * - getTransactionList: Database query function for API routes
 */

import { prisma } from "@/lib/db";
import type { Decimal } from "@prisma/client/runtime/client";

// ----- TYPE DEFINITIONS -----

export interface TransactionQueryParams {
  account_id?: string[];
  category?: string;
  transaction_type?: string;
  start_date?: Date;
  end_date?: Date;
  is_recurring?: boolean;
  search?: string;
  sort_by?: "transaction_date" | "amount" | "category" | "description";
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface TransactionRow {
  transaction_id: number;
  transaction_date: Date;
  transaction_time: string | null;
  account_id: string;
  account_name: string;
  account_type: string;
  account_owner: string;
  description: string;
  category: string;
  subcategory: string | null;
  amount: number;
  transaction_type: string;
  balance_after: number | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionListResult {
  transactions: TransactionRow[];
  total_count: number;
  limit: number;
  offset: number;
}

// ----- PURE FUNCTIONS FOR SQL GENERATION -----

/**
 * Escape special characters in a string for SQL LIKE clauses
 * Prevents SQL injection by escaping single quotes
 */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Format a date to ISO date string (YYYY-MM-DD) for SQL Server
 */
function formatDateForSql(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Build SQL WHERE clause from filter parameters
 * Returns a string with conditions joined by AND
 */
export function buildTransactionWhereClause(params: TransactionQueryParams): string {
  const conditions: string[] = ["1=1"];

  // Filter by account_id(s)
  if (params.account_id && params.account_id.length > 0) {
    const escapedIds = params.account_id.map((id) => `'${escapeSqlString(id)}'`);
    conditions.push(`account_id IN (${escapedIds.join(", ")})`);
  }

  // Filter by category
  if (params.category) {
    conditions.push(`category = '${escapeSqlString(params.category)}'`);
  }

  // Filter by transaction_type
  if (params.transaction_type) {
    conditions.push(`transaction_type = '${escapeSqlString(params.transaction_type)}'`);
  }

  // Filter by start_date
  if (params.start_date) {
    conditions.push(`transaction_date >= '${formatDateForSql(params.start_date)}'`);
  }

  // Filter by end_date
  if (params.end_date) {
    conditions.push(`transaction_date <= '${formatDateForSql(params.end_date)}'`);
  }

  // Filter by is_recurring
  if (params.is_recurring !== undefined) {
    conditions.push(`is_recurring = ${params.is_recurring ? 1 : 0}`);
  }

  // Search in description and category
  if (params.search && params.search.trim() !== "") {
    const searchTerm = escapeSqlString(params.search.trim());
    conditions.push(
      `(description LIKE '%${searchTerm}%' OR category LIKE '%${searchTerm}%')`
    );
  }

  return conditions.join(" AND ");
}

/**
 * Build SQL ORDER BY clause for transaction queries
 * Includes secondary sort by transaction_id for stable pagination
 */
export function buildTransactionOrderBy(
  sortBy: "transaction_date" | "amount" | "category" | "description" = "transaction_date",
  sortOrder: "asc" | "desc" = "desc"
): string {
  const order = sortOrder.toUpperCase();
  return `${sortBy} ${order}, transaction_id ${order}`;
}

// ----- DATABASE QUERY FUNCTIONS -----

interface RawTransactionRow {
  transaction_id: string;
  transaction_date: Date;
  transaction_time: Date | null;
  account_id: string;
  account_name: string;
  account_type: string;
  account_owner: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  amount: Decimal;
  transaction_type: string;
  balance_after: Decimal | null;
  is_recurring: boolean | null;
  recurring_frequency: string | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface CountResult {
  total: number;
}

/**
 * Get paginated list of transactions with filters and sorting
 */
export async function getTransactionList(
  params: TransactionQueryParams
): Promise<TransactionListResult> {
  const whereClause = buildTransactionWhereClause(params);
  const orderBy = buildTransactionOrderBy(params.sort_by, params.sort_order);
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;

  // Get total count (for pagination info)
  const countResult = await prisma.$queryRawUnsafe<CountResult[]>(`
    SELECT COUNT(*) as total
    FROM transactions
    WHERE ${whereClause}
  `);
  const totalCount = Number(countResult[0]?.total ?? 0);

  // Get paginated transactions
  const rawRows = await prisma.$queryRawUnsafe<RawTransactionRow[]>(`
    SELECT
      transaction_id,
      transaction_date,
      transaction_time,
      account_id,
      account_name,
      account_type,
      account_owner,
      description,
      category,
      subcategory,
      amount,
      transaction_type,
      balance_after,
      is_recurring,
      recurring_frequency,
      notes,
      created_at,
      updated_at
    FROM transactions
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    OFFSET ${offset} ROWS
    FETCH NEXT ${limit} ROWS ONLY
  `);

  // Transform raw rows to TransactionRow type
  const transactions: TransactionRow[] = rawRows.map((row) => ({
    transaction_id: parseInt(row.transaction_id, 10),
    transaction_date: row.transaction_date,
    transaction_time: row.transaction_time
      ? row.transaction_time.toISOString().split("T")[1].split(".")[0]
      : null,
    account_id: row.account_id,
    account_name: row.account_name,
    account_type: row.account_type,
    account_owner: row.account_owner,
    description: row.description ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory,
    amount: Number(row.amount),
    transaction_type: row.transaction_type,
    balance_after: row.balance_after !== null ? Number(row.balance_after) : null,
    is_recurring: row.is_recurring ?? false,
    recurring_frequency: row.recurring_frequency,
    notes: row.notes,
    created_at: row.created_at ?? new Date(),
    updated_at: row.updated_at ?? new Date(),
  }));

  return {
    transactions,
    total_count: totalCount,
    limit,
    offset,
  };
}

/**
 * Get all transactions matching filters (for CSV export, no pagination)
 */
export async function getTransactionsForExport(
  params: Omit<TransactionQueryParams, "limit" | "offset" | "sort_by" | "sort_order">
): Promise<TransactionRow[]> {
  const whereClause = buildTransactionWhereClause(params);

  const rawRows = await prisma.$queryRawUnsafe<RawTransactionRow[]>(`
    SELECT
      transaction_id,
      transaction_date,
      transaction_time,
      account_id,
      account_name,
      account_type,
      account_owner,
      description,
      category,
      subcategory,
      amount,
      transaction_type,
      balance_after,
      is_recurring,
      recurring_frequency,
      notes,
      created_at,
      updated_at
    FROM transactions
    WHERE ${whereClause}
    ORDER BY transaction_date DESC, transaction_id DESC
  `);

  return rawRows.map((row) => ({
    transaction_id: parseInt(row.transaction_id, 10),
    transaction_date: row.transaction_date,
    transaction_time: row.transaction_time
      ? row.transaction_time.toISOString().split("T")[1].split(".")[0]
      : null,
    account_id: row.account_id,
    account_name: row.account_name,
    account_type: row.account_type,
    account_owner: row.account_owner,
    description: row.description ?? "",
    category: row.category ?? "",
    subcategory: row.subcategory,
    amount: Number(row.amount),
    transaction_type: row.transaction_type,
    balance_after: row.balance_after !== null ? Number(row.balance_after) : null,
    is_recurring: row.is_recurring ?? false,
    recurring_frequency: row.recurring_frequency,
    notes: row.notes,
    created_at: row.created_at ?? new Date(),
    updated_at: row.updated_at ?? new Date(),
  }));
}
