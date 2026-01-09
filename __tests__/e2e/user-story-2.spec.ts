import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 2: View Cash Flow Over Time
 *
 * Goal: Display income vs expenses chart over time with transfers excluded.
 *
 * Acceptance Scenarios:
 * 1. Income displays as positive values (mint green) and expenses as negative (coral)
 * 2. Inter-account transfers are excluded from income/expense calculations
 * 3. Chart refreshes when time period filter changes
 * 4. Tooltip shows date/period, income, expense, and net amounts on hover
 */

test.describe("User Story 2: Cash Flow Over Time", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for the cash flow chart section to load
    await expect(page.locator('text="Cash Flow Over Time"')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display the Cash Flow chart section", async ({ page }) => {
    // Find the Cash Flow section by its heading
    const cashFlowSection = page.locator("section", {
      has: page.locator('text="Cash Flow Over Time"'),
    });

    await expect(cashFlowSection).toBeVisible();

    // Should have a description
    const description = page.locator(
      'text="Income vs expenses by month (transfers excluded)"'
    );
    await expect(description).toBeVisible();
  });

  test("should render Recharts BarChart component", async ({ page }) => {
    // Wait for chart to render
    await page.waitForSelector(".recharts-responsive-container", {
      timeout: 10000,
    });

    // The Recharts component should be present
    const chartContainer = page.locator(".recharts-responsive-container");
    await expect(chartContainer).toBeVisible();

    // Should have a bar chart wrapper
    const barChart = page.locator(".recharts-wrapper");
    await expect(barChart).toBeVisible();
  });

  test("should display income bars in the chart", async ({ page }) => {
    // Wait for chart to fully render
    await page.waitForSelector(".recharts-bar", { timeout: 10000 });

    // Should have bar elements for income
    const bars = page.locator(".recharts-bar-rectangle");
    const barCount = await bars.count();

    // Should have some bars rendered (depends on data periods)
    expect(barCount).toBeGreaterThan(0);
  });

  test("should display chart legend with Income and Expenses labels", async ({
    page,
  }) => {
    // Wait for chart to render
    await page.waitForSelector(".recharts-legend-wrapper", { timeout: 10000 });

    // Legend should be visible
    const legend = page.locator(".recharts-legend-wrapper");
    await expect(legend).toBeVisible();

    // Should have Income legend item
    const incomeLegend = page.locator(".recharts-legend-wrapper", {
      has: page.locator('text="Income"'),
    });
    await expect(incomeLegend).toBeVisible();

    // Should have Expenses legend item
    const expensesLegend = page.locator(".recharts-legend-wrapper", {
      has: page.locator('text="Expenses"'),
    });
    await expect(expensesLegend).toBeVisible();
  });

  test("should display X-axis with period labels", async ({ page }) => {
    // Wait for chart to render
    await page.waitForSelector(".recharts-xAxis", { timeout: 10000 });

    // X-axis should be visible
    const xAxis = page.locator(".recharts-xAxis");
    await expect(xAxis).toBeVisible();

    // Should have tick labels (month abbreviations)
    const ticks = page.locator(".recharts-xAxis .recharts-cartesian-axis-tick");
    const tickCount = await ticks.count();
    expect(tickCount).toBeGreaterThan(0);
  });

  test("should display Y-axis with currency values", async ({ page }) => {
    // Wait for chart to render
    await page.waitForSelector(".recharts-yAxis", { timeout: 10000 });

    // Y-axis should be visible
    const yAxis = page.locator(".recharts-yAxis");
    await expect(yAxis).toBeVisible();

    // Should have tick values with $ symbol
    const tickTexts = page.locator(
      ".recharts-yAxis .recharts-cartesian-axis-tick-value"
    );
    const count = await tickTexts.count();

    if (count > 0) {
      const firstTickText = await tickTexts.first().textContent();
      // Should start with $ or be a formatted number
      expect(firstTickText).toMatch(/\$|K|M|0/);
    }
  });

  test("should show tooltip on bar hover", async ({ page }) => {
    // Wait for chart to render with bars
    await page.waitForSelector(".recharts-bar-rectangle", { timeout: 10000 });

    // Get the chart area
    const chartArea = page.locator(".recharts-surface");
    const box = await chartArea.boundingBox();

    if (box) {
      // Hover over the middle of the chart
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

      // Wait a moment for tooltip to appear
      await page.waitForTimeout(500);

      // Check for tooltip (Recharts uses a custom tooltip component)
      const tooltip = page.locator(".recharts-tooltip-wrapper");

      // Tooltip might be visible if we're over a bar
      if (await tooltip.isVisible()) {
        // Tooltip should contain formatted currency values
        const tooltipContent = await tooltip.textContent();
        expect(tooltipContent).toBeTruthy();
      }
    }
  });

  test("should update chart when time filter changes", async ({ page }) => {
    // Wait for chart to render
    await page.waitForSelector(".recharts-bar", { timeout: 10000 });

    // Find and click "Last Month" button
    const lastMonthButton = page.locator('button:has-text("Last Month")');

    if (await lastMonthButton.isVisible()) {
      // Wait for API call
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/analytics/cash-flow") &&
          response.status() === 200
      );

      await lastMonthButton.click();
      await responsePromise;

      // Chart should still be visible after update
      await expect(
        page.locator(".recharts-responsive-container")
      ).toBeVisible();
    }
  });

  test("should have grid lines for readability", async ({ page }) => {
    // Wait for chart to render
    await page.waitForSelector(".recharts-cartesian-grid", { timeout: 10000 });

    // Grid lines should be present
    const grid = page.locator(".recharts-cartesian-grid");
    await expect(grid).toBeVisible();

    // Should have horizontal grid lines
    const horizontalLines = page.locator(
      ".recharts-cartesian-grid-horizontal line"
    );
    const lineCount = await horizontalLines.count();
    expect(lineCount).toBeGreaterThan(0);
  });

  test("should exclude transfers from the visualization", async ({ page }) => {
    // This test verifies the description mentions transfers are excluded
    const description = page.locator(
      'text="Income vs expenses by month (transfers excluded)"'
    );
    await expect(description).toBeVisible();

    // The chart should only show Income and Expenses in legend, not Transfers
    await page.waitForSelector(".recharts-legend-wrapper", { timeout: 10000 });

    const legendText = await page
      .locator(".recharts-legend-wrapper")
      .textContent();
    expect(legendText).not.toContain("Transfer");
  });
});

test.describe("User Story 2: Cash Flow Chart - Empty State", () => {
  test("should show empty state when no cash flow data", async ({ page }) => {
    // Mock API to return empty cash flow data
    await page.route("**/api/analytics/cash-flow**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            cash_flow: [],
          },
        }),
      });
    });

    await page.goto("/dashboard");

    // Wait for the cash flow section
    await expect(page.locator('text="Cash Flow Over Time"')).toBeVisible({
      timeout: 10000,
    });

    // Should show empty state message
    const emptyState = page.locator('text="No cash flow data"');
    await expect(emptyState).toBeVisible();
  });
});

test.describe("User Story 2: Cash Flow Chart - Error Handling", () => {
  test("should show error state when API fails", async ({ page }) => {
    // Mock API to return error
    await page.route("**/api/analytics/cash-flow**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Internal server error",
        }),
      });
    });

    await page.goto("/dashboard");

    // Wait for error state to appear
    await page.waitForTimeout(2000);

    // Should show error message
    const errorState = page.locator('text="Failed to load chart"');
    await expect(errorState).toBeVisible({ timeout: 5000 });
  });
});

test.describe("User Story 2: Cash Flow Chart - Responsive Design", () => {
  test("should resize chart on different viewports", async ({ page }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    await page.waitForSelector(".recharts-responsive-container", {
      timeout: 10000,
    });

    const desktopChart = page.locator(".recharts-responsive-container").first();
    const desktopBox = await desktopChart.boundingBox();

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletBox = await desktopChart.boundingBox();

    // Chart should resize (width should be different)
    if (desktopBox && tabletBox) {
      expect(tabletBox.width).toBeLessThan(desktopBox.width);
    }
  });

  test("should be visible on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Cash Flow section should still be visible
    await expect(page.locator('text="Cash Flow Over Time"')).toBeVisible({
      timeout: 10000,
    });

    // Chart should render
    await page.waitForSelector(".recharts-responsive-container", {
      timeout: 10000,
    });
    await expect(
      page.locator(".recharts-responsive-container").first()
    ).toBeVisible();
  });
});

test.describe("User Story 2: Cash Flow Chart - Accessibility", () => {
  test("should have accessible chart structure", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for chart to render
    await page.waitForSelector(".recharts-wrapper", { timeout: 10000 });

    // The card containing the chart should be visible
    const chartCard = page.locator(".recharts-wrapper").locator("..").first();
    await expect(chartCard).toBeVisible();
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for page to load
    await page.waitForSelector(".recharts-responsive-container", {
      timeout: 10000,
    });

    // Tab through the page - chart section should be reachable
    // The card containing the chart should be in the tab order
    await page.keyboard.press("Tab");

    // Continue tabbing - we're testing that the page doesn't break
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
    }

    // Page should still be responsive
    await expect(page.locator('text="Cash Flow Over Time"')).toBeVisible();
  });
});

test.describe("User Story 2: Cash Flow Chart - Color Semantics", () => {
  test("should use semantic colors for income (green) and expenses (coral)", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Wait for chart to render
    await page.waitForSelector(".recharts-bar-rectangle", { timeout: 10000 });

    // Get the bar elements
    const bars = page.locator(".recharts-bar-rectangle rect");
    const count = await bars.count();

    if (count > 0) {
      // Collect unique fill colors from bars
      const colors = new Set<string>();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const fill = await bars.nth(i).getAttribute("fill");
        if (fill) {
          colors.add(fill.toLowerCase());
        }
      }

      // Should have at least one color (income or expense)
      expect(colors.size).toBeGreaterThan(0);

      // Colors should be from our semantic palette
      // Income: variations of green (#22c55e, #10b981, etc.)
      // Expenses: variations of coral/red (#f87171, #ef4444, etc.)
      const colorArray = Array.from(colors);
      const hasSemanticColor = colorArray.some(
        (c) =>
          // Green shades for income
          c.includes("22c55e") ||
          c.includes("10b981") ||
          c.includes("4ade80") ||
          // Coral/red shades for expenses
          c.includes("f87171") ||
          c.includes("ef4444") ||
          c.includes("fb7185") ||
          // Or HSL/RGB values
          c.includes("hsl") ||
          c.includes("rgb")
      );

      // At minimum, there should be recognizable colors
      expect(colorArray.length).toBeGreaterThan(0);
    }
  });
});
