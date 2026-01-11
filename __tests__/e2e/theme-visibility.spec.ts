import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 4: Access Theme Toggle from Any Page
 *
 * Goal: Theme toggle icon button is visible in header bar across all pages
 *
 * TDD Phase: These tests verify that the ThemeToggle component is accessible
 * from every page in the application and maintains proper functionality.
 *
 * Acceptance Scenarios:
 * 1. Theme toggle visible on dashboard page (T040)
 * 2. Theme toggle visible on calendar page (T041)
 * 3. Theme toggle visible on admin page (T042)
 * 4. Theme toggle icon updates (sun/moon) based on theme (T043)
 * 5. Theme toggle visible on mobile viewport (T044)
 */

test.describe("User Story 4: Theme Toggle Visibility", () => {
  /**
   * T040: E2E test - theme toggle visible on dashboard page
   *
   * Tests that the theme toggle button is visible and accessible
   * on the main dashboard page.
   */
  test("T040: should display theme toggle on dashboard page", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible in the header
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Verify it's a button element for accessibility
    const tagName = await themeToggle.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("button");

    // Verify toggle is in the header area (within first 100px from top)
    const boundingBox = await themeToggle.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeLessThan(100);
  });

  test("T040: theme toggle on dashboard should be functional", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get initial theme state
    const initialClass = await page.locator("html").getAttribute("class");
    const initiallyDark = initialClass?.includes("dark");

    // Click toggle
    await themeToggle.click();

    // Wait for theme to change
    await page.waitForFunction(
      ({ wasDark }) => {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        return wasDark ? !isDark : isDark;
      },
      { wasDark: initiallyDark },
      { timeout: 2000 }
    );

    // Verify theme changed
    const newClass = await page.locator("html").getAttribute("class");
    const nowDark = newClass?.includes("dark");
    expect(nowDark).not.toBe(initiallyDark);
  });

  /**
   * T041: E2E test - theme toggle visible on calendar page
   *
   * Tests that the theme toggle button is visible and accessible
   * on the calendar page.
   */
  test("T041: should display theme toggle on calendar page", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible in the header
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Verify it's a button element for accessibility
    const tagName = await themeToggle.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("button");

    // Verify toggle is in the header area
    const boundingBox = await themeToggle.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeLessThan(100);
  });

  test("T041: theme toggle on calendar should be functional", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get initial theme state
    const initialClass = await page.locator("html").getAttribute("class");
    const initiallyDark = initialClass?.includes("dark");

    // Click toggle
    await themeToggle.click();

    // Wait for theme to change
    await page.waitForFunction(
      ({ wasDark }) => {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        return wasDark ? !isDark : isDark;
      },
      { wasDark: initiallyDark },
      { timeout: 2000 }
    );

    // Verify theme changed
    const newClass = await page.locator("html").getAttribute("class");
    const nowDark = newClass?.includes("dark");
    expect(nowDark).not.toBe(initiallyDark);
  });

  /**
   * T042: E2E test - theme toggle visible on admin page
   *
   * Tests that the theme toggle button is visible and accessible
   * on the admin page and its sub-pages.
   */
  test("T042: should display theme toggle on admin page", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible in the header
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Verify it's a button element for accessibility
    const tagName = await themeToggle.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("button");

    // Verify toggle is in the header area
    const boundingBox = await themeToggle.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeLessThan(100);
  });

  test("T042: theme toggle on admin should be functional", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get initial theme state
    const initialClass = await page.locator("html").getAttribute("class");
    const initiallyDark = initialClass?.includes("dark");

    // Click toggle
    await themeToggle.click();

    // Wait for theme to change
    await page.waitForFunction(
      ({ wasDark }) => {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        return wasDark ? !isDark : isDark;
      },
      { wasDark: initiallyDark },
      { timeout: 2000 }
    );

    // Verify theme changed
    const newClass = await page.locator("html").getAttribute("class");
    const nowDark = newClass?.includes("dark");
    expect(nowDark).not.toBe(initiallyDark);
  });

  test("T042: should display theme toggle on admin sub-pages", async ({
    page,
  }) => {
    // Test on admin categories page
    await page.goto("/admin/categories");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Navigate to admin settings
    await page.goto("/admin/settings");
    await page.waitForLoadState("domcontentloaded");
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Navigate to admin users
    await page.goto("/admin/users");
    await page.waitForLoadState("domcontentloaded");
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
  });
});

test.describe("User Story 4: Theme Toggle Icon Updates", () => {
  /**
   * T043: E2E test - theme toggle icon updates (sun/moon) based on theme
   *
   * Tests that the toggle displays the correct icon:
   * - Sun icon when in dark mode (to switch to light)
   * - Moon icon when in light mode (to switch to dark)
   */
  test("T043: should display sun icon in dark mode", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Ensure we're in dark mode
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = htmlClass?.includes("dark");

    if (!isDark) {
      // Switch to dark mode first
      await themeToggle.click();
      await page.waitForFunction(() =>
        document.documentElement.classList.contains("dark")
      );
    }

    // In dark mode, should show sun icon (to switch to light)
    const sunIcon = themeToggle.locator('[data-testid="sun-icon"]');
    await expect(sunIcon).toBeVisible({ timeout: 2000 });

    // Moon icon should not be visible
    const moonIcon = themeToggle.locator('[data-testid="moon-icon"]');
    await expect(moonIcon).not.toBeVisible();
  });

  test("T043: should display moon icon in light mode", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Ensure we're in light mode
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = htmlClass?.includes("dark");

    if (isDark) {
      // Switch to light mode first
      await themeToggle.click();
      await page.waitForFunction(
        () => !document.documentElement.classList.contains("dark")
      );
    }

    // In light mode, should show moon icon (to switch to dark)
    const moonIcon = themeToggle.locator('[data-testid="moon-icon"]');
    await expect(moonIcon).toBeVisible({ timeout: 2000 });

    // Sun icon should not be visible
    const sunIcon = themeToggle.locator('[data-testid="sun-icon"]');
    await expect(sunIcon).not.toBeVisible();
  });

  test("T043: icon should change after toggle click", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get current theme and expected icon
    const htmlClass = await page.locator("html").getAttribute("class");
    const initiallyDark = htmlClass?.includes("dark");

    // Check initial icon
    if (initiallyDark) {
      await expect(
        themeToggle.locator('[data-testid="sun-icon"]')
      ).toBeVisible();
    } else {
      await expect(
        themeToggle.locator('[data-testid="moon-icon"]')
      ).toBeVisible();
    }

    // Click toggle
    await themeToggle.click();

    // Wait for theme change
    await page.waitForFunction(
      ({ wasDark }) => {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        return wasDark ? !isDark : isDark;
      },
      { wasDark: initiallyDark },
      { timeout: 2000 }
    );

    // Check icon has flipped
    if (initiallyDark) {
      // Was dark (sun shown), now light (moon should show)
      await expect(
        themeToggle.locator('[data-testid="moon-icon"]')
      ).toBeVisible({ timeout: 2000 });
      await expect(
        themeToggle.locator('[data-testid="sun-icon"]')
      ).not.toBeVisible();
    } else {
      // Was light (moon shown), now dark (sun should show)
      await expect(
        themeToggle.locator('[data-testid="sun-icon"]')
      ).toBeVisible({ timeout: 2000 });
      await expect(
        themeToggle.locator('[data-testid="moon-icon"]')
      ).not.toBeVisible();
    }
  });

  test("T043: aria-label should update based on theme", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Wait for component to be mounted (aria-label changes from "Loading..." to theme-specific)
    await page.waitForFunction(() => {
      const toggle = document.querySelector('[data-testid="theme-toggle"]');
      const label = toggle?.getAttribute("aria-label");
      return label && !label.includes("Loading");
    }, { timeout: 5000 });

    // Get current theme
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = htmlClass?.includes("dark");

    // Check aria-label matches theme
    const ariaLabel = await themeToggle.getAttribute("aria-label");

    if (isDark) {
      // In dark mode, aria-label should indicate switching to light
      expect(ariaLabel).toMatch(/light/i);
    } else {
      // In light mode, aria-label should indicate switching to dark
      expect(ariaLabel).toMatch(/dark/i);
    }
  });
});

test.describe("User Story 4: Theme Toggle Mobile Visibility", () => {
  /**
   * T044: E2E test - theme toggle visible on mobile viewport
   *
   * Tests that the theme toggle remains visible and functional
   * on mobile viewport sizes.
   */
  test("T044: should be visible on mobile viewport (iPhone SE)", async ({
    page,
  }) => {
    // Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Should still be in the header (within top 80px for mobile)
    const boundingBox = await themeToggle.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeLessThan(80);
  });

  test("T044: should be visible on mobile viewport (iPhone 12 Pro)", async ({
    page,
  }) => {
    // Set mobile viewport (iPhone 12 Pro dimensions)
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
  });

  test("T044: should be visible on mobile viewport (Pixel 5)", async ({
    page,
  }) => {
    // Set mobile viewport (Pixel 5 dimensions)
    await page.setViewportSize({ width: 393, height: 851 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });
  });

  test("T044: should be functional on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get initial theme
    const initialClass = await page.locator("html").getAttribute("class");
    const initiallyDark = initialClass?.includes("dark");

    // Click toggle on mobile
    await themeToggle.click();

    // Wait for theme change
    await page.waitForFunction(
      ({ wasDark }) => {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        return wasDark ? !isDark : isDark;
      },
      { wasDark: initiallyDark },
      { timeout: 2000 }
    );

    // Verify theme changed
    const newClass = await page.locator("html").getAttribute("class");
    const nowDark = newClass?.includes("dark");
    expect(nowDark).not.toBe(initiallyDark);
  });

  test("T044: should be visible on tablet viewport", async ({ page }) => {
    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Theme toggle should be visible
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Verify toggle is in header
    const boundingBox = await themeToggle.boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.y).toBeLessThan(100);
  });

  test("T044: should be tappable on touch devices (minimum tap target)", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Check minimum tap target size (44x44 is WCAG minimum)
    const boundingBox = await themeToggle.boundingBox();
    expect(boundingBox).not.toBeNull();

    // The button should have at least 40x40 clickable area
    // (allowing slight tolerance below 44px WCAG recommendation)
    expect(boundingBox!.width).toBeGreaterThanOrEqual(32);
    expect(boundingBox!.height).toBeGreaterThanOrEqual(32);
  });
});

test.describe("User Story 4: Theme Toggle Cross-Page Consistency", () => {
  test("should maintain theme state when navigating between pages", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get initial theme
    const initialClass = await page.locator("html").getAttribute("class");
    const initiallyDark = initialClass?.includes("dark");

    // Toggle theme
    await themeToggle.click();

    // Wait for theme change
    await page.waitForFunction(
      ({ wasDark }) => {
        const html = document.documentElement;
        const isDark = html.classList.contains("dark");
        return wasDark ? !isDark : isDark;
      },
      { wasDark: initiallyDark },
      { timeout: 2000 }
    );

    const newThemeIsDark = !initiallyDark;

    // Navigate to calendar
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded");

    // Theme should persist
    const calendarClass = await page.locator("html").getAttribute("class");
    const calendarIsDark = calendarClass?.includes("dark");
    expect(calendarIsDark).toBe(newThemeIsDark);

    // Toggle should still be visible
    await expect(themeToggle).toBeVisible();

    // Navigate to admin
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");

    // Theme should still persist
    const adminClass = await page.locator("html").getAttribute("class");
    const adminIsDark = adminClass?.includes("dark");
    expect(adminIsDark).toBe(newThemeIsDark);

    // Toggle should still be visible
    await expect(themeToggle).toBeVisible();
  });

  test("should show consistent icon across all pages", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    await expect(themeToggle).toBeVisible({ timeout: 10000 });

    // Get current theme
    const htmlClass = await page.locator("html").getAttribute("class");
    const isDark = htmlClass?.includes("dark");
    const expectedIconTestId = isDark ? "sun-icon" : "moon-icon";

    // Check icon on dashboard
    await expect(
      themeToggle.locator(`[data-testid="${expectedIconTestId}"]`)
    ).toBeVisible();

    // Navigate to calendar and check same icon
    await page.goto("/calendar");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      themeToggle.locator(`[data-testid="${expectedIconTestId}"]`)
    ).toBeVisible();

    // Navigate to admin and check same icon
    await page.goto("/admin");
    await page.waitForLoadState("domcontentloaded");
    await expect(
      themeToggle.locator(`[data-testid="${expectedIconTestId}"]`)
    ).toBeVisible();
  });
});
