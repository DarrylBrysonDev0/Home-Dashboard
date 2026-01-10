/**
 * Admin middleware for API route protection
 *
 * Checks authentication and admin role for protected endpoints.
 * Used by admin-only routes (FR-007):
 * - /api/users/*
 * - /api/categories (POST, PUT, DELETE)
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Result of admin authentication check
 */
export interface AdminCheckResult {
  authorized: boolean;
  session: Session | null;
  response?: NextResponse;
}

/**
 * Check if the current request is from an authenticated admin user.
 *
 * Returns an object with:
 * - `authorized`: true if user is authenticated and has ADMIN role
 * - `session`: the session object if authenticated
 * - `response`: a NextResponse to return if not authorized (401 or 403)
 *
 * @returns Promise resolving to AdminCheckResult
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   const { authorized, response, session } = await checkAdminAuth();
 *   if (!authorized) {
 *     return response;
 *   }
 *   // User is admin, proceed with operation
 *   console.log(`Admin ${session.user.email} accessing endpoint`);
 * }
 * ```
 */
export async function checkAdminAuth(): Promise<AdminCheckResult> {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session || !session.user) {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  // Check if user has admin role
  if (session.user.role !== "ADMIN") {
    return {
      authorized: false,
      session,
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Get current user's session for any authenticated request.
 *
 * Use this for endpoints that need authentication but not admin role.
 *
 * @returns Promise resolving to session check result
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   const { authenticated, response, session } = await checkAuth();
 *   if (!authenticated) {
 *     return response;
 *   }
 *   // User is authenticated
 * }
 * ```
 */
export async function checkAuth(): Promise<{
  authenticated: boolean;
  session: Session | null;
  response?: NextResponse;
}> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authenticated: false,
      session: null,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    session,
  };
}
