import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard | Home Finance",
  description: "View your financial health at a glance",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout
 *
 * Server component that provides metadata for SEO and wraps
 * the dashboard content with the DashboardShell client component.
 *
 * The DashboardShell handles:
 * - FilterProvider context for global filter state
 * - Filter sidebar with TimeFilter and AccountFilter
 * - Mobile header with collapsible filters
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
