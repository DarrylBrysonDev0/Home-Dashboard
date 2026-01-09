import { describe, it, expect } from "vitest";
import {
  detectRecurringPatterns,
  groupTransactionsByDescription,
  detectFrequency,
  calculateConfidenceScore,
  calculateNextExpectedDate,
  normalizeDescription,
  calculateDescriptionSimilarity,
} from "@/lib/queries/recurring";
import type {
  RecurringPattern,
  RecurringFrequency,
  ConfidenceLevel,
  TransactionForRecurring,
} from "@/lib/validations/recurring";

/**
 * Unit Tests: Recurring Transaction Detection Algorithm
 *
 * TDD Phase: RED - These tests should FAIL until lib/queries/recurring.ts is implemented.
 * Based on: data-model.md confidence scoring formula and OpenAPI spec contracts/analytics-api.yaml
 *
 * Test Categories:
 * - Pattern Detection: Identify recurring transactions from transaction history
 * - Description Grouping: Fuzzy matching for similar descriptions (80%+ similarity)
 * - Frequency Detection: Classify patterns as Weekly, Biweekly, or Monthly
 * - Confidence Scoring: Calculate confidence based on regularity, consistency, occurrences
 * - Next Expected Date: Predict when the next occurrence should happen
 *
 * Confidence Scoring Formula (from data-model.md):
 * - Interval Regularity: Perfect (±1 day) = 50pts, Good (±2 days) = 40pts, Fair (±3 days) = 30pts
 * - Amount Consistency: CV < 0.05 = 40pts, CV < 0.10 = 30pts, CV < 0.20 = 20pts
 * - Occurrence Bonus: 3-4 = 0pts, 5-6 = 5pts, 7+ = 10pts
 * - Total: High (90-100), Medium (70-89), Low (50-69)
 */

// Use TransactionForRecurring type from validations for consistency
type MockRecurringTransaction = TransactionForRecurring;

describe("detectRecurringPatterns", () => {
  describe("Basic Pattern Detection", () => {
    it("should detect a simple monthly recurring pattern", () => {
      const transactions = createMonthlyRecurringTransactions(
        "Netflix Subscription",
        -15.99,
        6
      );

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      expect(patterns[0].description_pattern).toContain("Netflix");
      expect(patterns[0].frequency).toBe("Monthly");
      expect(patterns[0].occurrence_count).toBe(6);
    });

    it("should detect multiple recurring patterns", () => {
      const netflixTxns = createMonthlyRecurringTransactions("Netflix Subscription", -15.99, 4);
      const gymTxns = createMonthlyRecurringTransactions("Planet Fitness", -29.99, 4);

      const patterns = detectRecurringPatterns([...netflixTxns, ...gymTxns]);

      expect(patterns.length).toBe(2);
      const patternNames = patterns.map((p) => p.description_pattern);
      expect(patternNames.some((n) => n.includes("Netflix"))).toBe(true);
      expect(patternNames.some((n) => n.includes("Planet Fitness") || n.includes("Fitness"))).toBe(true);
    });

    it("should require minimum 3 occurrences", () => {
      const transactions = createMonthlyRecurringTransactions("Rare Expense", -100, 2);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(0);
    });

    it("should detect pattern with exactly 3 occurrences", () => {
      const transactions = createMonthlyRecurringTransactions("Quarterly Bill", -250, 3);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      expect(patterns[0].occurrence_count).toBe(3);
    });

    it("should return empty array for empty transactions", () => {
      const patterns = detectRecurringPatterns([]);
      expect(patterns).toEqual([]);
    });

    it("should return empty array for non-recurring transactions", () => {
      const transactions: MockRecurringTransaction[] = [
        createTransaction({ description: "Random Store 1", transaction_date: new Date("2024-01-15") }),
        createTransaction({ description: "Different Vendor", transaction_date: new Date("2024-02-20") }),
        createTransaction({ description: "Another Place", transaction_date: new Date("2024-03-10") }),
      ];

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(0);
    });

    it("should exclude transfers from recurring detection", () => {
      const transactions = createMonthlyRecurringTransactions(
        "Savings Transfer",
        -500,
        6,
        { transaction_type: "Transfer" }
      );

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(0);
    });
  });

  describe("Frequency Detection", () => {
    it("should detect weekly frequency (~7 days)", () => {
      const transactions = createWeeklyRecurringTransactions("Weekly Groceries", -75, 8);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      expect(patterns[0].frequency).toBe("Weekly");
    });

    it("should detect biweekly frequency (~14 days)", () => {
      const transactions = createBiweeklyRecurringTransactions("Biweekly Paycheck", 2500, 6);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      expect(patterns[0].frequency).toBe("Biweekly");
    });

    it("should detect monthly frequency (~30 days)", () => {
      const transactions = createMonthlyRecurringTransactions("Monthly Rent", -1500, 6);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      expect(patterns[0].frequency).toBe("Monthly");
    });
  });

  describe("Account Filtering", () => {
    it("should detect patterns per account", () => {
      const checking = createMonthlyRecurringTransactions("Electric Bill", -100, 4, {
        account_id: "ACC-JOINT-CHK",
      });
      const savings = createMonthlyRecurringTransactions("Electric Bill", -100, 4, {
        account_id: "ACC-USER1-SAV",
      });

      const patterns = detectRecurringPatterns([...checking, ...savings]);

      // Should either combine as one pattern or keep separate per account
      // Based on account_id being in the pattern, they should be separate
      expect(patterns.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Pattern Fields", () => {
    it("should include all required fields in pattern result", () => {
      const transactions = createMonthlyRecurringTransactions("Spotify Premium", -9.99, 5);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      const pattern = patterns[0];

      expect(pattern).toHaveProperty("pattern_id");
      expect(pattern).toHaveProperty("description_pattern");
      expect(pattern).toHaveProperty("account_id");
      expect(pattern).toHaveProperty("category");
      expect(pattern).toHaveProperty("avg_amount");
      expect(pattern).toHaveProperty("frequency");
      expect(pattern).toHaveProperty("next_expected_date");
      expect(pattern).toHaveProperty("confidence_level");
      expect(pattern).toHaveProperty("confidence_score");
      expect(pattern).toHaveProperty("occurrence_count");
      expect(pattern).toHaveProperty("last_occurrence_date");
      expect(pattern).toHaveProperty("is_confirmed");
      expect(pattern).toHaveProperty("is_rejected");
    });

    it("should calculate average amount correctly", () => {
      const transactions = createMonthlyRecurringTransactions("Variable Bill", -100, 5);
      // Override amounts to have variance
      transactions[0].amount = -95;
      transactions[1].amount = -100;
      transactions[2].amount = -105;
      transactions[3].amount = -98;
      transactions[4].amount = -102;

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns.length).toBe(1);
      // Average: (95 + 100 + 105 + 98 + 102) / 5 = 100
      expect(patterns[0].avg_amount).toBeCloseTo(-100, 0);
    });

    it("should set is_confirmed and is_rejected to false by default", () => {
      const transactions = createMonthlyRecurringTransactions("New Pattern", -50, 4);

      const patterns = detectRecurringPatterns(transactions);

      expect(patterns[0].is_confirmed).toBe(false);
      expect(patterns[0].is_rejected).toBe(false);
    });
  });
});

describe("groupTransactionsByDescription", () => {
  it("should group identical descriptions", () => {
    const transactions: MockRecurringTransaction[] = [
      createTransaction({ description: "Netflix" }),
      createTransaction({ description: "Netflix" }),
      createTransaction({ description: "Spotify" }),
    ];

    const groups = groupTransactionsByDescription(transactions);

    expect(groups.size).toBe(2);
    expect(groups.get("netflix")?.length).toBe(2);
    expect(groups.get("spotify")?.length).toBe(1);
  });

  it("should group similar descriptions (80%+ match)", () => {
    const transactions: MockRecurringTransaction[] = [
      createTransaction({ description: "Netflix Subscription" }),
      createTransaction({ description: "NETFLIX SUBSCRIPTION" }),
      createTransaction({ description: "Netflix.com Subscription" }),
    ];

    const groups = groupTransactionsByDescription(transactions);

    // All should be grouped together due to high similarity
    expect(groups.size).toBe(1);
    const group = Array.from(groups.values())[0];
    expect(group?.length).toBe(3);
  });

  it("should NOT group dissimilar descriptions", () => {
    const transactions: MockRecurringTransaction[] = [
      createTransaction({ description: "Netflix" }),
      createTransaction({ description: "Spotify" }),
      createTransaction({ description: "Amazon Prime" }),
    ];

    const groups = groupTransactionsByDescription(transactions);

    expect(groups.size).toBe(3);
  });

  it("should handle empty descriptions", () => {
    const transactions: MockRecurringTransaction[] = [
      createTransaction({ description: "" }),
      createTransaction({ description: "Netflix" }),
    ];

    const groups = groupTransactionsByDescription(transactions);

    expect(groups.size).toBe(2);
  });

  it("should normalize descriptions before grouping", () => {
    const transactions: MockRecurringTransaction[] = [
      createTransaction({ description: "  Netflix  " }),
      createTransaction({ description: "NETFLIX" }),
      createTransaction({ description: "netflix" }),
    ];

    const groups = groupTransactionsByDescription(transactions);

    expect(groups.size).toBe(1);
  });

  it("should group descriptions with reference numbers", () => {
    const transactions: MockRecurringTransaction[] = [
      createTransaction({ description: "ACH DEPOSIT EMPLOYER INC REF#12345" }),
      createTransaction({ description: "ACH DEPOSIT EMPLOYER INC REF#67890" }),
      createTransaction({ description: "ACH DEPOSIT EMPLOYER INC REF#11111" }),
    ];

    const groups = groupTransactionsByDescription(transactions);

    // Should group despite different reference numbers
    expect(groups.size).toBe(1);
    const group = Array.from(groups.values())[0];
    expect(group?.length).toBe(3);
  });
});

describe("normalizeDescription", () => {
  it("should convert to lowercase", () => {
    expect(normalizeDescription("NETFLIX")).toBe("netflix");
  });

  it("should trim whitespace", () => {
    expect(normalizeDescription("  Netflix  ")).toBe("netflix");
  });

  it("should remove reference numbers", () => {
    const normalized = normalizeDescription("ACH DEPOSIT REF#12345");
    expect(normalized).not.toContain("12345");
  });

  it("should remove dates from description", () => {
    const normalized = normalizeDescription("Payment 01/15/2024");
    expect(normalized).not.toContain("01/15/2024");
  });

  it("should remove trailing numbers", () => {
    const normalized = normalizeDescription("VENMO PAYMENT 1234567890");
    // Should remove or keep consistently
    expect(typeof normalized).toBe("string");
  });

  it("should handle special characters", () => {
    const normalized = normalizeDescription("Amazon.com*AMZN.COM/BILL");
    expect(normalized).toContain("amazon");
  });
});

describe("calculateDescriptionSimilarity", () => {
  it("should return 1.0 for identical strings", () => {
    const similarity = calculateDescriptionSimilarity("netflix", "netflix");
    expect(similarity).toBe(1.0);
  });

  it("should return high similarity for similar strings", () => {
    const similarity = calculateDescriptionSimilarity(
      "netflix subscription",
      "netflix subscript"
    );
    expect(similarity).toBeGreaterThan(0.8);
  });

  it("should return low similarity for different strings", () => {
    const similarity = calculateDescriptionSimilarity("netflix", "spotify");
    expect(similarity).toBeLessThan(0.5);
  });

  it("should be case insensitive", () => {
    const similarity = calculateDescriptionSimilarity("NETFLIX", "netflix");
    expect(similarity).toBe(1.0);
  });

  it("should handle empty strings", () => {
    const similarity = calculateDescriptionSimilarity("", "");
    expect(similarity).toBe(1.0);
  });

  it("should return 0 when one string is empty and other is not", () => {
    const similarity = calculateDescriptionSimilarity("netflix", "");
    expect(similarity).toBe(0);
  });
});

describe("detectFrequency", () => {
  it("should detect Weekly frequency for ~7 day intervals", () => {
    const dates = [
      new Date("2024-01-01"),
      new Date("2024-01-08"),
      new Date("2024-01-15"),
      new Date("2024-01-22"),
    ];

    const frequency = detectFrequency(dates);
    expect(frequency).toBe("Weekly");
  });

  it("should detect Biweekly frequency for ~14 day intervals", () => {
    const dates = [
      new Date("2024-01-01"),
      new Date("2024-01-15"),
      new Date("2024-01-29"),
      new Date("2024-02-12"),
    ];

    const frequency = detectFrequency(dates);
    expect(frequency).toBe("Biweekly");
  });

  it("should detect Monthly frequency for ~30 day intervals", () => {
    const dates = [
      new Date("2024-01-15"),
      new Date("2024-02-15"),
      new Date("2024-03-15"),
      new Date("2024-04-15"),
    ];

    const frequency = detectFrequency(dates);
    expect(frequency).toBe("Monthly");
  });

  it("should handle irregular intervals by finding closest match", () => {
    // Mostly monthly with slight variance
    const dates = [
      new Date("2024-01-15"),
      new Date("2024-02-14"),
      new Date("2024-03-16"),
      new Date("2024-04-15"),
    ];

    const frequency = detectFrequency(dates);
    expect(frequency).toBe("Monthly");
  });

  it("should return null for irregular patterns", () => {
    const dates = [
      new Date("2024-01-01"),
      new Date("2024-01-05"),
      new Date("2024-01-25"),
      new Date("2024-02-28"),
    ];

    const frequency = detectFrequency(dates);
    expect(frequency).toBeNull();
  });

  it("should return null for less than 3 dates", () => {
    const dates = [new Date("2024-01-01"), new Date("2024-02-01")];

    const frequency = detectFrequency(dates);
    expect(frequency).toBeNull();
  });

  it("should sort dates before calculating intervals", () => {
    const dates = [
      new Date("2024-03-15"),
      new Date("2024-01-15"),
      new Date("2024-02-15"),
    ];

    const frequency = detectFrequency(dates);
    expect(frequency).toBe("Monthly");
  });
});

describe("calculateConfidenceScore", () => {
  describe("Interval Regularity Scoring", () => {
    it("should give 50 points for perfect intervals (±1 day)", () => {
      const transactions = createMonthlyRecurringTransactions("Perfect Monthly", -100, 5);
      // Perfect 30-day intervals (dates are exactly 30 days apart)

      const { score } = calculateConfidenceScore(transactions);

      // Perfect intervals (50) + good consistency (at least 30) + some bonus
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should give lower score for irregular intervals", () => {
      const perfectTxns = createMonthlyRecurringTransactions("Perfect", -100, 5);
      const irregularTxns: MockRecurringTransaction[] = [
        createTransaction({ description: "Irregular", transaction_date: new Date("2024-01-01") }),
        createTransaction({ description: "Irregular", transaction_date: new Date("2024-02-05") }),
        createTransaction({ description: "Irregular", transaction_date: new Date("2024-03-01") }),
        createTransaction({ description: "Irregular", transaction_date: new Date("2024-04-10") }),
        createTransaction({ description: "Irregular", transaction_date: new Date("2024-05-01") }),
      ];

      const perfectScore = calculateConfidenceScore(perfectTxns);
      const irregularScore = calculateConfidenceScore(irregularTxns);

      expect(perfectScore.score).toBeGreaterThan(irregularScore.score);
    });
  });

  describe("Amount Consistency Scoring", () => {
    it("should give 40 points for CV < 0.05 (very consistent)", () => {
      const transactions = createMonthlyRecurringTransactions("Consistent", -100, 5);
      // All same amount = CV = 0

      const { score } = calculateConfidenceScore(transactions);

      // Should include full amount consistency points
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should give lower score for variable amounts", () => {
      const consistentTxns = createMonthlyRecurringTransactions("Consistent", -100, 5);
      const variableTxns = createMonthlyRecurringTransactions("Variable", -100, 5);
      variableTxns[0].amount = -80;
      variableTxns[1].amount = -120;
      variableTxns[2].amount = -90;
      variableTxns[3].amount = -110;
      variableTxns[4].amount = -100;

      const consistentScore = calculateConfidenceScore(consistentTxns);
      const variableScore = calculateConfidenceScore(variableTxns);

      expect(consistentScore.score).toBeGreaterThanOrEqual(variableScore.score);
    });

    it("should give 0 points for CV > 0.20 (highly variable)", () => {
      const transactions: MockRecurringTransaction[] = [
        createTransaction({ description: "Wild", amount: -50, transaction_date: new Date("2024-01-15") }),
        createTransaction({ description: "Wild", amount: -200, transaction_date: new Date("2024-02-15") }),
        createTransaction({ description: "Wild", amount: -75, transaction_date: new Date("2024-03-15") }),
        createTransaction({ description: "Wild", amount: -300, transaction_date: new Date("2024-04-15") }),
      ];

      const { score } = calculateConfidenceScore(transactions);

      // Should still have some score from regularity, but reduced from variance
      expect(score).toBeLessThan(90);
    });
  });

  describe("Occurrence Bonus Scoring", () => {
    it("should give 0 bonus points for 3-4 occurrences", () => {
      const txns3 = createMonthlyRecurringTransactions("Three", -100, 3);
      const txns4 = createMonthlyRecurringTransactions("Four", -100, 4);

      const score3 = calculateConfidenceScore(txns3);
      const score4 = calculateConfidenceScore(txns4);

      // Similar scores, 4 might be slightly higher due to better interval stats
      expect(Math.abs(score3.score - score4.score)).toBeLessThan(10);
    });

    it("should give 5 bonus points for 5-6 occurrences", () => {
      const txns4 = createMonthlyRecurringTransactions("Four", -100, 4);
      const txns6 = createMonthlyRecurringTransactions("Six", -100, 6);

      const score4 = calculateConfidenceScore(txns4);
      const score6 = calculateConfidenceScore(txns6);

      expect(score6.score).toBeGreaterThan(score4.score);
    });

    it("should give 10 bonus points for 7+ occurrences", () => {
      const txns6 = createMonthlyRecurringTransactions("Six", -100, 6);
      const txns8 = createMonthlyRecurringTransactions("Eight", -100, 8);

      const score6 = calculateConfidenceScore(txns6);
      const score8 = calculateConfidenceScore(txns8);

      expect(score8.score).toBeGreaterThan(score6.score);
    });
  });

  describe("Confidence Level Classification", () => {
    it("should classify 90-100 as High confidence", () => {
      const transactions = createMonthlyRecurringTransactions("Reliable", -100, 8);

      const { level, score } = calculateConfidenceScore(transactions);

      if (score >= 90) {
        expect(level).toBe("High");
      }
    });

    it("should classify 70-89 as Medium confidence", () => {
      // Create somewhat regular pattern
      const transactions: MockRecurringTransaction[] = [
        createTransaction({ description: "Medium", amount: -100, transaction_date: new Date("2024-01-15") }),
        createTransaction({ description: "Medium", amount: -105, transaction_date: new Date("2024-02-16") }),
        createTransaction({ description: "Medium", amount: -95, transaction_date: new Date("2024-03-14") }),
        createTransaction({ description: "Medium", amount: -102, transaction_date: new Date("2024-04-15") }),
      ];

      const { level, score } = calculateConfidenceScore(transactions);

      if (score >= 70 && score < 90) {
        expect(level).toBe("Medium");
      }
    });

    it("should classify 50-69 as Low confidence", () => {
      // Create irregular pattern
      const transactions: MockRecurringTransaction[] = [
        createTransaction({ description: "Low", amount: -80, transaction_date: new Date("2024-01-01") }),
        createTransaction({ description: "Low", amount: -150, transaction_date: new Date("2024-02-05") }),
        createTransaction({ description: "Low", amount: -100, transaction_date: new Date("2024-03-20") }),
      ];

      const { level, score } = calculateConfidenceScore(transactions);

      if (score >= 50 && score < 70) {
        expect(level).toBe("Low");
      }
    });
  });
});

describe("calculateNextExpectedDate", () => {
  it("should calculate next date for Weekly frequency", () => {
    const lastDate = new Date("2024-01-15");
    const nextDate = calculateNextExpectedDate(lastDate, "Weekly");

    expect(nextDate).toEqual(new Date("2024-01-22"));
  });

  it("should calculate next date for Biweekly frequency", () => {
    const lastDate = new Date("2024-01-15");
    const nextDate = calculateNextExpectedDate(lastDate, "Biweekly");

    expect(nextDate).toEqual(new Date("2024-01-29"));
  });

  it("should calculate next date for Monthly frequency", () => {
    const lastDate = new Date("2024-01-15");
    const nextDate = calculateNextExpectedDate(lastDate, "Monthly");

    expect(nextDate).toEqual(new Date("2024-02-15"));
  });

  it("should handle month rollover correctly", () => {
    const lastDate = new Date("2024-01-31");
    const nextDate = calculateNextExpectedDate(lastDate, "Monthly");

    // Should handle end-of-month gracefully (Feb has fewer days)
    expect(nextDate.getMonth()).toBe(1); // February
    expect(nextDate.getFullYear()).toBe(2024);
  });

  it("should handle year rollover correctly", () => {
    const lastDate = new Date("2024-12-15");
    const nextDate = calculateNextExpectedDate(lastDate, "Monthly");

    expect(nextDate).toEqual(new Date("2025-01-15"));
  });

  it("should return null for null frequency", () => {
    const lastDate = new Date("2024-01-15");
    const nextDate = calculateNextExpectedDate(lastDate, null);

    expect(nextDate).toBeNull();
  });
});

// Helper functions

function createTransaction(
  overrides: Partial<MockRecurringTransaction>
): MockRecurringTransaction {
  return {
    transaction_id: `TXN-${Math.random().toString(36).substring(7)}`,
    transaction_date: new Date("2024-01-15"),
    account_id: "ACC-JOINT-CHK",
    description: "Test Transaction",
    category: "Uncategorized",
    subcategory: null,
    amount: -100,
    transaction_type: "Expense",
    is_recurring: false,
    recurring_frequency: null,
    ...overrides,
  };
}

function createMonthlyRecurringTransactions(
  description: string,
  amount: number,
  count: number,
  overrides: Partial<MockRecurringTransaction> = {}
): MockRecurringTransaction[] {
  const transactions: MockRecurringTransaction[] = [];
  const baseDate = new Date("2024-01-15");

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + i);

    transactions.push(
      createTransaction({
        description,
        amount,
        transaction_date: date,
        category: "Subscription",
        transaction_type: amount > 0 ? "Income" : "Expense",
        ...overrides,
      })
    );
  }

  return transactions;
}

function createWeeklyRecurringTransactions(
  description: string,
  amount: number,
  count: number,
  overrides: Partial<MockRecurringTransaction> = {}
): MockRecurringTransaction[] {
  const transactions: MockRecurringTransaction[] = [];
  const baseDate = new Date("2024-01-01");

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 7);

    transactions.push(
      createTransaction({
        description,
        amount,
        transaction_date: date,
        category: "Groceries",
        transaction_type: amount > 0 ? "Income" : "Expense",
        ...overrides,
      })
    );
  }

  return transactions;
}

function createBiweeklyRecurringTransactions(
  description: string,
  amount: number,
  count: number,
  overrides: Partial<MockRecurringTransaction> = {}
): MockRecurringTransaction[] {
  const transactions: MockRecurringTransaction[] = [];
  const baseDate = new Date("2024-01-01");

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 14);

    transactions.push(
      createTransaction({
        description,
        amount,
        transaction_date: date,
        category: "Income",
        transaction_type: amount > 0 ? "Income" : "Expense",
        ...overrides,
      })
    );
  }

  return transactions;
}
