"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { NavItems } from "./nav-items";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * MobileDrawer Component Props
 * @see data-model.md MobileDrawerProps interface
 */
export interface MobileDrawerProps {
  /** Whether drawer is open */
  isOpen: boolean;
  /** Callback to close drawer */
  onClose: () => void;
}

/**
 * MobileDrawer Component
 *
 * Slide-out navigation drawer for mobile viewports (< 768px).
 * Uses shadcn Sheet component for accessibility and animations.
 *
 * Features:
 * - Slides from left side (side="left")
 * - Contains all navigation items in vertical layout
 * - User section with avatar, name, and email
 * - Sign out button
 * - Closes on nav item click, backdrop tap, or X button
 * - Focus trap and Escape key handling (via Sheet)
 * - 200ms animation timing (via Sheet's built-in animation)
 *
 * @see User Story 5: Mobile Navigation with Hamburger Menu
 */
export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { data: session, status } = useSession();

  // Derive user info
  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  /**
   * Handle navigation item click
   * Closes drawer after selection for better mobile UX
   */
  const handleNavItemClick = () => {
    onClose();
  };

  /**
   * Handle sign out
   * Signs out and redirects to login page
   */
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        data-testid="mobile-drawer"
        className={cn(
          "flex flex-col w-[280px] sm:w-[320px]",
          // Custom animation duration closer to 200ms
          "data-[state=closed]:duration-200 data-[state=open]:duration-200"
        )}
      >
        {/* Header */}
        <SheetHeader data-testid="mobile-drawer-header">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Mobile navigation menu with links to all app sections
          </SheetDescription>
        </SheetHeader>

        {/* Navigation Items */}
        <nav className="flex-1 py-6">
          <NavItems
            isMobile={true}
            onItemClick={handleNavItemClick}
          />
        </nav>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* User Section */}
        {status === "authenticated" && user && (
          <div
            data-testid="mobile-drawer-user"
            className="py-4 space-y-4"
          >
            {/* User Info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
                style={{
                  backgroundColor: user.avatarColor || "#F97316",
                }}
              >
                {initials}
              </div>

              {/* Name and Email */}
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm truncate">
                  {user.name}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        )}

        {/* Loading state placeholder */}
        {status === "loading" && (
          <div className="py-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
