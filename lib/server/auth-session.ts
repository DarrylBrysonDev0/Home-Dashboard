import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Get the current authenticated session
 *
 * This is a wrapper around getServerSession that can be mocked in tests.
 * In production, it returns the actual NextAuth session.
 * In tests, this function can be mocked to return test session data.
 *
 * @returns Session object or null if not authenticated
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}
