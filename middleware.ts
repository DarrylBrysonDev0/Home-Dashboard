import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js middleware for route protection
 *
 * Protected routes:
 * - /calendar - Requires authentication
 * - /admin - Requires authentication + ADMIN role
 * - /api/events - Requires authentication
 *
 * Public routes:
 * - /login
 * - /api/auth/* (NextAuth endpoints)
 * - / (home page)
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
 * Runs on:
 * - /calendar and all sub-routes
 * - /admin and all sub-routes
 * - /api/events and all sub-routes
 *
 * Does NOT run on:
 * - /api/auth/* (NextAuth endpoints)
 * - /_next/* (Next.js internals)
 * - /favicon.ico
 * - Other public routes
 */
export const config = {
  matcher: [
    "/calendar/:path*",
    "/admin/:path*",
    "/api/events/:path*",
  ],
};
