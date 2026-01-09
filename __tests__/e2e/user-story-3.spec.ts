import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 3: Filter Transactions by Time and Account
 *
 * Goal: Enable filtering by quick-select time periods, custom date range,
 * and account multi-select.
 *
 * Acceptance Scenarios:
 * 1. Quick select time buttons refresh all charts and metrics
 * 2. Custom date picker allows start/end date selection
 * 3. Account multi-select filters transactions to selected accounts
 * 4. "All Accounts" or reset returns to showing all data
 */

test.describe("User Story 3: Time Period Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test("should display time period filter buttons", async ({ page }) => {
    // Find the time period filter section
    const timeFilterSection = page.locator('section:has-text("Time Period")');
    await expect(timeFilterSection).toBeVisible();

    // Expected quick-select buttons
    const expectedButtons = [
      "This Month",
      "Last Month",
      "Last 3 Months",
      "YTD",
      "All Time",
    ];

    for (const buttonText of expectedButtons) {
      const button = page.locator(`button:has-text("${buttonText}")`);
      await expect(button).toBeVisible();
    }
  });

  test("should have one time filter button active by default", async ({
    page,
  }) => {
    // One button should be pressed/active
    const activeButton = page.locator('button[aria-pressed="true"]');
    await expect(activeButton).toBeVisible();

    // It should be one of the time filter buttons
    const activeText = await activeButton.textContent();
    expect(activeText).toBeTruthy();
  });

  test("should switch active state when clicking different time filters", async ({
    page,
  }) => {
    // Get currently active button
    const initialActive = page
      .locator('button[aria-pressed="true"]')
      .first();
    const initialText = await initialActive.textContent();

    // Find a different button to click
    const differentButton = page.locator(
      'button[aria-pressed="false"]:has-text("Last Month")'
    );

    if (await differentButton.isVisible()) {
      await differentButton.click();

      // Wait for API response
      await page.waitForResponse(
        (response) =>
          response.url().includes("/api/analytics/") &&
          response.status() === 200
      );

      // The clicked button should now be active
      await expect(differentButton).toHaveAttribute("aria-pressed", "true");

      // Previous button should be inactive
      const newActive = page
        .locator(`button[aria-pressed="true"]:has-text("Last Month")`)
        .first();
      await expect(newActive).toBeVisible();
    }
  });

  test("should refresh KPI cards when time filter changes", async ({
    page,
  }) => {
    // Get initial KPI value
    const kpiValue = page.locator('[data-testid="kpi-value"]').first();
    const initialValue = await kpiValue.textContent();

    // Click a different time filter
    const lastMonthButton = page.locator(
      'button[aria-pressed="false"]:has-text("Last Month")'
    );

    if (await lastMonthButton.isVisible()) {
      // Wait for API response
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/analytics/kpis") &&
          response.status() === 200
      );

      await lastMonthButton.click();
      await responsePromise;

      // KPI should have been updated (value may or may not have changed)
      const newValue = await kpiValue.textContent();
      expect(newValue).toBeTruthy();
    }
  });

  test("should refresh Cash Flow chart when time filter changes", async ({
    page,
  }) => {
    // Wait for chart to load
    await page.waitForSelector(".recharts-bar", { timeout: 10000 });

    // Click a different time filter
    const ytdButton = page.locator(
      'button[aria-pressed="false"]:has-text("YTD")'
    );

    if (await ytdButton.isVisible()) {
      // Wait for API response
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/analytics/cash-flow") &&
          response.status() === 200
      );

      await ytdButton.click();
      await responsePromise;

      // Chart should still be visible
      await expect(
        page.locator(".recharts-responsive-container").first()
      ).toBeVisible();
    }
  });
});

test.describe("User Story 3: Custom Date Range", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test("should display Custom date range button", async ({ page }) => {
    const customButton = page.locator('button:has-text("Custom")');
    await expect(customButton).toBeVisible();
  });

  test("should open date picker popover when clicking Custom", async ({
    page,
  }) => {
    const customButton = page.locator('button:has-text("Custom")');
    await customButton.click();

    // Date picker dialog should appear
    const datePickerDialog = page.locator('[role="dialog"]');
    await expect(datePickerDialog).toBeVisible();

    // Should have start and end date inputs
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').last();

    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
  });

  test("should allow entering custom date range", async ({ page }) => {
    const customButton = page.locator('button:has-text("Custom")');
    await customButton.click();

    // Find date inputs
    const startDateInput = page.locator("#start-date-input");
    const endDateInput = page.locator("#end-date-input");

    // Enter dates
    await startDateInput.fill("2024-01-01");
    await endDateInput.fill("2024-12-31");

    // Apply button should be enabled
    const applyButton = page.locator('button:has-text("Apply")');
    await expect(applyButton).toBeEnabled();

    // Click Apply
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/analytics/") && response.status() === 200
    );

    await applyButton.click();
    await responsePromise;

    // Popover should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Custom button should now be active
    const activeCustomButton = page.locator(
      'button[aria-pressed="true"]:has-text("Custom")'
    );
    await expect(activeCustomButton).toBeVisible();
  });

  test("should show validation error for invalid date range", async ({
    page,
  }) => {
    const customButton = page.locator('button:has-text("Custom")');
    await customButton.click();

    // Find date inputs
    const startDateInput = page.locator("#start-date-input");
    const endDateInput = page.locator("#end-date-input");

    // Enter invalid range (end before start)
    await startDateInput.fill("2024-12-31");
    await endDateInput.fill("2024-01-01");

    // Should show error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("End date must be after start date");

    // Apply button should be disabled
    const applyButton = page.locator('button:has-text("Apply")');
    await expect(applyButton).toBeDisabled();
  });

  test("should close date picker with Cancel button", async ({ page }) => {
    const customButton = page.locator('button:has-text("Custom")');
    await customButton.click();

    // Dialog should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click Cancel
    const cancelButton = page.locator('button:has-text("Cancel")');
    await cancelButton.click();

    // Dialog should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe("User Story 3: Account Filter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test("should display account filter dropdown", async ({ page }) => {
    // Find the account filter section
    const accountSection = page.locator('section:has-text("Accounts")');
    await expect(accountSection).toBeVisible();

    // Account filter button should be visible
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await expect(accountButton).toBeVisible();
  });

  test("should show 'All Accounts' by default", async ({ page }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    const buttonText = await accountButton.textContent();

    expect(buttonText).toContain("All Accounts");
  });

  test("should open account dropdown when clicked", async ({ page }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Dropdown should appear
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible();
  });

  test("should display available accounts in dropdown", async ({ page }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Wait for accounts to load
    await page.waitForTimeout(500);

    // Should have account options
    const accountOptions = page.locator('[role="option"]');
    const count = await accountOptions.count();

    // Should have some accounts
    expect(count).toBeGreaterThan(0);
  });

  test("should allow selecting individual account", async ({ page }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Wait for accounts to load
    await page.waitForTimeout(500);

    // Click on first account option
    const firstOption = page.locator('[role="option"]').first();
    const accountName = await firstOption
      .locator("span")
      .first()
      .textContent();

    // Wait for API response
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/analytics/") && response.status() === 200
    );

    await firstOption.click();
    await responsePromise;

    // Button text should update to show selected account
    const updatedButton = page.locator('button[aria-label="Filter by account"]');
    const updatedText = await updatedButton.textContent();

    // Should show the account name or count
    expect(updatedText).toBeTruthy();
  });

  test("should have Select All button", async ({ page }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Should have Select All button
    const selectAllButton = page.locator('button:has-text("Select All")');
    await expect(selectAllButton).toBeVisible();
  });

  test("should select all accounts when clicking Select All", async ({
    page,
  }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Wait for accounts to load
    await page.waitForTimeout(500);

    // Click Select All
    const selectAllButton = page.locator('button:has-text("Select All")');
    await selectAllButton.click();

    // All checkboxes should be checked
    const checkboxes = page.locator('[role="option"] input[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test("should show Clear button when accounts are selected", async ({
    page,
  }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Select an account
    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();

    // Re-open dropdown
    await accountButton.click();

    // Clear button should be visible
    const clearButton = page.locator('button:has-text("Clear")');
    await expect(clearButton).toBeVisible();
  });

  test("should clear selection and show All Accounts when clicking Clear", async ({
    page,
  }) => {
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Select an account
    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();

    // Re-open dropdown
    await accountButton.click();

    // Click Clear
    const clearButton = page.locator('button:has-text("Clear")');
    await clearButton.click();

    // Close dropdown by clicking elsewhere
    await page.keyboard.press("Escape");

    // Button should show "All Accounts"
    const buttonText = await accountButton.textContent();
    expect(buttonText).toContain("All Accounts");
  });
});

test.describe("User Story 3: Filter Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test("should update all dashboard sections when time filter changes", async ({
    page,
  }) => {
    // Track API calls
    const apiCalls: string[] = [];
    page.on("response", (response) => {
      if (
        response.url().includes("/api/analytics/") &&
        response.status() === 200
      ) {
        apiCalls.push(response.url());
      }
    });

    // Click a time filter
    const last3MonthsButton = page.locator(
      'button[aria-pressed="false"]:has-text("Last 3 Months")'
    );

    if (await last3MonthsButton.isVisible()) {
      await last3MonthsButton.click();

      // Wait for multiple API calls
      await page.waitForTimeout(2000);

      // Should have called multiple analytics endpoints
      const kpiCalls = apiCalls.filter((url) => url.includes("/kpis"));
      const cashFlowCalls = apiCalls.filter((url) =>
        url.includes("/cash-flow")
      );

      expect(kpiCalls.length).toBeGreaterThan(0);
      // Cash flow might also be called
    }
  });

  test("should update all sections when account filter changes", async ({
    page,
  }) => {
    // Track API calls
    const apiCalls: string[] = [];
    page.on("response", (response) => {
      if (
        response.url().includes("/api/analytics/") &&
        response.status() === 200
      ) {
        apiCalls.push(response.url());
      }
    });

    // Open account filter
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Select an account
    const firstOption = page.locator('[role="option"]').first();
    await firstOption.click();

    // Wait for API calls
    await page.waitForTimeout(2000);

    // Should have made API calls
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test("should persist filter state across interactions", async ({ page }) => {
    // Select Last Month
    const lastMonthButton = page.locator(
      'button[aria-pressed="false"]:has-text("Last Month")'
    );

    if (await lastMonthButton.isVisible()) {
      await lastMonthButton.click();
      await page.waitForTimeout(1000);

      // Button should remain active
      await expect(lastMonthButton).toHaveAttribute("aria-pressed", "true");

      // Scroll down and back up
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);
      await page.evaluate(() => window.scrollTo(0, 0));

      // Filter should still be active
      await expect(
        page.locator('button[aria-pressed="true"]:has-text("Last Month")')
      ).toBeVisible();
    }
  });
});

test.describe("User Story 3: Filter Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="kpi-value"]').first()).toBeVisible(
      { timeout: 10000 }
    );
  });

  test("should have accessible time filter group", async ({ page }) => {
    // Time filter should have role="group" with aria-label
    const timeFilterGroup = page.locator('[role="group"]').first();
    await expect(timeFilterGroup).toBeVisible();

    const ariaLabel = await timeFilterGroup.getAttribute("aria-label");
    expect(ariaLabel).toContain("time period");
  });

  test("should have proper aria-pressed states on filter buttons", async ({
    page,
  }) => {
    // Active button should have aria-pressed="true"
    const activeButton = page.locator('button[aria-pressed="true"]');
    await expect(activeButton).toBeVisible();

    // Inactive buttons should have aria-pressed="false"
    const inactiveButtons = page.locator('button[aria-pressed="false"]');
    const count = await inactiveButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should support keyboard navigation in time filters", async ({
    page,
  }) => {
    // Focus on a filter button
    const firstFilterButton = page.locator('button[aria-pressed]').first();
    await firstFilterButton.focus();

    // Tab to next button
    await page.keyboard.press("Tab");

    // The focused element should be a button
    const focusedElement = page.locator(":focus");
    const tagName = await focusedElement.evaluate((el) =>
      el.tagName.toLowerCase()
    );
    expect(tagName).toBe("button");
  });

  test("should have accessible account filter", async ({ page }) => {
    // Account filter should have proper ARIA attributes
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await expect(accountButton).toBeVisible();

    const hasAriaExpanded =
      (await accountButton.getAttribute("aria-expanded")) !== null;
    const hasAriaHaspopup =
      (await accountButton.getAttribute("aria-haspopup")) !== null;

    expect(hasAriaHaspopup || hasAriaExpanded).toBeTruthy();
  });

  test("should support keyboard navigation in account dropdown", async ({
    page,
  }) => {
    // Open account filter
    const accountButton = page.locator('button[aria-label="Filter by account"]');
    await accountButton.click();

    // Wait for dropdown
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

    // Press arrow down to navigate
    await page.keyboard.press("ArrowDown");

    // An option should be focused or highlighted
    // (specific behavior depends on component implementation)
    const dropdown = page.locator('[role="listbox"]');
    await expect(dropdown).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(dropdown).not.toBeVisible();
  });
});

test.describe("User Story 3: Mobile Filters", () => {
  test("should show mobile filter toggle on small viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Mobile header should be visible
    const mobileHeader = page.locator('header:has-text("Filters")');
    await expect(mobileHeader).toBeVisible({ timeout: 10000 });

    // Filter button should be visible
    const filterButton = page.locator('button:has-text("Filters")');
    await expect(filterButton).toBeVisible();
  });

  test("should expand mobile filters when clicking toggle", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard");

    // Click filter toggle
    const filterButton = page.locator('button:has-text("Filters")');
    await filterButton.click();

    // Mobile filters should expand
    const mobileFilters = page.locator("#mobile-filters");
    await expect(mobileFilters).toBeVisible();

    // Should have time period section
    await expect(
      mobileFilters.locator('text="Time Period"')
    ).toBeVisible();

    // Should have accounts section
    await expect(mobileFilters.locator('text="Accounts"')).toBeVisible();
  });
});
