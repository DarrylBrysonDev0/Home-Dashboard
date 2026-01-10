import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js API route handler
 *
 * Handles all authentication endpoints:
 * - GET/POST /api/auth/signin - Sign in page
 * - POST /api/auth/signout - Sign out
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - GET/POST /api/auth/callback/credentials - Credentials callback
 *
 * @see contracts/auth-api.md
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
