/**
 * GET /api/transactions - List transactions with filters, sorting, and pagination
 *
 * User Story 6: View and Manage Transaction Details
 * Contract: specs/001-home-finance-dashboard/contracts/transactions-api.yaml
 */

import { NextRequest, NextResponse } from "next/server";
import { transactionListParamsSchema } from "@/lib/validations/transaction";
import { getTransactionList } from "@/lib/queries/transactions";

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string> = {};

    for (const [key, value] of searchParams.entries()) {
      rawParams[key] = value;
    }

    // Validate query parameters with Zod
    const parseResult = transactionListParamsSchema.safeParse(rawParams);

    if (!parseResult.success) {
      const errorMessages = parseResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      );
    }

    const params = parseResult.data;

    // Execute query with validated parameters
    const result = await getTransactionList({
      account_id: params.account_id,
      category: params.category,
      transaction_type: params.transaction_type,
      start_date: params.start_date,
      end_date: params.end_date,
      is_recurring: params.is_recurring,
      search: params.search,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
      limit: params.limit,
      offset: params.offset,
    });

    // Format dates for JSON response
    const formattedTransactions = result.transactions.map((txn) => ({
      ...txn,
      transaction_date: txn.transaction_date.toISOString().split("T")[0],
      created_at: txn.created_at.toISOString(),
      updated_at: txn.updated_at.toISOString(),
    }));

    return NextResponse.json({
      data: {
        transactions: formattedTransactions,
        total_count: result.total_count,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
