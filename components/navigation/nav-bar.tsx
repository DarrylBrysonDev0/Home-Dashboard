"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Menu } from "lucide-react";
import { Logo } from "./logo";
import { NavItems } from "./nav-items";
import { MobileDrawer } from "./mobile-drawer";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * NavBar Component Props
 * @see data-model.md NavBarProps interface
 */
export interface NavBarProps {
  className?: string;
}

/**
 * NavBar Component
 *
 * Main persistent navigation bar for the application.
 * Integrates Logo, NavItems, ThemeToggle, and UserMenu components.
 *
 * Features:
 * - Fixed height of 64px (h-16)
 * - Sticky positioning at top of viewport
 * - Responsive: hamburger menu on mobile, full nav on desktop
 * - Proper z-index for layering
 * - Accessible with aria-label
 *
 * Desktop Layout:
 * [Logo] [NavItems] ────────────── [ThemeToggle] [UserMenu]
 *
 * Mobile Layout:
 * [Hamburger] [Logo] ────────────── [ThemeToggle] [UserMenu]
 *
 * @see User Story 1: Desktop Navigation
 */
export function NavBar({ className }: NavBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  // Dynamic tooltip text based on current theme
  const tooltipText =
    resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <nav
      data-testid="nav-bar"
      className={cn(
        // Fixed height and positioning
        "h-16 sticky top-0 z-50 w-full",
        // Layout
        "flex items-center justify-between px-4 md:px-6",
        // Background and visual separation
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Left section: Mobile hamburger + Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          data-testid="mobile-menu-button"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <Logo />

        {/* Desktop NavItems - hidden on mobile */}
        <NavItems isMobile={false} className="hidden md:flex ml-6" />
      </div>

      {/* Right section: ThemeToggle + UserMenu */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ThemeToggle />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
        <div data-testid="nav-user-menu">
          <UserMenu />
        </div>
      </div>

      {/* Mobile Drawer - Rendered outside nav for proper overlay positioning */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </nav>
  );
}
