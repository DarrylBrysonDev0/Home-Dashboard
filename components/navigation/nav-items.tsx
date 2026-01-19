"use client";

import { Home, DollarSign, Calendar, Settings } from "lucide-react";
import { NavItem } from "./nav-item";
import { cn } from "@/lib/utils";

/**
 * NavItems Component Props
 * @see data-model.md NavItemsProps interface
 */
export interface NavItemsProps {
  /** Whether in mobile drawer context */
  isMobile?: boolean;
  /** Callback when nav item is clicked (for drawer close) */
  onItemClick?: () => void;
  /** Custom class names */
  className?: string;
}

/**
 * Navigation item configuration
 */
interface NavItemConfig {
  href: string;
  icon: typeof Home;
  label: string;
}

/**
 * Navigation items configuration
 * Order: Home, Finance, Calendar, Settings
 */
const navItems: NavItemConfig[] = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/dashboard", icon: DollarSign, label: "Finance" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/admin", icon: Settings, label: "Settings" },
];

/**
 * NavItems Component
 *
 * Collection of navigation links for the main application sections.
 * Supports both desktop (horizontal) and mobile (vertical) layouts.
 *
 * Features:
 * - Four main navigation items: Home, Finance, Calendar, Settings
 * - Responsive layout (horizontal desktop, vertical mobile)
 * - onItemClick callback for mobile drawer close behavior
 * - Keyboard accessible with proper tab order
 *
 * @see User Story 1: Desktop Navigation
 */
export function NavItems({ isMobile = false, onItemClick, className }: NavItemsProps) {
  const handleClick = () => {
    onItemClick?.();
  };

  return (
    <div
      data-testid="nav-items"
      className={cn(
        "flex gap-1",
        isMobile ? "flex-col space-y-1" : "flex-row items-center",
        className
      )}
    >
      {navItems.map((item) => (
        <div key={item.href} onClick={handleClick}>
          <NavItem href={item.href} icon={item.icon} label={item.label} />
        </div>
      ))}
    </div>
  );
}
