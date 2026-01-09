/**
 * CSV Export Utility
 *
 * User Story 6: View and Manage Transaction Details
 *
 * Provides client-side functionality to trigger CSV downloads
 * from the /api/export/csv endpoint.
 */

import { format } from "date-fns";

/**
 * Export filter parameters
 */
export interface CsvExportParams {
  /** Start date for filtering transactions */
  startDate?: Date;
  /** End date for filtering transactions */
  endDate?: Date;
  /** Account IDs to filter by */
  accountIds?: string[];
  /** Category to filter by */
  category?: string;
  /** Transaction type to filter by */
  transactionType?: "Income" | "Expense" | "Transfer";
}

/**
 * Build the export API URL with query parameters
 */
function buildExportUrl(params: CsvExportParams): string {
  const searchParams = new URLSearchParams();

  if (params.startDate) {
    searchParams.set("start_date", format(params.startDate, "yyyy-MM-dd"));
  }

  if (params.endDate) {
    searchParams.set("end_date", format(params.endDate, "yyyy-MM-dd"));
  }

  if (params.accountIds && params.accountIds.length > 0) {
    searchParams.set("account_id", params.accountIds.join(","));
  }

  if (params.category) {
    searchParams.set("category", params.category);
  }

  if (params.transactionType) {
    searchParams.set("transaction_type", params.transactionType);
  }

  const queryString = searchParams.toString();
  return `/api/export/csv${queryString ? `?${queryString}` : ""}`;
}

/**
 * Extract filename from Content-Disposition header
 */
function extractFilename(contentDisposition: string | null): string {
  if (!contentDisposition) {
    return `transactions-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
  }

  // Match filename="..." or filename=...
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (filenameMatch && filenameMatch[1]) {
    // Remove quotes if present
    return filenameMatch[1].replace(/['"]/g, "");
  }

  return `transactions-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
}

/**
 * Download transactions as CSV
 *
 * Fetches CSV data from the export API endpoint and triggers
 * a file download in the browser.
 *
 * @param params - Filter parameters for the export
 * @throws Error if the fetch fails or response is not OK
 *
 * @example
 * ```tsx
 * // Export all transactions in date range
 * await downloadCsv({
 *   startDate: new Date("2024-01-01"),
 *   endDate: new Date("2024-12-31"),
 * });
 *
 * // Export filtered transactions
 * await downloadCsv({
 *   startDate: new Date("2024-01-01"),
 *   endDate: new Date("2024-12-31"),
 *   accountIds: ["ACC-JOINT-CHK"],
 *   category: "Dining",
 * });
 * ```
 */
export async function downloadCsv(params: CsvExportParams = {}): Promise<void> {
  const url = buildExportUrl(params);

  const response = await fetch(url);

  if (!response.ok) {
    // Try to get error message from JSON response
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Export failed (${response.status})`);
    }
    throw new Error(`Export failed (${response.status})`);
  }

  // Get the CSV content as a blob
  const blob = await response.blob();

  // Extract filename from response headers
  const contentDisposition = response.headers.get("content-disposition");
  const filename = extractFilename(contentDisposition);

  // Create a temporary URL for the blob
  const blobUrl = URL.createObjectURL(blob);

  // Create a temporary anchor element and trigger download
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.style.display = "none";

  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  URL.revokeObjectURL(blobUrl);
}

/**
 * Generate a default export filename based on date range
 */
export function generateExportFilename(
  startDate?: Date,
  endDate?: Date
): string {
  const today = format(new Date(), "yyyy-MM-dd");

  if (startDate && endDate) {
    return `transactions-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
  }

  if (startDate) {
    return `transactions-from-${format(startDate, "yyyy-MM-dd")}.csv`;
  }

  if (endDate) {
    return `transactions-to-${format(endDate, "yyyy-MM-dd")}.csv`;
  }

  return `transactions-export-${today}.csv`;
}
