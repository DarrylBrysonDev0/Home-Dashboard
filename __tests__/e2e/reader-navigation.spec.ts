import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Phase 13: Reader Navigation Integration
 *
 * TDD Phase: RED - These tests should FAIL until T111-T118 implementation is complete.
 *
 * Goal: Verify Reader feature is discoverable from navbar, home page, and that
 * authenticated users are redirected to home page (/) instead of calendar (/calendar).
 *
 * Acceptance Scenarios:
 * 1. Reader nav item visible in navbar with BookOpen icon
 * 2. Reader app card visible on home page landing
 * 3. Navigation to /reader works from navbar click
 * 4. Navigation to /reader works from home page app card
 * 5. Login redirects to home page (/) not calendar (/calendar)
 * 6. Reader nav item shows active state when on /reader route
 */

test.describe("Phase 13: Reader Navigation Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible({ timeout: 10000 });
  });

  test.describe("Reader Nav Item in Navbar", () => {
    test("should display Reader nav item in navbar", async ({ page }) => {
      // Reader link should be visible in nav items
      const readerNavItem = page.locator('[data-testid="nav-item-reader"]');
      await expect(readerNavItem).toBeVisible();
    });

    test("should have Reader link with correct href", async ({ page }) => {
      // Reader link should point to /reader (use nav-item-reader to avoid matching app card)
      const readerLink = page.locator('[data-testid="nav-item-reader"] a[href="/reader"]');
      await expect(readerLink).toBeVisible();
    });

    test("should navigate to /reader when clicking Reader nav item", async ({ page }) => {
      // Click Reader nav item (use specific locator to avoid matching app card)
      const readerLink = page.locator('[data-testid="nav-item-reader"] a[href="/reader"]');
      await readerLink.click();

      // Should navigate to reader page
      await expect(page).toHaveURL("/reader");

      // Nav bar should still be visible
      await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
    });

    test("should show Reader nav item in correct order (after Calendar, before Settings)", async ({ page }) => {
      // Get all nav links in order
      const navLinks = page.locator('[data-testid="nav-items"] a');
      const count = await navLinks.count();

      // Get labels in order
      const labels: string[] = [];
      for (let i = 0; i < count; i++) {
        const text = await navLinks.nth(i).textContent();
        labels.push(text?.trim().toLowerCase() || "");
      }

      // Find positions
      const calendarIndex = labels.indexOf("calendar");
      const readerIndex = labels.indexOf("reader");
      const settingsIndex = labels.indexOf("settings");

      // Reader should come after Calendar and before Settings
      expect(readerIndex).toBeGreaterThan(calendarIndex);
      expect(readerIndex).toBeLessThan(settingsIndex);
    });

    test("should display Reader with BookOpen icon", async ({ page }) => {
      // Reader nav item should have an SVG icon
      const readerNavItem = page.locator('[data-testid="nav-item-reader"]');
      await expect(readerNavItem).toBeVisible();

      // Should contain an icon (SVG element)
      const icon = readerNavItem.locator("svg");
      await expect(icon).toBeVisible();
    });
  });

  test.describe("Reader Active State", () => {
    test("should show Reader as active when on /reader route", async ({ page }) => {
      // Navigate to reader page
      await page.goto("/reader");
      await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

      // Reader nav item should have active state
      const readerNavItem = page.locator('[data-testid="nav-item-reader"]');
      await expect(readerNavItem).toHaveAttribute("data-active", "true");
    });

    test("should show Reader as active on nested reader paths", async ({ page }) => {
      // Navigate to a nested reader path
      await page.goto("/reader/docs/getting-started.md");

      // Wait for nav bar (may redirect to /reader if file doesn't exist)
      await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

      // Reader nav item should have active state for nested paths
      const readerNavItem = page.locator('[data-testid="nav-item-reader"]');
      await expect(readerNavItem).toHaveAttribute("data-active", "true");
    });

    test("should NOT show Reader as active when on other pages", async ({ page }) => {
      // On home page, Reader should not be active
      await page.goto("/");
      await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

      const readerNavItem = page.locator('[data-testid="nav-item-reader"]');
      await expect(readerNavItem).toHaveAttribute("data-active", "false");

      // On dashboard, Reader should not be active
      await page.goto("/dashboard");
      await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();
      await expect(readerNavItem).toHaveAttribute("data-active", "false");
    });
  });

  test.describe("Reader App Card on Home Page", () => {
    test("should display Reader app card on home page", async ({ page }) => {
      // Reader app card should be visible
      const readerCard = page.locator('[data-testid="app-card"]').filter({ hasText: /reader/i });
      await expect(readerCard).toBeVisible();
    });

    test("should navigate to /reader when clicking Reader app card", async ({ page }) => {
      // Click Reader app card
      const readerCard = page.locator('[data-testid="app-card"]').filter({ hasText: /reader/i });
      await readerCard.click();

      // Should navigate to reader page
      await expect(page).toHaveURL("/reader");
    });

    test("should display Reader app card with correct description", async ({ page }) => {
      // Reader card should have description mentioning docs/documentation/markdown
      const readerCard = page.locator('[data-testid="app-card"]').filter({ hasText: /reader/i });
      await expect(readerCard).toBeVisible();

      // The description should mention documents or browsing
      const cardText = await readerCard.textContent();
      expect(cardText?.toLowerCase()).toMatch(/document|docs|browse|markdown|read/i);
    });

    test("should display Reader app card with BookOpen icon", async ({ page }) => {
      // Reader card should have an icon
      const readerCard = page.locator('[data-testid="app-card"]').filter({ hasText: /reader/i });
      const icon = readerCard.locator('[data-testid="app-card-icon"]');
      await expect(icon).toBeVisible();
    });

    test("should show 5 app cards total (including Reader)", async ({ page }) => {
      // Should have 5 app cards: Home, Finance, Calendar, Reader, Settings
      const appCards = page.locator('[data-testid="app-card"]');
      await expect(appCards).toHaveCount(5);
    });
  });

  test.describe("Reader in Mobile Drawer", () => {
    // Use mobile viewport
    test.use({ viewport: { width: 375, height: 667 } });

    test("should display Reader nav item in mobile drawer", async ({ page }) => {
      // Open mobile drawer
      const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
      await hamburgerButton.click();

      const drawer = page.locator('[data-testid="mobile-drawer"]');
      await expect(drawer).toBeVisible();

      // Reader should be visible in drawer
      await expect(drawer.locator("text=Reader")).toBeVisible();
    });

    test("should navigate to /reader and close drawer when Reader is clicked", async ({ page }) => {
      // Open mobile drawer
      const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
      await hamburgerButton.click();

      const drawer = page.locator('[data-testid="mobile-drawer"]');
      await expect(drawer).toBeVisible();

      // Click Reader link
      await drawer.locator("text=Reader").click();

      // Should navigate to reader
      await expect(page).toHaveURL("/reader");

      // Drawer should close
      await expect(drawer).not.toBeVisible();
    });
  });
});

test.describe("Phase 13: Login Redirect to Home Page", () => {
  test("should redirect to home page (/) after successful login, not /calendar", async ({ page }) => {
    // First sign out if logged in
    await page.goto("/");

    // Try to access the user menu to sign out
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');

    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      const logoutItem = page.locator('[role="menuitem"]').filter({ hasText: /log out/i });
      if (await logoutItem.isVisible()) {
        await logoutItem.click();
        // Wait for redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      }
    }

    // Go to login page
    await page.goto("/login");

    // Fill in login form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill("admin@home.local");
    await passwordInput.fill("ChangeMe123!");
    await submitButton.click();

    // Should redirect to home page (/), NOT /calendar
    await expect(page).toHaveURL("/", { timeout: 10000 });

    // Should NOT be on calendar
    expect(page.url()).not.toContain("/calendar");
  });

  test("should land on home page when accessing protected route without auth", async ({ page }) => {
    // Navigate directly to login without session
    await page.goto("/login");

    // Check if callbackUrl defaults to "/" in the form or auth flow
    // The login form's default callbackUrl should be "/" not "/calendar"
    const loginForm = page.locator("form");
    await expect(loginForm).toBeVisible();

    // Fill and submit login
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill("admin@home.local");
    await passwordInput.fill("ChangeMe123!");
    await submitButton.click();

    // After login, should redirect to home, not calendar
    await expect(page).toHaveURL("/", { timeout: 10000 });
  });
});

test.describe("Phase 13: Keyboard Accessibility for Reader Navigation", () => {
  test("should be able to navigate to Reader via keyboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Find and focus the Reader nav link
    const readerLink = page.locator('[data-testid="nav-item-reader"] a');
    await readerLink.focus();

    // Press Enter to navigate
    await page.keyboard.press("Enter");

    // Should navigate to reader
    await expect(page).toHaveURL("/reader");
  });

  test("should have aria-current on Reader when active", async ({ page }) => {
    await page.goto("/reader");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible();

    // Reader link should have aria-current="page"
    const readerLink = page.locator('[data-testid="nav-item-reader"] a');
    await expect(readerLink).toHaveAttribute("aria-current", "page");
  });
});
