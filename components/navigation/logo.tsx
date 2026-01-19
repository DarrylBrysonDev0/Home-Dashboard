"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo Component Props
 * @see data-model.md LogoProps interface
 */
export interface LogoProps {
  className?: string;
}

/**
 * Logo Component
 *
 * Displays the application logo/brand name as a link to the home route.
 * Used in the navigation bar for consistent branding and home navigation.
 *
 * Features:
 * - Links to home route (/)
 * - Accessible with aria-label
 * - Supports custom className for styling flexibility
 *
 * @see User Story 1: Desktop Navigation
 */
export function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center space-x-2 font-semibold text-lg hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
        className
      )}
      aria-label="Cemdash Home Dashboard - Go to home page"
      data-testid="nav-logo"
    >
      <span className="text-primary">Cemdash</span>
    </Link>
  );
}
