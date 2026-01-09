"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NoData } from "@/components/dashboard/empty-states/no-data";
import { useFilters } from "@/lib/contexts/filter-context";
import { downloadCsv } from "@/lib/utils/csv-export";

/**
 * Transaction row data structure matching API response
 */
export interface TransactionRow {
  transaction_id: number;
  transaction_date: string;
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
}

/**
 * API response structure
 */
interface TransactionsApiResponse {
  data?: {
    transactions: TransactionRow[];
    total_count: number;
    limit: number;
    offset: number;
  };
  error?: string;
}

/**
 * Filter props for transaction fetching
 */
export interface TransactionTableFilterProps {
  startDate?: Date;
  endDate?: Date;
  accountIds?: string[];
}

/**
 * Props for the TransactionTable component
 */
export interface TransactionTableProps extends TransactionTableFilterProps {
  className?: string;
}

/**
 * Format currency values
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get the appropriate color class based on transaction type
 */
function getAmountColorClass(transactionType: string): string {
  switch (transactionType) {
    case "Income":
      return "text-green-600 dark:text-green-400";
    case "Expense":
      return "text-red-600 dark:text-red-400";
    case "Transfer":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "";
  }
}

/**
 * Column definitions for the transaction table
 */
const columns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "transaction_date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateStr = row.getValue("transaction_date") as string;
      return format(new Date(dateStr), "MMM d, yyyy");
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Description
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[200px] truncate" title={description}>
          {description}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Category
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      const subcategory = row.original.subcategory;
      return (
        <div>
          <span>{category}</span>
          {subcategory && (
            <span className="text-muted-foreground text-xs ml-1">
              / {subcategory}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "account_name",
    header: "Account",
    cell: ({ row }) => {
      return (
        <div className="max-w-[120px] truncate" title={row.getValue("account_name")}>
          {row.getValue("account_name")}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Amount
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const transactionType = row.original.transaction_type;
      return (
        <span className={`font-medium ${getAmountColorClass(transactionType)}`}>
          {formatCurrency(amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "transaction_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("transaction_type") as string;
      const typeColors: Record<string, string> = {
        Income: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        Expense: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        Transfer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[type] || ""}`}
        >
          {type}
        </span>
      );
    },
  },
];

/**
 * Loading skeleton for the transaction table
 */
function TransactionTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {["Date", "Description", "Category", "Account", "Amount", "Type"].map(
                (header) => (
                  <TableHead key={header}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * Build API URL with query parameters
 */
function buildTransactionsUrl(filters: TransactionTableFilterProps, search?: string): string {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set("start_date", format(filters.startDate, "yyyy-MM-dd"));
  }

  if (filters.endDate) {
    params.set("end_date", format(filters.endDate, "yyyy-MM-dd"));
  }

  if (filters.accountIds && filters.accountIds.length > 0) {
    params.set("account_id", filters.accountIds.join(","));
  }

  if (search && search.trim()) {
    params.set("search", search.trim());
  }

  // Set a high limit to get all transactions for client-side operations
  params.set("limit", "1000");

  const queryString = params.toString();
  return `/api/transactions${queryString ? `?${queryString}` : ""}`;
}

/**
 * Custom hook for fetching transaction data
 */
function useTransactionData(filters: TransactionTableFilterProps) {
  const [data, setData] = useState<TransactionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the account IDs to avoid reference equality issues
  const accountIdsKey = filters.accountIds?.join(",") ?? "";

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildTransactionsUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch transactions (${response.status})`
        );
      }

      const json: TransactionsApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data) {
        throw new Error("Invalid response: missing data");
      }

      setData(json.data.transactions);
      setTotalCount(json.data.total_count);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate?.getTime(), filters.endDate?.getTime(), accountIdsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, totalCount, isLoading, error, refetch: fetchData };
}

/**
 * TransactionTable - Sortable, searchable transaction table with CSV export
 *
 * User Story 6: View and Manage Transaction Details
 *
 * Features:
 * - Column sorting (date, description, category, amount)
 * - Search input for filtering by description or category
 * - Export to CSV functionality
 * - Transaction type badges with color coding
 * - Amount formatting with color based on type (income/expense/transfer)
 */
export function TransactionTable({
  startDate,
  endDate,
  accountIds,
  className,
}: TransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "transaction_date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data, totalCount, isLoading, error } = useTransactionData({
    startDate,
    endDate,
    accountIds,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  /**
   * Handle CSV export
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await downloadCsv({
        startDate,
        endDate,
        accountIds,
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, accountIds]);

  if (isLoading) {
    return <TransactionTableSkeleton />;
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
        role="alert"
      >
        <p className="font-medium">Failed to load transactions</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <NoData
        title="No transactions"
        description="There are no transactions for the selected period and filters."
      />
    );
  }

  const filteredRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div className={className}>
      {/* Toolbar: Search and Export */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
            aria-label="Search transactions"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {globalFilter
              ? `${filteredRowCount} of ${totalCount} transactions`
              : `${totalCount} transactions`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            aria-label="Export transactions to CSV"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * FilteredTransactionTable - Context-aware transaction table
 *
 * Consumes the FilterContext to automatically fetch and display
 * transactions based on the current filter state. Use this component
 * inside the dashboard where FilterProvider is available.
 *
 * For testing or standalone usage, use TransactionTable with explicit props.
 */
export interface FilteredTransactionTableProps {
  className?: string;
}

export function FilteredTransactionTable({ className }: FilteredTransactionTableProps) {
  const { dateRange, selectedAccountIds } = useFilters();

  return (
    <TransactionTable
      startDate={dateRange.start}
      endDate={dateRange.end}
      accountIds={selectedAccountIds.length > 0 ? selectedAccountIds : undefined}
      className={className}
    />
  );
}
