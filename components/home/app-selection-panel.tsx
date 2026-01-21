"use client";

import { usePathname } from "next/navigation";
import { Home, DollarSign, Calendar, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppCard } from "./app-card";

/**
 * AppSelectionPanel Component Props
 * @see data-model.md AppSelectionPanelProps interface
 */
export interface AppSelectionPanelProps {
  /** Custom class names */
  className?: string;
}

/**
 * App configuration for the selection panel
 */
const apps = [
  {
    href: "/",
    icon: Home,
    title: "Home",
    description: "Your personal dashboard hub",
  },
  {
    href: "/dashboard",
    icon: DollarSign,
    title: "Finance",
    description: "Track your income and expenses",
  },
  {
    href: "/calendar",
    icon: Calendar,
    title: "Calendar",
    description: "Manage your schedule and events",
  },
  {
    href: "/reader",
    icon: BookOpen,
    title: "Reader",
    description: "Browse and read documentation",
  },
  {
    href: "/settings",
    icon: Settings,
    title: "Settings",
    description: "Configure your preferences",
  },
] as const;

/**
 * AppSelectionPanel Component
 *
 * Grid display of app cards for the landing page.
 * Automatically detects and highlights the current page.
 *
 * Features:
 * - Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
 * - Current page detection via usePathname
 * - Consistent card styling across all apps
 * - Accessible with aria-label
 *
 * @see User Story 2: Landing Page App Selection
 */
export function AppSelectionPanel({ className }: AppSelectionPanelProps) {
  const pathname = usePathname();

  /**
   * Determine if a route is the current page
   * - Exact match for home "/"
   * - Prefix match for other routes (e.g., /dashboard/*)
   */
  const isCurrentPage = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      data-testid="app-selection-panel"
      aria-label="Application selection"
      className={cn(
        // Grid layout - responsive columns
        "grid gap-4",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {apps.map((app) => (
        <AppCard
          key={app.href}
          href={app.href}
          icon={app.icon}
          title={app.title}
          description={app.description}
          isCurrentPage={isCurrentPage(app.href)}
        />
      ))}
    </nav>
  );
}
