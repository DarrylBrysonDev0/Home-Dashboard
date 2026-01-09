/**
 * GET /api/export/csv - Export transactions to CSV format
 *
 * User Story 6: View and Manage Transaction Details
 * Contract: specs/001-home-finance-dashboard/contracts/transactions-api.yaml
 */

import { NextRequest, NextResponse } from "next/server";
import { csvExportParamsSchema } from "@/lib/validations/transaction";
import { getTransactionsForExport } from "@/lib/queries/transactions";
import { validationError, handleApiError } from "@/lib/api-errors";

// CSV column headers matching the API contract
const CSV_HEADERS = [
  "transaction_id",
  "transaction_date",
  "transaction_time",
  "account_id",
  "account_name",
  "account_type",
  "account_owner",
  "description",
  "category",
  "subcategory",
  "amount",
  "transaction_type",
  "balance_after",
  "is_recurring",
  "recurring_frequency",
  "notes",
];

/**
 * Escape a value for CSV format (RFC 4180)
 * - Values with commas, quotes, or newlines are wrapped in double quotes
 * - Embedded double quotes are escaped by doubling them
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const strValue = String(value);

  // Check if value needs quoting
  if (
    strValue.includes(",") ||
    strValue.includes('"') ||
    strValue.includes("\n") ||
    strValue.includes("\r")
  ) {
    // Escape double quotes by doubling them
    const escaped = strValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return strValue;
}

/**
 * Format a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Generate filename with date range
 */
function generateFilename(startDate?: Date, endDate?: Date): string {
  const today = formatDate(new Date());

  if (startDate && endDate) {
    return `transactions-${formatDate(startDate)}-to-${formatDate(endDate)}.csv`;
  }

  if (startDate) {
    return `transactions-from-${formatDate(startDate)}.csv`;
  }

  if (endDate) {
    return `transactions-to-${formatDate(endDate)}.csv`;
  }

  return `transactions-export-${today}.csv`;
}

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string> = {};

    for (const [key, value] of searchParams.entries()) {
      rawParams[key] = value;
    }

    // Validate query parameters with Zod
    const parseResult = csvExportParamsSchema.safeParse(rawParams);

    if (!parseResult.success) {
      return validationError(parseResult.error);
    }

    const params = parseResult.data;

    // Fetch all transactions matching filters (no pagination for export)
    const transactions = await getTransactionsForExport({
      account_id: params.account_id,
      category: params.category,
      transaction_type: params.transaction_type,
      start_date: params.start_date,
      end_date: params.end_date,
    });

    // Build CSV content
    const csvRows: string[] = [];

    // Header row
    csvRows.push(CSV_HEADERS.join(","));

    // Data rows
    for (const txn of transactions) {
      const row = [
        escapeCsvValue(txn.transaction_id),
        escapeCsvValue(formatDate(txn.transaction_date)),
        escapeCsvValue(txn.transaction_time),
        escapeCsvValue(txn.account_id),
        escapeCsvValue(txn.account_name),
        escapeCsvValue(txn.account_type),
        escapeCsvValue(txn.account_owner),
        escapeCsvValue(txn.description),
        escapeCsvValue(txn.category),
        escapeCsvValue(txn.subcategory),
        escapeCsvValue(txn.amount),
        escapeCsvValue(txn.transaction_type),
        escapeCsvValue(txn.balance_after),
        escapeCsvValue(txn.is_recurring),
        escapeCsvValue(txn.recurring_frequency),
        escapeCsvValue(txn.notes),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n");
    const filename = generateFilename(params.start_date, params.end_date);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "export transactions to CSV", { context: "CSV Export API" });
  }
}
