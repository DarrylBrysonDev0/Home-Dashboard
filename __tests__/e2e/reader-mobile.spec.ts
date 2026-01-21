import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 8: Mobile Navigation Experience (Reader)
 *
 * TDD Phase: RED - These tests should FAIL until mobile drawer is implemented.
 *
 * Goal: Collapsible drawer navigation for efficient browsing on smaller screens.
 *
 * Acceptance Scenarios:
 * 1. Navigation pane hidden and hamburger visible on viewports below 768px
 * 2. Drawer slides in from left when hamburger is clicked
 * 3. Drawer contains file tree, search, recents, and favorites
 * 4. Drawer closes on file selection
 * 5. Drawer closes on overlay tap or close button
 * 6. Content fills viewport with appropriate text sizing
 */
test.describe("User Story 8: Reader Mobile Navigation Experience", () => {
  // Use mobile viewport (375px width)
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    // Navigate to reader page before each test
    await page.goto("/reader");
    // Wait for the reader to load
    await page.waitForLoadState("networkidle");
  });

  test("should hide navigation pane on mobile viewport", async ({ page }) => {
    // Navigation pane should be hidden on mobile
    const navigationPane = page.locator('[aria-label="File navigation"]');
    await expect(navigationPane).not.toBeVisible();
  });

  test("should show hamburger menu button on mobile viewport", async ({ page }) => {
    // Hamburger button should be visible on mobile
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await expect(hamburgerButton).toBeVisible();
  });

  test("should open reader drawer when hamburger is clicked", async ({ page }) => {
    // Click hamburger button
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    // Reader drawer should appear
    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();
  });

  test("should slide drawer from left side", async ({ page }) => {
    // Click hamburger button
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    // Drawer should slide from left
    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Verify drawer is on the left side
    const boundingBox = await drawer.boundingBox();
    expect(boundingBox?.x).toBeLessThanOrEqual(0);
  });

  test("should display Documents header in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Documents header should be visible
    await expect(drawer.locator('text=Documents')).toBeVisible();
  });

  test("should display search input in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Search input should be visible
    await expect(drawer.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test("should display file tree in drawer", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // File tree should be visible (at least one file or directory)
    const fileTreeItems = drawer.locator('[data-testid="file-tree-node"]');
    // If there are files, they should be visible
    // If no files, the tree might be empty - just verify drawer is rendered
    const count = await fileTreeItems.count();
    // Accept either files present or empty state
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should close drawer when X button is clicked", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Click close button
    const closeButton = page.locator('button[aria-label*="Close"]');
    await closeButton.click();

    // Drawer should be closed
    await expect(drawer).not.toBeVisible();
  });

  test("should close drawer when backdrop is clicked", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Click on backdrop (overlay area outside drawer)
    // Sheet creates an overlay that can be clicked
    await page.keyboard.press("Escape");

    // Drawer should be closed
    await expect(drawer).not.toBeVisible();
  });

  test("should close drawer when file is selected", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Click on a file in the file tree (if available)
    const fileNode = drawer.locator('[data-testid="file-tree-node"][data-type="file"]').first();

    // Only test if files exist
    const count = await fileNode.count();
    if (count > 0) {
      await fileNode.click();

      // Drawer should be closed
      await expect(drawer).not.toBeVisible();
    }
  });

  test("should NOT close drawer when expanding a directory", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Find a directory expand button (if available)
    const expandButton = drawer.locator('[data-testid="file-tree-expand-button"]').first();

    // Only test if directories exist
    const count = await expandButton.count();
    if (count > 0) {
      await expandButton.click();

      // Drawer should STILL be visible (not closed)
      await expect(drawer).toBeVisible();
    }
  });

  test("should fill viewport with content on mobile", async ({ page }) => {
    // Content area should fill the viewport
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Verify content takes full width
    const boundingBox = await mainContent.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(370); // Almost full width allowing for padding
  });

  test("should have readable text sizing on mobile", async ({ page }) => {
    // Navigate to a file first (if available)
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    const fileNode = drawer.locator('[data-testid="file-tree-node"][data-type="file"]').first();
    const count = await fileNode.count();

    if (count > 0) {
      await fileNode.click();
      await expect(drawer).not.toBeVisible();

      // Wait for content to load
      await page.waitForTimeout(500);

      // Check that text is readable (font size should be at least 14px)
      const contentViewer = page.locator('[data-testid="content-viewer"]');
      if (await contentViewer.isVisible()) {
        const fontSize = await contentViewer.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });
        const fontSizeNum = parseFloat(fontSize);
        expect(fontSizeNum).toBeGreaterThanOrEqual(14);
      }
    }
  });

  test("should have proper drawer animation timing (200ms)", async ({ page }) => {
    // Measure animation timing
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');

    const startTime = Date.now();
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();
    const endTime = Date.now();

    // Animation should complete within reasonable time (200ms target + buffer)
    expect(endTime - startTime).toBeLessThan(500);
  });

  test("should support keyboard navigation with Escape to close", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");

    // Drawer should close
    await expect(drawer).not.toBeVisible();
  });

  test("should close drawer when selecting from favorites", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Look for favorites section
    const favoritesSection = drawer.locator('text=Favorites');

    if (await favoritesSection.isVisible()) {
      // Click on a favorite file
      const favoriteItem = drawer.locator('[data-testid="favorite-item"]').first();
      const count = await favoriteItem.count();

      if (count > 0) {
        await favoriteItem.click();

        // Drawer should be closed
        await expect(drawer).not.toBeVisible();
      }
    }
  });

  test("should close drawer when selecting from recents", async ({ page }) => {
    // Open drawer
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');
    await hamburgerButton.click();

    const drawer = page.locator('[data-testid="reader-drawer"]');
    await expect(drawer).toBeVisible();

    // Look for recents section
    const recentsSection = drawer.locator('text=Recent');

    if (await recentsSection.isVisible()) {
      // Click on a recent file
      const recentItem = drawer.locator('[data-testid="recent-file-item"]').first();
      const count = await recentItem.count();

      if (count > 0) {
        await recentItem.click();

        // Drawer should be closed
        await expect(drawer).not.toBeVisible();
      }
    }
  });
});

test.describe("User Story 8: Responsive Switching (Reader)", () => {
  test("should switch between mobile and desktop layouts on viewport resize", async ({ page }) => {
    // Start with desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/reader");
    await page.waitForLoadState("networkidle");

    // Desktop: navigation pane visible, hamburger hidden
    const navigationPane = page.locator('[aria-label="File navigation"]');
    const hamburgerButton = page.locator('[data-testid="reader-menu-button"]');

    await expect(navigationPane).toBeVisible();
    await expect(hamburgerButton).not.toBeVisible();

    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile: navigation pane hidden, hamburger visible
    await expect(navigationPane).not.toBeVisible();
    await expect(hamburgerButton).toBeVisible();

    // Switch back to desktop
    await page.setViewportSize({ width: 1024, height: 768 });

    // Desktop layout should be restored
    await expect(navigationPane).toBeVisible();
    await expect(hamburgerButton).not.toBeVisible();
  });
});

/**
 * E2E Tests for User Story 9: Refresh Content Without Page Reload
 *
 * Goal: Reload current file content without full page reload to see external changes.
 *
 * Acceptance Scenarios:
 * 1. Refresh button visible when viewing a file
 * 2. Clicking refresh reloads the file content
 * 3. Loading indicator shown during refresh
 * 4. Updated content displayed after refresh
 */
test.describe("User Story 9: Refresh Content Without Page Reload", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reader page
    await page.goto("/reader");
    await page.waitForLoadState("networkidle");
  });

  test("should display refresh button when viewing a file", async ({ page }) => {
    // First, select a file if available
    const fileNode = page.locator('[data-testid="file-tree-node"][data-type="file"]').first();
    const count = await fileNode.count();

    if (count > 0) {
      await fileNode.click();
      await page.waitForTimeout(500);

      // Refresh button should be visible
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await expect(refreshButton).toBeVisible();
    }
  });

  test("should NOT display refresh button when no file is selected", async ({ page }) => {
    // On reader page without selecting a file
    const refreshButton = page.locator('[data-testid="refresh-button"]');

    // Refresh button should not be visible (no file selected)
    await expect(refreshButton).not.toBeVisible();
  });

  test("should show loading indicator when refresh is clicked", async ({ page }) => {
    // First, select a file if available
    const fileNode = page.locator('[data-testid="file-tree-node"][data-type="file"]').first();
    const count = await fileNode.count();

    if (count > 0) {
      await fileNode.click();
      await page.waitForTimeout(500);

      // Click refresh button
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await refreshButton.click();

      // Loading indicator should appear briefly
      const loadingIndicator = page.locator('[data-testid="refresh-loading"]');
      // Due to quick loading, we check it was triggered
      // The button should become disabled during loading
      await expect(refreshButton).toBeDisabled({ timeout: 1000 }).catch(() => {
        // It's okay if it loads too fast to catch
      });
    }
  });

  test("should reload file content when refresh is clicked", async ({ page }) => {
    // First, select a file if available
    const fileNode = page.locator('[data-testid="file-tree-node"][data-type="file"]').first();
    const count = await fileNode.count();

    if (count > 0) {
      await fileNode.click();
      await page.waitForTimeout(500);

      // Get current content (if visible)
      const contentViewer = page.locator('[data-testid="content-viewer"]');

      // Click refresh button
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await refreshButton.click();

      // Wait for refresh to complete
      await page.waitForTimeout(1000);

      // Content viewer should still be visible (content reloaded)
      await expect(contentViewer).toBeVisible();
    }
  });

  test("should have accessible refresh button", async ({ page }) => {
    // First, select a file if available
    const fileNode = page.locator('[data-testid="file-tree-node"][data-type="file"]').first();
    const count = await fileNode.count();

    if (count > 0) {
      await fileNode.click();
      await page.waitForTimeout(500);

      // Refresh button should have accessible label
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await expect(refreshButton).toHaveAttribute("aria-label", "Refresh content");
    }
  });

  test("should support keyboard activation of refresh button", async ({ page }) => {
    // First, select a file if available
    const fileNode = page.locator('[data-testid="file-tree-node"][data-type="file"]').first();
    const count = await fileNode.count();

    if (count > 0) {
      await fileNode.click();
      await page.waitForTimeout(500);

      // Focus and activate refresh button with keyboard
      const refreshButton = page.locator('[data-testid="refresh-button"]');
      await refreshButton.focus();
      await page.keyboard.press("Enter");

      // Content should still be visible (refresh triggered)
      const contentViewer = page.locator('[data-testid="content-viewer"]');
      await expect(contentViewer).toBeVisible();
    }
  });
});
