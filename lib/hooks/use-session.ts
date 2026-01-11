"use client";

import { useSession as useNextAuthSession } from "next-auth/react";

/**
 * Custom session hook wrapper
 *
 * Provides a convenient wrapper around NextAuth's useSession hook
 * with properly typed session data including user ID and role.
 *
 * Usage:
 * ```tsx
 * const { session, status, isAuthenticated, isLoading, user } = useSession();
 * ```
 *
 * @returns Session data with helper properties
 */
export function useSession() {
  const { data: session, status } = useNextAuthSession();

  return {
    // Original session data
    session,
    status,

    // Convenience properties
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user ?? null,

    // Role checks
    isAdmin: session?.user?.role === "ADMIN",
    isMember: session?.user?.role === "MEMBER",
  };
}

/**
 * Hook to require authentication
 *
 * Throws an error if the user is not authenticated.
 * Use this in components that absolutely require a user session.
 *
 * @throws Error if user is not authenticated
 * @returns Authenticated session data
 */
export function useRequireAuth() {
  const { session, isAuthenticated, isLoading } = useSession();

  if (!isLoading && !isAuthenticated) {
    throw new Error("Authentication required");
  }

  return {
    session: session!,
    user: session!.user,
  };
}

/**
 * Hook to require admin role
 *
 * Throws an error if the user is not an admin.
 * Use this in admin-only components.
 *
 * @throws Error if user is not an admin
 * @returns Admin session data
 */
export function useRequireAdmin() {
  const { session, isAdmin, isLoading } = useSession();

  if (!isLoading && !isAdmin) {
    throw new Error("Admin access required");
  }

  return {
    session: session!,
    user: session!.user,
  };
}
