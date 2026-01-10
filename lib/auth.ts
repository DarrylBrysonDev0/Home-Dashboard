import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * NextAuth.js configuration for household member authentication
 *
 * Features:
 * - Credentials provider with email/password
 * - JWT strategy with 7-day sessions
 * - Custom session callbacks to include user ID and role
 *
 * @see contracts/auth-api.md
 */
export const authOptions: NextAuthOptions = {
  // Use JWT strategy (no database sessions)
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds (FR-003)
  },

  // Authentication providers
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // Authorize function will be implemented in T036
      // For now, this is a stub that rejects all login attempts
      async authorize(credentials) {
        // TODO: T036 - Implement full authorize logic:
        // 1. Validate credentials presence
        // 2. Look up user by email (lib/queries/auth.ts)
        // 3. Check account lockout status
        // 4. Verify password with bcrypt
        // 5. Handle failed login attempts
        // 6. Reset failed attempts on success

        // Stub implementation - will be replaced in T036
        throw new Error("Authentication not yet implemented - complete T036");
      },
    }),
  ],

  // Custom pages
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // Callbacks to customize JWT and session
  callbacks: {
    /**
     * JWT callback - runs whenever a JWT is created or updated
     * Adds custom claims (id, role) to the token
     */
    async jwt({ token, user }) {
      // On sign in, user object is available
      if (user) {
        token.id = user.id;
        token.role = user.role as "ADMIN" | "MEMBER";
      }
      return token;
    },

    /**
     * Session callback - runs whenever a session is checked
     * Transforms JWT claims into session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MEMBER";
      }
      return session;
    },
  },

  // Security options
  secret: process.env.NEXTAUTH_SECRET,
};
