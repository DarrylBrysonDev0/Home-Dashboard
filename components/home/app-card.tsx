"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AppCard Component Props
 * @see data-model.md AppCardProps interface
 */
export interface AppCardProps {
  /** Target route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Card title */
  title: string;
  /** Brief description */
  description: string;
  /** Whether this is the current page */
  isCurrentPage?: boolean;
  /** Custom class names */
  className?: string;
}

/**
 * AppCard Component
 *
 * Interactive card for app selection on the landing page.
 * Displays an icon, title, and description with hover animations.
 *
 * Features:
 * - 48px icon display
 * - Hover scale animation (1.02)
 * - Current page visual indication
 * - Accessible with aria-label
 * - Focus-visible ring for keyboard navigation
 *
 * @see User Story 2: Landing Page App Selection
 */
export function AppCard({
  href,
  icon: Icon,
  title,
  description,
  isCurrentPage = false,
  className,
}: AppCardProps) {
  return (
    <Link
      href={href}
      aria-label={`${title} - ${description}`}
      className={cn(
        // Card base styling
        "block rounded-xl border bg-bg-secondary p-6",
        // Transition for smooth animations
        "transition-all duration-200 ease-out",
        // Hover effects - scale 1.02 per spec
        "hover:scale-[1.02] hover:shadow-lg hover:border-border-subtle",
        // Focus styles for keyboard navigation
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Current page indication
        isCurrentPage
          ? "ring-2 ring-primary border-primary"
          : "border-border-subtle",
        className
      )}
      data-testid="app-card"
    >
      {/* Icon container - 48px per spec (w-12 h-12) */}
      <div
        data-testid="app-card-icon"
        className={cn(
          "mb-4 flex h-12 w-12 items-center justify-center rounded-lg",
          "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-6 w-6" />
      </div>

      {/* Title */}
      <h3 className="mb-1 font-semibold text-text-primary">{title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
