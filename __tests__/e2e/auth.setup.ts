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
  // Enable console logging for debugging
  page.on("console", (msg) => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });

  // Log failed requests
  page.on("requestfailed", (request) => {
    console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

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

  // Wait for auth response after clicking submit
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/auth") &&
      response.request().method() === "POST",
    { timeout: 10000 }
  );

  await submitButton.click();

  // Wait for the auth API response
  try {
    const response = await responsePromise;
    console.log("Auth response status:", response.status());
    console.log("Auth response URL:", response.url());
    const body = await response.text();
    console.log("Auth response body:", body.substring(0, 500));
  } catch (e) {
    console.log("No auth API response captured:", e);
  }

  // Wait for navigation to home page (matches full URL)
  await page.waitForURL(/localhost:3000\/?$/, { timeout: 20000 });

  // Verify we're authenticated by checking for nav bar
  await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible({
    timeout: 10000,
  });

  // Store the authenticated state
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
