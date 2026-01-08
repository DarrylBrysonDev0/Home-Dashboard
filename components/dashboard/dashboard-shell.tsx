"use client";

import * as React from "react";
import {
  FilterProvider,
  useFilters,
} from "@/lib/contexts/filter-context";
import { TimeFilter } from "@/components/dashboard/filters/time-filter";
import { AccountFilter } from "@/components/dashboard/filters/account-filter";
import type { Account } from "@/components/dashboard/filters/account-filter";

/**
 * Dashboard Shell Props
 */
interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Sidebar component that uses filter context
 */
function FilterSidebar() {
  const {
    quickDateRanges,
    dateRangeKey,
    dateRange,
    customDateRange,
    setDateRange,
    accounts,
    selectedAccountIds,
    setSelectedAccounts,
    setAccounts,
    isLoading,
    setIsLoading,
  } = useFilters();

  // Fetch accounts on mount
  React.useEffect(() => {
    async function fetchAccounts() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/filters/accounts");
        if (!response.ok) {
          throw new Error("Failed to fetch accounts");
        }
        const json = await response.json();
        if (json.data?.accounts) {
          setAccounts(json.data.accounts);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, [setAccounts, setIsLoading]);

  return (
    <aside className="hidden lg:block border-r border-light-gray bg-white">
      <div className="sticky top-0 h-screen overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-near-black">
            Home Finance
          </h1>
          <p className="text-sm text-medium-gray">Dashboard</p>
        </div>

        <nav className="space-y-6">
          {/* Time Period Filter */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-medium-gray">
              Time Period
            </h2>
            <TimeFilter
              ranges={quickDateRanges}
              selectedKey={dateRangeKey}
              customRange={customDateRange}
              onChange={setDateRange}
              isLoading={isLoading}
              className="flex-col items-stretch"
            />
          </section>

          {/* Account Filter */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-medium-gray">
              Accounts
            </h2>
            <AccountFilter
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              onChange={setSelectedAccounts}
              isLoading={isLoading}
              groupByType={true}
              showOwner={true}
              className="w-full"
            />
          </section>
        </nav>
      </div>
    </aside>
  );
}

/**
 * Mobile Header with filter trigger
 */
function MobileHeader() {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);
  const {
    quickDateRanges,
    dateRangeKey,
    dateRange,
    customDateRange,
    setDateRange,
    accounts,
    selectedAccountIds,
    setSelectedAccounts,
    isLoading,
  } = useFilters();

  return (
    <header className="sticky top-0 z-10 border-b border-light-gray bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-near-black">
            Home Finance
          </h1>
        </div>
        <button
          type="button"
          className="rounded-lg border border-light-gray px-3 py-2 text-sm text-dark-gray hover:bg-off-white"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          aria-expanded={isMobileFiltersOpen}
          aria-controls="mobile-filters"
        >
          Filters
        </button>
      </div>

      {/* Mobile filters dropdown */}
      {isMobileFiltersOpen && (
        <div
          id="mobile-filters"
          className="mt-4 space-y-4 border-t border-light-gray pt-4"
        >
          <div>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-medium-gray">
              Time Period
            </h2>
            <TimeFilter
              ranges={quickDateRanges}
              selectedKey={dateRangeKey}
              customRange={customDateRange}
              onChange={setDateRange}
              isLoading={isLoading}
            />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-medium-gray">
              Accounts
            </h2>
            <AccountFilter
              accounts={accounts}
              selectedAccountIds={selectedAccountIds}
              onChange={setSelectedAccounts}
              isLoading={isLoading}
              className="w-full"
            />
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * DashboardShell - Client component wrapper for dashboard layout
 *
 * Provides the FilterProvider context and renders the filter sidebar.
 * This separates client-side interactivity from the server layout component.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <FilterProvider>
      <div className="min-h-screen bg-off-white">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* Filter Sidebar (Desktop) */}
          <FilterSidebar />

          {/* Main Content Area */}
          <main className="min-h-screen">
            {/* Mobile Header */}
            <MobileHeader />

            {/* Dashboard Content */}
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

export default DashboardShell;
