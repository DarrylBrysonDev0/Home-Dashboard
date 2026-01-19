"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NavItem Component Props
 * @see data-model.md NavItemProps interface
 */
export interface NavItemProps {
  /** Target route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Display label */
  label: string;
  /** Whether navigation is pending (loading state) */
  isPending?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * NavItem Component
 *
 * Individual navigation link with active state detection and loading support.
 * Uses usePathname to determine if the current route matches the link.
 *
 * Features:
 * - Active state detection via usePathname
 * - Loading spinner when isPending is true
 * - Accessible with aria-current for active state
 * - Hover and focus states for interactivity
 *
 * @see User Story 1: Desktop Navigation
 */
export function NavItem({
  href,
  icon: Icon,
  label,
  isPending = false,
  className,
}: NavItemProps) {
  const pathname = usePathname();

  // Determine active state - exact match for home, startsWith for others
  const isActive =
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  // Generate test id from label (lowercase, hyphenated)
  const testId = `nav-item-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div data-testid={testId} data-active={isActive ? "true" : "false"}>
      <Link
        href={href}
        className={cn(
          // Base styles
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
          // Transitions
          "transition-colors duration-200",
          // Focus styles
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Hover styles
          "hover:bg-accent hover:text-accent-foreground",
          // Active vs inactive styles
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        aria-current={isActive ? "page" : undefined}
        aria-busy={isPending ? "true" : undefined}
      >
        {isPending ? (
          <Loader2
            className="h-4 w-4 animate-spin"
            data-testid="nav-item-spinner"
          />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        <span>{label}</span>
      </Link>
    </div>
  );
}
