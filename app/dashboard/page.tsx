"use client";

import { Suspense } from "react";
import { FilteredKPICards } from "@/components/dashboard/kpi-cards";
import { KPICardsSkeleton, ChartSkeleton } from "@/components/dashboard/loading-skeleton";
import { FilteredCashFlowChart } from "@/components/dashboard/charts/cash-flow-chart";
import { FilteredBalanceTrendsChart } from "@/components/dashboard/charts/balance-trends";
import { FilteredSpendingByCategory } from "@/components/dashboard/spending-by-category";
import { FilteredTransactionTable } from "@/components/dashboard/transactions/transaction-table";
import { FilteredRecurringTable } from "@/components/dashboard/transactions/recurring-table";
import { FilteredTransferFlowChart } from "@/components/dashboard/charts/transfer-flow";

/**
 * Dashboard Page - Financial Health Overview
 *
 * This is the main dashboard page displaying financial metrics and visualizations.
 * All components automatically respond to filter changes via FilterContext.
 *
 * Implemented:
 * - US1: Financial Health Summary (KPI cards)
 * - US2: Cash Flow Chart (income vs expenses over time)
 * - US3: Filter integration (time period, accounts) - components now respond to filters
 * - US4: Spending by Category (donut/bar charts with drill-down)
 * - US5: Account Balance Trends chart
 * - US6: Transaction Table (sortable, searchable with CSV export)
 * - US7: Recurring Transactions (pattern detection with confirm/reject)
 * - US8: Transfer Flow visualization (Sankey diagram)
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Section: Financial Health Summary (US1) */}
      <section aria-labelledby="kpi-section-heading">
        <header className="mb-4">
          <h2
            id="kpi-section-heading"
            className="text-lg font-semibold text-near-black"
          >
            Financial Health Summary
          </h2>
          <p className="text-sm text-medium-gray">
            Key metrics for your finances at a glance
          </p>
        </header>

        <Suspense fallback={<KPICardsSkeleton />}>
          <FilteredKPICards />
        </Suspense>
      </section>

      {/* Section: Cash Flow Chart (US2) */}
      <section aria-labelledby="cashflow-section-heading">
        <Suspense fallback={<ChartSkeleton height={350} />}>
          <FilteredCashFlowChart
            title="Cash Flow Over Time"
            description="Income vs expenses by month (transfers excluded)"
            granularity="monthly"
          />
        </Suspense>
      </section>

      {/* Section: Category Charts (US4) + Account Balance Trends (US5) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton height={350} />}>
          <FilteredSpendingByCategory
            title="Spending by Category"
            description="Expense breakdown by category (click to drill down)"
            height={350}
            defaultView="donut"
          />
        </Suspense>

        <Suspense fallback={<ChartSkeleton height={350} />}>
          <FilteredBalanceTrendsChart
            title="Account Balance Trends"
            description="Balance over time for each account"
            granularity="monthly"
          />
        </Suspense>
      </section>

      {/* Section: Transfer Flow (US8) */}
      <section aria-labelledby="transfer-section-heading">
        <header className="mb-4">
          <h2
            id="transfer-section-heading"
            className="text-lg font-semibold text-near-black"
          >
            Transfer Flow
          </h2>
          <p className="text-sm text-medium-gray">
            Money movement between your accounts
          </p>
        </header>

        <Suspense fallback={<ChartSkeleton height={350} />}>
          <FilteredTransferFlowChart
            title="Account Transfers"
            description="Visualizing transfers between accounts"
            height={350}
          />
        </Suspense>
      </section>

      {/* Section: Transaction Table (US6) */}
      <section aria-labelledby="transactions-section-heading">
        <header className="mb-4">
          <h2
            id="transactions-section-heading"
            className="text-lg font-semibold text-near-black"
          >
            Recent Transactions
          </h2>
          <p className="text-sm text-medium-gray">
            View, search, and export your transaction history
          </p>
        </header>

        <FilteredTransactionTable />
      </section>

      {/* Section: Recurring Transactions (US7) */}
      <section aria-labelledby="recurring-section-heading">
        <header className="mb-4">
          <h2
            id="recurring-section-heading"
            className="text-lg font-semibold text-near-black"
          >
            Recurring Transactions
          </h2>
          <p className="text-sm text-medium-gray">
            Automatically detected recurring patterns with confidence scores
          </p>
        </header>

        <FilteredRecurringTable />
      </section>
    </div>
  );
}
