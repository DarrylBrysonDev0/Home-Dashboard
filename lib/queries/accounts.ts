/**
 * Account query helpers
 * Accounts are derived from the transactions table - not stored as separate entities
 */

import { prisma } from "@/lib/db";
import type { Decimal } from "@prisma/client/runtime/client";

export interface Account {
  account_id: string;
  account_name: string;
  account_type: string;
  account_owner: string;
  current_balance: number;
  last_transaction_date: Date | null;
}

/**
 * Get all distinct accounts with their current balance
 * Current balance is derived from the most recent transaction's balance_after
 */
export async function getAccounts(): Promise<Account[]> {
  // Get distinct accounts with their most recent transaction info
  // We use a raw query for performance - this avoids N+1 queries
  const accounts = await prisma.$queryRaw<
    Array<{
      account_id: string;
      account_name: string;
      account_type: string;
      account_owner: string;
      current_balance: Decimal | null;
      last_transaction_date: Date | null;
    }>
  >`
    SELECT
      t.account_id,
      t.account_name,
      t.account_type,
      t.account_owner,
      t.balance_after AS current_balance,
      t.transaction_date AS last_transaction_date
    FROM transactions t
    INNER JOIN (
      SELECT
        account_id,
        MAX(transaction_date) AS max_date
      FROM transactions
      GROUP BY account_id
    ) latest ON t.account_id = latest.account_id
      AND t.transaction_date = latest.max_date
    ORDER BY t.account_name
  `;

  return accounts.map((a) => ({
    account_id: a.account_id,
    account_name: a.account_name,
    account_type: a.account_type,
    account_owner: a.account_owner,
    current_balance: a.current_balance ? Number(a.current_balance) : 0,
    last_transaction_date: a.last_transaction_date,
  }));
}

/**
 * Get accounts filtered by account IDs
 */
export async function getAccountsByIds(
  accountIds: string[]
): Promise<Account[]> {
  if (accountIds.length === 0) {
    return getAccounts();
  }

  const accounts = await prisma.$queryRaw<
    Array<{
      account_id: string;
      account_name: string;
      account_type: string;
      account_owner: string;
      current_balance: Decimal | null;
      last_transaction_date: Date | null;
    }>
  >`
    SELECT
      t.account_id,
      t.account_name,
      t.account_type,
      t.account_owner,
      t.balance_after AS current_balance,
      t.transaction_date AS last_transaction_date
    FROM transactions t
    INNER JOIN (
      SELECT
        account_id,
        MAX(transaction_date) AS max_date
      FROM transactions
      WHERE account_id IN (${accountIds.join(",")})
      GROUP BY account_id
    ) latest ON t.account_id = latest.account_id
      AND t.transaction_date = latest.max_date
    ORDER BY t.account_name
  `;

  return accounts.map((a) => ({
    account_id: a.account_id,
    account_name: a.account_name,
    account_type: a.account_type,
    account_owner: a.account_owner,
    current_balance: a.current_balance ? Number(a.current_balance) : 0,
    last_transaction_date: a.last_transaction_date,
  }));
}

/**
 * Get total balance across all accounts or filtered accounts
 */
export async function getTotalBalance(accountIds?: string[]): Promise<number> {
  const accounts = accountIds?.length
    ? await getAccountsByIds(accountIds)
    : await getAccounts();

  return accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
}
