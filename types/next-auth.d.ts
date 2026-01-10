import { DefaultSession, DefaultUser } from "next-auth";

/**
 * User role type
 * Matches the role field in the User model (String field with ADMIN or MEMBER values)
 */
export type UserRole = "ADMIN" | "MEMBER";

/**
 * Type augmentations for NextAuth.js
 *
 * Extends the default Session and User types to include:
 * - user.id (from database)
 * - user.role (ADMIN or MEMBER)
 *
 * @see contracts/auth-api.md
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
