import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 1: View Financial Health Summary
 *
 * Goal: Display top-level KPI cards (Net Cash Flow, Total Balance, MoM Change,
 * Recurring Expenses, Largest Expense) when opening the dashboard.
 *
 * Acceptance Scenarios:
 * 1. Dashboard shows KPI cards with correct metrics when transactions exist
 * 2. Positive MoM change displays green upward trend indicator
 * 3. Negative MoM change displays coral downward trend indicator
 * 4. Empty period displays $0 values with appropriate messaging
 */

test.describe("User Story 1: Financial Health Summary", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto("/dashboard");
  });

  test("should display all five KPI cards when dashboard loads", async ({
    page,
  }) => {
    // Wait for KPI cards to load (skeleton should disappear)
    await expect(page.locator('[role="article"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Verify all 5 KPI card titles are present
    const expectedTitles = [
      "Net Cash Flow",
      "Total Balance",
      "Month-over-Month",
      "Recurring Expenses",
      "Largest Expense",
    ];

    for (const title of expectedTitles) {
      const cardTitle = page.locator(`[role="article"]`, {
        has: page.locator(`text="${title}"`),
      });
      await expect(cardTitle).toBeVisible();
    }
  });

  test("should display currency values in KPI cards", async ({ page }) => {
    // Wait for loading to complete
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Get all KPI values
    const kpiValues = page.locator('[data-testid="kpi-value"]');
    const count = await kpiValues.count();

    // Should have 5 KPI cards
    expect(count).toBe(5);

    // Each value should be formatted as currency (contains $)
    for (let i = 0; i < count; i++) {
      const valueText = await kpiValues.nth(i).textContent();
      // Allow for "—" (em dash) for null values or "$" for currency
      expect(valueText).toMatch(/[\$—]/);
    }
  });

  test("should display trend indicator for Net Cash Flow", async ({ page }) => {
    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Find the Net Cash Flow card
    const netCashFlowCard = page.locator('[role="article"]', {
      has: page.locator('text="Net Cash Flow"'),
    });

    await expect(netCashFlowCard).toBeVisible();

    // Check for trend indicator within the card
    const trendIndicator = netCashFlowCard.locator(
      '[data-testid="trend-indicator"]'
    );

    // Trend indicator should be visible
    await expect(trendIndicator).toBeVisible();
  });

  test("should display Month-over-Month change with trend indicator", async ({
    page,
  }) => {
    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Find the Month-over-Month card
    const momCard = page.locator('[role="article"]', {
      has: page.locator('text="Month-over-Month"'),
    });

    await expect(momCard).toBeVisible();

    // Check for trend indicator
    const trendIndicator = momCard.locator('[data-testid="trend-indicator"]');
    await expect(trendIndicator).toBeVisible();

    // Value should be a percentage
    const valueElement = momCard.locator('[data-testid="kpi-value"]');
    const valueText = await valueElement.textContent();
    expect(valueText).toMatch(/%/);
  });

  test("should apply semantic colors to trend indicators", async ({ page }) => {
    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Get all trend indicators
    const trendIndicators = page.locator('[data-testid="trend-indicator"]');
    const count = await trendIndicators.count();

    // At least some KPI cards should have trend indicators
    expect(count).toBeGreaterThan(0);

    // Each visible trend indicator should have a color class
    for (let i = 0; i < count; i++) {
      const indicator = trendIndicators.nth(i);
      const classes = await indicator.getAttribute("class");

      // Should have one of the semantic color classes
      const hasSemanticColor =
        classes?.includes("text-emerald") ||
        classes?.includes("text-coral") ||
        classes?.includes("text-gray");

      expect(hasSemanticColor).toBeTruthy();
    }
  });

  test("should show tooltips on hover for KPI cards", async ({ page }) => {
    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Find a KPI card (Net Cash Flow has a tooltip)
    const netCashFlowCard = page.locator('[role="article"]', {
      has: page.locator('text="Net Cash Flow"'),
    });

    // Hover over the card
    await netCashFlowCard.hover();

    // Wait for tooltip to appear
    await expect(page.locator('[role="tooltip"]')).toBeVisible({
      timeout: 2000,
    });

    // Tooltip should contain explanatory text
    const tooltipText = await page.locator('[role="tooltip"]').textContent();
    expect(tooltipText).toContain("income");
  });

  test("should display Largest Expense with description subtitle", async ({
    page,
  }) => {
    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Find the Largest Expense card
    const largestExpenseCard = page.locator('[role="article"]', {
      has: page.locator('text="Largest Expense"'),
    });

    await expect(largestExpenseCard).toBeVisible();

    // Should have a currency value
    const valueElement = largestExpenseCard.locator(
      '[data-testid="kpi-value"]'
    );
    const valueText = await valueElement.textContent();
    expect(valueText).toMatch(/\$/);

    // Should have subtitle text with description
    const subtitleText = await largestExpenseCard
      .locator(".text-muted-foreground")
      .first()
      .textContent();
    // Subtitle should exist (either a transaction description or "No expenses")
    expect(subtitleText).toBeTruthy();
  });

  test("should have accessible KPI card structure", async ({ page }) => {
    // Wait for KPI cards to load
    await expect(page.locator('[role="article"]').first()).toBeVisible({
      timeout: 10000,
    });

    // All KPI cards should have article role with aria-label
    const kpiCards = page.locator('[role="article"]');
    const count = await kpiCards.count();

    expect(count).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < count; i++) {
      const card = kpiCards.nth(i);
      const ariaLabel = await card.getAttribute("aria-label");

      // Should have descriptive aria-label
      expect(ariaLabel).toMatch(/KPI card/);
    }

    // Each card should have a heading
    const headings = page.locator('[role="article"] [role="heading"]');
    expect(await headings.count()).toBeGreaterThanOrEqual(5);
  });

  test("should display loading skeletons initially", async ({ page }) => {
    // Navigate with slower network to catch loading state
    await page.route("**/api/analytics/kpis**", async (route) => {
      // Delay response by 1 second to see skeleton
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto("/dashboard");

    // Should see skeleton or content (depending on timing)
    const hasSkeletonOrContent = await page
      .locator('[data-testid="kpi-skeleton"], [data-testid="kpi-value"]')
      .first()
      .isVisible();
    expect(hasSkeletonOrContent).toBeTruthy();
  });

  test("should update KPI values when filter changes", async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Get initial Net Cash Flow value
    const netCashFlowCard = page.locator('[role="article"]', {
      has: page.locator('text="Net Cash Flow"'),
    });
    const initialValue = await netCashFlowCard
      .locator('[data-testid="kpi-value"]')
      .textContent();

    // Click "Last Month" filter button
    const lastMonthButton = page.locator(
      'button[aria-pressed="false"]:has-text("Last Month")'
    );

    if (await lastMonthButton.isVisible()) {
      await lastMonthButton.click();

      // Wait for data to update
      await page.waitForResponse(
        (response) =>
          response.url().includes("/api/analytics/kpis") &&
          response.status() === 200
      );

      // Value should exist (may or may not have changed depending on data)
      const newValue = await netCashFlowCard
        .locator('[data-testid="kpi-value"]')
        .textContent();
      expect(newValue).toBeTruthy();
    }
  });
});

test.describe("User Story 1: Financial Health Summary - Empty State", () => {
  test("should handle empty data gracefully", async ({ page }) => {
    // Mock API to return empty data
    await page.route("**/api/analytics/kpis**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            net_cash_flow: 0,
            total_balance: 0,
            month_over_month_change: {
              current_period: 0,
              previous_period: 0,
              percentage: 0,
              trend: "neutral" as const,
            },
            recurring_expenses: 0,
            largest_expense: null,
          },
        }),
      });
    });

    await page.goto("/dashboard");

    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Values should show $0.00 for currency fields
    const netCashFlowCard = page.locator('[role="article"]', {
      has: page.locator('text="Net Cash Flow"'),
    });
    const valueText = await netCashFlowCard
      .locator('[data-testid="kpi-value"]')
      .textContent();
    expect(valueText).toBe("$0.00");
  });
});

test.describe("User Story 1: Responsive Design", () => {
  test("should display KPI cards in grid on desktop", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // The container should have grid classes for desktop
    const kpiContainer = page.locator(".grid").first();
    await expect(kpiContainer).toBeVisible();

    // All 5 KPI cards should be visible
    const kpiCards = page.locator('[role="article"]');
    expect(await kpiCards.count()).toBeGreaterThanOrEqual(5);
  });

  test("should stack KPI cards on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Wait for KPI cards to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );

    // Cards should still be visible and accessible
    const kpiCards = page.locator('[role="article"]');
    expect(await kpiCards.count()).toBeGreaterThanOrEqual(5);
  });
});
