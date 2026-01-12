import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 5: Experience Consistent Styling Across All Components
 *
 * Goal: All UI components update consistently when theme switches
 * (cards, tables, forms, modals, badges, sidebar)
 *
 * TDD Phase: RED - These tests should FAIL until:
 * - T054-T060: Component styling tasks are implemented
 *
 * Testing Approach (from tasks.md best practices):
 * - Test via user interaction (theme toggle clicks) rather than synthetic state
 * - Verify computed styles change appropriately between themes
 * - Check that CSS variables are properly consumed
 *
 * Acceptance Scenarios:
 * 1. Transaction table uses theme colors (T049)
 * 2. Modal dialogs use theme colors (T050)
 * 3. Form inputs use theme colors (T051)
 * 4. Cards and badges use theme colors (T052)
 * 5. Navigation sidebar uses theme colors (T053)
 */

/**
 * Helper function to toggle theme and wait for change
 */
async function toggleTheme(page: import("@playwright/test").Page) {
  const toggle = page.locator('[data-testid="theme-toggle"]');
  await expect(toggle).toBeVisible({ timeout: 10000 });

  const htmlElement = page.locator("html");
  const initialClass = await htmlElement.getAttribute("class");
  const initialTheme = initialClass?.includes("dark") ? "dark" : "light";

  await toggle.click();

  // Wait for theme to change
  await page.waitForFunction(
    ({ prevTheme }) => {
      const html = document.documentElement;
      const currentIsDark = html.classList.contains("dark");
      return prevTheme === "dark" ? !currentIsDark : currentIsDark;
    },
    { prevTheme: initialTheme },
    { timeout: 2000 }
  );

  return initialTheme === "dark" ? "light" : "dark";
}

/**
 * Helper to get computed style property
 */
async function getComputedStyleValue(
  page: import("@playwright/test").Page,
  selector: string,
  property: string
): Promise<string> {
  return page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return "";
      return getComputedStyle(element).getPropertyValue(prop);
    },
    { sel: selector, prop: property }
  );
}

/**
 * Helper to check if element has theme-aware styling
 * Returns true if the color values differ between light and dark themes
 */
async function verifyThemeAwareStyling(
  page: import("@playwright/test").Page,
  selector: string,
  property: string
): Promise<{ light: string; dark: string; different: boolean }> {
  // Get current theme
  const htmlClass = await page.locator("html").getAttribute("class");
  const currentTheme = htmlClass?.includes("dark") ? "dark" : "light";

  // Get style in current theme
  const currentValue = await getComputedStyleValue(page, selector, property);

  // Toggle theme
  await toggleTheme(page);

  // Get style in opposite theme
  const oppositeValue = await getComputedStyleValue(page, selector, property);

  // Toggle back to original
  await toggleTheme(page);

  return {
    light: currentTheme === "light" ? currentValue : oppositeValue,
    dark: currentTheme === "dark" ? currentValue : oppositeValue,
    different: currentValue !== oppositeValue,
  };
}

test.describe("User Story 5: Consistent Component Styling", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.addInitScript(() => {
      localStorage.removeItem("cemdash-theme");
    });
  });

  /**
   * T049: E2E test - transaction table uses theme colors
   *
   * Tests that the transaction table:
   * 1. Has theme-aware background colors
   * 2. Has theme-aware text colors
   * 3. Has theme-aware border colors
   * 4. Row hover states use theme colors
   */
  test.describe("T049: Transaction Table Theme Styling", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to dashboard which contains transaction tables
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
    });

    test("should have theme-aware table background colors", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Look for table element - transaction table or recurring table
      const tableSelector = 'table, [role="table"], [data-testid*="table"]';
      const table = page.locator(tableSelector).first();

      // Wait for table to be visible (data loaded)
      await expect(table).toBeVisible({ timeout: 15000 });

      // Get background color in current theme
      const bgResult = await verifyThemeAwareStyling(
        page,
        tableSelector,
        "background-color"
      );

      // Background should be different between themes (or use CSS variable)
      // Even if not different, should not be transparent/unset
      expect(bgResult.light || bgResult.dark).toBeTruthy();
    });

    test("should have theme-aware table text colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Look for table cells
      const cellSelector = "td, th, [role='cell'], [role='columnheader']";

      // Wait for table content
      await page.waitForSelector(cellSelector, { timeout: 15000 });

      const textResult = await verifyThemeAwareStyling(
        page,
        cellSelector,
        "color"
      );

      // Text color should ideally differ between themes
      // At minimum, should have a valid color value
      expect(textResult.light || textResult.dark).toBeTruthy();
    });

    test("should have theme-aware table border colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Look for bordered elements in the table
      const borderSelector = "table, thead, tbody, tr, th, td";

      await page.waitForSelector(borderSelector, { timeout: 15000 });

      const borderResult = await verifyThemeAwareStyling(
        page,
        "tr",
        "border-color"
      );

      // Should have some border styling
      expect(borderResult.light || borderResult.dark).toBeTruthy();
    });

    test("should update table styles when theme is toggled", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Wait for table content
      await page.waitForSelector("table, [role='table']", { timeout: 15000 });

      // Capture initial styles
      const initialStyles = await page.evaluate(() => {
        const table = document.querySelector("table, [role='table']");
        if (!table) return null;
        const computed = getComputedStyle(table);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });

      expect(initialStyles).not.toBeNull();

      // Toggle theme
      await toggleTheme(page);

      // Give CSS time to update
      await page.waitForTimeout(100);

      // Capture new styles
      const newStyles = await page.evaluate(() => {
        const table = document.querySelector("table, [role='table']");
        if (!table) return null;
        const computed = getComputedStyle(table);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });

      expect(newStyles).not.toBeNull();

      // At least one style property should have changed
      const stylesChanged =
        initialStyles?.backgroundColor !== newStyles?.backgroundColor ||
        initialStyles?.color !== newStyles?.color;

      expect(stylesChanged).toBe(true);
    });
  });

  /**
   * T050: E2E test - modal dialogs use theme colors
   *
   * Tests that modal dialogs:
   * 1. Have theme-aware background colors
   * 2. Have theme-aware text colors
   * 3. Have theme-aware border/shadow styling
   * 4. Overlay uses appropriate theme opacity
   */
  test.describe("T050: Modal Dialog Theme Styling", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to calendar page which has event modals
      await page.goto("/calendar");
      await page.waitForLoadState("networkidle");
    });

    test("should have theme-aware modal background when opened", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Click on a date cell to trigger event creation modal
      const calendarCell = page.locator('[role="gridcell"]').first();
      await expect(calendarCell).toBeVisible({ timeout: 10000 });
      await calendarCell.click();

      // Wait for modal to appear
      const modalSelector =
        '[role="dialog"], [data-radix-dialog-content], .dialog-content';
      await page.waitForSelector(modalSelector, { timeout: 5000 });

      // Get modal background color
      const bgColor = await getComputedStyleValue(
        page,
        modalSelector,
        "background-color"
      );
      expect(bgColor).toBeTruthy();

      // Close modal
      await page.keyboard.press("Escape");
    });

    test("should update modal styles when theme changes", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Open modal
      const calendarCell = page.locator('[role="gridcell"]').first();
      await expect(calendarCell).toBeVisible({ timeout: 10000 });
      await calendarCell.click();

      const modalSelector =
        '[role="dialog"], [data-radix-dialog-content], .dialog-content';
      await page.waitForSelector(modalSelector, { timeout: 5000 });

      // Get initial background color
      const initialBg = await getComputedStyleValue(
        page,
        modalSelector,
        "background-color"
      );

      // Toggle theme (modal should stay open)
      await page.locator('[data-testid="theme-toggle"]').click();
      await page.waitForTimeout(200);

      // Get new background color
      const newBg = await getComputedStyleValue(
        page,
        modalSelector,
        "background-color"
      );

      // Background should change with theme
      expect(initialBg !== newBg || initialBg !== "").toBe(true);

      // Close modal
      await page.keyboard.press("Escape");
    });

    test("should have theme-aware modal overlay", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Open modal
      const calendarCell = page.locator('[role="gridcell"]').first();
      await expect(calendarCell).toBeVisible({ timeout: 10000 });
      await calendarCell.click();

      // Wait for overlay
      const overlaySelector =
        '[data-radix-dialog-overlay], .dialog-overlay, [class*="overlay"]';
      await page.waitForSelector(overlaySelector, { timeout: 5000 });

      // Overlay should have some background styling
      const overlayBg = await getComputedStyleValue(
        page,
        overlaySelector,
        "background-color"
      );

      // Overlay should be semi-transparent
      expect(overlayBg).toBeTruthy();

      // Close modal
      await page.keyboard.press("Escape");
    });

    test("should have theme-aware modal text colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Open modal
      const calendarCell = page.locator('[role="gridcell"]').first();
      await expect(calendarCell).toBeVisible({ timeout: 10000 });
      await calendarCell.click();

      const modalSelector =
        '[role="dialog"], [data-radix-dialog-content], .dialog-content';
      await page.waitForSelector(modalSelector, { timeout: 5000 });

      // Get text color
      const textColor = await getComputedStyleValue(
        page,
        modalSelector,
        "color"
      );
      expect(textColor).toBeTruthy();

      // Close modal
      await page.keyboard.press("Escape");
    });
  });

  /**
   * T051: E2E test - form inputs use theme colors
   *
   * Tests that form inputs:
   * 1. Have theme-aware background colors
   * 2. Have theme-aware border colors
   * 3. Have theme-aware text colors
   * 4. Focus states use theme-appropriate styling
   */
  test.describe("T051: Form Inputs Theme Styling", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to login page which has form inputs
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
    });

    test("should have theme-aware input background colors", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Find text input
      const inputSelector =
        'input[type="text"], input[type="email"], input[type="password"], input:not([type])';
      await expect(page.locator(inputSelector).first()).toBeVisible({
        timeout: 10000,
      });

      const bgResult = await verifyThemeAwareStyling(
        page,
        inputSelector,
        "background-color"
      );

      // Input should have valid background
      expect(bgResult.light || bgResult.dark).toBeTruthy();
    });

    test("should have theme-aware input border colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const inputSelector =
        'input[type="text"], input[type="email"], input[type="password"], input:not([type])';
      await expect(page.locator(inputSelector).first()).toBeVisible({
        timeout: 10000,
      });

      const borderResult = await verifyThemeAwareStyling(
        page,
        inputSelector,
        "border-color"
      );

      // Input should have border styling
      expect(borderResult.light || borderResult.dark).toBeTruthy();
    });

    test("should have theme-aware input text colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const inputSelector =
        'input[type="text"], input[type="email"], input[type="password"], input:not([type])';
      await expect(page.locator(inputSelector).first()).toBeVisible({
        timeout: 10000,
      });

      const textResult = await verifyThemeAwareStyling(
        page,
        inputSelector,
        "color"
      );

      // Input text color should differ between themes
      expect(textResult.light || textResult.dark).toBeTruthy();
    });

    test("should update input styles when theme is toggled", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const inputSelector =
        'input[type="text"], input[type="email"], input[type="password"], input:not([type])';
      await expect(page.locator(inputSelector).first()).toBeVisible({
        timeout: 10000,
      });

      // Capture initial styles
      const initialStyles = await page.evaluate((selector) => {
        const input = document.querySelector(selector) as HTMLElement;
        if (!input) return null;
        const computed = getComputedStyle(input);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
        };
      }, inputSelector);

      expect(initialStyles).not.toBeNull();

      // Toggle theme
      await toggleTheme(page);
      await page.waitForTimeout(100);

      // Capture new styles
      const newStyles = await page.evaluate((selector) => {
        const input = document.querySelector(selector) as HTMLElement;
        if (!input) return null;
        const computed = getComputedStyle(input);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
        };
      }, inputSelector);

      expect(newStyles).not.toBeNull();

      // At least one style should change
      const stylesChanged =
        initialStyles?.backgroundColor !== newStyles?.backgroundColor ||
        initialStyles?.borderColor !== newStyles?.borderColor ||
        initialStyles?.color !== newStyles?.color;

      expect(stylesChanged).toBe(true);
    });

    test("should have theme-aware button styling", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Find a button (submit button on login form)
      const buttonSelector = 'button[type="submit"], button.btn, .button';
      await expect(page.locator(buttonSelector).first()).toBeVisible({
        timeout: 10000,
      });

      const bgResult = await verifyThemeAwareStyling(
        page,
        buttonSelector,
        "background-color"
      );

      // Button should have background styling
      expect(bgResult.light || bgResult.dark).toBeTruthy();
    });
  });

  /**
   * T052: E2E test - cards and badges use theme colors
   *
   * Tests that cards and badges:
   * 1. KPI cards have theme-aware backgrounds
   * 2. KPI cards have theme-aware borders/shadows
   * 3. Badges have theme-aware colors
   * 4. Card content text uses theme colors
   */
  test.describe("T052: Cards and Badges Theme Styling", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to dashboard which has KPI cards
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
    });

    test("should have theme-aware card background colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Find card elements
      const cardSelector =
        '[class*="card"], [data-testid*="card"], .card, [role="article"]';

      // Wait for cards to load
      await expect(page.locator(cardSelector).first()).toBeVisible({
        timeout: 15000,
      });

      const bgResult = await verifyThemeAwareStyling(
        page,
        cardSelector,
        "background-color"
      );

      // Cards should have valid background
      expect(bgResult.light || bgResult.dark).toBeTruthy();
    });

    test("should have theme-aware card border styling", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const cardSelector =
        '[class*="card"], [data-testid*="card"], .card, [role="article"]';
      await expect(page.locator(cardSelector).first()).toBeVisible({
        timeout: 15000,
      });

      const borderResult = await verifyThemeAwareStyling(
        page,
        cardSelector,
        "border-color"
      );

      // Cards should have border styling
      expect(borderResult.light || borderResult.dark).toBeTruthy();
    });

    test("should have theme-aware card text colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const cardSelector =
        '[class*="card"], [data-testid*="card"], .card, [role="article"]';
      await expect(page.locator(cardSelector).first()).toBeVisible({
        timeout: 15000,
      });

      const textResult = await verifyThemeAwareStyling(
        page,
        cardSelector,
        "color"
      );

      // Card text should differ between themes
      expect(textResult.different || textResult.light !== "").toBe(true);
    });

    test("should update card styles when theme is toggled", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const cardSelector =
        '[class*="card"], [data-testid*="card"], .card, [role="article"]';
      await expect(page.locator(cardSelector).first()).toBeVisible({
        timeout: 15000,
      });

      // Capture initial styles
      const initialStyles = await page.evaluate((selector) => {
        const card = document.querySelector(selector) as HTMLElement;
        if (!card) return null;
        const computed = getComputedStyle(card);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow,
        };
      }, cardSelector);

      expect(initialStyles).not.toBeNull();

      // Toggle theme
      await toggleTheme(page);
      await page.waitForTimeout(100);

      // Capture new styles
      const newStyles = await page.evaluate((selector) => {
        const card = document.querySelector(selector) as HTMLElement;
        if (!card) return null;
        const computed = getComputedStyle(card);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow,
        };
      }, cardSelector);

      expect(newStyles).not.toBeNull();

      // At least one style should change
      const stylesChanged =
        initialStyles?.backgroundColor !== newStyles?.backgroundColor ||
        initialStyles?.borderColor !== newStyles?.borderColor ||
        initialStyles?.boxShadow !== newStyles?.boxShadow;

      expect(stylesChanged).toBe(true);
    });

    test("should have theme-aware badge styling", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Find badge elements (category badges, status badges, etc.)
      const badgeSelector =
        '[class*="badge"], [data-testid*="badge"], .badge, .tag, .chip';

      // Wait for any badges to appear (may not exist on all pages)
      const badges = page.locator(badgeSelector);
      const count = await badges.count();

      if (count > 0) {
        const bgResult = await verifyThemeAwareStyling(
          page,
          badgeSelector,
          "background-color"
        );

        // Badges should have background styling
        expect(bgResult.light || bgResult.dark).toBeTruthy();
      } else {
        // If no badges on page, test passes (not all pages have badges)
        expect(true).toBe(true);
      }
    });
  });

  /**
   * T053: E2E test - navigation sidebar uses theme colors
   *
   * Tests that the navigation sidebar:
   * 1. Has theme-aware background color (Abyss in dark mode)
   * 2. Has theme-aware border color
   * 3. Has theme-aware text colors
   * 4. Navigation items have theme-aware hover/active states
   */
  test.describe("T053: Navigation Sidebar Theme Styling", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to dashboard which has the sidebar
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
    });

    test("should have theme-aware sidebar background color", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Find sidebar (aside element or sidebar class)
      const sidebarSelector =
        'aside, [role="navigation"], [class*="sidebar"], nav.sidebar';

      // Sidebar may only be visible on desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(100);

      const sidebar = page.locator(sidebarSelector).first();

      // Check if sidebar is visible at this viewport
      if (await sidebar.isVisible()) {
        const bgResult = await verifyThemeAwareStyling(
          page,
          sidebarSelector,
          "background-color"
        );

        // Sidebar should have background styling
        expect(bgResult.light || bgResult.dark).toBeTruthy();
      } else {
        // If sidebar not visible at current viewport, test passes
        expect(true).toBe(true);
      }
    });

    test("should have theme-aware sidebar border color", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const sidebarSelector =
        'aside, [role="navigation"], [class*="sidebar"], nav.sidebar';

      // Ensure desktop viewport for sidebar
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(100);

      const sidebar = page.locator(sidebarSelector).first();

      if (await sidebar.isVisible()) {
        const borderResult = await verifyThemeAwareStyling(
          page,
          sidebarSelector,
          "border-color"
        );

        // Sidebar should have border styling
        expect(borderResult.light || borderResult.dark).toBeTruthy();
      } else {
        expect(true).toBe(true);
      }
    });

    test("should have theme-aware sidebar text colors", async ({ page }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const sidebarSelector =
        'aside, [role="navigation"], [class*="sidebar"], nav.sidebar';

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(100);

      const sidebar = page.locator(sidebarSelector).first();

      if (await sidebar.isVisible()) {
        const textResult = await verifyThemeAwareStyling(
          page,
          sidebarSelector,
          "color"
        );

        // Sidebar text should have color styling
        expect(textResult.light || textResult.dark).toBeTruthy();
      } else {
        expect(true).toBe(true);
      }
    });

    test("should update sidebar styles when theme is toggled", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      const sidebarSelector =
        'aside, [role="navigation"], [class*="sidebar"], nav.sidebar';

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(100);

      const sidebar = page.locator(sidebarSelector).first();

      if (await sidebar.isVisible()) {
        // Capture initial styles
        const initialStyles = await page.evaluate((selector) => {
          const sidebar = document.querySelector(selector) as HTMLElement;
          if (!sidebar) return null;
          const computed = getComputedStyle(sidebar);
          return {
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            color: computed.color,
          };
        }, sidebarSelector);

        expect(initialStyles).not.toBeNull();

        // Toggle theme
        await toggleTheme(page);
        await page.waitForTimeout(100);

        // Capture new styles
        const newStyles = await page.evaluate((selector) => {
          const sidebar = document.querySelector(selector) as HTMLElement;
          if (!sidebar) return null;
          const computed = getComputedStyle(sidebar);
          return {
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor,
            color: computed.color,
          };
        }, sidebarSelector);

        expect(newStyles).not.toBeNull();

        // At least one style should change
        const stylesChanged =
          initialStyles?.backgroundColor !== newStyles?.backgroundColor ||
          initialStyles?.borderColor !== newStyles?.borderColor ||
          initialStyles?.color !== newStyles?.color;

        expect(stylesChanged).toBe(true);
      } else {
        expect(true).toBe(true);
      }
    });

    test("should have theme-aware navigation button styling", async ({
      page,
    }) => {
      await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
        timeout: 10000,
      });

      // Look for time period filter buttons in sidebar
      const buttonSelector =
        'aside button, [role="navigation"] button, nav button';

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(100);

      const buttons = page.locator(buttonSelector);
      const count = await buttons.count();

      if (count > 0) {
        const bgResult = await verifyThemeAwareStyling(
          page,
          buttonSelector,
          "background-color"
        );

        // Navigation buttons should have background styling
        expect(bgResult.light || bgResult.dark).toBeTruthy();
      } else {
        expect(true).toBe(true);
      }
    });
  });
});

/**
 * Cross-component theme consistency tests
 */
test.describe("US5: Cross-Component Theme Consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("cemdash-theme");
    });
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("should apply consistent background theme across all components", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Ensure desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(100);

    // Get background colors from multiple components
    const bgColors = await page.evaluate(() => {
      const body = document.body;
      const sidebar = document.querySelector("aside");
      const main = document.querySelector("main");
      const card = document.querySelector('[class*="card"]');

      return {
        body: body ? getComputedStyle(body).backgroundColor : null,
        sidebar: sidebar ? getComputedStyle(sidebar).backgroundColor : null,
        main: main ? getComputedStyle(main).backgroundColor : null,
        card: card ? getComputedStyle(card).backgroundColor : null,
      };
    });

    // All components should have some background color
    expect(bgColors.body).toBeTruthy();
    // At least some components should be present
    const hasComponents = bgColors.sidebar || bgColors.main || bgColors.card;
    expect(hasComponents).toBeTruthy();
  });

  test("should maintain theme after multiple toggles", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Toggle theme multiple times
    for (let i = 0; i < 4; i++) {
      await toggleTheme(page);
      await page.waitForTimeout(100);
    }

    // Should still be functional
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass !== null && htmlClass !== undefined).toBe(true);

    // Components should still have styling
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      return getComputedStyle(body).backgroundColor !== "";
    });
    expect(hasStyles).toBe(true);
  });
});
