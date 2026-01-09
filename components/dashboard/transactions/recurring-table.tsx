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
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NoData } from "@/components/dashboard/empty-states/no-data";
import { ConfidenceBadge } from "@/components/dashboard/confidence-badge";
import { useFilters } from "@/lib/contexts/filter-context";
import type { ConfidenceLevel } from "@/lib/validations/analytics";
import type { RecurringFrequency } from "@/lib/validations/filters";

/**
 * Recurring pattern row data structure matching API response
 */
export interface RecurringPatternRow {
  pattern_id: number;
  description_pattern: string;
  account_id: string;
  category: string;
  avg_amount: number;
  frequency: RecurringFrequency;
  next_expected_date: string;
  confidence_level: ConfidenceLevel;
  confidence_score: number;
  occurrence_count: number;
  last_occurrence_date: string;
  is_confirmed: boolean;
  is_rejected: boolean;
}

/**
 * API response structure for recurring patterns
 */
interface RecurringApiResponse {
  data?: {
    recurring_transactions: RecurringPatternRow[];
  };
  error?: string;
}

/**
 * Filter props for recurring pattern fetching
 */
export interface RecurringTableFilterProps {
  accountIds?: string[];
  confidenceLevel?: ConfidenceLevel;
  frequency?: RecurringFrequency;
}

/**
 * Props for the RecurringTable component
 */
export interface RecurringTableProps extends RecurringTableFilterProps {
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
  }).format(Math.abs(value));
}

/**
 * Get the appropriate color class based on amount (expenses are negative)
 */
function getAmountColorClass(amount: number): string {
  if (amount >= 0) {
    return "text-green-600 dark:text-green-400";
  }
  return "text-red-600 dark:text-red-400";
}

/**
 * Frequency badge styling
 */
const FREQUENCY_STYLES: Record<RecurringFrequency, string> = {
  Weekly: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  Biweekly: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
  Monthly: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
};

/**
 * Loading skeleton for the recurring table
 */
function RecurringTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {["Description", "Category", "Amount", "Frequency", "Next Due", "Confidence", "Actions"].map(
                (header) => (
                  <TableHead key={header}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
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
function buildRecurringUrl(filters: RecurringTableFilterProps): string {
  const params = new URLSearchParams();

  if (filters.accountIds && filters.accountIds.length > 0) {
    params.set("account_id", filters.accountIds.join(","));
  }

  if (filters.confidenceLevel) {
    params.set("confidence_level", filters.confidenceLevel);
  }

  if (filters.frequency) {
    params.set("frequency", filters.frequency);
  }

  const queryString = params.toString();
  return `/api/analytics/recurring${queryString ? `?${queryString}` : ""}`;
}

/**
 * Custom hook for fetching recurring pattern data
 */
function useRecurringData(filters: RecurringTableFilterProps) {
  const [data, setData] = useState<RecurringPatternRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = buildRecurringUrl(filters);
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to fetch recurring patterns (${response.status})`
        );
      }

      const json: RecurringApiResponse = await response.json();

      if (json.error) {
        throw new Error(json.error);
      }

      if (!json.data) {
        throw new Error("Invalid response: missing data");
      }

      setData(json.data.recurring_transactions);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Action cell component for confirm/reject buttons
 */
interface ActionCellProps {
  pattern: RecurringPatternRow;
  onConfirm: (patternId: number) => Promise<void>;
  onReject: (patternId: number) => Promise<void>;
  isProcessing: number | null;
}

function ActionCell({ pattern, onConfirm, onReject, isProcessing }: ActionCellProps) {
  const isThisProcessing = isProcessing === pattern.pattern_id;

  if (pattern.is_confirmed) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
        <Check className="h-4 w-4" />
        Confirmed
      </span>
    );
  }

  if (pattern.is_rejected) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm line-through">
        Rejected
      </span>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30"
              onClick={() => onConfirm(pattern.pattern_id)}
              disabled={isThisProcessing}
              aria-label={`Confirm recurring pattern: ${pattern.description_pattern}`}
            >
              {isThisProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confirm this recurring pattern</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
              onClick={() => onReject(pattern.pattern_id)}
              disabled={isThisProcessing}
              aria-label={`Reject recurring pattern: ${pattern.description_pattern}`}
            >
              {isThisProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reject this pattern (not recurring)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * RecurringTable - Display detected recurring transaction patterns
 *
 * User Story 7: Identify Recurring Transactions
 *
 * Features:
 * - Display detected recurring patterns with confidence levels
 * - Confirm/reject actions to refine detection
 * - Sortable by description, amount, frequency, next due date
 * - Color-coded confidence badges (High/Medium/Low)
 * - Next expected date display
 */
export function RecurringTable({
  accountIds,
  confidenceLevel,
  frequency,
  className,
}: RecurringTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "confidence_score", desc: true },
  ]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const filters = useMemo(
    () => ({ accountIds, confidenceLevel, frequency }),
    [accountIds, confidenceLevel, frequency]
  );

  const { data, isLoading, error, refetch } = useRecurringData(filters);

  /**
   * Handle confirming a recurring pattern
   */
  const handleConfirm = useCallback(async (patternId: number) => {
    setProcessingId(patternId);
    try {
      const response = await fetch(`/api/analytics/recurring/${patternId}/confirm`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to confirm pattern");
      }

      // Refetch to update the list
      await refetch();
    } catch (err) {
      console.error("Failed to confirm pattern:", err);
    } finally {
      setProcessingId(null);
    }
  }, [refetch]);

  /**
   * Handle rejecting a recurring pattern
   */
  const handleReject = useCallback(async (patternId: number) => {
    setProcessingId(patternId);
    try {
      const response = await fetch(`/api/analytics/recurring/${patternId}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reject pattern");
      }

      // Refetch to update the list
      await refetch();
    } catch (err) {
      console.error("Failed to reject pattern:", err);
    } finally {
      setProcessingId(null);
    }
  }, [refetch]);

  /**
   * Column definitions for the recurring table
   */
  const columns: ColumnDef<RecurringPatternRow>[] = useMemo(
    () => [
      {
        accessorKey: "description_pattern",
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
          const description = row.getValue("description_pattern") as string;
          return (
            <div className="max-w-[200px]">
              <div className="truncate font-medium" title={description}>
                {description}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.original.occurrence_count} occurrences
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("category")}</span>
        ),
      },
      {
        accessorKey: "avg_amount",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4"
            >
              Avg Amount
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
          const amount = row.getValue("avg_amount") as number;
          return (
            <span className={`font-medium ${getAmountColorClass(amount)}`}>
              {formatCurrency(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "frequency",
        header: "Frequency",
        cell: ({ row }) => {
          const freq = row.getValue("frequency") as RecurringFrequency;
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${FREQUENCY_STYLES[freq]}`}
            >
              {freq}
            </span>
          );
        },
      },
      {
        accessorKey: "next_expected_date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4"
            >
              Next Due
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
          const dateStr = row.getValue("next_expected_date") as string;
          return (
            <span className="text-sm">
              {format(new Date(dateStr), "MMM d, yyyy")}
            </span>
          );
        },
      },
      {
        accessorKey: "confidence_score",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-ml-4"
            >
              Confidence
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
          const level = row.original.confidence_level;
          const score = row.getValue("confidence_score") as number;
          return <ConfidenceBadge level={level} score={score} showScore />;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <ActionCell
            pattern={row.original}
            onConfirm={handleConfirm}
            onReject={handleReject}
            isProcessing={processingId}
          />
        ),
      },
    ],
    [handleConfirm, handleReject, processingId]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <RecurringTableSkeleton />;
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
        role="alert"
      >
        <p className="font-medium">Failed to load recurring patterns</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <NoData
        title="No recurring patterns detected"
        description="The system hasn't detected any recurring transaction patterns yet. Patterns require at least 3 occurrences with regular intervals."
      />
    );
  }

  const confirmedCount = data.filter((p) => p.is_confirmed).length;
  const pendingCount = data.filter((p) => !p.is_confirmed && !p.is_rejected).length;

  return (
    <div className={className}>
      {/* Header with count and refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            {data.length} patterns detected
          </h3>
          <p className="text-xs text-muted-foreground">
            {confirmedCount} confirmed, {pendingCount} pending review
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          aria-label="Refresh recurring patterns"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
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
                <TableRow
                  key={row.id}
                  className={
                    row.original.is_rejected
                      ? "opacity-50"
                      : row.original.is_confirmed
                        ? "bg-green-50/50 dark:bg-green-900/10"
                        : ""
                  }
                >
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
                  No patterns found.
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
 * FilteredRecurringTable - Context-aware recurring table
 *
 * Consumes the FilterContext to automatically fetch and display
 * recurring patterns based on the current filter state.
 *
 * For testing or standalone usage, use RecurringTable with explicit props.
 */
export interface FilteredRecurringTableProps {
  className?: string;
}

export function FilteredRecurringTable({ className }: FilteredRecurringTableProps) {
  const { selectedAccountIds } = useFilters();

  return (
    <RecurringTable
      accountIds={selectedAccountIds.length > 0 ? selectedAccountIds : undefined}
      className={className}
    />
  );
}
