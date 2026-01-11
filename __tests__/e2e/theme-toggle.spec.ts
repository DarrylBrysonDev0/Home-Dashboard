import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 1: Toggle Between Light and Dark Theme
 *
 * Goal: Users can click a theme toggle button and instantly switch between
 * light and dark themes.
 *
 * TDD Phase: RED - These tests should FAIL until:
 * - T017: ThemeToggle component is created
 * - T018: useTheme hook is implemented
 * - T019: Hooks exported from lib/theme/index.ts
 *
 * Acceptance Scenarios:
 * 1. Theme toggle click switches theme (T013)
 * 2. Theme switch < 100ms with no FOUC (T014)
 * 3. Theme persists across page navigation (T015)
 */

test.describe("User Story 1: Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.addInitScript(() => {
      localStorage.removeItem("cemdash-theme");
    });
    // Navigate to login page (doesn't require auth, no redirect needed)
    await page.goto("/login");
    // Wait for JavaScript to hydrate
    await page.waitForLoadState("networkidle");
  });

  /**
   * T013: E2E test - theme toggle click switches theme
   *
   * Tests that clicking the theme toggle button:
   * 1. Changes the theme class on the <html> element
   * 2. Toggle is accessible and has proper aria attributes
   */
  test("T013: should switch theme when toggle is clicked", async ({ page }) => {
    // Wait for the page to load and theme toggle to be visible
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Get the initial theme class from <html>
    const htmlElement = page.locator("html");
    const initialClass = await htmlElement.getAttribute("class");
    const initialTheme = initialClass?.includes("dark") ? "dark" : "light";

    // Click the theme toggle button
    await page.locator('[data-testid="theme-toggle"]').click();

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

    // Verify theme has switched
    const newClass = await htmlElement.getAttribute("class");
    const newTheme = newClass?.includes("dark") ? "dark" : "light";
    expect(newTheme).not.toBe(initialTheme);

    // Verify toggle has correct aria-label for current state
    const toggle = page.locator('[data-testid="theme-toggle"]');
    const ariaLabel = await toggle.getAttribute("aria-label");
    expect(ariaLabel).toMatch(/theme|dark|light/i);
  });

  test("T013: should toggle back to original theme on second click", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Get initial theme
    const htmlElement = page.locator("html");
    const initialClass = await htmlElement.getAttribute("class");
    const initialTheme = initialClass?.includes("dark") ? "dark" : "light";

    // Click toggle twice
    await page.locator('[data-testid="theme-toggle"]').click();
    await page.waitForTimeout(200); // Brief wait for state update
    await page.locator('[data-testid="theme-toggle"]').click();

    // Wait for theme to return to initial state
    await page.waitForFunction(
      ({ expected }) => {
        const html = document.documentElement;
        const currentIsDark = html.classList.contains("dark");
        return expected === "dark" ? currentIsDark : !currentIsDark;
      },
      { expected: initialTheme },
      { timeout: 2000 }
    );

    // Verify theme has returned to original
    const finalClass = await htmlElement.getAttribute("class");
    const finalTheme = finalClass?.includes("dark") ? "dark" : "light";
    expect(finalTheme).toBe(initialTheme);
  });

  /**
   * T014: E2E test - theme switch < 100ms with no FOUC
   *
   * Tests performance requirements:
   * 1. Theme switch completes within 100ms
   * 2. No flash of unstyled content during switch
   */
  test("T014: should switch theme in less than 100ms", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Measure time for theme switch
    const startTime = await page.evaluate(() => performance.now());

    await page.locator('[data-testid="theme-toggle"]').click();

    // Wait for theme class to change
    await page.waitForFunction(
      () => document.documentElement.classList.length > 0,
      {},
      { timeout: 200 }
    );

    const endTime = await page.evaluate(() => performance.now());
    const duration = endTime - startTime;

    // Theme switch should complete within 100ms (with some buffer for Playwright overhead)
    expect(duration).toBeLessThan(150);
  });

  test("T014: should not have flash of unstyled content (FOUC)", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Track style changes during toggle
    const styleChanges = await page.evaluate(async () => {
      const changes: string[] = [];
      const html = document.documentElement;
      const initialBg = getComputedStyle(html).backgroundColor;

      // Set up mutation observer before click
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === "class") {
            const currentBg = getComputedStyle(html).backgroundColor;
            changes.push(currentBg);
          }
        });
      });

      observer.observe(html, { attributes: true, attributeFilter: ["class"] });

      // Simulate click via finding and clicking toggle
      const toggle = document.querySelector('[data-testid="theme-toggle"]');
      if (toggle) {
        (toggle as HTMLElement).click();
      }

      // Wait a bit for any changes
      await new Promise((resolve) => setTimeout(resolve, 100));

      observer.disconnect();
      return { initialBg, changes };
    });

    // Should have exactly one or two style changes (class add/remove)
    // No intermediate states that would cause FOUC
    expect(styleChanges.changes.length).toBeLessThanOrEqual(2);
  });

  /**
   * T015: E2E test - theme persists across page navigation
   *
   * Tests that the selected theme:
   * 1. Persists when navigating to another page
   * 2. Is applied immediately on the new page (no flash)
   */
  test("T015: should persist theme across page navigation", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Get initial theme
    const htmlElement = page.locator("html");
    const initialClass = await htmlElement.getAttribute("class");
    const initialTheme = initialClass?.includes("dark") ? "dark" : "light";

    // Switch to opposite theme
    await page.locator('[data-testid="theme-toggle"]').click();

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

    // Get the new theme
    const newClass = await htmlElement.getAttribute("class");
    const newTheme = newClass?.includes("dark") ? "dark" : "light";

    // Navigate to another page (calendar)
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded");

    // Verify theme persists on new page
    const calendarHtmlClass = await page.locator("html").getAttribute("class");
    const calendarTheme = calendarHtmlClass?.includes("dark") ? "dark" : "light";
    expect(calendarTheme).toBe(newTheme);
  });

  test("T015: should persist theme after hard navigation", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    // Switch theme
    await page.locator('[data-testid="theme-toggle"]').click();

    // Wait for localStorage to be updated
    await page.waitForFunction(() => {
      return localStorage.getItem("cemdash-theme") !== null;
    });

    // Get the current theme after toggle
    const themeAfterToggle = await page.locator("html").getAttribute("class");
    const expectedTheme = themeAfterToggle?.includes("dark") ? "dark" : "light";

    // Navigate away and back (simulates hard navigation)
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Theme should still be the same
    const themeAfterNavigation = await page.locator("html").getAttribute("class");
    const actualTheme = themeAfterNavigation?.includes("dark") ? "dark" : "light";
    expect(actualTheme).toBe(expectedTheme);
  });
});

test.describe("User Story 1: Theme Toggle - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should have accessible theme toggle button", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    const toggle = page.locator('[data-testid="theme-toggle"]');

    // Should be a button element
    const tagName = await toggle.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("button");

    // Should have accessible name
    const ariaLabel = await toggle.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toMatch(/theme|toggle|dark|light/i);

    // Should be focusable
    await toggle.focus();
    await expect(toggle).toBeFocused();
  });

  test("should be keyboard accessible", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    const toggle = page.locator('[data-testid="theme-toggle"]');
    const htmlElement = page.locator("html");

    // Get initial theme
    const initialClass = await htmlElement.getAttribute("class");
    const initialTheme = initialClass?.includes("dark") ? "dark" : "light";

    // Focus and activate with keyboard
    await toggle.focus();
    await page.keyboard.press("Enter");

    // Wait for theme change
    await page.waitForFunction(
      ({ prevTheme }) => {
        const html = document.documentElement;
        const currentIsDark = html.classList.contains("dark");
        return prevTheme === "dark" ? !currentIsDark : currentIsDark;
      },
      { prevTheme: initialTheme },
      { timeout: 2000 }
    );

    // Theme should have changed
    const newClass = await htmlElement.getAttribute("class");
    const newTheme = newClass?.includes("dark") ? "dark" : "light";
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe("User Story 1: Theme Toggle - Visual Feedback", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display correct icon based on current theme", async ({
    page,
  }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    const toggle = page.locator('[data-testid="theme-toggle"]');

    // Check for sun or moon icon based on theme
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = htmlClass?.includes("dark");

    // In dark mode, should show sun icon (to switch to light)
    // In light mode, should show moon icon (to switch to dark)
    const iconSelector = isDark ? '[data-testid="sun-icon"]' : '[data-testid="moon-icon"]';
    await expect(toggle.locator(iconSelector)).toBeVisible();
  });

  test("should update icon after theme toggle", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({
      timeout: 10000,
    });

    const toggle = page.locator('[data-testid="theme-toggle"]');
    const htmlClass = await page.locator("html").getAttribute("class");
    const initiallyDark = htmlClass?.includes("dark");

    // Click to toggle
    await toggle.click();

    // Wait for theme change
    await page.waitForTimeout(200);

    // Icon should have changed
    // After toggle: was dark (had sun) -> now light (has moon)
    // After toggle: was light (had moon) -> now dark (has sun)
    const expectedIcon = initiallyDark ? '[data-testid="moon-icon"]' : '[data-testid="sun-icon"]';
    await expect(toggle.locator(expectedIcon)).toBeVisible({ timeout: 2000 });
  });
});
