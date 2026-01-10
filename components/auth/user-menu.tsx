"use client";

/**
 * UserMenu Component
 *
 * Displays authenticated user information with a dropdown menu for actions.
 *
 * Features:
 * - User name display with avatar placeholder
 * - Avatar color indicator from user profile
 * - Logout button with signOut integration
 * - Session state handling
 *
 * @see contracts/auth-api.md
 */

import { signOut, useSession } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * UserMenu component for authenticated users
 *
 * Shows user name, email, and logout option in a dropdown menu.
 * Uses NextAuth session to get current user data.
 */
export function UserMenu() {
  const { data: session, status } = useSession();

  // Don't render if not authenticated or still loading
  if (status === "loading" || !session?.user) {
    return null;
  }

  const { user } = session;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  /**
   * Handle logout action
   * Redirects to login page after sign out
   */
  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full"
          aria-label="User menu"
        >
          {/* Avatar circle with initials */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{
              backgroundColor: user.avatarColor || "#F97316", // Default to Cemdash orange
            }}
          >
            {initials}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        {/* User Info Section */}
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.role === "ADMIN" && (
              <p className="text-xs font-medium text-orange-600">
                Administrator
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Profile Link (future enhancement) */}
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout Button */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
