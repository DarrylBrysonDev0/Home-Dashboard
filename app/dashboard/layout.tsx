import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Home Finance",
  description: "View your financial health at a glance",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-off-white">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Filter Sidebar */}
        <aside className="hidden lg:block border-r border-light-gray bg-white">
          <div className="sticky top-0 h-screen overflow-y-auto p-6">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-near-black">
                Home Finance
              </h1>
              <p className="text-sm text-medium-gray">Dashboard</p>
            </div>

            <nav className="space-y-6">
              {/* Filter sections will be added by US3 */}
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-medium-gray">
                  Time Period
                </h2>
                <div className="rounded-lg border border-light-gray bg-off-white p-4 text-sm text-medium-gray">
                  Filter components coming in US3
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-medium-gray">
                  Accounts
                </h2>
                <div className="rounded-lg border border-light-gray bg-off-white p-4 text-sm text-medium-gray">
                  Account filter coming in US3
                </div>
              </section>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-h-screen">
          {/* Mobile Header - visible on smaller screens */}
          <header className="sticky top-0 z-10 border-b border-light-gray bg-white px-4 py-3 lg:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-near-black">
                  Home Finance
                </h1>
              </div>
              {/* Mobile filter toggle button - will be functional in US3 */}
              <button
                type="button"
                className="rounded-lg border border-light-gray px-3 py-2 text-sm text-dark-gray hover:bg-off-white"
              >
                Filters
              </button>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
