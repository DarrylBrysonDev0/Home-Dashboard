"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/hooks/use-session";

export interface ProtectedRouteProps {
  /**
   * Content to render when authenticated
   */
  children: React.ReactNode;

  /**
   * If true, requires admin role (default: false)
   */
  requireAdmin?: boolean;

  /**
   * Path to redirect to when not authenticated (default: /login)
   */
  redirectTo?: string;

  /**
   * Loading component to show while checking authentication
   */
  loadingComponent?: React.ReactNode;
}

/**
 * Protected route wrapper component
 *
 * Wraps content that requires authentication. Automatically redirects
 * to login page if user is not authenticated.
 *
 * Features:
 * - Checks authentication status using NextAuth session
 * - Optional admin role requirement
 * - Customizable redirect path
 * - Loading state while checking session
 *
 * Usage:
 * ```tsx
 * // Require any authenticated user
 * <ProtectedRoute>
 *   <CalendarPage />
 * </ProtectedRoute>
 *
 * // Require admin role
 * <ProtectedRoute requireAdmin>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * ```
 *
 * @see lib/hooks/use-session.ts for session utilities
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = "/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAdmin } = useSession();

  useEffect(() => {
    // Wait for session to load
    if (isLoading) return;

    // Redirect if not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    // Redirect if admin required but user is not admin
    if (requireAdmin && !isAdmin) {
      router.push("/"); // Redirect non-admins to home
    }
  }, [isAuthenticated, isLoading, isAdmin, requireAdmin, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      <>
        {loadingComponent ?? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Checking authentication...
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Don't render if not authenticated (while redirecting)
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if admin required but user is not admin
  if (requireAdmin && !isAdmin) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Higher-order component to wrap a page with protection
 *
 * Usage:
 * ```tsx
 * export default withProtectedRoute(CalendarPage);
 *
 * // With admin requirement
 * export default withProtectedRoute(AdminPage, { requireAdmin: true });
 * ```
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, "children"> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
