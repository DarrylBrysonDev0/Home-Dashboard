import { z } from "zod";
import { recurringFrequencySchema } from "./filters";

/**
 * Analytics validation schemas for dashboard endpoints
 * Based on OpenAPI spec in contracts/analytics-api.yaml
 */

// Granularity for time-series data
export const granularitySchema = z.enum(["daily", "weekly", "monthly"]);
export type Granularity = z.infer<typeof granularitySchema>;

// Trend direction for KPIs
export const trendSchema = z.enum(["up", "down", "neutral"]);
export type Trend = z.infer<typeof trendSchema>;

// Confidence level for recurring detection
export const confidenceLevelSchema = z.enum(["High", "Medium", "Low"]);
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

// KPIs endpoint query parameters
export const kpiParamsSchema = z
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
export type KpiParams = z.infer<typeof kpiParamsSchema>;

// Cash flow endpoint query parameters
export const cashFlowParamsSchema = z
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
    granularity: granularitySchema.default("monthly"),
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
export type CashFlowParams = z.infer<typeof cashFlowParamsSchema>;

// Categories endpoint query parameters
export const categoryParamsSchema = z
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
    include_subcategories: z
      .string()
      .optional()
      .transform((val) => val === "true"),
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
export type CategoryParams = z.infer<typeof categoryParamsSchema>;

// Account balance trends endpoint query parameters
export const accountTrendsParamsSchema = z
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
    granularity: granularitySchema.default("monthly"),
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
export type AccountTrendsParams = z.infer<typeof accountTrendsParamsSchema>;

// Recurring transactions endpoint query parameters
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

// Recurring pattern ID parameter
export const patternIdSchema = z.coerce.number().int().positive();
export type PatternId = z.infer<typeof patternIdSchema>;

// Transfer flow endpoint query parameters
export const transferFlowParamsSchema = z
  .object({
    start_date: z.coerce.date().optional(),
    end_date: z.coerce.date().optional(),
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
export type TransferFlowParams = z.infer<typeof transferFlowParamsSchema>;

// Response schemas for type inference (not runtime validation of outgoing data)

// KPI response
export const kpiResponseSchema = z.object({
  net_cash_flow: z.number(),
  total_balance: z.number(),
  month_over_month_change: z.object({
    percentage: z.number(),
    trend: trendSchema,
  }),
  recurring_expenses: z.number(),
  largest_expense: z.object({
    amount: z.number(),
    description: z.string(),
    category: z.string(),
    date: z.coerce.date(),
  }).nullable(),
});
export type KpiResponse = z.infer<typeof kpiResponseSchema>;

// Cash flow period item
export const cashFlowPeriodSchema = z.object({
  period: z.string(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  income: z.number(),
  expenses: z.number(),
  net: z.number(),
});
export type CashFlowPeriod = z.infer<typeof cashFlowPeriodSchema>;

// Category breakdown item
export const categoryBreakdownSchema = z.object({
  category: z.string(),
  amount: z.number(),
  percentage: z.number(),
  transaction_count: z.number().int(),
  subcategories: z
    .array(
      z.object({
        subcategory: z.string(),
        amount: z.number(),
        percentage: z.number(),
        transaction_count: z.number().int(),
      })
    )
    .optional(),
});
export type CategoryBreakdown = z.infer<typeof categoryBreakdownSchema>;

// Account balance point
export const balancePointSchema = z.object({
  date: z.coerce.date(),
  balance: z.number(),
});
export type BalancePoint = z.infer<typeof balancePointSchema>;

// Account with balance trend
export const accountTrendSchema = z.object({
  account_id: z.string(),
  account_name: z.string(),
  balances: z.array(balancePointSchema),
});
export type AccountTrend = z.infer<typeof accountTrendSchema>;

// Recurring transaction pattern
export const recurringPatternSchema = z.object({
  pattern_id: z.number().int(),
  description_pattern: z.string(),
  account_id: z.string(),
  category: z.string(),
  avg_amount: z.number(),
  frequency: recurringFrequencySchema,
  next_expected_date: z.coerce.date(),
  confidence_level: confidenceLevelSchema,
  confidence_score: z.number().int().min(50).max(100),
  occurrence_count: z.number().int(),
  last_occurrence_date: z.coerce.date(),
  is_confirmed: z.boolean(),
  is_rejected: z.boolean(),
});
export type RecurringPattern = z.infer<typeof recurringPatternSchema>;

// Transfer flow item
export const transferFlowSchema = z.object({
  source_account_id: z.string(),
  source_account_name: z.string(),
  destination_account_id: z.string(),
  destination_account_name: z.string(),
  total_amount: z.number(),
  transfer_count: z.number().int(),
});
export type TransferFlow = z.infer<typeof transferFlowSchema>;
