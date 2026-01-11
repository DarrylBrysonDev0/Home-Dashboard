import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  Tag,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin | Home Dashboard",
  description: "Administration panel for managing users and settings",
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin navigation items
 */
const navItems = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Tag,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
];

/**
 * Admin Layout
 *
 * Server component that provides:
 * - SEO metadata for admin pages
 * - Navigation sidebar for admin sections
 * - Consistent page structure
 *
 * Route protection is handled by middleware.ts which:
 * - Requires authentication
 * - Requires ADMIN role
 * - Redirects non-admins to /calendar
 *
 * @see middleware.ts for authentication handling
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
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
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </div>
            </div>

            {/* Quick Link to Calendar */}
            <Link
              href="/calendar"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Calendar
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="container py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-48 shrink-0">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
