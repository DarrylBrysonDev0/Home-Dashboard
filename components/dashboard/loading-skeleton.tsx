import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function KPICardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  );
}

export function KPICardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/**
 * CashFlowChartSkeleton - Skeleton for bar charts showing income vs expenses
 * Shows placeholder bars of varying heights to simulate the chart structure
 */
export function CashFlowChartSkeleton({ height = 350 }: { height?: number }) {
  const barHeights = [65, 80, 45, 90, 55, 70, 85, 60, 75, 50, 40, 88];

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div
          className="flex items-end justify-between gap-1 md:gap-2 px-4 md:px-8"
          style={{ height: height - 80 }}
        >
          {barHeights.map((barHeight, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center gap-1 ${i >= 8 ? 'hidden lg:flex' : ''}`}
            >
              <div className="flex w-full gap-0.5">
                {/* Income bar (green placeholder) */}
                <Skeleton
                  className="flex-1 rounded-t"
                  style={{ height: `${barHeight}%` }}
                />
                {/* Expense bar (red placeholder) */}
                <Skeleton
                  className="flex-1 rounded-t"
                  style={{ height: `${Math.max(20, barHeight - 15)}%` }}
                />
              </div>
              {/* X-axis label */}
              <Skeleton className="mt-2 h-3 w-6 md:w-8" />
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-sm" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-sm" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * BalanceTrendsChartSkeleton - Skeleton for multi-line chart showing balance trends
 * Shows a wavy line pattern to simulate trend lines
 */
export function BalanceTrendsChartSkeleton({ height = 350 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-1 h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div
          className="relative overflow-hidden rounded"
          style={{ height: height - 80 }}
        >
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 flex h-full flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
          {/* Chart area with wave pattern */}
          <div className="ml-16 h-full">
            <svg
              className="h-full w-full"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              {/* Simulated trend lines */}
              <path
                d="M0,120 Q50,100 100,110 T200,90 T300,105 T400,85"
                fill="none"
                className="stroke-primary/10"
                strokeWidth="3"
              />
              <path
                d="M0,140 Q50,130 100,145 T200,125 T300,135 T400,115"
                fill="none"
                className="stroke-primary/10"
                strokeWidth="3"
              />
              <path
                d="M0,160 Q50,150 100,155 T200,145 T300,150 T400,140"
                fill="none"
                className="stroke-primary/10"
                strokeWidth="3"
              />
            </svg>
          </div>
          {/* X-axis labels */}
          <div className="ml-16 mt-2 flex justify-between">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-12" />
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CategoryDonutSkeleton - Skeleton for donut/pie charts
 * Shows a circular ring to simulate the donut structure
 */
export function CategoryDonutSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div style={{ height }} className="relative">
      {/* Donut ring */}
      <div className="flex h-full items-center justify-center">
        <div className="relative">
          <Skeleton
            className="rounded-full"
            style={{
              width: Math.min(height * 0.7, 200),
              height: Math.min(height * 0.7, 200),
            }}
          />
          {/* Inner hole */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
            style={{
              width: Math.min(height * 0.4, 120),
              height: Math.min(height * 0.4, 120),
            }}
          />
          {/* Center text placeholder */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <Skeleton className="mx-auto h-3 w-10" />
            <Skeleton className="mx-auto mt-1 h-5 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CategoryBarSkeleton - Skeleton for horizontal bar charts
 * Shows horizontal bars of varying widths
 */
export function CategoryBarSkeleton({
  height = 300,
  rows = 8,
}: {
  height?: number;
  rows?: number;
}) {
  const barWidths = [95, 78, 65, 52, 45, 38, 30, 22];

  return (
    <div style={{ height }} className="space-y-3 py-2">
      {barWidths.slice(0, rows).map((width, i) => (
        <div key={i} className="flex items-center gap-3">
          {/* Category label */}
          <Skeleton className="h-4 w-24 shrink-0" />
          {/* Bar */}
          <Skeleton
            className="h-6 rounded-r"
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * TransferFlowChartSkeleton - Skeleton for Sankey flow diagrams
 * Shows nodes and connecting flows
 */
export function TransferFlowChartSkeleton({ height = 350 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-4 w-56" />
      </CardHeader>
      <CardContent>
        <div
          className="relative flex items-center justify-between px-4"
          style={{ height: height - 80 }}
        >
          {/* Left nodes */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-16 w-4 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-12 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Flow lines (simulated with diagonal skeletons) */}
          <div className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2">
            <Skeleton className="h-2 w-full opacity-30" />
            <Skeleton className="mt-6 h-1.5 w-3/4 opacity-30" />
            <Skeleton className="mt-6 h-1 w-1/2 opacity-30" />
          </div>

          {/* Right nodes */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-14 w-4 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-4 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-18" />
              <Skeleton className="h-12 w-4 rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SpendingByCategorySkeleton - Skeleton for the category spending container
 * Shows the toggle buttons and chart placeholder
 */
export function SpendingByCategorySkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-1 h-4 w-52" />
        </div>
        {/* View toggle buttons */}
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <CategoryDonutSkeleton height={height} />
        <Skeleton className="mx-auto mt-2 h-3 w-56" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        {/* Table Header */}
        <div className="mb-4 flex gap-4 border-b border-light-gray pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        {/* Table Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FilterSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <KPICardsSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
