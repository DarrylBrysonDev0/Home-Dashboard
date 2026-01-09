/**
 * Recurring transaction detection algorithm
 *
 * Detects patterns in transaction history using:
 * - Fuzzy description matching (80%+ Levenshtein similarity)
 * - Frequency detection (Weekly ~7d, Biweekly ~14d, Monthly ~30d)
 * - Confidence scoring based on regularity, amount consistency, occurrence count
 *
 * Based on: data-model.md confidence scoring formula and contracts/analytics-api.yaml
 */

import { prisma } from "@/lib/db";
import type {
  RecurringPattern,
  RecurringFrequency,
  ConfidenceLevel,
  ConfidenceScoreResult,
  TransactionForRecurring,
  RecurringParams,
} from "@/lib/validations/recurring";

// In-memory pattern storage for confirm/reject state
// In production, this would be stored in the database
// Uses pattern key (account_id + description) for stable identification
// Note: We use globalThis to persist state across vi.resetModules() in tests

interface PatternGlobalState {
  patternStates: Map<string, { is_confirmed: boolean; is_rejected: boolean }>;
  patternIdToKey: Map<number, string>;
  patternKeyToId: Map<string, number>;
  nextPatternId: number;
}

declare const globalThis: {
  __recurringPatternState?: PatternGlobalState;
} & typeof global;

function getGlobalState(): PatternGlobalState {
  if (!globalThis.__recurringPatternState) {
    globalThis.__recurringPatternState = {
      patternStates: new Map(),
      patternIdToKey: new Map(),
      patternKeyToId: new Map(),
      nextPatternId: 1,
    };
  }
  return globalThis.__recurringPatternState;
}

/**
 * Reset internal state (for testing purposes)
 * This clears all pattern ID mappings and state
 */
export function resetPatternState(): void {
  globalThis.__recurringPatternState = {
    patternStates: new Map(),
    patternIdToKey: new Map(),
    patternKeyToId: new Map(),
    nextPatternId: 1,
  };
}

/**
 * Get or create a stable pattern ID for a given key
 * The key is based on account_id and normalized description
 */
function getStablePatternId(accountId: string, normalizedDesc: string): number {
  const state = getGlobalState();
  const key = `${accountId}::${normalizedDesc}`;

  if (state.patternKeyToId.has(key)) {
    return state.patternKeyToId.get(key)!;
  }

  const id = state.nextPatternId++;
  state.patternKeyToId.set(key, id);
  state.patternIdToKey.set(id, key);
  return id;
}

/**
 * Get pattern state by pattern ID
 */
function getPatternStateById(patternId: number): { is_confirmed: boolean; is_rejected: boolean } {
  const state = getGlobalState();
  const key = state.patternIdToKey.get(patternId);
  if (!key) {
    return { is_confirmed: false, is_rejected: false };
  }
  return state.patternStates.get(key) ?? { is_confirmed: false, is_rejected: false };
}

/**
 * Set pattern state by pattern ID
 */
function setPatternStateById(
  patternId: number,
  newState: { is_confirmed: boolean; is_rejected: boolean }
): boolean {
  const state = getGlobalState();
  const key = state.patternIdToKey.get(patternId);
  if (!key) {
    return false;
  }
  state.patternStates.set(key, newState);
  return true;
}

// ----- EXPORTED PURE FUNCTIONS (for unit testing) -----

/**
 * Detect recurring patterns from a list of transactions
 *
 * @param transactions - Array of transactions to analyze
 * @returns Array of detected recurring patterns
 */
export function detectRecurringPatterns(
  transactions: TransactionForRecurring[]
): RecurringPattern[] {
  // Filter out transfers - they shouldn't be detected as recurring
  const nonTransfers = transactions.filter(
    (t) => t.transaction_type !== "Transfer"
  );

  if (nonTransfers.length === 0) {
    return [];
  }

  // Group transactions by normalized description (fuzzy matching)
  const descriptionGroups = groupTransactionsByDescription(nonTransfers);

  // Split groups by account to detect patterns per account
  const groups = splitGroupsByAccount(descriptionGroups);

  const patterns: RecurringPattern[] = [];

  for (const [groupKey, groupTxns] of groups) {
    // Require minimum 3 occurrences for pattern detection
    if (groupTxns.length < 3) {
      continue;
    }

    // Get transaction dates sorted chronologically
    const dates = groupTxns
      .map((t) => new Date(t.transaction_date))
      .sort((a, b) => a.getTime() - b.getTime());

    // Detect frequency from date intervals
    const frequency = detectFrequency(dates);

    // Skip if no regular frequency detected
    if (!frequency) {
      continue;
    }

    // Calculate confidence score
    const { score, level } = calculateConfidenceScore(groupTxns);

    // Skip patterns with very low confidence (below 50)
    if (score < 50) {
      continue;
    }

    // Calculate average amount
    const amounts = groupTxns.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Get last occurrence date
    const lastOccurrenceDate = dates[dates.length - 1];

    // Calculate next expected date
    const nextExpectedDate = calculateNextExpectedDate(lastOccurrenceDate, frequency);

    // Get first transaction for description pattern
    const firstTxn = groupTxns[0];

    // Generate stable pattern ID based on account + description
    const normalizedDesc = normalizeDescription(firstTxn.description);
    const patternId = getStablePatternId(firstTxn.account_id, normalizedDesc);
    const state = getPatternStateById(patternId);

    patterns.push({
      pattern_id: patternId,
      description_pattern: firstTxn.description,
      account_id: firstTxn.account_id,
      category: firstTxn.category,
      avg_amount: Math.round(avgAmount * 100) / 100,
      frequency,
      next_expected_date: nextExpectedDate ?? new Date(),
      confidence_level: level,
      confidence_score: score,
      occurrence_count: groupTxns.length,
      last_occurrence_date: lastOccurrenceDate,
      is_confirmed: state.is_confirmed,
      is_rejected: state.is_rejected,
    });
  }

  // Sort by confidence score descending
  return patterns.sort((a, b) => b.confidence_score - a.confidence_score);
}

/**
 * Group transactions by normalized description using fuzzy matching
 * Descriptions with 80%+ similarity are grouped together
 *
 * @param transactions - Array of transactions to group
 * @returns Map of normalized key to transaction array
 */
export function groupTransactionsByDescription(
  transactions: TransactionForRecurring[]
): Map<string, TransactionForRecurring[]> {
  const groups = new Map<string, TransactionForRecurring[]>();

  for (const txn of transactions) {
    const normalized = normalizeDescription(txn.description);

    // Check if this description matches an existing group (80%+ similarity)
    let matchedKey: string | null = null;

    for (const [existingKey] of groups) {
      const similarity = calculateDescriptionSimilarity(normalized, existingKey);
      if (similarity >= 0.8) {
        matchedKey = existingKey;
        break;
      }
    }

    if (matchedKey) {
      groups.get(matchedKey)!.push(txn);
    } else {
      // Create new group with this normalized description as key
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push(txn);
    }
  }

  return groups;
}

/**
 * Further split transaction groups by account_id
 * This ensures patterns are detected per account
 *
 * @param groups - Map from groupTransactionsByDescription
 * @returns Map with account-specific groups
 */
function splitGroupsByAccount(
  groups: Map<string, TransactionForRecurring[]>
): Map<string, TransactionForRecurring[]> {
  const accountGroups = new Map<string, TransactionForRecurring[]>();

  for (const [descKey, transactions] of groups) {
    // Group transactions by account within this description group
    const byAccount = new Map<string, TransactionForRecurring[]>();

    for (const txn of transactions) {
      if (!byAccount.has(txn.account_id)) {
        byAccount.set(txn.account_id, []);
      }
      byAccount.get(txn.account_id)!.push(txn);
    }

    // Create separate groups for each account
    for (const [accountId, accountTxns] of byAccount) {
      const key = `${accountId}::${descKey}`;
      accountGroups.set(key, accountTxns);
    }
  }

  return accountGroups;
}

/**
 * Normalize a transaction description for comparison
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes reference numbers, dates, and trailing numbers
 *
 * @param description - Raw transaction description
 * @returns Normalized description string
 */
export function normalizeDescription(description: string): string {
  let normalized = description.toLowerCase().trim();

  // Remove reference numbers (REF#12345, #12345, etc.)
  normalized = normalized.replace(/ref#?\d+/gi, "");
  normalized = normalized.replace(/#\d+/g, "");

  // Remove dates (MM/DD/YYYY, YYYY-MM-DD, etc.)
  normalized = normalized.replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, "");
  normalized = normalized.replace(/\d{4}-\d{2}-\d{2}/g, "");

  // Remove trailing long numbers (like VENMO PAYMENT 1234567890)
  normalized = normalized.replace(/\s+\d{7,}$/g, "");

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Calculate similarity between two description strings using Levenshtein distance
 *
 * @param str1 - First string (should be normalized)
 * @param str2 - Second string (should be normalized)
 * @returns Similarity score between 0 and 1
 */
export function calculateDescriptionSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Handle empty strings
  if (s1.length === 0 && s2.length === 0) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  // Convert distance to similarity (0 to 1)
  return 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create distance matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Detect the frequency pattern from a list of dates
 *
 * @param dates - Array of dates sorted chronologically
 * @returns Detected frequency or null if irregular
 */
export function detectFrequency(dates: Date[]): RecurringFrequency | null {
  if (dates.length < 3) {
    return null;
  }

  // Sort dates chronologically
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Calculate intervals between consecutive dates (in days)
  const intervals: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const diffMs = sortedDates[i].getTime() - sortedDates[i - 1].getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    intervals.push(diffDays);
  }

  // Calculate average interval
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // Determine frequency based on average interval
  // Weekly: 5-9 days (targeting ~7)
  // Biweekly: 11-17 days (targeting ~14)
  // Monthly: 25-35 days (targeting ~30)

  if (avgInterval >= 5 && avgInterval <= 9) {
    // Verify consistency - check if most intervals are within range
    const weeklyCount = intervals.filter((i) => i >= 5 && i <= 9).length;
    if (weeklyCount >= intervals.length * 0.6) {
      return "Weekly";
    }
  }

  if (avgInterval >= 11 && avgInterval <= 17) {
    const biweeklyCount = intervals.filter((i) => i >= 11 && i <= 17).length;
    if (biweeklyCount >= intervals.length * 0.6) {
      return "Biweekly";
    }
  }

  if (avgInterval >= 25 && avgInterval <= 35) {
    const monthlyCount = intervals.filter((i) => i >= 25 && i <= 35).length;
    if (monthlyCount >= intervals.length * 0.6) {
      return "Monthly";
    }
  }

  // No clear pattern detected
  return null;
}

/**
 * Calculate confidence score for a group of recurring transactions
 *
 * Scoring formula (from data-model.md):
 * - Interval Regularity: Perfect (±1 day) = 50pts, Good (±2 days) = 40pts, Fair (±3 days) = 30pts
 * - Amount Consistency: CV < 0.05 = 40pts, CV < 0.10 = 30pts, CV < 0.20 = 20pts, else 0pts
 * - Occurrence Bonus: 3-4 = 0pts, 5-6 = 5pts, 7+ = 10pts
 *
 * @param transactions - Array of transactions in the pattern group
 * @returns Confidence score (50-100) and level (High/Medium/Low)
 */
export function calculateConfidenceScore(
  transactions: TransactionForRecurring[]
): ConfidenceScoreResult {
  if (transactions.length < 3) {
    return { score: 50, level: "Low" };
  }

  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  );

  // Calculate interval regularity score
  const intervalScore = calculateIntervalRegularityScore(sorted);

  // Calculate amount consistency score
  const amounts = sorted.map((t) => Math.abs(t.amount));
  const amountScore = calculateAmountConsistencyScore(amounts);

  // Calculate occurrence bonus
  const occurrenceBonus = transactions.length >= 7 ? 10 : transactions.length >= 5 ? 5 : 0;

  // Total score
  const totalScore = Math.min(100, intervalScore + amountScore + occurrenceBonus);

  // Determine confidence level
  let level: ConfidenceLevel;
  if (totalScore >= 90) {
    level = "High";
  } else if (totalScore >= 70) {
    level = "Medium";
  } else {
    level = "Low";
  }

  return {
    score: Math.round(totalScore),
    level,
  };
}

/**
 * Calculate interval regularity score (max 50 points)
 */
function calculateIntervalRegularityScore(
  transactions: TransactionForRecurring[]
): number {
  if (transactions.length < 2) return 0;

  const dates = transactions.map((t) => new Date(t.transaction_date));
  const intervals: number[] = [];

  for (let i = 1; i < dates.length; i++) {
    const diffMs = dates[i].getTime() - dates[i - 1].getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    intervals.push(diffDays);
  }

  if (intervals.length === 0) return 0;

  // Calculate expected interval based on detected frequency
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  let expectedInterval: number;

  if (avgInterval <= 9) {
    expectedInterval = 7; // Weekly
  } else if (avgInterval <= 17) {
    expectedInterval = 14; // Biweekly
  } else {
    expectedInterval = 30; // Monthly
  }

  // Calculate deviation from expected interval
  const deviations = intervals.map((i) => Math.abs(i - expectedInterval));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;

  // Score based on average deviation
  if (avgDeviation <= 1) {
    return 50; // Perfect
  } else if (avgDeviation <= 2) {
    return 40; // Good
  } else if (avgDeviation <= 3) {
    return 30; // Fair
  } else if (avgDeviation <= 5) {
    return 20; // Acceptable
  } else {
    return 10; // Poor but still recurring
  }
}

/**
 * Calculate amount consistency score using coefficient of variation (max 40 points)
 */
function calculateAmountConsistencyScore(amounts: number[]): number {
  if (amounts.length < 2) return 40;

  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  if (mean === 0) return 40;

  // Calculate standard deviation
  const squaredDiffs = amounts.map((a) => Math.pow(a - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV) = stdDev / mean
  const cv = stdDev / Math.abs(mean);

  // Score based on CV
  if (cv < 0.05) {
    return 40; // Very consistent
  } else if (cv < 0.10) {
    return 30; // Consistent
  } else if (cv < 0.20) {
    return 20; // Moderate variance
  } else {
    return 0; // High variance
  }
}

/**
 * Calculate the next expected occurrence date based on frequency
 *
 * @param lastDate - Date of the last occurrence
 * @param frequency - Detected frequency pattern
 * @returns Next expected date or null if frequency is null
 */
export function calculateNextExpectedDate(
  lastDate: Date,
  frequency: RecurringFrequency | null
): Date | null {
  if (!frequency) {
    return null;
  }

  const nextDate = new Date(lastDate);

  switch (frequency) {
    case "Weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "Biweekly":
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case "Monthly": {
      // Handle month rollover properly by clamping to last day of target month
      const originalDay = lastDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + 1);

      // If the day overflowed (e.g., Jan 31 -> Mar 3), clamp to last day of target month
      if (nextDate.getDate() < originalDay) {
        // Day overflowed, go back to last day of intended month
        nextDate.setDate(0); // Sets to last day of previous month
      }
      break;
    }
  }

  return nextDate;
}

// ----- DATABASE QUERY FUNCTIONS (for API endpoints) -----

/**
 * Get all transactions for recurring detection
 */
async function getAllTransactionsForRecurring(
  accountIds?: string[]
): Promise<TransactionForRecurring[]> {
  let whereClause = "1=1";

  if (accountIds && accountIds.length > 0) {
    const accountList = accountIds.map((id) => `'${id}'`).join(",");
    whereClause = `account_id IN (${accountList})`;
  }

  const result = await prisma.$queryRawUnsafe<
    Array<{
      transaction_id: string;
      transaction_date: Date;
      account_id: string;
      description: string | null;
      category: string | null;
      subcategory: string | null;
      amount: { toNumber: () => number } | number;
      transaction_type: string;
      is_recurring: boolean | null;
      recurring_frequency: string | null;
    }>
  >(`
    SELECT
      transaction_id,
      transaction_date,
      account_id,
      description,
      category,
      subcategory,
      amount,
      transaction_type,
      is_recurring,
      recurring_frequency
    FROM transactions
    WHERE ${whereClause}
    ORDER BY transaction_date ASC
  `);

  return result.map((r) => ({
    transaction_id: r.transaction_id,
    transaction_date: new Date(r.transaction_date),
    account_id: r.account_id,
    description: r.description ?? "",
    category: r.category ?? "Uncategorized",
    subcategory: r.subcategory,
    amount: typeof r.amount === "number" ? r.amount : r.amount.toNumber(),
    transaction_type: r.transaction_type as "Income" | "Expense" | "Transfer",
    is_recurring: r.is_recurring ?? false,
    recurring_frequency: r.recurring_frequency as RecurringFrequency | null,
  }));
}

/**
 * Get recurring patterns with optional filtering
 * Main function called by GET /api/analytics/recurring
 */
export async function getRecurringPatterns(
  params?: RecurringParams
): Promise<RecurringPattern[]> {
  // Fetch all transactions
  const transactions = await getAllTransactionsForRecurring(params?.account_id);

  // Detect patterns
  let patterns = detectRecurringPatterns(transactions);

  // Apply account filter (patterns already filtered by account in query)
  if (params?.account_id && params.account_id.length > 0) {
    patterns = patterns.filter((p) => params.account_id!.includes(p.account_id));
  }

  // Apply confidence level filter
  if (params?.confidence_level) {
    patterns = patterns.filter((p) => p.confidence_level === params.confidence_level);
  }

  // Apply frequency filter
  if (params?.frequency) {
    patterns = patterns.filter((p) => p.frequency === params.frequency);
  }

  return patterns;
}

/**
 * Confirm a recurring pattern
 * Sets is_confirmed = true for the pattern
 */
export async function confirmPattern(patternId: number): Promise<boolean> {
  // Check if the pattern ID is known
  const state = getGlobalState();
  if (!state.patternIdToKey.has(patternId)) {
    return false;
  }

  // Update state using stable key mapping
  return setPatternStateById(patternId, {
    is_confirmed: true,
    is_rejected: false, // Confirming unsets rejection
  });
}

/**
 * Reject a recurring pattern
 * Sets is_rejected = true for the pattern
 */
export async function rejectPattern(patternId: number): Promise<boolean> {
  // Check if the pattern ID is known
  const state = getGlobalState();
  if (!state.patternIdToKey.has(patternId)) {
    return false;
  }

  // Update state using stable key mapping
  return setPatternStateById(patternId, {
    is_rejected: true,
    is_confirmed: false, // Rejecting unsets confirmation
  });
}

/**
 * Check if a pattern exists (was detected)
 * Returns true if pattern_id is valid and was detected
 */
export async function patternExists(patternId: number): Promise<boolean> {
  // Check if we have this pattern ID mapped
  let state = getGlobalState();
  if (state.patternIdToKey.has(patternId)) {
    return true;
  }

  // If not mapped yet, detect patterns to populate the mapping
  await getRecurringPatterns();
  // Re-get state after detection (maps may have been updated)
  state = getGlobalState();
  return state.patternIdToKey.has(patternId);
}

/**
 * Get pattern state (confirm/reject status)
 */
export function getPatternState(
  patternId: number
): { is_confirmed: boolean; is_rejected: boolean } {
  return getPatternStateById(patternId);
}
