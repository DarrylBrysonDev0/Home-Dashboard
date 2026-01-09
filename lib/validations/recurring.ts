import { z } from "zod";
import { recurringFrequencySchema, type RecurringFrequency } from "./filters";
import { confidenceLevelSchema, type ConfidenceLevel } from "./analytics";

/**
 * Recurring transaction validation schemas
 * Based on data-model.md RecurringTransaction entity and contracts/analytics-api.yaml
 */

// Re-export types for convenience
export { RecurringFrequency, ConfidenceLevel };
export { recurringFrequencySchema, confidenceLevelSchema };

/**
 * Recurring pattern schema - represents a detected recurring transaction pattern
 *
 * Pattern detection criteria:
 * - Minimum 3 occurrences required
 * - Transactions grouped by fuzzy description similarity (80%+)
 * - Frequency detected based on interval regularity
 * - Confidence scored based on regularity, amount consistency, and occurrence count
 */
export const recurringPatternSchema = z.object({
  /** Generated unique identifier for the recurring pattern */
  pattern_id: z.number().int(),

  /** Normalized description pattern (e.g., "Netflix Subscription") */
  description_pattern: z.string(),

  /** Account where recurring transaction occurs */
  account_id: z.string(),

  /** Category of the recurring transaction */
  category: z.string(),

  /** Average transaction amount across all occurrences */
  avg_amount: z.number(),

  /** Detected frequency pattern */
  frequency: recurringFrequencySchema,

  /** Predicted date of next occurrence */
  next_expected_date: z.coerce.date(),

  /** Qualitative confidence classification */
  confidence_level: confidenceLevelSchema,

  /** Numeric confidence score (50-100) */
  confidence_score: z.number().int().min(50).max(100),

  /** Number of times this pattern has occurred */
  occurrence_count: z.number().int().min(3),

  /** Date of most recent occurrence */
  last_occurrence_date: z.coerce.date(),

  /** Whether user has manually confirmed this pattern */
  is_confirmed: z.boolean(),

  /** Whether user has rejected this pattern (prevents re-detection) */
  is_rejected: z.boolean(),
});

export type RecurringPattern = z.infer<typeof recurringPatternSchema>;

/**
 * Confidence score result from the scoring algorithm
 */
export interface ConfidenceScoreResult {
  /** Numeric score (50-100) */
  score: number;
  /** Qualitative level derived from score */
  level: ConfidenceLevel;
}

/**
 * Transaction group for pattern detection
 */
export interface TransactionGroup {
  /** Normalized description key */
  key: string;
  /** Original description from first transaction */
  description: string;
  /** Transactions in this group */
  transactions: TransactionForRecurring[];
}

/**
 * Minimal transaction interface for recurring detection
 * Contains only the fields needed for pattern detection
 */
export interface TransactionForRecurring {
  transaction_id: string;
  transaction_date: Date;
  account_id: string;
  description: string;
  category: string;
  subcategory: string | null;
  amount: number;
  transaction_type: "Income" | "Expense" | "Transfer";
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
}

/**
 * Parameters for recurring endpoint query
 */
export const recurringParamsSchema = z.object({
  account_id: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return val.split(",").map((id) => id.trim()).filter(Boolean);
    }),
  confidence_level: confidenceLevelSchema.optional(),
  frequency: recurringFrequencySchema.optional(),
});

export type RecurringParams = z.infer<typeof recurringParamsSchema>;

/**
 * Pattern ID for confirm/reject endpoints
 */
export const patternIdSchema = z.coerce.number().int().positive();
export type PatternId = z.infer<typeof patternIdSchema>;
