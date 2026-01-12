import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js middleware for route protection
 *
 * Protected routes (requires authentication):
 * - / - Landing page (home)
 * - /dashboard - Main financial dashboard
 * - /calendar - Shared event calendar
 * - /admin - Admin panel (also requires ADMIN role)
 * - /api/analytics/* - All analytics endpoints
 * - /api/categories/* - Category management
 * - /api/events/* - Event management
 * - /api/export/* - Data export
 * - /api/filters/* - Filter data
 * - /api/transactions/* - Transaction data
 * - /api/users/* - User management
 *
 * Public routes (no authentication required):
 * - /login - Login page
 * - /api/auth/* - NextAuth endpoints
 *
 * @see contracts/auth-api.md
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Check admin role for /admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        // Redirect non-admin users to calendar page
        return NextResponse.redirect(new URL("/calendar", req.url));
      }
    }

    // All other protected routes just need authentication (handled by withAuth)
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback determines if the request is authorized
      // Return true to allow access, false to redirect to login
      authorized: ({ token }) => {
        // User must have a valid token to access protected routes
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

/**
 * Matcher config - defines which routes this middleware runs on
 *
 * Protected routes (requires authentication):
 * - / (landing page)
 * - /dashboard and all sub-routes
 * - /calendar and all sub-routes
 * - /admin and all sub-routes (also requires ADMIN role)
 * - /api/analytics/* - All analytics endpoints
 * - /api/categories/* - Category management
 * - /api/events/* - Event management
 * - /api/export/* - Data export
 * - /api/filters/* - Filter data
 * - /api/transactions/* - Transaction data
 * - /api/users/* - User management
 *
 * Does NOT run on (public routes):
 * - /login
 * - /api/auth/* (NextAuth endpoints)
 * - /_next/* (Next.js internals)
 * - /favicon.ico
 */
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/calendar/:path*",
    "/admin/:path*",
    "/api/analytics/:path*",
    "/api/categories/:path*",
    "/api/events/:path*",
    "/api/export/:path*",
    "/api/filters/:path*",
    "/api/transactions/:path*",
    "/api/users/:path*",
  ],
};
