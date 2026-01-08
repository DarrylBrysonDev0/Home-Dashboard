import { z } from "zod";

/**
 * Common filter validation schemas for query parameters
 * Used across transactions, analytics, and export API routes
 */

// Quick-select date range keys matching /api/filters/date-ranges
export const dateRangeKeySchema = z.enum([
  "this-month",
  "last-month",
  "last-3-months",
  "last-6-months",
  "ytd",
  "last-12-months",
  "all-time",
  "custom",
]);
export type DateRangeKey = z.infer<typeof dateRangeKeySchema>;

// Date filter with coercion from string (query params come as strings)
export const dateFilterSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return data.start_date <= data.end_date;
    }
    return true;
  },
  { message: "start_date must be before or equal to end_date" }
);
export type DateFilter = z.infer<typeof dateFilterSchema>;

// Account filter - comma-separated account IDs transformed to array
export const accountFilterSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === "") return undefined;
    return val.split(",").map((id) => id.trim()).filter(Boolean);
  });
export type AccountFilter = z.infer<typeof accountFilterSchema>;

// Account ID format validation (ACC-{OWNER}-{TYPE})
export const accountIdSchema = z
  .string()
  .regex(/^ACC-[A-Z0-9]+-[A-Z]+$/, {
    message: "Account ID must match format ACC-{OWNER}-{TYPE}",
  });
export type AccountId = z.infer<typeof accountIdSchema>;

// Account type enum
export const accountTypeSchema = z.enum(["Checking", "Savings"]);
export type AccountType = z.infer<typeof accountTypeSchema>;

// Account owner enum
export const accountOwnerSchema = z.enum(["Joint", "User1", "User2"]);
export type AccountOwner = z.infer<typeof accountOwnerSchema>;

// Category filter - comma-separated categories transformed to array
export const categoryFilterSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val.trim() === "") return undefined;
    return val.split(",").map((cat) => cat.trim()).filter(Boolean);
  });
export type CategoryFilter = z.infer<typeof categoryFilterSchema>;

// Transaction type filter
export const transactionTypeSchema = z.enum(["Income", "Expense", "Transfer"]);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionTypeFilterSchema = transactionTypeSchema.optional();

// Recurring frequency filter
export const recurringFrequencySchema = z.enum(["Weekly", "Biweekly", "Monthly"]);
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

// Combined base filter schema (used by most endpoints)
export const baseFilterSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  account_id: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return val.split(",").map((id) => id.trim()).filter(Boolean);
    }),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      return data.start_date <= data.end_date;
    }
    return true;
  },
  { message: "start_date must be before or equal to end_date" }
);
export type BaseFilter = z.infer<typeof baseFilterSchema>;

// Categories endpoint query params
export const categoriesFilterSchema = z.object({
  include_subcategories: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});
export type CategoriesFilter = z.infer<typeof categoriesFilterSchema>;
