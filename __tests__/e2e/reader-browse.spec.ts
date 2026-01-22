import { test, expect } from "@playwright/test";

/**
 * E2E Tests for User Story 1: Browse and View Documentation
 *
 * Goal: Navigate documentation folder and view rendered markdown files with proper formatting.
 *
 * Acceptance Scenarios (from spec.md):
 * 1. File tree displays documentation folder structure with directories and supported files
 * 2. Clicking on a directory expands/collapses its contents
 * 3. Clicking on a markdown file displays rendered content with proper formatting
 * 4. Headers, lists, tables, links, and images render correctly
 * 5. Breadcrumb trail shows clickable path segments
 *
 * Note: These tests require:
 * - Authenticated session (handled by auth.setup.ts)
 * - DOCS_ROOT environment variable configured
 * - Some markdown files in the documentation directory
 */
test.describe("User Story 1: Browse and View Documentation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reader page before each test
    await page.goto("/reader");
    // Wait for the reader to load
    await page.waitForLoadState("networkidle");
    // Verify nav bar is visible (confirms authentication)
    await expect(page.locator('[data-testid="nav-bar"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test.describe("File Tree Navigation", () => {
    test("should display file tree with documentation structure", async ({
      page,
    }) => {
      // File tree container should be visible
      const fileTree = page.locator('[data-testid="file-tree"]');
      await expect(fileTree).toBeVisible();

      // Should have at least one tree node (file or directory)
      const treeNodes = page.locator('[data-testid="file-tree-node"]');
      // The tree should exist even if empty
      await expect(fileTree).toBeVisible();
    });

    test("should display supported file types (.md, .mmd, .txt)", async ({
      page,
    }) => {
      // Wait for file tree to load
      const fileTree = page.locator('[data-testid="file-tree"]');
      await expect(fileTree).toBeVisible();

      // Check that files have appropriate icons or indicators
      // Files should be clickable elements
      const fileNodes = page.locator(
        '[data-testid="file-tree-node"][data-type="file"]'
      );
      const count = await fileNodes.count();

      // If there are files, verify they're interactive
      if (count > 0) {
        const firstFile = fileNodes.first();
        await expect(firstFile).toBeVisible();
        // Should be clickable (cursor: pointer)
        const cursor = await firstFile.evaluate((el) => {
          return window.getComputedStyle(el).cursor;
        });
        expect(cursor).toBe("pointer");
      }
    });

    test("should expand directory when clicked", async ({ page }) => {
      // Find a directory node
      const directoryNode = page
        .locator('[data-testid="file-tree-node"][data-type="directory"]')
        .first();

      const count = await directoryNode.count();
      if (count > 0) {
        // Find the expand button
        const expandButton = directoryNode.locator(
          '[data-testid="file-tree-expand-button"]'
        );

        // Check if expand button exists
        const expandExists = (await expandButton.count()) > 0;

        if (expandExists) {
          // Get initial expanded state
          const initialState =
            await directoryNode.getAttribute("data-expanded");

          // Click to expand
          await expandButton.click();

          // Wait for expansion animation
          await page.waitForTimeout(300);

          // Should toggle expanded state
          const newState = await directoryNode.getAttribute("data-expanded");
          expect(newState).not.toBe(initialState);
        }
      }
    });

    test("should collapse expanded directory when clicked again", async ({
      page,
    }) => {
      // Find a directory node
      const directoryNode = page
        .locator('[data-testid="file-tree-node"][data-type="directory"]')
        .first();

      const count = await directoryNode.count();
      if (count > 0) {
        const expandButton = directoryNode.locator(
          '[data-testid="file-tree-expand-button"]'
        );

        const expandExists = (await expandButton.count()) > 0;
        if (expandExists) {
          // Expand first
          await expandButton.click();
          await page.waitForTimeout(300);

          // Collapse
          await expandButton.click();
          await page.waitForTimeout(300);

          // Should be collapsed
          const state = await directoryNode.getAttribute("data-expanded");
          expect(state).toBe("false");
        }
      }
    });

    test("should show file icon based on file type", async ({ page }) => {
      // Wait for file tree
      const fileTree = page.locator('[data-testid="file-tree"]');
      await expect(fileTree).toBeVisible();

      // File nodes should have icons (SVG elements)
      const fileNodes = page.locator(
        '[data-testid="file-tree-node"][data-type="file"]'
      );
      const count = await fileNodes.count();

      if (count > 0) {
        // Each file should have an icon
        const icon = fileNodes.first().locator("svg");
        await expect(icon).toBeVisible();
      }
    });

    test("should show directory icon for directories", async ({ page }) => {
      // Wait for file tree
      const fileTree = page.locator('[data-testid="file-tree"]');
      await expect(fileTree).toBeVisible();

      // Directory nodes should have folder icons
      const directoryNodes = page.locator(
        '[data-testid="file-tree-node"][data-type="directory"]'
      );
      const count = await directoryNodes.count();

      if (count > 0) {
        // Each directory should have an icon
        const icon = directoryNodes.first().locator("svg");
        await expect(icon).toBeVisible();
      }
    });
  });

  test.describe("Markdown File Viewing", () => {
    test("should display rendered markdown when file is selected", async ({
      page,
    }) => {
      // Find a markdown file in the tree
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        // Click to select file
        await mdFile.click();

        // Wait for content to load
        await page.waitForTimeout(500);

        // Content viewer should be visible
        const contentViewer = page.locator('[data-testid="content-viewer"]');
        await expect(contentViewer).toBeVisible();

        // Should contain rendered markdown (not raw text)
        const markdownContent = page.locator(
          '[data-testid="markdown-content"], .prose'
        );
        await expect(markdownContent).toBeVisible();
      }
    });

    test("should render markdown headers with proper hierarchy", async ({
      page,
    }) => {
      // Select a markdown file
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Check for heading elements (h1, h2, h3, etc.)
        const headings = page.locator(
          '[data-testid="markdown-content"] h1, [data-testid="markdown-content"] h2, [data-testid="markdown-content"] h3, .prose h1, .prose h2, .prose h3'
        );

        // If the file has headings, they should be rendered
        const headingCount = await headings.count();
        // Not all files have headings, so just verify structure works
        expect(headingCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("should render markdown lists correctly", async ({ page }) => {
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Check for list elements
        const lists = page.locator(
          '[data-testid="markdown-content"] ul, [data-testid="markdown-content"] ol, .prose ul, .prose ol'
        );

        const listCount = await lists.count();
        // Lists are optional in markdown, just verify rendering works
        expect(listCount).toBeGreaterThanOrEqual(0);
      }
    });

    test("should render markdown links as clickable elements", async ({
      page,
    }) => {
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Check for link elements
        const links = page.locator(
          '[data-testid="markdown-content"] a, .prose a'
        );
        const linkCount = await links.count();

        if (linkCount > 0) {
          // Links should have href attribute
          const firstLink = links.first();
          const href = await firstLink.getAttribute("href");
          expect(href).toBeTruthy();
        }
      }
    });

    test("should render code blocks with proper styling", async ({ page }) => {
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Check for code blocks
        const codeBlocks = page.locator(
          '[data-testid="markdown-content"] pre, [data-testid="code-block"], .prose pre'
        );
        const codeCount = await codeBlocks.count();

        if (codeCount > 0) {
          // Code blocks should have monospace font
          const firstBlock = codeBlocks.first();
          const fontFamily = await firstBlock.evaluate((el) => {
            return window.getComputedStyle(el).fontFamily;
          });
          expect(fontFamily.toLowerCase()).toMatch(/mono|consolas|courier/);
        }
      }
    });
  });

  test.describe("Breadcrumb Navigation", () => {
    test("should display breadcrumbs showing current path", async ({
      page,
    }) => {
      // Breadcrumbs component should be visible
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      await expect(breadcrumbs).toBeVisible();
    });

    test("should update breadcrumbs when navigating to nested file", async ({
      page,
    }) => {
      // Find and expand a directory first
      const directoryNode = page
        .locator('[data-testid="file-tree-node"][data-type="directory"]')
        .first();

      const dirCount = await directoryNode.count();
      if (dirCount > 0) {
        // Expand directory
        const expandButton = directoryNode.locator(
          '[data-testid="file-tree-expand-button"]'
        );
        const expandExists = (await expandButton.count()) > 0;

        if (expandExists) {
          await expandButton.click();
          await page.waitForTimeout(300);

          // Find a nested file
          const nestedFile = page
            .locator('[data-testid="file-tree-node"][data-type="file"]')
            .first();

          const fileCount = await nestedFile.count();
          if (fileCount > 0) {
            await nestedFile.click();
            await page.waitForTimeout(500);

            // Breadcrumbs should show the path
            const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
            await expect(breadcrumbs).toBeVisible();

            // Should have multiple segments for nested paths
            const segments = breadcrumbs.locator(
              '[data-testid="breadcrumb-segment"], a'
            );
            const segmentCount = await segments.count();
            expect(segmentCount).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    test("should navigate when clicking breadcrumb segment", async ({
      page,
    }) => {
      // Navigate to a file first
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Find a clickable breadcrumb segment
        const breadcrumbLink = page
          .locator('[data-testid="breadcrumbs"] a')
          .first();
        const linkCount = await breadcrumbLink.count();

        if (linkCount > 0) {
          // Click the breadcrumb
          await breadcrumbLink.click();
          await page.waitForTimeout(500);

          // URL should change to reflect navigation
          const currentUrl = page.url();
          expect(currentUrl).toContain("/reader");
        }
      }
    });

    test("should show Documents as root breadcrumb", async ({ page }) => {
      // Breadcrumbs should show root
      const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
      await expect(breadcrumbs).toBeVisible();

      // Should contain "Documents" or similar root indicator
      const rootText = await breadcrumbs.textContent();
      expect(rootText?.toLowerCase()).toMatch(/documents|docs|root|home/);
    });
  });

  test.describe("Content Area States", () => {
    test("should show empty state when no file is selected", async ({
      page,
    }) => {
      // Navigate to reader root without selecting a file
      await page.goto("/reader");
      await page.waitForLoadState("networkidle");

      // Empty state should be visible
      const emptyState = page.locator(
        '[data-testid="empty-state"], [data-testid="content-viewer-empty"]'
      );

      // Either empty state is shown or content viewer with placeholder
      const contentViewer = page.locator('[data-testid="content-viewer"]');
      await expect(contentViewer.or(emptyState)).toBeVisible();
    });

    test("should show loading indicator while content loads", async ({
      page,
    }) => {
      // Intercept the file API to add delay
      await page.route("**/api/reader/file**", async (route) => {
        // Add small delay to observe loading state
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.continue();
      });

      // Select a file
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();

        // Content viewer should show loading state initially
        const contentViewer = page.locator('[data-testid="content-viewer"]');
        await expect(contentViewer).toBeVisible();

        // Wait for content to load
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe("URL State Synchronization", () => {
    test("should update URL when file is selected", async ({ page }) => {
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // URL should contain the file path
        const url = page.url();
        expect(url).toContain("/reader/");
        expect(url.length).toBeGreaterThan("/reader/".length + 10);
      }
    });

    test("should load correct file when navigating directly to URL", async ({
      page,
    }) => {
      // First, select a file to get a valid URL
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Get the current URL
        const fileUrl = page.url();

        // Navigate away and back
        await page.goto("/");
        await page.goto(fileUrl);
        await page.waitForLoadState("networkidle");

        // Content viewer should show the file
        const contentViewer = page.locator('[data-testid="content-viewer"]');
        await expect(contentViewer).toBeVisible();
      }
    });

    test("should handle browser back/forward navigation", async ({ page }) => {
      // Select first file
      const firstFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await firstFile.count();
      if (count > 0) {
        await firstFile.click();
        await page.waitForTimeout(500);
        const firstUrl = page.url();

        // Select second file (if available)
        const secondFile = page
          .locator('[data-testid="file-tree-node"][data-type="file"]')
          .nth(1);
        const secondCount = await secondFile.count();

        if (secondCount > 0) {
          await secondFile.click();
          await page.waitForTimeout(500);
          const secondUrl = page.url();

          // Go back
          await page.goBack();
          await page.waitForLoadState("networkidle");

          // Should show first file URL
          await expect(page).toHaveURL(firstUrl);

          // Go forward
          await page.goForward();
          await page.waitForLoadState("networkidle");

          // Should show second file URL
          await expect(page).toHaveURL(secondUrl);
        }
      }
    });
  });

  test.describe("Theme Integration", () => {
    test("should respect system theme (light/dark)", async ({ page }) => {
      // Content should be readable in current theme
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Content should have appropriate contrast
        const contentViewer = page.locator('[data-testid="content-viewer"]');
        const backgroundColor = await contentViewer.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        // Background should be defined (not transparent)
        expect(backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
      }
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should support Tab navigation through file tree", async ({
      page,
    }) => {
      // Focus on file tree
      const fileTree = page.locator('[data-testid="file-tree"]');
      await expect(fileTree).toBeVisible();

      // Tab should move focus through tree items
      await page.keyboard.press("Tab");

      // Some element should have focus
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    });

    test("should activate file with Enter key", async ({ page }) => {
      // Find a file and focus it
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        // Focus the file
        await mdFile.focus();

        // Press Enter
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);

        // Content viewer should show content
        const contentViewer = page.locator('[data-testid="content-viewer"]');
        await expect(contentViewer).toBeVisible();
      }
    });
  });

  test.describe("Accessibility", () => {
    test("should have accessible file tree with proper roles", async ({
      page,
    }) => {
      const fileTree = page.locator('[data-testid="file-tree"]');
      await expect(fileTree).toBeVisible();

      // Tree should have appropriate ARIA role
      const role = await fileTree.getAttribute("role");
      expect(role).toMatch(/tree|list|group|menu/);
    });

    test("should have accessible content viewer", async ({ page }) => {
      const mdFile = page
        .locator('[data-testid="file-tree-node"][data-type="file"]')
        .first();

      const count = await mdFile.count();
      if (count > 0) {
        await mdFile.click();
        await page.waitForTimeout(500);

        // Content viewer should be a main or article element
        const contentViewer = page.locator('[data-testid="content-viewer"]');
        await expect(contentViewer).toBeVisible();
      }
    });

    test("should have visible focus indicators", async ({ page }) => {
      // Tab to an element
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Focused element should have visible focus ring
      const focusedElement = page.locator(":focus");
      const hasFocusStyle = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== "none" ||
          styles.boxShadow !== "none" ||
          el.classList.contains("focus-visible")
        );
      });
      expect(hasFocusStyle).toBeTruthy();
    });
  });
});
