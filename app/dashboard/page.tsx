import { Suspense } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { KPICardsSkeleton } from "@/components/dashboard/loading-skeleton";

/**
 * Dashboard Page - Financial Health Overview
 *
 * This is the main dashboard page displaying financial metrics and visualizations.
 * Currently implements User Story 1 (Financial Health Summary) with KPI cards.
 *
 * Future additions planned:
 * - US2: Cash Flow Chart (income vs expenses over time)
 * - US3: Filter integration (time period, accounts)
 * - US4: Spending by Category charts
 * - US5: Account Balance Trends chart
 * - US6: Transaction Table
 * - US7: Recurring Transactions
 * - US8: Transfer Flow visualization
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
          <KPICards />
        </Suspense>
      </section>

      {/* Placeholder: Cash Flow Chart (US2) */}
      <section
        aria-labelledby="cashflow-section-heading"
        className="rounded-lg border border-dashed border-light-gray bg-off-white/50 p-6"
      >
        <h2
          id="cashflow-section-heading"
          className="mb-2 text-sm font-medium text-medium-gray"
        >
          Cash Flow Over Time
        </h2>
        <p className="text-xs text-medium-gray">
          Income vs expenses visualization coming in User Story 2
        </p>
      </section>

      {/* Placeholder: Category Charts (US4) */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-dashed border-light-gray bg-off-white/50 p-6">
          <h2 className="mb-2 text-sm font-medium text-medium-gray">
            Spending by Category
          </h2>
          <p className="text-xs text-medium-gray">
            Category breakdown coming in User Story 4
          </p>
        </div>

        {/* Placeholder: Balance Trends (US5) */}
        <div className="rounded-lg border border-dashed border-light-gray bg-off-white/50 p-6">
          <h2 className="mb-2 text-sm font-medium text-medium-gray">
            Account Balance Trends
          </h2>
          <p className="text-xs text-medium-gray">
            Balance trends coming in User Story 5
          </p>
        </div>
      </section>

      {/* Placeholder: Transaction Table (US6) */}
      <section className="rounded-lg border border-dashed border-light-gray bg-off-white/50 p-6">
        <h2 className="mb-2 text-sm font-medium text-medium-gray">
          Recent Transactions
        </h2>
        <p className="text-xs text-medium-gray">
          Transaction table coming in User Story 6
        </p>
      </section>
    </div>
  );
}
