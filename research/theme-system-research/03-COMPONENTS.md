# Component Integration Guide

This guide covers how to apply the Cemdash Theme System to shadcn/ui components, custom components, and common UI patterns.

---

## shadcn/ui Integration

shadcn/ui natively supports CSS variables. After setting up the theme system, components automatically respond to theme changes with minimal configuration.

### Update shadcn/ui CSS Variables

Modify the shadcn/ui base styles in your `globals.css` to use Cemdash variables:

```css
@layer base {
  :root {
    /* shadcn/ui variable mapping to Cemdash tokens */
    --background: var(--color-bg-page);
    --foreground: var(--color-text-primary);
    
    --card: var(--color-bg-primary);
    --card-foreground: var(--color-text-primary);
    
    --popover: var(--color-bg-primary);
    --popover-foreground: var(--color-text-primary);
    
    --primary: var(--color-accent-coral);
    --primary-foreground: var(--color-text-inverse);
    
    --secondary: var(--color-bg-tertiary);
    --secondary-foreground: var(--color-text-secondary);
    
    --muted: var(--color-bg-secondary);
    --muted-foreground: var(--color-text-muted);
    
    --accent: var(--color-bg-hover);
    --accent-foreground: var(--color-text-primary);
    
    --destructive: var(--color-negative);
    --destructive-foreground: var(--color-text-inverse);
    
    --border: var(--color-border-default);
    --input: var(--color-border-default);
    --ring: var(--color-accent-coral);
    
    --radius: var(--radius-md);
  }

  .dark {
    /* Dark theme inherits the same mappings - 
       values change via Cemdash CSS variables */
  }
}
```

---

## KPI Card Component

The flagship component showcasing theme-aware styling with glow effects.

### `src/components/dashboard/KPICard.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type KPIVariant = 'coral' | 'teal' | 'mint' | 'purple' | 'neutral';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: KPIVariant;
  subtitle?: string;
  className?: string;
}

const variantStyles: Record<KPIVariant, string> = {
  coral: `
    border-accent-coral/50 
    dark:shadow-glow-coral 
    dark:border-accent-coral/30
    before:bg-gradient-to-r before:from-accent-coral before:to-accent-coral/50
  `,
  teal: `
    border-accent-teal/50 
    dark:shadow-glow-teal 
    dark:border-accent-teal/30
    before:bg-gradient-to-r before:from-accent-teal before:to-accent-cyan
  `,
  mint: `
    border-accent-mint/50 
    dark:shadow-glow-mint 
    dark:border-accent-mint/30
    before:bg-gradient-to-r before:from-accent-mint before:to-accent-mint/50
  `,
  purple: `
    border-purple-500/50 
    dark:shadow-[0_0_20px_rgba(139,92,246,0.4)] 
    dark:border-purple-500/30
    before:bg-gradient-to-r before:from-purple-500 before:to-purple-400
  `,
  neutral: `
    border-border 
    dark:border-border-emphasis
  `,
};

export function KPICard({
  label,
  value,
  icon,
  trend,
  variant = 'neutral',
  subtitle,
  className,
}: KPICardProps) {
  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
      ? TrendingDown 
      : Minus;

  const trendColor = trend?.direction === 'up'
    ? 'text-positive'
    : trend?.direction === 'down'
      ? 'text-negative'
      : 'text-text-muted';

  return (
    <div
      className={cn(
        // Base styles
        'relative rounded-lg border-2 bg-bg-secondary p-5',
        'transition-all duration-200',
        // Hover effect
        'hover:shadow-lg dark:hover:shadow-xl',
        // Gradient border effect (top edge)
        'before:absolute before:inset-x-0 before:top-0 before:h-[2px]',
        'before:rounded-t-lg',
        // Variant-specific styles
        variantStyles[variant],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        {icon && (
          <span className="text-text-muted">{icon}</span>
        )}
      </div>

      {/* Value */}
      <div className="mt-2">
        <span className="text-3xl font-bold text-text-primary">
          {typeof value === 'number' 
            ? value.toLocaleString('en-US', { 
                style: 'currency', 
                currency: 'USD',
                minimumFractionDigits: 2,
              })
            : value
          }
        </span>
      </div>

      {/* Trend & Subtitle */}
      <div className="mt-2 flex items-center gap-2">
        {trend && (
          <div className={cn('flex items-center gap-1 text-sm font-medium', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
        {subtitle && (
          <span className="text-xs text-text-muted">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
```

### Usage

```tsx
<KPICard
  label="Net Cash Flow"
  value={123877.32}
  variant="coral"
  icon={<DollarSign className="h-5 w-5" />}
  trend={{ value: 12.5, direction: 'up' }}
/>

<KPICard
  label="Total Balance"
  value={197143.34}
  variant="teal"
  icon={<Wallet className="h-5 w-5" />}
/>
```

---

## Sidebar Navigation

Theme-aware sidebar with active states and hover effects.

### `src/components/layout/Sidebar.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PiggyBank,
  Calendar,
  Settings,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Accounts', href: '/accounts', icon: PiggyBank },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-screen w-64 flex-col',
        'bg-bg-primary border-r border-border-subtle',
        'transition-colors duration-200',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border-subtle px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-coral">
          <span className="text-lg font-bold text-white">C</span>
        </div>
        <span className="text-lg font-semibold text-text-primary">
          Cemdash
        </span>
      </div>

      {/* Time Period Selector */}
      <div className="border-b border-border-subtle p-4">
        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-tertiary">
          Time Period
        </span>
        <div className="space-y-1">
          {['This Year', 'Last Month', 'Last 3 Months'].map((period) => (
            <button
              key={period}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left text-sm',
                'border border-transparent',
                'transition-colors duration-150',
                'hover:bg-bg-hover hover:border-border-subtle',
                period === 'This Year' && 
                  'bg-bg-hover border-accent-coral text-text-primary'
              )}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                'transition-colors duration-150',
                isActive
                  ? 'bg-accent-coral/10 text-accent-coral dark:bg-accent-coral/20'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
```

---

## Data Table Styling

TanStack Table with theme-aware row states.

### `src/components/tables/DataTable.tsx`

```typescript
'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className={cn('rounded-lg border border-border bg-bg-secondary', className)}>
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider',
                    'text-text-tertiary bg-bg-tertiary',
                    header.column.getCanSort() && 'cursor-pointer select-none hover:text-text-primary'
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && (
                      <ChevronUp className="h-4 w-4" />
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border-subtle last:border-0',
                'transition-colors duration-150',
                'hover:bg-bg-hover',
                index % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-primary'
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 text-sm text-text-secondary"
                >
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

## Amount Display Component

Semantic coloring for financial values.

### `src/components/ui/Amount.tsx`

```typescript
import { cn } from '@/lib/utils';

interface AmountProps {
  value: number;
  className?: string;
  showSign?: boolean;
  currency?: string;
}

export function Amount({ 
  value, 
  className, 
  showSign = true,
  currency = 'USD' 
}: AmountProps) {
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
        !isPositive && !isNegative && 'text-text-secondary',
        className
      )}
    >
      {showSign && isPositive && '+'}
      {isNegative && '-'}
      {formatted}
    </span>
  );
}
```

---

## Category Badge Component

Color-coded badges using theme category colors.

### `src/components/ui/CategoryBadge.tsx`

```typescript
import { cn } from '@/lib/utils';

type Category = 
  | 'charity' | 'daily' | 'dining' | 'entertainment' 
  | 'gifts' | 'groceries' | 'healthcare' | 'financing'
  | 'shopping' | 'subscriptions' | 'transportation' 
  | 'travel' | 'utilities';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
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
};

const categoryLabels: Record<Category, string> = {
  charity: 'Charity',
  daily: 'Daily',
  dining: 'Dining',
  entertainment: 'Entertainment',
  gifts: 'Gifts',
  groceries: 'Groceries',
  healthcare: 'Healthcare',
  financing: 'Financing',
  shopping: 'Shopping',
  subscriptions: 'Subscriptions',
  transportation: 'Transportation',
  travel: 'Travel',
  utilities: 'Utilities',
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium border',
        categoryStyles[category],
        className
      )}
    >
      {categoryLabels[category]}
    </span>
  );
}
```

---

## Card Component Variants

Extended card component with theme variants.

### `src/components/ui/ThemedCard.tsx`

```typescript
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ThemedCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-bg-secondary border border-border-subtle',
  elevated: 'bg-bg-secondary shadow-lg dark:shadow-xl border border-border-subtle',
  outlined: 'bg-transparent border-2 border-border',
  glass: 'bg-bg-primary/80 backdrop-blur-md border border-border-subtle/50',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function ThemedCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
}: ThemedCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg transition-colors duration-200',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
```

---

## Button Variants

Extended button styles with theme integration.

### `src/components/ui/ThemedButton.tsx`

```typescript
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ThemedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: cn(
    'bg-accent-coral text-text-inverse',
    'hover:bg-accent-coral-hover',
    'dark:shadow-glow-coral dark:hover:shadow-[0_0_30px_rgba(249,112,102,0.6)]'
  ),
  secondary: cn(
    'bg-bg-tertiary text-text-primary',
    'hover:bg-bg-hover',
    'border border-border'
  ),
  ghost: cn(
    'bg-transparent text-text-secondary',
    'hover:bg-bg-hover hover:text-text-primary'
  ),
  destructive: cn(
    'bg-negative text-text-inverse',
    'hover:bg-red-600'
  ),
  outline: cn(
    'bg-transparent text-text-primary',
    'border border-border',
    'hover:bg-bg-hover hover:border-border-emphasis'
  ),
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const ThemedButton = forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-accent-coral focus:ring-offset-2',
          'focus:ring-offset-bg-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

ThemedButton.displayName = 'ThemedButton';
```

---

## Empty State Component

### `src/components/ui/EmptyState.tsx`

```typescript
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        'rounded-lg border-2 border-dashed border-border',
        'bg-bg-primary/50',
        className
      )}
    >
      <div className="text-text-muted mb-4">
        {icon || <Inbox className="h-12 w-12" />}
      </div>
      <h3 className="text-base font-medium text-text-secondary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-tertiary text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
```

---

## Loading Skeleton

Theme-aware skeleton with shimmer effect.

### `src/components/ui/Skeleton.tsx`

```typescript
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        'bg-bg-tertiary',
        // Shimmer effect
        'relative overflow-hidden',
        'after:absolute after:inset-0',
        'after:translate-x-[-100%]',
        'after:bg-gradient-to-r after:from-transparent after:via-bg-hover/50 after:to-transparent',
        'after:animate-[shimmer_1.5s_infinite]',
        className
      )}
    />
  );
}

// Add this to your tailwind.config.ts under theme.extend.animation:
// shimmer: 'shimmer 1.5s infinite'

// And under theme.extend.keyframes:
// shimmer: {
//   '100%': { transform: 'translateX(100%)' }
// }
```

---

## Next Steps

- **[Chart Theming](./04-CHARTS.md)** - Recharts integration with dynamic colors
- **[Table Theming](./05-TABLES.md)** - Advanced TanStack Table styling
- **[API Reference](./06-API-REFERENCE.md)** - Complete hook and utility documentation
