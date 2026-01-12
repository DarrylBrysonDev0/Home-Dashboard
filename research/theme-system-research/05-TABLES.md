# Table Theming Guide

This guide covers how to apply the Cemdash Theme System to TanStack Table for theme-aware data tables.

---

## Overview

TanStack Table is a headless library, meaning it provides logic without styling. This gives us complete control over appearance through CSS and Tailwind classes.

### Theming Strategy

1. **Use CSS variables** - All colors come from theme tokens
2. **Conditional classes** - Apply different styles based on data
3. **Row state styling** - Hover, selected, and zebra striping
4. **Cell formatters** - Semantic colors for amounts and status

---

## Base Table Component

### `src/components/tables/ThemedTable.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface ThemedTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  striped?: boolean;
  compact?: boolean;
}

export function ThemedTable<TData, TValue>({
  columns,
  data,
  className,
  enableSorting = true,
  enableFiltering = false,
  enablePagination = false,
  pageSize = 10,
  striped = true,
  compact = false,
}: ThemedTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
    }),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
      initialState: { pagination: { pageSize } },
    }),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className={cn('w-full', className)}>
      <div className="rounded-lg border border-border bg-bg-secondary overflow-hidden">
        <table className="w-full">
          {/* Header */}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-bg-tertiary"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'text-left text-xs font-medium uppercase tracking-wider',
                        'text-text-tertiary',
                        compact ? 'px-3 py-2' : 'px-4 py-3',
                        canSort && 'cursor-pointer select-none hover:text-text-primary',
                        'transition-colors duration-150'
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <span className="ml-1">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-text-muted"
                >
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border-subtle last:border-0',
                    'transition-colors duration-150',
                    'hover:bg-bg-hover',
                    striped && index % 2 === 1 && 'bg-bg-primary'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'text-sm text-text-secondary',
                        compact ? 'px-3 py-2' : 'px-4 py-3'
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <TablePagination table={table} />
      )}
    </div>
  );
}

// Pagination Component
function TablePagination<TData>({
  table,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-text-tertiary">
        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={cn(
            'rounded-md border border-border px-3 py-1.5 text-sm',
            'bg-bg-primary text-text-secondary',
            'hover:bg-bg-hover hover:border-border-emphasis',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150'
          )}
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={cn(
            'rounded-md border border-border px-3 py-1.5 text-sm',
            'bg-bg-primary text-text-secondary',
            'hover:bg-bg-hover hover:border-border-emphasis',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-150'
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Cell Formatters

Reusable cell renderers with theme-aware styling.

### `src/components/tables/cells/AmountCell.tsx`

```typescript
import { cn } from '@/lib/utils';

interface AmountCellProps {
  value: number;
  showSign?: boolean;
  currency?: string;
}

export function AmountCell({
  value,
  showSign = true,
  currency = 'USD',
}: AmountCellProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const formatted = Math.abs(value).toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });

  return (
    <span
      className={cn(
        'font-medium tabular-nums',
        isPositive && 'text-positive',
        isNegative && 'text-negative',
        !isPositive && !isNegative && 'text-text-secondary'
      )}
    >
      {showSign && isPositive && '+'}
      {isNegative && '-'}
      {formatted}
    </span>
  );
}
```

### `src/components/tables/cells/CategoryCell.tsx`

```typescript
import { cn } from '@/lib/utils';

type Category =
  | 'charity' | 'daily' | 'dining' | 'entertainment'
  | 'gifts' | 'groceries' | 'healthcare' | 'financing'
  | 'shopping' | 'subscriptions' | 'transportation'
  | 'travel' | 'utilities' | 'income' | 'transfer';

interface CategoryCellProps {
  category: string;
}

const categoryStyles: Record<Category, string> = {
  charity: 'bg-category-charity/20 text-category-charity border-category-charity/30',
  daily: 'bg-category-daily/20 text-category-daily border-category-daily/30',
  dining: 'bg-category-dining/20 text-category-dining border-category-dining/30',
  entertainment: 'bg-category-entertainment/20 text-category-entertainment border-category-entertainment/30',
  gifts: 'bg-category-gifts/20 text-category-gifts border-category-gifts/30',
  groceries: 'bg-category-groceries/20 text-category-groceries border-category-groceries/30',
  healthcare: 'bg-category-healthcare/20 text-category-healthcare border-category-healthcare/30',
  financing: 'bg-category-financing/20 text-category-financing border-category-financing/30',
  shopping: 'bg-category-shopping/20 text-category-shopping border-category-shopping/30',
  subscriptions: 'bg-category-subscriptions/20 text-category-subscriptions border-category-subscriptions/30',
  transportation: 'bg-category-transportation/20 text-category-transportation border-category-transportation/30',
  travel: 'bg-category-travel/20 text-category-travel border-category-travel/30',
  utilities: 'bg-category-utilities/20 text-category-utilities border-category-utilities/30',
  income: 'bg-positive/20 text-positive border-positive/30',
  transfer: 'bg-info/20 text-info border-info/30',
};

export function CategoryCell({ category }: CategoryCellProps) {
  const key = category.toLowerCase().replace(/\s+/g, '') as Category;
  const style = categoryStyles[key] || 'bg-bg-tertiary text-text-secondary border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium border',
        style
      )}
    >
      {category}
    </span>
  );
}
```

### `src/components/tables/cells/AccountCell.tsx`

```typescript
import { cn } from '@/lib/utils';

type Account =
  | 'jointChecking' | 'jointSavings'
  | 'user1Checking' | 'user1Savings'
  | 'user2Checking' | 'user2Savings';

interface AccountCellProps {
  account: string;
  accountId?: string;
}

const accountColors: Record<string, string> = {
  'Joint Checking': 'bg-[var(--color-account-joint-checking)]',
  'Joint Savings': 'bg-[var(--color-account-joint-savings)]',
  'User1 Checking': 'bg-[var(--color-account-user1-checking)]',
  'User1 Savings': 'bg-[var(--color-account-user1-savings)]',
  'User2 Checking': 'bg-[var(--color-account-user2-checking)]',
  'User2 Savings': 'bg-[var(--color-account-user2-savings)]',
};

export function AccountCell({ account }: AccountCellProps) {
  const dotColor = accountColors[account] || 'bg-text-muted';

  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-2 w-2 rounded-full', dotColor)} />
      <span className="text-text-secondary">{account}</span>
    </div>
  );
}
```

### `src/components/tables/cells/DateCell.tsx`

```typescript
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface DateCellProps {
  date: string | Date;
  showTime?: boolean;
}

export function DateCell({ date, showTime = false }: DateCellProps) {
  const parsed = typeof date === 'string' ? parseISO(date) : date;

  let dateString: string;
  if (isToday(parsed)) {
    dateString = 'Today';
  } else if (isYesterday(parsed)) {
    dateString = 'Yesterday';
  } else {
    dateString = format(parsed, 'MMM d, yyyy');
  }

  const timeString = showTime ? format(parsed, 'h:mm a') : null;

  return (
    <div className="flex flex-col">
      <span className="text-text-secondary">{dateString}</span>
      {timeString && (
        <span className="text-xs text-text-muted">{timeString}</span>
      )}
    </div>
  );
}
```

### `src/components/tables/cells/StatusCell.tsx`

```typescript
import { cn } from '@/lib/utils';
import { Check, Clock, AlertTriangle, X } from 'lucide-react';

type Status = 'completed' | 'pending' | 'warning' | 'failed';

interface StatusCellProps {
  status: Status;
  label?: string;
}

const statusConfig: Record<Status, { icon: typeof Check; style: string; label: string }> = {
  completed: {
    icon: Check,
    style: 'text-positive bg-positive/10',
    label: 'Completed',
  },
  pending: {
    icon: Clock,
    style: 'text-warning bg-warning/10',
    label: 'Pending',
  },
  warning: {
    icon: AlertTriangle,
    style: 'text-warning bg-warning/10',
    label: 'Warning',
  },
  failed: {
    icon: X,
    style: 'text-negative bg-negative/10',
    label: 'Failed',
  },
};

export function StatusCell({ status, label }: StatusCellProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-1', config.style)}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{label || config.label}</span>
    </div>
  );
}
```

---

## Transactions Table Example

Complete example combining all cell formatters.

### `src/components/tables/TransactionsTable.tsx`

```typescript
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ThemedTable } from './ThemedTable';
import { AmountCell } from './cells/AmountCell';
import { CategoryCell } from './cells/CategoryCell';
import { AccountCell } from './cells/AccountCell';
import { DateCell } from './cells/DateCell';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  isRecurring?: boolean;
}

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <DateCell date={row.original.date} />,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-text-primary">
          {row.original.description}
        </span>
        {row.original.isRecurring && (
          <span className="text-xs text-text-muted">Recurring</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <CategoryCell category={row.original.category} />,
  },
  {
    accessorKey: 'account',
    header: 'Account',
    cell: ({ row }) => <AccountCell account={row.original.account} />,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => <AmountCell value={row.original.amount} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem className="text-negative">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

interface TransactionsTableProps {
  data: Transaction[];
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  return (
    <ThemedTable
      columns={columns}
      data={data}
      enableSorting
      enablePagination
      pageSize={15}
    />
  );
}
```

---

## Recurring Items Table

Specialized table for recurring transactions.

### `src/components/tables/RecurringTable.tsx`

```typescript
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ThemedTable } from './ThemedTable';
import { AmountCell } from './cells/AmountCell';
import { CategoryCell } from './cells/CategoryCell';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface RecurringItem {
  id: string;
  name: string;
  category: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  nextDate: string;
  account: string;
}

const frequencyLabels = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const columns: ColumnDef<RecurringItem>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className="font-medium text-text-primary">
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => <CategoryCell category={row.original.category} />,
  },
  {
    accessorKey: 'frequency',
    header: 'Frequency',
    cell: ({ row }) => (
      <span className="text-text-secondary">
        {frequencyLabels[row.original.frequency]}
      </span>
    ),
  },
  {
    accessorKey: 'nextDate',
    header: 'Next Date',
    cell: ({ row }) => (
      <span className="text-text-secondary">
        {format(new Date(row.original.nextDate), 'MMM d, yyyy')}
      </span>
    ),
  },
  {
    accessorKey: 'account',
    header: 'Account',
    cell: ({ row }) => (
      <span className="text-text-secondary">{row.original.account}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => <AmountCell value={row.original.amount} />,
  },
];

interface RecurringTableProps {
  data: RecurringItem[];
}

export function RecurringTable({ data }: RecurringTableProps) {
  return (
    <ThemedTable
      columns={columns}
      data={data}
      enableSorting
      striped
    />
  );
}
```

---

## Row Selection

Add selectable rows with theme-aware checkboxes.

### `src/components/tables/SelectableTable.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface SelectableTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onSelectionChange?: (selectedRows: TData[]) => void;
}

export function SelectableTable<TData>({
  columns,
  data,
  onSelectionChange,
}: SelectableTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const selectionColumn: ColumnDef<TData> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="border-border data-[state=checked]:bg-accent-coral data-[state=checked]:border-accent-coral"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="border-border data-[state=checked]:bg-accent-coral data-[state=checked]:border-accent-coral"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const table = useReactTable({
    data,
    columns: [selectionColumn, ...columns],
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(rowSelection) 
        : updater;
      setRowSelection(newSelection);
      
      if (onSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map((key) => data[parseInt(key)]);
        onSelectionChange(selectedRows);
      }
    },
    state: { rowSelection },
  });

  return (
    <div className="rounded-lg border border-border bg-bg-secondary overflow-hidden">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-bg-tertiary">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-tertiary"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border-subtle last:border-0',
                'transition-colors duration-150',
                row.getIsSelected()
                  ? 'bg-accent-coral/5 dark:bg-accent-coral/10'
                  : 'hover:bg-bg-hover'
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm text-text-secondary">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Column Visibility Toggle

Allow users to show/hide columns.

### `src/components/tables/ColumnToggle.tsx`

```typescript
'use client';

import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SlidersHorizontal } from 'lucide-react';

interface ColumnToggleProps<TData> {
  table: Table<TData>;
}

export function ColumnToggle<TData>({ table }: ColumnToggleProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-border bg-bg-primary text-text-secondary hover:bg-bg-hover"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-bg-secondary border-border"
      >
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
              className="text-text-secondary hover:bg-bg-hover"
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Dark Mode Table Considerations

### Row Hover States
In dark mode, hover states should be more subtle:

```css
/* Light mode - noticeable hover */
.light tr:hover {
  background-color: var(--color-bg-hover); /* E5E7EB */
}

/* Dark mode - subtle hover */
.dark tr:hover {
  background-color: var(--color-bg-hover); /* 222222 */
}
```

### Selected Row Glow
Add a subtle glow to selected rows in dark mode:

```typescript
className={cn(
  row.getIsSelected() && 'dark:shadow-[inset_0_0_0_1px_rgba(249,112,102,0.3)]'
)}
```

### Border Contrast
Use slightly brighter borders in dark mode for better visibility:

```css
.dark table {
  border-color: var(--color-border-default); /* 333333 */
}

.dark th,
.dark td {
  border-color: var(--color-border-subtle); /* 222222 */
}
```

---

## Next Steps

- **[API Reference](./06-API-REFERENCE.md)** - Complete documentation of all hooks and utilities
