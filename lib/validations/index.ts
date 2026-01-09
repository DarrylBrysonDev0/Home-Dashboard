/**
 * Validation schemas index
 * Re-exports all Zod schemas for easy importing
 */

// Filter schemas
export {
  dateRangeKeySchema,
  dateFilterSchema,
  accountFilterSchema,
  accountIdSchema,
  accountTypeSchema,
  accountOwnerSchema,
  categoryFilterSchema,
  transactionTypeSchema,
  transactionTypeFilterSchema,
  recurringFrequencySchema,
  baseFilterSchema,
  categoriesFilterSchema,
} from "./filters";

export type {
  DateRangeKey,
  DateFilter,
  AccountFilter,
  AccountId,
  AccountType,
  AccountOwner,
  CategoryFilter,
  TransactionType,
  RecurringFrequency,
  BaseFilter,
  CategoriesFilter,
} from "./filters";

// Transaction schemas
export {
  transactionCreateSchema,
  transactionUpdateSchema,
  transactionIdSchema,
  transactionSortFieldSchema,
  sortOrderSchema,
  transactionListParamsSchema,
  csvExportParamsSchema,
  transactionSchema,
} from "./transaction";

export type {
  TransactionCreate,
  TransactionUpdate,
  TransactionId,
  TransactionSortField,
  SortOrder,
  TransactionListParams,
  CsvExportParams,
  Transaction,
} from "./transaction";

// Analytics schemas
export {
  granularitySchema,
  trendSchema,
  confidenceLevelSchema,
  kpiParamsSchema,
  cashFlowParamsSchema,
  categoryParamsSchema,
  accountTrendsParamsSchema,
  recurringParamsSchema,
  patternIdSchema,
  transferFlowParamsSchema,
  kpiResponseSchema,
  cashFlowPeriodSchema,
  categoryBreakdownSchema,
  balancePointSchema,
  accountTrendSchema,
  recurringPatternSchema,
  transferFlowSchema,
} from "./analytics";

export type {
  Granularity,
  Trend,
  ConfidenceLevel,
  KpiParams,
  CashFlowParams,
  CategoryParams,
  AccountTrendsParams,
  RecurringParams,
  PatternId,
  TransferFlowParams,
  KpiResponse,
  CashFlowPeriod,
  CategoryBreakdown,
  BalancePoint,
  AccountTrend,
  RecurringPattern,
  TransferFlow,
} from "./analytics";
