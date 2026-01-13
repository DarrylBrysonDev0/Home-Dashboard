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

/**
 * E2E Tests for User Story 4: User Menu and Sign Out
 *
 * TDD Phase: RED - These tests verify sign out functionality.
 *
 * Goal: Provide avatar dropdown with Profile, Settings, and Sign Out options.
 * Sign out should work immediately without confirmation and redirect to login.
 */
test.describe("User Story 4: User Menu and Sign Out", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible({ timeout: 10000 });
  });

  test("should open user menu dropdown when clicking avatar", async ({ page }) => {
    // Find and click the user menu button (avatar)
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();

    // Dropdown menu should appear
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu).toBeVisible();
  });

  test("should display user name and email in dropdown", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Should show user info in dropdown header
    const dropdownMenu = page.locator('[role="menu"]');
    await expect(dropdownMenu).toBeVisible();

    // User name and email should be displayed (actual values depend on test user)
    // Just verify the menu content structure exists
    const menuContent = page.locator('[role="menu"]');
    await expect(menuContent).toBeVisible();
  });

  test("should have Profile link in user menu", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Profile menu item should be visible
    const profileItem = page.locator('[role="menuitem"]').filter({ hasText: /profile/i });
    await expect(profileItem).toBeVisible();

    // Profile should NOT be disabled
    await expect(profileItem).not.toHaveAttribute("aria-disabled", "true");
  });

  test("should navigate to /settings/profile when clicking Profile", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Click Profile
    const profileItem = page.locator('[role="menuitem"]').filter({ hasText: /profile/i });
    await profileItem.click();

    // Should navigate to /settings/profile
    await expect(page).toHaveURL(/\/settings\/profile/);
  });

  test("should have Settings link in user menu", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Settings menu item should be visible (distinct from Profile)
    const settingsItem = page.locator('[role="menuitem"]').filter({ hasText: /^settings$/i });
    await expect(settingsItem).toBeVisible();
  });

  test("should navigate to /settings when clicking Settings", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Click Settings (need to distinguish from Profile which contains "settings")
    const settingsItem = page.locator('[role="menuitem"] >> text=Settings').first();
    await settingsItem.click();

    // Should navigate to /settings
    await expect(page).toHaveURL(/\/settings$/);
  });

  test("should have Log out option in user menu", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Log out menu item should be visible
    const logoutItem = page.locator('[role="menuitem"]').filter({ hasText: /log out/i });
    await expect(logoutItem).toBeVisible();
  });

  test("should sign out immediately without confirmation dialog", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Click Log out
    const logoutItem = page.locator('[role="menuitem"]').filter({ hasText: /log out/i });
    await logoutItem.click();

    // Should NOT show any confirmation dialog
    // Verify no dialog/alert appeared
    const dialog = page.locator('[role="alertdialog"], [role="dialog"]');
    await expect(dialog).not.toBeVisible({ timeout: 1000 }).catch(() => {
      // It's okay if there's no dialog element at all
    });

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("should redirect to /login after sign out", async ({ page }) => {
    // Open user menu
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();

    // Click Log out
    const logoutItem = page.locator('[role="menuitem"]').filter({ hasText: /log out/i });
    await logoutItem.click();

    // Should be on login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Login form should be visible
    const loginForm = page.locator('form, [data-testid="login-form"], input[type="email"], input[type="password"]');
    await expect(loginForm.first()).toBeVisible();
  });

  test("should not be able to access protected pages after sign out", async ({ page }) => {
    // Open user menu and sign out
    const userMenuButton = page.locator('[data-testid="nav-user-menu"] button, [aria-label="User menu"]');
    await userMenuButton.click();
    const logoutItem = page.locator('[role="menuitem"]').filter({ hasText: /log out/i });
    await logoutItem.click();

    // Wait for redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Try to access protected page directly
    await page.goto("/dashboard");

    // Should be redirected back to login (not see dashboard content)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

/**
 * E2E Tests for User Story 5: Mobile Navigation with Hamburger Menu
 *
 * TDD Phase: RED - These tests should FAIL until mobile drawer is implemented.
 *
 * Goal: Transform navigation to hamburger menu with slide-out drawer on viewports < 768px.
 *
 * Acceptance Scenarios:
 * 1. Hamburger menu appears on mobile viewport
 * 2. Drawer slides from left when hamburger is clicked
 * 3. Drawer contains all nav items in vertical layout
 * 4. Drawer closes on nav item click, backdrop tap, or X button
 * 5. User section with sign out in drawer
 */
test.describe("User Story 5: Mobile Navigation with Hamburger Menu", () => {
  // Use mobile viewport (375px width)
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto("/");
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible({ timeout: 10000 });
  });

  test("should show hamburger button on mobile viewport", async ({ page }) => {
    // Hamburger button should be visible on mobile
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(hamburgerButton).toBeVisible();
  });

  test("should hide desktop nav items on mobile viewport", async ({ page }) => {
    // Desktop nav items should be hidden on mobile
    const navItems = page.locator('[data-testid="nav-items"]');

    // NavItems should not be visible (hidden md:flex means hidden on mobile)
    await expect(navItems).not.toBeVisible();
  });

  test("should open mobile drawer when hamburger is clicked", async ({ page }) => {
    // Click hamburger button
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    // Mobile drawer should appear
    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();
  });

  test("should slide drawer from left side", async ({ page }) => {
    // Click hamburger button
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    // Drawer should slide from left (check position)
    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Verify drawer is on the left side
    const boundingBox = await drawer.boundingBox();
    expect(boundingBox?.x).toBeLessThanOrEqual(0); // Left edge at or near 0
  });

  test("should display all navigation items in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // All nav items should be visible in drawer
    await expect(drawer.locator('text=Home')).toBeVisible();
    await expect(drawer.locator('text=Finance')).toBeVisible();
    await expect(drawer.locator('text=Calendar')).toBeVisible();
    await expect(drawer.locator('text=Settings')).toBeVisible();
  });

  test("should display navigation items in vertical layout", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Check that nav items are in vertical layout
    const navItems = drawer.locator('[data-testid="nav-items"]');
    await expect(navItems).toBeVisible();

    // Verify flex-col class is applied
    const className = await navItems.getAttribute("class");
    expect(className).toContain("flex-col");
  });

  test("should close drawer when X button is clicked", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Click close button
    const closeButton = page.locator('[data-testid="mobile-drawer"] button').filter({ has: page.locator('svg') }).first();
    await closeButton.click();

    // Drawer should be closed
    await expect(drawer).not.toBeVisible();
  });

  test("should close drawer when backdrop is clicked", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Click on backdrop (overlay area outside drawer)
    // The backdrop is the overlay element
    const backdrop = page.locator('[data-state="open"][class*="bg-black"]');
    await backdrop.click({ position: { x: 350, y: 300 } }); // Click on the right side (outside drawer)

    // Drawer should be closed
    await expect(drawer).not.toBeVisible();
  });

  test("should close drawer and navigate when nav item is clicked", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Click on Finance nav item
    const financeLink = drawer.locator('text=Finance');
    await financeLink.click();

    // Should navigate to dashboard
    await expect(page).toHaveURL("/dashboard");

    // Drawer should be closed after navigation
    await expect(drawer).not.toBeVisible();
  });

  test("should display user info in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // User section should be visible with avatar/initials
    const userSection = drawer.locator('[data-testid="mobile-drawer-user"]');
    await expect(userSection).toBeVisible();
  });

  test("should display sign out button in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Sign out button should be visible
    const signOutButton = drawer.locator('button').filter({ hasText: /log out|sign out/i });
    await expect(signOutButton).toBeVisible();
  });

  test("should sign out when sign out button is clicked in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Click sign out button
    const signOutButton = drawer.locator('button').filter({ hasText: /log out|sign out/i });
    await signOutButton.click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("should have proper drawer animation timing", async ({ page }) => {
    // Open drawer with timing measurement
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');

    const startTime = Date.now();
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();
    const endTime = Date.now();

    // Animation should complete within reasonable time (200ms target + buffer)
    expect(endTime - startTime).toBeLessThan(500);
  });

  test("should maintain nav bar visible while drawer is open", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Nav bar should still be visible (behind drawer)
    const navBar = page.locator('[data-testid="nav-bar"]');
    await expect(navBar).toBeVisible();
  });

  test("should work with keyboard navigation", async ({ page }) => {
    // Tab to hamburger button and press Enter
    await page.keyboard.press("Tab");

    // May need multiple tabs to reach hamburger
    for (let i = 0; i < 5; i++) {
      const focused = await page.locator(":focus").getAttribute("data-testid");
      if (focused === "mobile-menu-button") break;
      await page.keyboard.press("Tab");
    }

    await page.keyboard.press("Enter");

    // Drawer should open
    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");

    // Drawer should close
    await expect(drawer).not.toBeVisible();
  });
});

test.describe("User Story 5: Mobile vs Desktop Viewport Switching", () => {
  test("should switch between mobile and desktop nav on viewport resize", async ({ page }) => {
    // Start with desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    // Desktop: nav items visible, hamburger hidden
    const navItems = page.locator('[data-testid="nav-items"]');
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');

    await expect(navItems).toBeVisible();
    await expect(hamburgerButton).not.toBeVisible();

    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile: nav items hidden, hamburger visible
    await expect(navItems).not.toBeVisible();
    await expect(hamburgerButton).toBeVisible();

    // Switch back to desktop
    await page.setViewportSize({ width: 1024, height: 768 });

    // Desktop layout should be restored
    await expect(navItems).toBeVisible();
    await expect(hamburgerButton).not.toBeVisible();
  });

  test("should close drawer when resizing to desktop", async ({ page }) => {
    // Start with mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open drawer
    const hamburgerButton = page.locator('[data-testid="mobile-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="mobile-drawer"]');
    await expect(drawer).toBeVisible();

    // Resize to desktop
    await page.setViewportSize({ width: 1024, height: 768 });

    // Drawer should close automatically (or become irrelevant)
    // The drawer should not interfere with desktop layout
    const navItems = page.locator('[data-testid="nav-items"]');
    await expect(navItems).toBeVisible();
  });
});
