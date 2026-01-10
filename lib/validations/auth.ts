import { z } from "zod";

/**
 * Authentication validation schemas
 * Used for login, user creation, and user management API routes
 */

/**
 * Password validation schema (FR-004)
 * - Minimum 8 characters
 * - Maximum 72 characters (bcrypt limit)
 * - At least one number required
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/\d/, "Password must contain at least one number");

/**
 * Email validation schema
 * - Maximum 320 characters (RFC 5321 standard)
 */
export const emailSchema = z.string().email("Invalid email address").max(320);

/**
 * User role enum
 */
export const userRoleSchema = z.enum(["ADMIN", "MEMBER"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Hex color validation schema
 * Validates format: #RRGGBB
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format (must be #RRGGBB)");

/**
 * Login credentials schema
 * POST /api/auth/callback/credentials
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

/**
 * Create user schema
 * POST /api/users
 *
 * Used by admin to create new household member accounts (FR-032)
 */
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  password: passwordSchema,
  role: userRoleSchema.default("MEMBER"),
  avatarColor: hexColorSchema.optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update user schema
 * PUT /api/users/[id]
 *
 * Used by admin to update user details (FR-033)
 * All fields are optional - only provided fields will be updated
 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  name: z.string().min(1).max(100).optional(),
  password: passwordSchema.optional(),
  role: userRoleSchema.optional(),
  avatarColor: hexColorSchema.nullable().optional(),
  unlockAccount: z.boolean().optional(), // If true, resets lockout
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
