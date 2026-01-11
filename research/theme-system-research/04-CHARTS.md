# Chart Theming Guide

This guide covers how to integrate the Cemdash Theme System with Recharts for dynamic, theme-aware data visualizations.

---

## Overview

Recharts components accept color props directly, so we use the `useChartTheme` hook to provide resolved color values that update when the theme changes.

### Key Principles

1. **Use the hook for all colors** - Never hardcode chart colors
2. **Memoize chart data** - Prevent unnecessary re-renders
3. **Use gradients for depth** - Especially in dark mode
4. **Consistent tooltips** - Theme-aware tooltip styling

---

## Chart Theme Hook

The `useChartTheme` hook (defined in the Implementation Guide) provides all chart-related colors:

```typescript
import { useChartTheme } from '@/lib/theme';

const {
  palette,      // Array of 10 colors for multi-series
  income,       // Color for income/positive values
  expenses,     // Color for expenses/negative values
  categories,   // Object with category-specific colors
  accounts,     // Object with account-specific colors
  grid,         // Grid line color
  axis,         // Axis label color
  tooltip,      // Tooltip styling object
  gradients,    // Gradient definitions for bars
} = useChartTheme();
```

---

## Custom Tooltip Component

A reusable tooltip component that respects theme colors.

### `src/components/charts/ChartTooltip.tsx`

```typescript
'use client';

import { TooltipProps } from 'recharts';
import { useChartTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ChartTooltipProps extends TooltipProps<number, string> {
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => v.toLocaleString(),
  labelFormatter = (l) => l,
}: ChartTooltipProps) {
  const { tooltip } = useChartTheme();

  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border p-3 shadow-xl backdrop-blur-sm"
      style={{
        backgroundColor: tooltip.background,
        borderColor: tooltip.border,
      }}
    >
      <p 
        className="mb-2 text-sm font-semibold"
        style={{ color: tooltip.text }}
      >
        {labelFormatter(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span 
              className="text-xs"
              style={{ color: tooltip.text }}
            >
              {entry.name}:
            </span>
            <span 
              className="text-xs font-medium"
              style={{ color: entry.color }}
            >
              {valueFormatter(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Cash Flow Bar Chart

Grouped bar chart showing income vs expenses by month.

### `src/components/charts/CashFlowChart.tsx`

```typescript
'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useChartTheme } from '@/lib/theme';
import { ChartTooltip } from './ChartTooltip';

interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  height?: number;
}

export function CashFlowChart({ data, height = 400 }: CashFlowChartProps) {
  const { income, expenses, grid, axis, gradients } = useChartTheme();

  // Unique gradient IDs to avoid conflicts
  const incomeGradientId = 'cashflow-income-gradient';
  const expensesGradientId = 'cashflow-expenses-gradient';

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        barGap={4}
        barCategoryGap="20%"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id={incomeGradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={gradients.income[0]} />
            <stop offset="100%" stopColor={gradients.income[1]} />
          </linearGradient>
          <linearGradient id={expensesGradientId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={gradients.expenses[0]} />
            <stop offset="100%" stopColor={gradients.expenses[1]} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke={grid}
          vertical={false}
        />

        <XAxis
          dataKey="month"
          tick={{ fill: axis, fontSize: 11 }}
          axisLine={{ stroke: grid }}
          tickLine={{ stroke: grid }}
        />

        <YAxis
          tick={{ fill: axis, fontSize: 11 }}
          axisLine={{ stroke: grid }}
          tickLine={{ stroke: grid }}
          tickFormatter={formatCurrency}
        />

        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={formatCurrency}
            />
          }
          cursor={{ fill: 'transparent' }}
        />

        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span style={{ color: axis, fontSize: 12 }}>{value}</span>
          )}
        />

        <Bar
          dataKey="income"
          name="Income"
          fill={`url(#${incomeGradientId})`}
          radius={[4, 4, 0, 0]}
        />

        <Bar
          dataKey="expenses"
          name="Expenses"
          fill={`url(#${expensesGradientId})`}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## Spending by Category Donut Chart

### `src/components/charts/SpendingDonutChart.tsx`

```typescript
'use client';

import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@/lib/theme';
import { ChartTooltip } from './ChartTooltip';

interface SpendingData {
  category: string;
  amount: number;
}

interface SpendingDonutChartProps {
  data: SpendingData[];
  height?: number;
}

export function SpendingDonutChart({ data, height = 400 }: SpendingDonutChartProps) {
  const { categories, axis, tooltip } = useChartTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calculate total
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.amount, 0),
    [data]
  );

  // Map categories to colors
  const getColor = (category: string): string => {
    const key = category.toLowerCase().replace(/\s+/g, '') as keyof typeof categories;
    return categories[key] || '#888888';
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Custom label for center
  const CenterLabel = () => (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
    >
      <tspan
        x="50%"
        dy="-0.5em"
        fill={axis}
        fontSize={12}
      >
        Total
      </tspan>
      <tspan
        x="50%"
        dy="1.5em"
        fill={tooltip.text}
        fontSize={24}
        fontWeight="bold"
      >
        {formatCurrency(total)}
      </tspan>
    </text>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={2}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColor(entry.category)}
              stroke="var(--color-bg-primary)"
              strokeWidth={2}
              style={{
                filter: activeIndex === index 
                  ? 'drop-shadow(0 0 8px currentColor)' 
                  : 'none',
                transform: activeIndex === index 
                  ? 'scale(1.05)' 
                  : 'scale(1)',
                transformOrigin: 'center',
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </Pie>

        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={formatCurrency}
            />
          }
        />

        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span style={{ color: axis, fontSize: 12 }}>{value}</span>
          )}
        />

        {/* Center label */}
        <CenterLabel />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

---

## Account Balance Trends Line Chart

### `src/components/charts/AccountTrendsChart.tsx`

```typescript
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useChartTheme } from '@/lib/theme';
import { ChartTooltip } from './ChartTooltip';

interface AccountData {
  date: string;
  jointChecking?: number;
  jointSavings?: number;
  user1Checking?: number;
  user1Savings?: number;
  user2Checking?: number;
  user2Savings?: number;
}

interface AccountTrendsChartProps {
  data: AccountData[];
  visibleAccounts?: string[];
  height?: number;
}

const accountConfig = [
  { key: 'jointChecking', name: 'Joint Checking', colorKey: 'jointChecking' },
  { key: 'jointSavings', name: 'Joint Savings', colorKey: 'jointSavings' },
  { key: 'user1Checking', name: 'User1 Checking', colorKey: 'user1Checking' },
  { key: 'user1Savings', name: 'User1 Savings', colorKey: 'user1Savings' },
  { key: 'user2Checking', name: 'User2 Checking', colorKey: 'user2Checking' },
  { key: 'user2Savings', name: 'User2 Savings', colorKey: 'user2Savings' },
];

export function AccountTrendsChart({
  data,
  visibleAccounts,
  height = 400,
}: AccountTrendsChartProps) {
  const { accounts, grid, axis } = useChartTheme();

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });

  // Filter accounts if specified
  const displayAccounts = visibleAccounts
    ? accountConfig.filter((acc) => visibleAccounts.includes(acc.key))
    : accountConfig;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={grid}
          vertical={true}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: axis, fontSize: 11 }}
          axisLine={{ stroke: grid }}
          tickLine={{ stroke: grid }}
        />

        <YAxis
          tick={{ fill: axis, fontSize: 11 }}
          axisLine={{ stroke: grid }}
          tickLine={{ stroke: grid }}
          tickFormatter={formatCurrency}
        />

        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={formatCurrency}
            />
          }
        />

        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => (
            <span style={{ color: axis, fontSize: 12 }}>{value}</span>
          )}
        />

        {displayAccounts.map((account) => (
          <Line
            key={account.key}
            type="monotone"
            dataKey={account.key}
            name={account.name}
            stroke={accounts[account.colorKey as keyof typeof accounts]}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              strokeWidth: 2,
              stroke: 'var(--color-bg-primary)',
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Area Chart with Gradient Fill

### `src/components/charts/AreaTrendChart.tsx`

```typescript
'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useChartTheme } from '@/lib/theme';
import { ChartTooltip } from './ChartTooltip';

interface TrendData {
  date: string;
  value: number;
}

interface AreaTrendChartProps {
  data: TrendData[];
  color?: 'coral' | 'mint' | 'teal' | 'cyan';
  height?: number;
}

export function AreaTrendChart({
  data,
  color = 'teal',
  height = 200,
}: AreaTrendChartProps) {
  const { grid, axis } = useChartTheme();

  const colorMap = {
    coral: 'var(--color-accent-coral)',
    mint: 'var(--color-accent-mint)',
    teal: 'var(--color-accent-teal)',
    cyan: 'var(--color-accent-cyan)',
  };

  const gradientId = `area-gradient-${color}`;
  const strokeColor = colorMap[color];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke={grid}
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: axis, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis hide />

        <Tooltip
          content={<ChartTooltip />}
        />

        <Area
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

---

## Horizontal Bar Chart (Top Categories)

### `src/components/charts/TopCategoriesChart.tsx`

```typescript
'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useChartTheme } from '@/lib/theme';
import { ChartTooltip } from './ChartTooltip';

interface CategoryData {
  category: string;
  amount: number;
}

interface TopCategoriesChartProps {
  data: CategoryData[];
  height?: number;
  limit?: number;
}

export function TopCategoriesChart({
  data,
  height = 300,
  limit = 5,
}: TopCategoriesChartProps) {
  const { categories, grid, axis } = useChartTheme();

  // Sort and limit
  const sortedData = [...data]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  const getColor = (category: string): string => {
    const key = category.toLowerCase().replace(/\s+/g, '') as keyof typeof categories;
    return categories[key] || '#888888';
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
      >
        <XAxis
          type="number"
          tick={{ fill: axis, fontSize: 11 }}
          axisLine={{ stroke: grid }}
          tickLine={{ stroke: grid }}
          tickFormatter={formatCurrency}
        />

        <YAxis
          type="category"
          dataKey="category"
          tick={{ fill: axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />

        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={formatCurrency}
            />
          }
          cursor={{ fill: 'var(--color-bg-hover)', opacity: 0.5 }}
        />

        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getColor(entry.category)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

---

## Chart Container Component

Wrapper providing consistent styling for all charts.

### `src/components/charts/ChartContainer.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartContainer({
  title,
  subtitle,
  children,
  actions,
  className,
}: ChartContainerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border-subtle bg-bg-secondary p-5',
        'transition-colors duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-sm text-text-tertiary">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
```

---

## Usage Examples

### Dashboard Layout with Charts

```tsx
import { ChartContainer } from '@/components/charts/ChartContainer';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { SpendingDonutChart } from '@/components/charts/SpendingDonutChart';
import { AccountTrendsChart } from '@/components/charts/AccountTrendsChart';

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Cash Flow - Full Width */}
      <ChartContainer
        title="Cash Flow Over Time"
        subtitle="Income vs expenses by month (transfers excluded)"
        className="lg:col-span-2"
      >
        <CashFlowChart data={cashFlowData} height={350} />
      </ChartContainer>

      {/* Spending Breakdown */}
      <ChartContainer
        title="Spending by Category"
        subtitle="Expense breakdown by category (drill to see details)"
      >
        <SpendingDonutChart data={spendingData} height={350} />
      </ChartContainer>

      {/* Account Trends */}
      <ChartContainer
        title="Account Balance Trends"
        subtitle="Balance over time for each account"
      >
        <AccountTrendsChart data={accountData} height={350} />
      </ChartContainer>
    </div>
  );
}
```

---

## Dark Mode Considerations

### Gradient Intensities
Dark mode gradients are more vibrant to stand out against dark backgrounds:

```typescript
// Light mode: Subtle gradients
gradients: {
  income: ['#12B76A', '#14B8A6'],   // Muted green to teal
  expenses: ['#F97066', '#F59E0B'], // Coral to amber
}

// Dark mode: Neon gradients
gradients: {
  income: ['#00FF7F', '#00CED1'],   // Bright neon green to cyan
  expenses: ['#FF4444', '#FF8C00'], // Bright red to orange
}
```

### Glow Effects
Add glow on hover for active elements in dark mode:

```css
.dark .chart-element:hover {
  filter: drop-shadow(0 0 8px currentColor);
}
```

### Grid Line Visibility
Darker grid lines for dark mode (less contrast):

```typescript
grid: isDark ? '#222222' : '#E5E7EB'
```

---

## Performance Tips

1. **Memoize chart data transformations**
   ```typescript
   const processedData = useMemo(() => transformData(rawData), [rawData]);
   ```

2. **Use `ResponsiveContainer` sparingly**
   - Each instance adds resize observers
   - Consider fixed heights for stable layouts

3. **Limit animation duration**
   ```typescript
   <Bar isAnimationActive={false} /> // For large datasets
   ```

4. **Debounce theme changes** (if needed)
   - The hook already handles this efficiently

---

## Next Steps

- **[Table Theming](./05-TABLES.md)** - TanStack Table integration
- **[API Reference](./06-API-REFERENCE.md)** - Complete documentation
