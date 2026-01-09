/**
 * GET /api/filters/accounts
 *
 * Returns all distinct accounts for filtering purposes.
 * Accounts are derived from the transactions table.
 *
 * Response includes:
 * - account_id: Unique identifier (e.g., "ACC-JOINT-CHK")
 * - account_name: Display name (e.g., "Joint Checking")
 * - account_type: "Checking" or "Savings"
 * - account_owner: Owner designation (Joint, User1, User2)
 * - current_balance: Latest balance from most recent transaction
 * - last_transaction_date: Date of most recent transaction
 * - transaction_count: Total number of transactions in account
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Decimal } from "@prisma/client/runtime/client";
import { handleApiError } from "@/lib/api-errors";

interface AccountWithCount {
  account_id: string;
  account_name: string;
  account_type: string;
  account_owner: string;
  current_balance: number;
  last_transaction_date: string | null;
  transaction_count: number;
}

export async function GET(_request: NextRequest) {
  try {
    // Get distinct accounts with balance, last transaction date, and count
    // Uses a CTE (Common Table Expression) for efficient single-query retrieval
    const accounts = await prisma.$queryRaw<
      Array<{
        account_id: string;
        account_name: string;
        account_type: string;
        account_owner: string;
        current_balance: Decimal | null;
        last_transaction_date: Date | null;
        transaction_count: number;
      }>
    >`
      WITH AccountStats AS (
        SELECT
          account_id,
          COUNT(*) AS transaction_count,
          MAX(transaction_date) AS last_date
        FROM transactions
        GROUP BY account_id
      )
      SELECT
        t.account_id,
        t.account_name,
        t.account_type,
        t.account_owner,
        t.balance_after AS current_balance,
        t.transaction_date AS last_transaction_date,
        stats.transaction_count
      FROM transactions t
      INNER JOIN AccountStats stats
        ON t.account_id = stats.account_id
        AND t.transaction_date = stats.last_date
      ORDER BY t.account_name ASC
    `;

    // Transform to response format
    const formattedAccounts: AccountWithCount[] = accounts.map((a) => ({
      account_id: a.account_id,
      account_name: a.account_name,
      account_type: a.account_type,
      account_owner: a.account_owner,
      current_balance: a.current_balance ? Number(a.current_balance) : 0,
      last_transaction_date: a.last_transaction_date
        ? a.last_transaction_date.toISOString().split("T")[0]
        : null,
      transaction_count: Number(a.transaction_count),
    }));

    return NextResponse.json({
      data: {
        accounts: formattedAccounts,
      },
    });
  } catch (error) {
    return handleApiError(error, "fetch accounts", { context: "Filters/Accounts API" });
  }
}
