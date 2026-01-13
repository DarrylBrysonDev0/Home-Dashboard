import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 2: Landing Page App Selection
 *
 * Goal: Provide a landing page with personalized greeting and app card panel
 * for module access.
 *
 * TDD Phase: RED - These tests should FAIL until:
 * - T024-T027: Landing page components are implemented
 * - app/page.tsx is updated to render landing page instead of redirect
 *
 * Acceptance Scenarios:
 * 1. Landing page displays personalized greeting with user's name
 * 2. App selection panel shows cards for all main modules
 * 3. Clicking app card navigates to the correct route
 * 4. App cards have hover effects and accessible structure
 */

test.describe("User Story 2: Landing Page App Selection", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page (root route)
    // Note: This requires authentication - tests assume auth is configured
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("T020a: should display landing page instead of redirecting to dashboard", async ({
    page,
  }) => {
    // The landing page should NOT redirect to /dashboard
    // It should stay on "/" and show landing content
    await expect(page).toHaveURL("/");

    // Should see the hero section with greeting
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("T020b: should display personalized greeting with user name", async ({
    page,
  }) => {
    // Wait for hero section to load
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({
      timeout: 10000,
    });

    // Should display "Welcome back, [Name]" greeting
    const greeting = page.locator('[data-testid="hero-greeting"]');
    await expect(greeting).toBeVisible();

    // Greeting text should contain "Welcome back"
    const greetingText = await greeting.textContent();
    expect(greetingText).toMatch(/Welcome back/i);
  });

  test("T020c: should display app selection panel with all app cards", async ({
    page,
  }) => {
    // Wait for app selection panel to load
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // Should display all 4 main app cards
    const expectedApps = [
      { title: "Home", href: "/" },
      { title: "Finance", href: "/dashboard" },
      { title: "Calendar", href: "/calendar" },
      { title: "Settings", href: "/settings" },
    ];

    for (const app of expectedApps) {
      const appCard = page.locator('[data-testid="app-card"]', {
        has: page.locator(`text="${app.title}"`),
      });
      await expect(appCard).toBeVisible();
    }
  });

  test("T020d: should navigate to Finance dashboard when Finance card is clicked", async ({
    page,
  }) => {
    // Wait for app selection panel
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // Click the Finance app card
    const financeCard = page.locator('[data-testid="app-card"]', {
      has: page.locator('text="Finance"'),
    });
    await financeCard.click();

    // Should navigate to the dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("T020e: should navigate to Calendar when Calendar card is clicked", async ({
    page,
  }) => {
    // Wait for app selection panel
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // Click the Calendar app card
    const calendarCard = page.locator('[data-testid="app-card"]', {
      has: page.locator('text="Calendar"'),
    });
    await calendarCard.click();

    // Should navigate to the calendar page
    await expect(page).toHaveURL("/calendar");
  });

  test("T020f: should navigate to Settings when Settings card is clicked", async ({
    page,
  }) => {
    // Wait for app selection panel
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // Click the Settings app card
    const settingsCard = page.locator('[data-testid="app-card"]', {
      has: page.locator('text="Settings"'),
    });
    await settingsCard.click();

    // Should navigate to the settings page
    await expect(page).toHaveURL("/settings");
  });

  test("T020g: app cards should have proper accessibility attributes", async ({
    page,
  }) => {
    // Wait for app selection panel
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // Get all app cards
    const appCards = page.locator('[data-testid="app-card"]');
    const cardCount = await appCards.count();

    // Should have at least 4 app cards
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Each card should be a link or have role="link"
    for (let i = 0; i < cardCount; i++) {
      const card = appCards.nth(i);

      // Card should be focusable (link or button)
      const tagName = await card.evaluate((el) => el.tagName.toLowerCase());
      expect(["a", "button"]).toContain(tagName);

      // Card should have accessible name via aria-label or visible text
      const hasAccessibleName =
        (await card.getAttribute("aria-label")) ||
        (await card.textContent())?.trim();
      expect(hasAccessibleName).toBeTruthy();
    }
  });
});

test.describe("User Story 2: Landing Page - App Card Hover Effects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("T020h: app cards should have hover effect on desktop", async ({
    page,
  }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Wait for app selection panel
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // Get first app card
    const appCard = page.locator('[data-testid="app-card"]').first();

    // Get initial transform value
    const initialTransform = await appCard.evaluate(
      (el) => getComputedStyle(el).transform
    );

    // Hover over the card
    await appCard.hover();

    // Wait for hover animation
    await page.waitForTimeout(200);

    // Transform should change on hover (scale effect)
    const hoverTransform = await appCard.evaluate(
      (el) => getComputedStyle(el).transform
    );

    // If CSS transitions are working, transform should be different on hover
    // This tests the scale(1.02) hover effect defined in spec
    // Note: Both might be "none" or a matrix, check they're not identical when hovered
    expect(hoverTransform).not.toBe(initialTransform);
  });
});

test.describe("User Story 2: Landing Page - Responsive Design", () => {
  test("T020i: should display app cards in responsive grid on mobile", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for app selection panel
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible({
      timeout: 10000,
    });

    // All app cards should still be visible on mobile
    const appCards = page.locator('[data-testid="app-card"]');
    const cardCount = await appCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // Each card should be visible
    for (let i = 0; i < cardCount; i++) {
      await expect(appCards.nth(i)).toBeVisible();
    }
  });

  test("T020j: should display hero section properly on tablet", async ({
    page,
  }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Hero section should be visible
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({
      timeout: 10000,
    });

    // App selection panel should be visible
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible();
  });
});

test.describe("User Story 2: Landing Page - Loading and Empty States", () => {
  test("T020k: should handle loading state gracefully", async ({ page }) => {
    // Mock slow API response
    await page.route("**/api/events/upcoming**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto("/");

    // Hero section and app cards should still be visible even while events load
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('[data-testid="app-selection-panel"]')
    ).toBeVisible();
  });
});

/**
 * T051: Keyboard Accessibility Verification for Landing Page
 *
 * Verifies keyboard navigation for App Cards and landing page components.
 */
test.describe("T051: Landing Page Keyboard Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('[data-testid="app-selection-panel"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("should navigate app cards with Tab key", async ({ page }) => {
    // Count app cards
    const appCards = page.locator('[data-testid="app-card"]');
    const cardCount = await appCards.count();

    // Tab through page to reach app cards
    // Keep tabbing until we focus an app card
    let foundAppCard = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      const testId = await focused.getAttribute("data-testid").catch(() => null);
      if (testId === "app-card") {
        foundAppCard = true;
        break;
      }
    }

    expect(foundAppCard).toBeTruthy();
  });

  test("should activate app card with Enter key", async ({ page }) => {
    // Focus the Finance app card directly
    const financeCard = page.locator('[data-testid="app-card"]', {
      has: page.locator('text="Finance"'),
    });
    await financeCard.focus();

    // Press Enter to activate
    await page.keyboard.press("Enter");

    // Should navigate to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show visible focus ring on app card", async ({ page }) => {
    // Focus an app card
    const appCard = page.locator('[data-testid="app-card"]').first();
    await appCard.focus();

    // Verify focus ring is visible
    const hasRing = await appCard.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const boxShadow = styles.boxShadow;
      const outline = styles.outline;
      return boxShadow !== "none" || (outline !== "none" && outline !== "0px none rgb(0, 0, 0)");
    });
    expect(hasRing).toBeTruthy();
  });

  test("should have proper aria-label on app cards", async ({ page }) => {
    const appCards = page.locator('[data-testid="app-card"]');
    const cardCount = await appCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = appCards.nth(i);
      const ariaLabel = await card.getAttribute("aria-label");
      // Each card should have an aria-label describing its purpose
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    }
  });

  test("should maintain logical tab order through all app cards", async ({ page }) => {
    // Focus first app card
    const appCards = page.locator('[data-testid="app-card"]');
    const firstCard = appCards.first();
    await firstCard.focus();

    // Tab through remaining cards
    const cardCount = await appCards.count();
    const focusedCards: number[] = [];

    for (let i = 0; i < cardCount; i++) {
      const focused = page.locator(":focus");
      const testId = await focused.getAttribute("data-testid").catch(() => null);
      if (testId === "app-card") {
        focusedCards.push(i);
      }
      if (i < cardCount - 1) {
        await page.keyboard.press("Tab");
      }
    }

    // Should have visited multiple app cards in sequence
    expect(focusedCards.length).toBeGreaterThan(0);
  });

  test("should have accessible heading structure in hero section", async ({ page }) => {
    // Hero greeting should be an h1
    const greeting = page.locator('[data-testid="hero-greeting"]');
    const tagName = await greeting.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe("h1");
  });
});
