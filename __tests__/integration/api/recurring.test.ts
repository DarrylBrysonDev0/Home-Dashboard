import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  getTestPrisma,
} from "@/__tests__/helpers/test-db";
import { NextRequest } from "next/server";

// Dynamic imports for route handlers after env vars are set
let GET_recurring: typeof import("@/app/api/analytics/recurring/route").GET;
let POST_confirm: (
  req: NextRequest,
  context: { params: Promise<{ pattern_id: string }> }
) => Promise<Response>;
let POST_reject: (
  req: NextRequest,
  context: { params: Promise<{ pattern_id: string }> }
) => Promise<Response>;

/**
 * Integration Tests: Recurring Transactions API
 *
 * TDD Phase: RED - These tests should FAIL until the API routes are implemented.
 * Based on: OpenAPI spec contracts/analytics-api.yaml
 *
 * Endpoints Tested:
 * - GET /api/analytics/recurring - List detected recurring patterns
 * - POST /api/analytics/recurring/{pattern_id}/confirm - Confirm a pattern
 * - POST /api/analytics/recurring/{pattern_id}/reject - Reject a pattern
 *
 * Test Categories:
 * - Response structure validation
 * - Pattern detection from test data
 * - Filter parameters (confidence_level, frequency, account_id)
 * - Confirm/reject actions
 * - Error handling
 *
 * CRITICAL: User Story 7 requirement - "Automatically detect and display recurring transactions"
 */

describe("GET /api/analytics/recurring", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    // Clear module cache and reimport routes after env vars are set
    vi.resetModules();
    const recurringModule = await import("@/app/api/analytics/recurring/route");
    GET_recurring = recurringModule.GET;

    const confirmModule = await import(
      "@/app/api/analytics/recurring/[pattern_id]/confirm/route"
    );
    POST_confirm = confirmModule.POST;

    const rejectModule = await import(
      "@/app/api/analytics/recurring/[pattern_id]/reject/route"
    );
    POST_reject = rejectModule.POST;
  }, 120000); // Container startup can take time

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    txnCounter = 0;
  });

  describe("Response Structure", () => {
    it("should return data with recurring_transactions array", async () => {
      await seedRecurringPatternData();

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("recurring_transactions");
      expect(Array.isArray(json.data.recurring_transactions)).toBe(true);
    });

    it("should return pattern items with all required fields", async () => {
      await seedRecurringPatternData();

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(json.data.recurring_transactions.length).toBeGreaterThan(0);

      const pattern = json.data.recurring_transactions[0];
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

    it("should return numeric values for amount and scores", async () => {
      await seedRecurringPatternData();

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      const pattern = json.data.recurring_transactions[0];
      expect(typeof pattern.avg_amount).toBe("number");
      expect(typeof pattern.confidence_score).toBe("number");
      expect(typeof pattern.occurrence_count).toBe("number");
      expect(typeof pattern.pattern_id).toBe("number");
    });

    it("should return valid enum values for frequency and confidence", async () => {
      await seedRecurringPatternData();

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      const pattern = json.data.recurring_transactions[0];
      expect(["Weekly", "Biweekly", "Monthly"]).toContain(pattern.frequency);
      expect(["High", "Medium", "Low"]).toContain(pattern.confidence_level);
    });

    it("should return confidence_score between 50 and 100", async () => {
      await seedRecurringPatternData();

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.confidence_score).toBeGreaterThanOrEqual(50);
        expect(pattern.confidence_score).toBeLessThanOrEqual(100);
      }
    });

    it("should return occurrence_count >= 3", async () => {
      await seedRecurringPatternData();

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.occurrence_count).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("Pattern Detection", () => {
    it("should detect monthly recurring pattern", async () => {
      await seedMonthlyRecurringData("Netflix", -15.99, 6);

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.recurring_transactions.length).toBe(1);

      const pattern = json.data.recurring_transactions[0];
      expect(pattern.description_pattern).toContain("Netflix");
      expect(pattern.frequency).toBe("Monthly");
      expect(pattern.occurrence_count).toBe(6);
    });

    it("should detect weekly recurring pattern", async () => {
      await seedWeeklyRecurringData("Groceries Store", -75.00, 8);

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const groceryPattern = json.data.recurring_transactions.find(
        (p: { description_pattern: string }) =>
          p.description_pattern.toLowerCase().includes("groceries")
      );
      expect(groceryPattern).toBeDefined();
      expect(groceryPattern.frequency).toBe("Weekly");
    });

    it("should detect biweekly recurring pattern", async () => {
      await seedBiweeklyRecurringData("Paycheck Deposit", 2500.00, 6);

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      const paycheckPattern = json.data.recurring_transactions.find(
        (p: { description_pattern: string }) =>
          p.description_pattern.toLowerCase().includes("paycheck")
      );
      expect(paycheckPattern).toBeDefined();
      expect(paycheckPattern.frequency).toBe("Biweekly");
    });

    it("should detect multiple recurring patterns", async () => {
      await seedMonthlyRecurringData("Netflix Subscription", -15.99, 4);
      await seedMonthlyRecurringData("Spotify Premium", -9.99, 4);

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.recurring_transactions.length).toBe(2);
    });

    it("should NOT detect patterns with less than 3 occurrences", async () => {
      await seedMonthlyRecurringData("Rare Payment", -500.00, 2);

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Pattern with only 2 occurrences should not be detected
      expect(
        json.data.recurring_transactions.filter(
          (p: { description_pattern: string }) =>
            p.description_pattern.toLowerCase().includes("rare")
        ).length
      ).toBe(0);
    });

    it("should exclude transfers from recurring detection", async () => {
      await seedMonthlyRecurringData("Savings Transfer", -500.00, 6, "Transfer");

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Transfers should not be detected as recurring
      expect(
        json.data.recurring_transactions.filter(
          (p: { description_pattern: string }) =>
            p.description_pattern.toLowerCase().includes("transfer")
        ).length
      ).toBe(0);
    });

    it("should calculate average amount correctly", async () => {
      const prisma = getTestPrisma();
      // Create pattern with varying amounts
      await insertRecurringTransaction(prisma, {
        description: "Variable Bill",
        amount: -95.00,
        transaction_date: new Date("2024-01-15"),
      });
      await insertRecurringTransaction(prisma, {
        description: "Variable Bill",
        amount: -100.00,
        transaction_date: new Date("2024-02-15"),
      });
      await insertRecurringTransaction(prisma, {
        description: "Variable Bill",
        amount: -105.00,
        transaction_date: new Date("2024-03-15"),
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      const pattern = json.data.recurring_transactions[0];
      // Average should be -100
      expect(pattern.avg_amount).toBeCloseTo(-100, 0);
    });
  });

  describe("Filter Parameters", () => {
    it("should filter by confidence_level=High", async () => {
      await seedMixedConfidencePatterns();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?confidence_level=High"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.confidence_level).toBe("High");
      }
    });

    it("should filter by confidence_level=Medium", async () => {
      await seedMixedConfidencePatterns();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?confidence_level=Medium"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.confidence_level).toBe("Medium");
      }
    });

    it("should filter by confidence_level=Low", async () => {
      await seedMixedConfidencePatterns();

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?confidence_level=Low"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.confidence_level).toBe("Low");
      }
    });

    it("should filter by frequency=Weekly", async () => {
      await seedWeeklyRecurringData("Weekly Thing", -50, 6);
      await seedMonthlyRecurringData("Monthly Thing", -100, 4);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?frequency=Weekly"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.frequency).toBe("Weekly");
      }
    });

    it("should filter by frequency=Biweekly", async () => {
      await seedBiweeklyRecurringData("Biweekly Thing", 1000, 5);
      await seedMonthlyRecurringData("Monthly Thing", -100, 4);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?frequency=Biweekly"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.frequency).toBe("Biweekly");
      }
    });

    it("should filter by frequency=Monthly", async () => {
      await seedWeeklyRecurringData("Weekly Thing", -50, 6);
      await seedMonthlyRecurringData("Monthly Thing", -100, 4);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?frequency=Monthly"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.frequency).toBe("Monthly");
      }
    });

    it("should filter by account_id", async () => {
      await seedMonthlyRecurringData("Account1 Bill", -50, 4, "Expense", "ACC-USER1-CHK");
      await seedMonthlyRecurringData("Account2 Bill", -75, 4, "Expense", "ACC-USER2-SAV");

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?account_id=ACC-USER1-CHK"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.account_id).toBe("ACC-USER1-CHK");
      }
    });

    it("should filter by multiple account_ids", async () => {
      await seedMonthlyRecurringData("Account1 Bill", -50, 4, "Expense", "ACC-USER1-CHK");
      await seedMonthlyRecurringData("Account2 Bill", -75, 4, "Expense", "ACC-USER2-SAV");
      await seedMonthlyRecurringData("Account3 Bill", -100, 4, "Expense", "ACC-JOINT-CHK");

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?account_id=ACC-USER1-CHK,ACC-USER2-SAV"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(["ACC-USER1-CHK", "ACC-USER2-SAV"]).toContain(pattern.account_id);
      }
    });

    it("should combine multiple filters", async () => {
      await seedMonthlyRecurringData("Account1 Monthly", -100, 8, "Expense", "ACC-USER1-CHK");
      await seedWeeklyRecurringData("Account1 Weekly", -25, 10, "Expense", "ACC-USER1-CHK");
      await seedMonthlyRecurringData("Account2 Monthly", -100, 8, "Expense", "ACC-USER2-SAV");

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?account_id=ACC-USER1-CHK&frequency=Monthly"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      for (const pattern of json.data.recurring_transactions) {
        expect(pattern.account_id).toBe("ACC-USER1-CHK");
        expect(pattern.frequency).toBe("Monthly");
      }
    });
  });

  describe("Empty Data Handling", () => {
    it("should return empty array when no transactions exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.recurring_transactions).toEqual([]);
    });

    it("should return empty array when no recurring patterns detected", async () => {
      const prisma = getTestPrisma();
      // Insert random non-recurring transactions
      await insertRecurringTransaction(prisma, {
        description: "Random Purchase 1",
        amount: -50,
        transaction_date: new Date("2024-01-15"),
      });
      await insertRecurringTransaction(prisma, {
        description: "Different Vendor",
        amount: -75,
        transaction_date: new Date("2024-02-20"),
      });
      await insertRecurringTransaction(prisma, {
        description: "Another Thing",
        amount: -100,
        transaction_date: new Date("2024-03-10"),
      });

      const request = new NextRequest("http://localhost:3000/api/analytics/recurring");
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.recurring_transactions).toEqual([]);
    });

    it("should return empty array when filter has no matches", async () => {
      await seedMonthlyRecurringData("Netflix", -15.99, 4);

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?account_id=NONEXISTENT-ACCOUNT"
      );
      const response = await GET_recurring(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.recurring_transactions).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid confidence_level", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?confidence_level=Invalid"
      );
      const response = await GET_recurring(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });

    it("should return 400 for invalid frequency", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/recurring?frequency=InvalidFreq"
      );
      const response = await GET_recurring(request);

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json).toHaveProperty("error");
    });
  });
});

describe("POST /api/analytics/recurring/{pattern_id}/confirm", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    vi.resetModules();
    const confirmModule = await import(
      "@/app/api/analytics/recurring/[pattern_id]/confirm/route"
    );
    POST_confirm = confirmModule.POST;
  }, 120000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    txnCounter = 0;
  });

  it("should confirm a recurring pattern", async () => {
    await seedMonthlyRecurringData("Netflix", -15.99, 4);

    // First get the patterns to find the pattern_id
    const getRequest = new NextRequest("http://localhost:3000/api/analytics/recurring");
    const getResponse = await GET_recurring(getRequest);
    const getData = await getResponse.json();

    expect(getData.data.recurring_transactions.length).toBeGreaterThan(0);
    const patternId = getData.data.recurring_transactions[0].pattern_id;

    // Confirm the pattern
    const confirmRequest = new NextRequest(
      `http://localhost:3000/api/analytics/recurring/${patternId}/confirm`,
      { method: "POST" }
    );
    const confirmResponse = await POST_confirm(confirmRequest, {
      params: Promise.resolve({ pattern_id: String(patternId) }),
    });
    const confirmData = await confirmResponse.json();

    expect(confirmResponse.status).toBe(200);
    expect(confirmData.data).toHaveProperty("message");
    expect(confirmData.data.message).toContain("confirmed");
    expect(confirmData.data.pattern_id).toBe(patternId);
  });

  it("should update is_confirmed to true", async () => {
    await seedMonthlyRecurringData("Spotify", -9.99, 4);

    // Get patterns
    const getRequest = new NextRequest("http://localhost:3000/api/analytics/recurring");
    let getResponse = await GET_recurring(getRequest);
    let getData = await getResponse.json();
    const patternId = getData.data.recurring_transactions[0].pattern_id;

    // Initially not confirmed
    expect(getData.data.recurring_transactions[0].is_confirmed).toBe(false);

    // Confirm
    const confirmRequest = new NextRequest(
      `http://localhost:3000/api/analytics/recurring/${patternId}/confirm`,
      { method: "POST" }
    );
    await POST_confirm(confirmRequest, {
      params: Promise.resolve({ pattern_id: String(patternId) }),
    });

    // Verify is_confirmed is now true
    getResponse = await GET_recurring(getRequest);
    getData = await getResponse.json();
    const confirmedPattern = getData.data.recurring_transactions.find(
      (p: { pattern_id: number }) => p.pattern_id === patternId
    );
    expect(confirmedPattern.is_confirmed).toBe(true);
  });

  it("should return 404 for non-existent pattern_id", async () => {
    const confirmRequest = new NextRequest(
      "http://localhost:3000/api/analytics/recurring/99999/confirm",
      { method: "POST" }
    );
    const confirmResponse = await POST_confirm(confirmRequest, {
      params: Promise.resolve({ pattern_id: "99999" }),
    });

    expect(confirmResponse.status).toBe(404);
    const json = await confirmResponse.json();
    expect(json).toHaveProperty("error");
  });

  it("should return 400 for invalid pattern_id", async () => {
    const confirmRequest = new NextRequest(
      "http://localhost:3000/api/analytics/recurring/invalid/confirm",
      { method: "POST" }
    );
    const confirmResponse = await POST_confirm(confirmRequest, {
      params: Promise.resolve({ pattern_id: "invalid" }),
    });

    expect(confirmResponse.status).toBe(400);
    const json = await confirmResponse.json();
    expect(json).toHaveProperty("error");
  });
});

describe("POST /api/analytics/recurring/{pattern_id}/reject", () => {
  beforeAll(async () => {
    await setupTestDatabase();
    vi.resetModules();
    const recurringModule = await import("@/app/api/analytics/recurring/route");
    GET_recurring = recurringModule.GET;
    const rejectModule = await import(
      "@/app/api/analytics/recurring/[pattern_id]/reject/route"
    );
    POST_reject = rejectModule.POST;
  }, 120000);

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    txnCounter = 0;
  });

  it("should reject a recurring pattern", async () => {
    await seedMonthlyRecurringData("Unwanted Pattern", -50, 4);

    // Get patterns
    const getRequest = new NextRequest("http://localhost:3000/api/analytics/recurring");
    const getResponse = await GET_recurring(getRequest);
    const getData = await getResponse.json();

    expect(getData.data.recurring_transactions.length).toBeGreaterThan(0);
    const patternId = getData.data.recurring_transactions[0].pattern_id;

    // Reject the pattern
    const rejectRequest = new NextRequest(
      `http://localhost:3000/api/analytics/recurring/${patternId}/reject`,
      { method: "POST" }
    );
    const rejectResponse = await POST_reject(rejectRequest, {
      params: Promise.resolve({ pattern_id: String(patternId) }),
    });
    const rejectData = await rejectResponse.json();

    expect(rejectResponse.status).toBe(200);
    expect(rejectData.data).toHaveProperty("message");
    expect(rejectData.data.message).toContain("rejected");
    expect(rejectData.data.pattern_id).toBe(patternId);
  });

  it("should update is_rejected to true", async () => {
    await seedMonthlyRecurringData("False Positive", -25, 4);

    // Get patterns
    const getRequest = new NextRequest("http://localhost:3000/api/analytics/recurring");
    let getResponse = await GET_recurring(getRequest);
    let getData = await getResponse.json();
    const patternId = getData.data.recurring_transactions[0].pattern_id;

    // Initially not rejected
    expect(getData.data.recurring_transactions[0].is_rejected).toBe(false);

    // Reject
    const rejectRequest = new NextRequest(
      `http://localhost:3000/api/analytics/recurring/${patternId}/reject`,
      { method: "POST" }
    );
    await POST_reject(rejectRequest, {
      params: Promise.resolve({ pattern_id: String(patternId) }),
    });

    // Verify is_rejected is now true
    getResponse = await GET_recurring(getRequest);
    getData = await getResponse.json();
    const rejectedPattern = getData.data.recurring_transactions.find(
      (p: { pattern_id: number }) => p.pattern_id === patternId
    );
    // Rejected patterns might be excluded from results or have is_rejected = true
    if (rejectedPattern) {
      expect(rejectedPattern.is_rejected).toBe(true);
    }
  });

  it("should potentially exclude rejected patterns from future detection", async () => {
    await seedMonthlyRecurringData("To Be Rejected", -30, 4);

    // Get patterns
    const getRequest = new NextRequest("http://localhost:3000/api/analytics/recurring");
    let getResponse = await GET_recurring(getRequest);
    let getData = await getResponse.json();

    const initialCount = getData.data.recurring_transactions.length;
    expect(initialCount).toBe(1);

    const patternId = getData.data.recurring_transactions[0].pattern_id;

    // Reject
    const rejectRequest = new NextRequest(
      `http://localhost:3000/api/analytics/recurring/${patternId}/reject`,
      { method: "POST" }
    );
    await POST_reject(rejectRequest, {
      params: Promise.resolve({ pattern_id: String(patternId) }),
    });

    // Check if rejected pattern is excluded or marked
    getResponse = await GET_recurring(getRequest);
    getData = await getResponse.json();

    // Implementation may either exclude rejected patterns or mark them
    // Either behavior is acceptable per the API contract
    if (getData.data.recurring_transactions.length === 0) {
      expect(getData.data.recurring_transactions.length).toBe(0);
    } else {
      expect(getData.data.recurring_transactions[0].is_rejected).toBe(true);
    }
  });

  it("should return 404 for non-existent pattern_id", async () => {
    const rejectRequest = new NextRequest(
      "http://localhost:3000/api/analytics/recurring/99999/reject",
      { method: "POST" }
    );
    const rejectResponse = await POST_reject(rejectRequest, {
      params: Promise.resolve({ pattern_id: "99999" }),
    });

    expect(rejectResponse.status).toBe(404);
    const json = await rejectResponse.json();
    expect(json).toHaveProperty("error");
  });

  it("should return 400 for invalid pattern_id", async () => {
    const rejectRequest = new NextRequest(
      "http://localhost:3000/api/analytics/recurring/invalid/reject",
      { method: "POST" }
    );
    const rejectResponse = await POST_reject(rejectRequest, {
      params: Promise.resolve({ pattern_id: "invalid" }),
    });

    expect(rejectResponse.status).toBe(400);
    const json = await rejectResponse.json();
    expect(json).toHaveProperty("error");
  });
});

// Helper functions for seeding test data
let txnCounter = 0;

async function insertRecurringTransaction(
  prisma: ReturnType<typeof getTestPrisma>,
  data: {
    description: string;
    amount: number;
    transaction_date: Date;
    category?: string;
    subcategory?: string | null;
    transaction_type?: string;
    account_id?: string;
  }
) {
  const id = `TXN${String(++txnCounter).padStart(6, "0")}`;
  const txnType = data.transaction_type || (data.amount > 0 ? "Income" : "Expense");

  await prisma.$executeRawUnsafe(`
    INSERT INTO [transactions] (
      transaction_id, transaction_date, transaction_time, account_id, account_name,
      account_type, account_owner, description, category, subcategory, amount,
      transaction_type, balance_after, is_recurring, recurring_frequency, notes
    ) VALUES (
      '${id}',
      '${data.transaction_date.toISOString().split("T")[0]}',
      '${data.transaction_date.toTimeString().split(" ")[0]}',
      '${data.account_id || "ACC-JOINT-CHK"}',
      'Joint Checking',
      'Checking',
      'Joint',
      '${data.description.replace(/'/g, "''")}',
      '${data.category || "Subscription"}',
      ${data.subcategory ? `'${data.subcategory}'` : "NULL"},
      ${data.amount},
      '${txnType}',
      ${1000 + data.amount},
      0,
      NULL,
      'Test recurring data'
    )
  `);
}

async function seedRecurringPatternData() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // Create a simple monthly recurring pattern (Netflix-like)
  for (let i = 0; i < 5; i++) {
    const date = new Date("2024-01-15");
    date.setMonth(date.getMonth() + i);
    await insertRecurringTransaction(prisma, {
      description: "Netflix Subscription",
      amount: -15.99,
      transaction_date: date,
      category: "Entertainment",
    });
  }
}

async function seedMonthlyRecurringData(
  description: string,
  amount: number,
  count: number,
  transactionType = "Expense",
  accountId = "ACC-JOINT-CHK"
) {
  const prisma = getTestPrisma();

  for (let i = 0; i < count; i++) {
    const date = new Date("2024-01-15");
    date.setMonth(date.getMonth() + i);
    await insertRecurringTransaction(prisma, {
      description,
      amount,
      transaction_date: date,
      transaction_type: transactionType,
      account_id: accountId,
    });
  }
}

async function seedWeeklyRecurringData(
  description: string,
  amount: number,
  count: number,
  transactionType = "Expense",
  accountId = "ACC-JOINT-CHK"
) {
  const prisma = getTestPrisma();

  for (let i = 0; i < count; i++) {
    const date = new Date("2024-01-01");
    date.setDate(date.getDate() + i * 7);
    await insertRecurringTransaction(prisma, {
      description,
      amount,
      transaction_date: date,
      transaction_type: transactionType,
      account_id: accountId,
      category: "Groceries",
    });
  }
}

async function seedBiweeklyRecurringData(
  description: string,
  amount: number,
  count: number,
  transactionType = "Income",
  accountId = "ACC-JOINT-CHK"
) {
  const prisma = getTestPrisma();

  for (let i = 0; i < count; i++) {
    const date = new Date("2024-01-05");
    date.setDate(date.getDate() + i * 14);
    await insertRecurringTransaction(prisma, {
      description,
      amount,
      transaction_date: date,
      transaction_type: transactionType,
      account_id: accountId,
      category: "Income",
    });
  }
}

async function seedMixedConfidencePatterns() {
  const prisma = getTestPrisma();
  txnCounter = 0;

  // High confidence - perfect monthly pattern with consistent amounts
  for (let i = 0; i < 8; i++) {
    const date = new Date("2024-01-15");
    date.setMonth(date.getMonth() + i);
    await insertRecurringTransaction(prisma, {
      description: "High Confidence Subscription",
      amount: -19.99,
      transaction_date: date,
      category: "Subscription",
    });
  }

  // Medium confidence - monthly-ish with some variance
  const mediumDates = [
    new Date("2024-01-15"),
    new Date("2024-02-16"),
    new Date("2024-03-14"),
    new Date("2024-04-17"),
  ];
  for (const date of mediumDates) {
    await insertRecurringTransaction(prisma, {
      description: "Medium Confidence Bill",
      amount: -45.0 + Math.random() * 10 - 5, // Slight variance
      transaction_date: date,
      category: "Utilities",
    });
  }

  // Low confidence - irregular pattern
  const lowDates = [
    new Date("2024-01-01"),
    new Date("2024-02-08"),
    new Date("2024-03-20"),
  ];
  for (const date of lowDates) {
    await insertRecurringTransaction(prisma, {
      description: "Low Confidence Payment",
      amount: -30.0 + Math.random() * 20 - 10, // Higher variance
      transaction_date: date,
      category: "Shopping",
    });
  }
}
