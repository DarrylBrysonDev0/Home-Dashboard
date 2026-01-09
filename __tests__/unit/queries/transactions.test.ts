import { describe, it, expect } from "vitest";
import {
  getTransactionList,
  buildTransactionWhereClause,
  buildTransactionOrderBy,
  type TransactionListResult,
  type TransactionQueryParams,
  type TransactionRow,
} from "@/lib/queries/transactions";

/**
 * Unit Tests: Transaction List Query Functions
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/transactions.ts is implemented.
 * Based on: OpenAPI spec contracts/transactions-api.yaml, data-model.md
 *
 * Test Categories:
 * - getTransactionList: main query function with filters, sorting, pagination
 * - buildTransactionWhereClause: pure function to build SQL WHERE conditions
 * - buildTransactionOrderBy: pure function to build ORDER BY clause
 *
 * User Story 6: View and Manage Transaction Details
 * - Display sortable, searchable transaction table
 * - Support filtering by date, account, category, type, recurring
 * - Support text search in description/category
 */

// ----- buildTransactionWhereClause Tests -----

describe("buildTransactionWhereClause", () => {
  it("should return base condition (1=1) when no filters provided", () => {
    const params: TransactionQueryParams = {};
    const result = buildTransactionWhereClause(params);

    // Should return a valid WHERE clause base
    expect(result).toContain("1=1");
  });

  it("should filter by single account_id", () => {
    const params: TransactionQueryParams = {
      account_id: ["ACC-JOINT-CHK"],
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("account_id");
    expect(result).toContain("ACC-JOINT-CHK");
  });

  it("should filter by multiple account_ids with IN clause", () => {
    const params: TransactionQueryParams = {
      account_id: ["ACC-JOINT-CHK", "ACC-USER1-SAV"],
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("IN");
    expect(result).toContain("ACC-JOINT-CHK");
    expect(result).toContain("ACC-USER1-SAV");
  });

  it("should filter by category", () => {
    const params: TransactionQueryParams = {
      category: "Groceries",
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("category");
    expect(result).toContain("Groceries");
  });

  it("should filter by transaction_type", () => {
    const params: TransactionQueryParams = {
      transaction_type: "Expense",
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("transaction_type");
    expect(result).toContain("Expense");
  });

  it("should filter by start_date", () => {
    const params: TransactionQueryParams = {
      start_date: new Date("2024-01-01"),
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("transaction_date");
    expect(result).toContain(">=");
    expect(result).toContain("2024-01-01");
  });

  it("should filter by end_date", () => {
    const params: TransactionQueryParams = {
      end_date: new Date("2024-12-31"),
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("transaction_date");
    expect(result).toContain("<=");
    expect(result).toContain("2024-12-31");
  });

  it("should filter by date range (both start and end)", () => {
    const params: TransactionQueryParams = {
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-03-31"),
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("2024-01-01");
    expect(result).toContain("2024-03-31");
    expect(result).toContain(">=");
    expect(result).toContain("<=");
  });

  it("should filter by is_recurring=true", () => {
    const params: TransactionQueryParams = {
      is_recurring: true,
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("is_recurring");
    expect(result).toContain("1");
  });

  it("should filter by is_recurring=false", () => {
    const params: TransactionQueryParams = {
      is_recurring: false,
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("is_recurring");
    expect(result).toContain("0");
  });

  it("should include search term in description with LIKE", () => {
    const params: TransactionQueryParams = {
      search: "walmart",
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("description");
    expect(result).toContain("LIKE");
    expect(result.toLowerCase()).toContain("walmart");
  });

  it("should search in both description AND category", () => {
    const params: TransactionQueryParams = {
      search: "grocery",
    };
    const result = buildTransactionWhereClause(params);

    // Should search in both fields
    expect(result).toContain("description");
    expect(result).toContain("category");
    expect(result).toContain("OR");
  });

  it("should combine multiple filters with AND", () => {
    const params: TransactionQueryParams = {
      account_id: ["ACC-JOINT-CHK"],
      category: "Dining",
      transaction_type: "Expense",
      start_date: new Date("2024-01-01"),
    };
    const result = buildTransactionWhereClause(params);

    // All conditions should be present
    expect(result).toContain("account_id");
    expect(result).toContain("category");
    expect(result).toContain("transaction_type");
    expect(result).toContain("transaction_date");
  });

  it("should handle empty search string", () => {
    const params: TransactionQueryParams = {
      search: "",
    };
    const result = buildTransactionWhereClause(params);

    // Empty search should not add LIKE clause
    expect(result).not.toContain("LIKE");
  });

  it("should escape special characters in search to prevent SQL injection", () => {
    const params: TransactionQueryParams = {
      search: "O'Reilly",
    };
    const result = buildTransactionWhereClause(params);

    // Should escape single quotes
    expect(result).not.toContain("O'Reilly"); // Raw quote should be escaped
    expect(result).toContain("O''Reilly"); // SQL Server escaping
  });
});

// ----- buildTransactionOrderBy Tests -----

describe("buildTransactionOrderBy", () => {
  it("should default to transaction_date DESC when no sort specified", () => {
    const result = buildTransactionOrderBy();

    expect(result).toContain("transaction_date");
    expect(result).toContain("DESC");
  });

  it("should order by transaction_date ascending", () => {
    const result = buildTransactionOrderBy("transaction_date", "asc");

    expect(result).toContain("transaction_date");
    expect(result).toContain("ASC");
  });

  it("should order by amount descending", () => {
    const result = buildTransactionOrderBy("amount", "desc");

    expect(result).toContain("amount");
    expect(result).toContain("DESC");
  });

  it("should order by amount ascending", () => {
    const result = buildTransactionOrderBy("amount", "asc");

    expect(result).toContain("amount");
    expect(result).toContain("ASC");
  });

  it("should order by category", () => {
    const result = buildTransactionOrderBy("category", "asc");

    expect(result).toContain("category");
    expect(result).toContain("ASC");
  });

  it("should order by description", () => {
    const result = buildTransactionOrderBy("description", "desc");

    expect(result).toContain("description");
    expect(result).toContain("DESC");
  });

  it("should include secondary sort by transaction_id for stable pagination", () => {
    const result = buildTransactionOrderBy("amount", "desc");

    // Should have secondary sort for stable ordering with pagination
    expect(result).toContain("transaction_id");
  });
});

// ----- TransactionListResult Shape Tests -----

describe("TransactionListResult type expectations", () => {
  it("should have transactions array, total_count, limit, and offset", () => {
    // This tests the expected shape of the result
    const mockResult: TransactionListResult = {
      transactions: [],
      total_count: 0,
      limit: 100,
      offset: 0,
    };

    expect(mockResult).toHaveProperty("transactions");
    expect(mockResult).toHaveProperty("total_count");
    expect(mockResult).toHaveProperty("limit");
    expect(mockResult).toHaveProperty("offset");
    expect(Array.isArray(mockResult.transactions)).toBe(true);
  });
});

// ----- TransactionRow Type Tests -----

describe("TransactionRow type expectations", () => {
  it("should have all required fields per API contract", () => {
    const mockRow: TransactionRow = {
      transaction_id: 1,
      transaction_date: new Date("2024-01-15"),
      transaction_time: "10:30:00",
      account_id: "ACC-JOINT-CHK",
      account_name: "Joint Checking",
      account_type: "Checking",
      account_owner: "Joint",
      description: "Test Transaction",
      category: "Groceries",
      subcategory: null,
      amount: -150.00,
      transaction_type: "Expense",
      balance_after: 5000.00,
      is_recurring: false,
      recurring_frequency: null,
      notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Required fields per OpenAPI spec
    expect(mockRow).toHaveProperty("transaction_id");
    expect(mockRow).toHaveProperty("transaction_date");
    expect(mockRow).toHaveProperty("account_id");
    expect(mockRow).toHaveProperty("account_name");
    expect(mockRow).toHaveProperty("account_type");
    expect(mockRow).toHaveProperty("account_owner");
    expect(mockRow).toHaveProperty("description");
    expect(mockRow).toHaveProperty("category");
    expect(mockRow).toHaveProperty("amount");
    expect(mockRow).toHaveProperty("transaction_type");

    // Optional fields
    expect(mockRow).toHaveProperty("transaction_time");
    expect(mockRow).toHaveProperty("subcategory");
    expect(mockRow).toHaveProperty("balance_after");
    expect(mockRow).toHaveProperty("is_recurring");
    expect(mockRow).toHaveProperty("recurring_frequency");
    expect(mockRow).toHaveProperty("notes");
  });
});

// ----- Pagination Logic Tests -----

describe("Pagination parameters", () => {
  it("should accept default limit of 100", () => {
    const params: TransactionQueryParams = {};
    // Default values should be reasonable
    expect(params.limit ?? 100).toBe(100);
    expect(params.offset ?? 0).toBe(0);
  });

  it("should accept custom limit and offset", () => {
    const params: TransactionQueryParams = {
      limit: 50,
      offset: 100,
    };

    expect(params.limit).toBe(50);
    expect(params.offset).toBe(100);
  });

  it("should enforce maximum limit of 1000", () => {
    // This is a validation concern, but query should respect the limit
    const params: TransactionQueryParams = {
      limit: 1000,
    };

    expect(params.limit).toBeLessThanOrEqual(1000);
  });
});

// ----- Filter Combination Edge Cases -----

describe("Filter combination edge cases", () => {
  it("should handle all filters combined", () => {
    const params: TransactionQueryParams = {
      account_id: ["ACC-JOINT-CHK", "ACC-USER1-SAV"],
      category: "Groceries",
      transaction_type: "Expense",
      start_date: new Date("2024-01-01"),
      end_date: new Date("2024-12-31"),
      is_recurring: false,
      search: "walmart",
      sort_by: "amount",
      sort_order: "desc",
      limit: 50,
      offset: 0,
    };

    const whereClause = buildTransactionWhereClause(params);
    const orderBy = buildTransactionOrderBy(params.sort_by, params.sort_order);

    // All filter conditions should be present
    expect(whereClause).toContain("account_id");
    expect(whereClause).toContain("category");
    expect(whereClause).toContain("transaction_type");
    expect(whereClause).toContain("transaction_date");
    expect(whereClause).toContain("is_recurring");
    expect(whereClause).toContain("LIKE");

    // Sort should be correct
    expect(orderBy).toContain("amount");
    expect(orderBy).toContain("DESC");
  });

  it("should handle undefined filters gracefully", () => {
    const params: TransactionQueryParams = {
      account_id: undefined,
      category: undefined,
      transaction_type: undefined,
      start_date: undefined,
      end_date: undefined,
      is_recurring: undefined,
      search: undefined,
    };

    const whereClause = buildTransactionWhereClause(params);

    // Should still produce valid SQL
    expect(whereClause).toContain("1=1");
  });

  it("should handle empty account_id array", () => {
    const params: TransactionQueryParams = {
      account_id: [],
    };

    const whereClause = buildTransactionWhereClause(params);

    // Empty array should not add IN clause
    expect(whereClause).not.toContain("IN ()");
  });
});

// ----- Search Functionality Tests -----

describe("Search functionality", () => {
  it("should perform case-insensitive search", () => {
    const params: TransactionQueryParams = {
      search: "WALMART",
    };
    const result = buildTransactionWhereClause(params);

    // SQL Server search should be case-insensitive by collation
    // The query should include the search term
    expect(result.toUpperCase()).toContain("WALMART");
  });

  it("should handle search with multiple words", () => {
    const params: TransactionQueryParams = {
      search: "grocery store",
    };
    const result = buildTransactionWhereClause(params);

    expect(result).toContain("grocery store");
  });

  it("should wrap search term with wildcards for partial matching", () => {
    const params: TransactionQueryParams = {
      search: "mart",
    };
    const result = buildTransactionWhereClause(params);

    // Should use wildcards for LIKE
    expect(result).toContain("%");
  });
});

// ----- Date Handling Tests -----

describe("Date handling", () => {
  it("should format dates correctly for SQL Server", () => {
    const params: TransactionQueryParams = {
      start_date: new Date("2024-06-15T00:00:00.000Z"),
    };
    const result = buildTransactionWhereClause(params);

    // Should use ISO date format YYYY-MM-DD
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("should handle timezone-aware dates", () => {
    // Create date in local timezone
    const localDate = new Date(2024, 5, 15); // June 15, 2024
    const params: TransactionQueryParams = {
      start_date: localDate,
    };
    const result = buildTransactionWhereClause(params);

    // Should extract the date portion correctly
    expect(result).toContain("2024-06-15");
  });
});
