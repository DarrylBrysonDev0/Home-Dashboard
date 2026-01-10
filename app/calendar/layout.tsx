import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, LayoutDashboard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Calendar | Home Dashboard",
  description: "View and manage family events on the shared calendar",
};

interface CalendarLayoutProps {
  children: React.ReactNode;
}

/**
 * Calendar Layout
 *
 * Server component that provides:
 * - SEO metadata for the calendar page
 * - Navigation breadcrumbs and links
 * - Consistent page structure
 *
 * The calendar is protected by middleware (middleware.ts)
 * requiring authentication before access.
 *
 * Future enhancements:
 * - Category filter sidebar (US5)
 * - Quick action buttons (create event, etc.)
 */
export default function CalendarLayout({ children }: CalendarLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-card">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
              <div className="flex items-center gap-1 font-medium">
                <Calendar className="h-4 w-4" />
                <span>Calendar</span>
              </div>
            </div>

            {/* Future: Quick Actions */}
            {/* <div className="flex items-center gap-2">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Event
              </Button>
            </div> */}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
