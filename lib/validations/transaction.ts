import { z } from "zod";
import {
  accountIdSchema,
  accountTypeSchema,
  transactionTypeSchema,
  recurringFrequencySchema,
} from "./filters";

/**
 * Transaction validation schemas for CRUD operations
 * Based on OpenAPI spec in contracts/transactions-api.yaml
 */

// Transaction create schema - all required fields for new transactions
export const transactionCreateSchema = z
  .object({
    transaction_date: z.coerce.date(),
    transaction_time: z.string().optional().nullable(),
    account_id: accountIdSchema,
    account_name: z.string().min(1).max(100),
    account_type: accountTypeSchema,
    account_owner: z.string().min(1),
    description: z.string().min(1).max(255),
    category: z.string().min(1).max(50),
    subcategory: z.string().max(50).optional().nullable(),
    amount: z.number().refine((val) => val !== 0, {
      message: "Amount must be non-zero",
    }),
    transaction_type: transactionTypeSchema,
    balance_after: z.number().optional().nullable(),
    is_recurring: z.boolean().default(false),
    recurring_frequency: recurringFrequencySchema.optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // If is_recurring is true, recurring_frequency must be set
      if (data.is_recurring && !data.recurring_frequency) {
        return false;
      }
      return true;
    },
    {
      message: "recurring_frequency is required when is_recurring is true",
      path: ["recurring_frequency"],
    }
  )
  .refine(
    (data) => {
      // Transaction date cannot be in the future
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return data.transaction_date <= today;
    },
    {
      message: "Transaction date cannot be in the future",
      path: ["transaction_date"],
    }
  );
export type TransactionCreate = z.infer<typeof transactionCreateSchema>;

// Transaction update schema - all fields optional for partial updates
export const transactionUpdateSchema = z
  .object({
    transaction_date: z.coerce.date().optional(),
    transaction_time: z.string().optional().nullable(),
    description: z.string().min(1).max(255).optional(),
    category: z.string().min(1).max(50).optional(),
    subcategory: z.string().max(50).optional().nullable(),
    amount: z
      .number()
      .refine((val) => val !== 0, {
        message: "Amount must be non-zero",
      })
      .optional(),
    transaction_type: transactionTypeSchema.optional(),
    balance_after: z.number().optional().nullable(),
    is_recurring: z.boolean().optional(),
    recurring_frequency: recurringFrequencySchema.optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      // If is_recurring is explicitly set to true, recurring_frequency must be provided
      if (data.is_recurring === true && !data.recurring_frequency) {
        return false;
      }
      return true;
    },
    {
      message: "recurring_frequency is required when is_recurring is true",
      path: ["recurring_frequency"],
    }
  )
  .refine(
    (data) => {
      // Transaction date cannot be in the future
      if (data.transaction_date) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return data.transaction_date <= today;
      }
      return true;
    },
    {
      message: "Transaction date cannot be in the future",
      path: ["transaction_date"],
    }
  );
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;

// Transaction ID parameter schema
export const transactionIdSchema = z.coerce.number().int().positive();
export type TransactionId = z.infer<typeof transactionIdSchema>;

// Sort field options
export const transactionSortFieldSchema = z.enum([
  "transaction_date",
  "amount",
  "category",
  "description",
]);
export type TransactionSortField = z.infer<typeof transactionSortFieldSchema>;

// Sort order
export const sortOrderSchema = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof sortOrderSchema>;

// Transaction list query parameters
export const transactionListParamsSchema = z
  .object({
    // Filters
    account_id: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === "") return undefined;
        return val.split(",").map((id) => id.trim()).filter(Boolean);
      }),
    category: z.string().optional(),
    transaction_type: transactionTypeSchema.optional(),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    is_recurring: z
      .string()
      .optional()
      .transform((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        return undefined;
      }),
    search: z.string().optional(),
    // Sorting
    sort_by: transactionSortFieldSchema.default("transaction_date"),
    sort_order: sortOrderSchema.default("desc"),
    // Pagination
    limit: z.coerce.number().int().min(1).max(1000).default(100),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date;
      }
      return true;
    },
    { message: "start_date must be before or equal to end_date" }
  );
export type TransactionListParams = z.infer<typeof transactionListParamsSchema>;

// CSV export query parameters
export const csvExportParamsSchema = z
  .object({
    account_id: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === "") return undefined;
        return val.split(",").map((id) => id.trim()).filter(Boolean);
      }),
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
    category: z.string().optional(),
    transaction_type: transactionTypeSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.start_date <= data.end_date;
      }
      return true;
    },
    { message: "start_date must be before or equal to end_date" }
  );
export type CsvExportParams = z.infer<typeof csvExportParamsSchema>;

// Transaction response schema (for type inference, not runtime validation)
export const transactionSchema = z.object({
  transaction_id: z.number().int(),
  transaction_date: z.coerce.date(),
  transaction_time: z.string().nullable(),
  account_id: z.string(),
  account_name: z.string(),
  account_type: accountTypeSchema,
  account_owner: z.string(),
  description: z.string(),
  category: z.string(),
  subcategory: z.string().nullable(),
  amount: z.number(),
  transaction_type: transactionTypeSchema,
  balance_after: z.number().nullable(),
  is_recurring: z.boolean(),
  recurring_frequency: recurringFrequencySchema.nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type Transaction = z.infer<typeof transactionSchema>;
