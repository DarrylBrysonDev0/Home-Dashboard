import { test as setup, expect } from "@playwright/test";

/**
 * Global Authentication Setup for E2E Tests
 *
 * This file handles the login process once before all tests run.
 * The authenticated state is stored and reused across all test files.
 *
 * Test credentials (from prisma/seed.ts):
 * - Email: admin@home.local
 * - Password: ChangeMe123! (seeded admin password)
 *
 * @see https://playwright.dev/docs/auth
 */

const STORAGE_STATE_PATH = ".playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Wait for login form to be visible
  const loginForm = page.locator('form[aria-label="Sign in form"]');
  await expect(loginForm).toBeVisible({ timeout: 10000 });

  // Fill in credentials
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await emailInput.fill("admin@home.local");
  await passwordInput.fill("ChangeMe123!");
  await submitButton.click();

  // Wait for successful login - should redirect to home page
  await expect(page).toHaveURL("/", { timeout: 15000 });

  // Verify we're authenticated by checking for nav bar
  await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible({
    timeout: 10000,
  });

  // Store the authenticated state
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
