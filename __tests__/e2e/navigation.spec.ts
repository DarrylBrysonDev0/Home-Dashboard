import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 1: Desktop Navigation Across Pages
 *
 * TDD Phase: RED - These tests should FAIL until navigation components are implemented.
 *
 * Goal: Enable authenticated users to navigate between app modules using a
 * persistent top navigation bar.
 *
 * Acceptance Scenarios:
 * 1. Nav bar is visible on all authenticated pages
 * 2. Nav bar contains logo, nav items, and user menu
 * 3. Active state correctly indicates current page
 * 4. Navigation works between all main routes
 */

test.describe("User Story 1: Desktop Navigation Across Pages", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page (landing) before each test
    await page.goto("/");
  });

  test("should display navigation bar on home page", async ({ page }) => {
    // Wait for nav bar to be visible
    const navBar = page.locator('[data-testid="nav-bar"]');
    await expect(navBar).toBeVisible({ timeout: 10000 });

    // Should have fixed height of 64px (h-16)
    const height = await navBar.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBe(64);
  });

  test("should display logo that links to home", async ({ page }) => {
    // Wait for nav bar
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Logo should be visible
    const logo = page.locator('[data-testid="nav-logo"]');
    await expect(logo).toBeVisible();

    // Logo should link to home
    const logoLink = logo.locator("a");
    await expect(logoLink).toHaveAttribute("href", "/");
  });

  test("should display all navigation items", async ({ page }) => {
    // Wait for nav bar
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Should have all four main nav items
    const navItems = page.locator('[data-testid="nav-items"]');
    await expect(navItems).toBeVisible();

    // Check for Home, Finance, Calendar, Settings links
    await expect(page.locator('a[href="/"]').filter({ hasText: /home/i })).toBeVisible();
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/calendar"]')).toBeVisible();
    await expect(page.locator('a[href="/settings"]').or(page.locator('a[href="/admin"]'))).toBeVisible();
  });

  test("should show active state for current page", async ({ page }) => {
    // Wait for nav bar
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Home link should have active styling on home page
    const homeNavItem = page.locator('[data-testid="nav-item-home"]');
    await expect(homeNavItem).toHaveAttribute("data-active", "true");
  });

  test("should navigate to Finance dashboard", async ({ page }) => {
    // Wait for nav bar
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Click Finance link
    await page.locator('a[href="/dashboard"]').click();

    // Should navigate to dashboard
    await expect(page).toHaveURL("/dashboard");

    // Nav bar should still be visible
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Finance should now be active
    const financeNavItem = page.locator('[data-testid="nav-item-finance"]');
    await expect(financeNavItem).toHaveAttribute("data-active", "true");
  });

  test("should navigate to Calendar page", async ({ page }) => {
    // Wait for nav bar
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Click Calendar link
    await page.locator('a[href="/calendar"]').click();

    // Should navigate to calendar
    await expect(page).toHaveURL("/calendar");

    // Nav bar should still be visible
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });

  test("should display nav bar on dashboard page", async ({ page }) => {
    await page.goto("/dashboard");

    // Nav bar should be visible
    const navBar = page.locator('[data-testid="nav-bar"]');
    await expect(navBar).toBeVisible({ timeout: 10000 });

    // Should have logo
    await expect(page.locator('[data-testid="nav-logo"]')).toBeVisible();

    // Should have nav items
    await expect(page.locator('[data-testid="nav-items"]')).toBeVisible();
  });

  test("should display nav bar on calendar page", async ({ page }) => {
    await page.goto("/calendar");

    // Nav bar should be visible
    const navBar = page.locator('[data-testid="nav-bar"]');
    await expect(navBar).toBeVisible({ timeout: 10000 });
  });

  test("should display user menu in nav bar", async ({ page }) => {
    // Wait for nav bar
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // User menu should be visible (avatar button)
    const userMenu = page.locator('[data-testid="user-menu"], [data-testid="nav-user-menu"]');
    await expect(userMenu).toBeVisible();
  });

  test("should persist nav bar across page navigation", async ({ page }) => {
    // Start on home
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Navigate to dashboard
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Navigate to calendar
    await page.goto("/calendar");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Navigate back to home
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
  });
});

test.describe("User Story 1: Navigation Active States", () => {
  test("should update active state when navigating between pages", async ({ page }) => {
    // Start on home
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Home should be active initially
    const homeItem = page.locator('[data-testid="nav-item-home"]');
    await expect(homeItem).toHaveAttribute("data-active", "true");

    // Navigate to dashboard
    await page.locator('a[href="/dashboard"]').click();
    await expect(page).toHaveURL("/dashboard");

    // Finance should now be active, Home should not
    const financeItem = page.locator('[data-testid="nav-item-finance"]');
    await expect(financeItem).toHaveAttribute("data-active", "true");
    await expect(homeItem).toHaveAttribute("data-active", "false");
  });

  test("should show correct active state for nested routes", async ({ page }) => {
    // Navigate to a nested dashboard route if it exists
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Finance nav item should be active for /dashboard and its sub-routes
    const financeItem = page.locator('[data-testid="nav-item-finance"]');
    await expect(financeItem).toHaveAttribute("data-active", "true");
  });
});

test.describe("User Story 1: Navigation Accessibility", () => {
  test("should have accessible navigation landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Nav bar should be a <nav> element with proper role
    const nav = page.locator("nav[aria-label]");
    await expect(nav).toBeVisible();
  });

  test("should have accessible nav item links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // All nav items should be focusable
    const navLinks = page.locator('[data-testid="nav-items"] a');
    const count = await navLinks.count();

    expect(count).toBeGreaterThanOrEqual(4);

    // Each link should have accessible text
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const ariaLabel = await link.getAttribute("aria-label");
      const text = await link.textContent();
      // Should have either aria-label or visible text
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Tab to first nav item
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab"); // May need to tab past logo

    // Should have focus on a nav link
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Press Enter to navigate
    await page.keyboard.press("Enter");

    // Should have navigated (URL should change)
    // Note: actual URL depends on which link was focused
    await page.waitForLoadState("networkidle");
  });
});
