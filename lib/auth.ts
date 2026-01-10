import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  findUserByEmail,
  incrementFailedAttempts,
  resetFailedAttempts,
  isAccountLocked,
} from "@/lib/queries/auth";
import { verifyPassword } from "@/lib/utils/password";
import { loginSchema } from "@/lib/validations/auth";
import type { UserRole } from "@/types/next-auth";

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

      /**
       * Authorize function with account lockout protection (FR-001, FR-005)
       *
       * Flow:
       * 1. Validate credentials presence
       * 2. Look up user by email
       * 3. Check if account is locked (FR-005)
       * 4. Verify password with bcrypt (FR-002)
       * 5. On failure: increment failed attempts, lock after 5 failures
       * 6. On success: reset failed attempts counter
       */
      async authorize(credentials) {
        // 1. Validate credentials
        const validation = loginSchema.safeParse(credentials);
        if (!validation.success) {
          return null;
        }

        const { email, password } = validation.data;

        // 2. Look up user by email
        const user = await findUserByEmail(email);
        if (!user) {
          // Don't reveal whether email exists (security best practice)
          return null;
        }

        // 3. Check if account is locked
        if (isAccountLocked(user)) {
          const minutesRemaining = Math.ceil(
            (user.lockedUntil!.getTime() - Date.now()) / (60 * 1000)
          );
          throw new Error(
            `Account locked due to too many failed attempts. Try again in ${minutesRemaining} minute(s).`
          );
        }

        // 4. Verify password
        const isPasswordValid = await verifyPassword(password, user.passwordHash);

        if (!isPasswordValid) {
          // 5. Increment failed attempts on password failure
          await incrementFailedAttempts(user.id);
          return null;
        }

        // 6. Reset failed attempts on successful login
        await resetFailedAttempts(user.id);

        // Return user object for JWT token creation
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
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
