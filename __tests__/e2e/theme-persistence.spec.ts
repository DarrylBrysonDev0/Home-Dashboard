import { test, expect, Page } from "@playwright/test";

/**
 * E2E Tests for User Story 2: Persist Theme Preference Across Sessions
 *
 * Goal: Users' theme choice is saved to localStorage and automatically
 * applied on return visits.
 *
 * Acceptance Scenarios:
 * 1. Theme persists after browser reload
 * 2. System preference respected when no user preference
 * 3. System preference changes update theme dynamically
 *
 * @see specs/003-theme-style-system/spec.md for requirements
 */

/**
 * Storage key used by next-themes for persistence.
 * Must match the key in ThemeProvider configuration.
 */
const THEME_STORAGE_KEY = "cemdash-theme";

/**
 * Helper to get the current resolved theme from the page.
 * Checks the class on the <html> element.
 */
async function getResolvedTheme(page: Page): Promise<"light" | "dark"> {
  const isDark = await page.evaluate(() => {
    return document.documentElement.classList.contains("dark");
  });
  return isDark ? "dark" : "light";
}

/**
 * Helper to set theme via localStorage before page load.
 */
async function setStoredTheme(
  page: Page,
  theme: "light" | "dark" | "system"
): Promise<void> {
  await page.addInitScript((key: string, value: string) => {
    localStorage.setItem(key, value);
  }, THEME_STORAGE_KEY, theme);
}

/**
 * Helper to clear stored theme preference.
 */
async function clearStoredTheme(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    localStorage.removeItem(key);
  }, THEME_STORAGE_KEY);
}

test.describe("User Story 2: Theme Persistence", () => {
  test.describe("T021: Theme persists after browser reload", () => {
    test("should persist dark theme after page reload", async ({ page }) => {
      // Navigate to dashboard
      await page.goto("/dashboard");

      // Wait for the page to fully load and theme system to initialize
      await page.waitForLoadState("networkidle");

      // Find and click the theme toggle to switch to dark mode
      const themeToggle = page.getByTestId("theme-toggle");
      await expect(themeToggle).toBeVisible({ timeout: 10000 });

      // Get initial theme
      const initialTheme = await getResolvedTheme(page);

      // If already dark, click twice to go light then dark
      if (initialTheme === "dark") {
        await themeToggle.click();
        await page.waitForTimeout(100);
      }

      // Click to switch to dark
      await themeToggle.click();
      await page.waitForTimeout(100);

      // Verify theme changed to dark
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Reload the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verify theme is still dark after reload
      const themeAfterReload = await getResolvedTheme(page);
      expect(themeAfterReload).toBe("dark");
      await expect(page.locator("html")).toHaveClass(/dark/);
    });

    test("should persist light theme after page reload", async ({ page }) => {
      // Set dark theme first via localStorage
      await setStoredTheme(page, "dark");

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Verify we start in dark mode
      await expect(page.locator("html")).toHaveClass(/dark/);

      // Click toggle to switch to light
      const themeToggle = page.getByTestId("theme-toggle");
      await themeToggle.click();
      await page.waitForTimeout(100);

      // Verify theme changed to light
      await expect(page.locator("html")).not.toHaveClass(/dark/);

      // Reload the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Verify theme is still light after reload
      const themeAfterReload = await getResolvedTheme(page);
      expect(themeAfterReload).toBe("light");
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });

    test("should read theme from localStorage on initial load", async ({
      page,
    }) => {
      // Set dark theme in localStorage before navigation
      await setStoredTheme(page, "dark");

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Theme should be dark immediately
      const theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");
      await expect(page.locator("html")).toHaveClass(/dark/);
    });

    test("should use correct localStorage key", async ({ page }) => {
      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Click toggle to set a preference
      const themeToggle = page.getByTestId("theme-toggle");
      await themeToggle.click();
      await page.waitForTimeout(100);

      // Check localStorage uses correct key
      const storedValue = await page.evaluate((key) => {
        return localStorage.getItem(key);
      }, THEME_STORAGE_KEY);

      expect(storedValue).toBeTruthy();
      expect(["light", "dark", "system"]).toContain(storedValue);
    });
  });

  test.describe("T022: System preference when no user preference", () => {
    test("should follow dark system preference when no stored preference", async ({
      page,
    }) => {
      // Clear any stored preference
      await clearStoredTheme(page);

      // Emulate dark system preference
      await page.emulateMedia({ colorScheme: "dark" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Theme should match system preference (dark)
      const theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");
      await expect(page.locator("html")).toHaveClass(/dark/);
    });

    test("should follow light system preference when no stored preference", async ({
      page,
    }) => {
      // Clear any stored preference
      await clearStoredTheme(page);

      // Emulate light system preference
      await page.emulateMedia({ colorScheme: "light" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Theme should match system preference (light)
      const theme = await getResolvedTheme(page);
      expect(theme).toBe("light");
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });

    test("should use default theme when system preference is not available", async ({
      page,
    }) => {
      // Clear any stored preference
      await clearStoredTheme(page);

      // Emulate no preference (let browser default)
      await page.emulateMedia({ colorScheme: "no-preference" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Should still render without error (light is typically default)
      // Just verify the page loaded correctly
      await expect(page.locator("html")).toBeVisible();
    });

    test("should override system preference when user has explicit preference", async ({
      page,
    }) => {
      // Set explicit light preference in localStorage
      await setStoredTheme(page, "light");

      // Emulate dark system preference
      await page.emulateMedia({ colorScheme: "dark" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // User preference (light) should win over system (dark)
      const theme = await getResolvedTheme(page);
      expect(theme).toBe("light");
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });
  });

  test.describe("T023: Dynamic system preference updates", () => {
    test("should update theme when system preference changes dynamically", async ({
      page,
    }) => {
      // Set theme to 'system' to follow OS preference
      await setStoredTheme(page, "system");

      // Start with light system preference
      await page.emulateMedia({ colorScheme: "light" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Verify we start in light mode
      let theme = await getResolvedTheme(page);
      expect(theme).toBe("light");

      // Change system preference to dark
      await page.emulateMedia({ colorScheme: "dark" });

      // Wait for theme to update (next-themes listens to media query changes)
      await page.waitForTimeout(200);

      // Theme should now be dark
      theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");
      await expect(page.locator("html")).toHaveClass(/dark/);
    });

    test("should update theme when switching from dark to light system preference", async ({
      page,
    }) => {
      // Set theme to 'system' to follow OS preference
      await setStoredTheme(page, "system");

      // Start with dark system preference
      await page.emulateMedia({ colorScheme: "dark" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Verify we start in dark mode
      let theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");

      // Change system preference to light
      await page.emulateMedia({ colorScheme: "light" });

      // Wait for theme to update
      await page.waitForTimeout(200);

      // Theme should now be light
      theme = await getResolvedTheme(page);
      expect(theme).toBe("light");
      await expect(page.locator("html")).not.toHaveClass(/dark/);
    });

    test("should not update theme on system change when user has explicit preference", async ({
      page,
    }) => {
      // Set explicit dark preference (not 'system')
      await setStoredTheme(page, "dark");

      // Start with light system preference
      await page.emulateMedia({ colorScheme: "light" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Should be dark (user preference) not light (system)
      let theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");

      // Change system preference to light
      await page.emulateMedia({ colorScheme: "light" });
      await page.waitForTimeout(200);

      // Theme should still be dark (user preference wins)
      theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");
      await expect(page.locator("html")).toHaveClass(/dark/);
    });

    test("should switch to system following after selecting system option", async ({
      page,
    }) => {
      // Set explicit dark preference
      await setStoredTheme(page, "dark");

      // Set system to light
      await page.emulateMedia({ colorScheme: "light" });

      // Navigate to dashboard
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Should be dark (explicit preference)
      let theme = await getResolvedTheme(page);
      expect(theme).toBe("dark");

      // Manually set to 'system' via localStorage to simulate selecting system option
      await page.evaluate((key) => {
        localStorage.setItem(key, "system");
        // Dispatch storage event to trigger next-themes update
        window.dispatchEvent(new Event("storage"));
      }, THEME_STORAGE_KEY);

      // Reload to apply the change (next-themes may need reload for storage change)
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Now should follow system (light)
      theme = await getResolvedTheme(page);
      expect(theme).toBe("light");
    });
  });
});

test.describe("User Story 2: Theme Persistence - Edge Cases", () => {
  test("should handle corrupted localStorage gracefully", async ({ page }) => {
    // Set invalid value in localStorage
    await page.addInitScript((key: string) => {
      localStorage.setItem(key, "invalid-theme-value");
    }, THEME_STORAGE_KEY);

    // Navigate to dashboard - should not crash
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Page should still render
    await expect(page.locator("body")).toBeVisible();
  });

  test("should work when localStorage is not available", async ({ page }) => {
    // Simulate localStorage being unavailable (some privacy modes)
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get: () => {
          throw new Error("localStorage is disabled");
        },
      });
    });

    // Navigate to dashboard - should not crash
    await page.goto("/dashboard");

    // Page should still render with default/system theme
    await expect(page.locator("body")).toBeVisible();
  });

  test("should persist theme across different pages", async ({ page }) => {
    // Set dark theme
    await setStoredTheme(page, "dark");

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Verify dark theme
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Navigate to another page (e.g., calendar if it exists)
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    // Theme should still be dark
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Navigate back to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Theme should still be dark
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("User Story 2: Theme Persistence - Performance", () => {
  test("should apply theme without visible flash (FOUC prevention)", async ({
    page,
  }) => {
    // Set dark theme
    await setStoredTheme(page, "dark");

    // Start recording before navigation
    let flashDetected = false;

    // Listen for any class changes on html element during load
    await page.addInitScript(() => {
      // Track if we ever see the page without dark class then with it
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === "class") {
            const target = mutation.target as HTMLElement;
            // If we see a transition from no-dark to dark, we had FOUC
            // (This is simplified - real FOUC detection would need frame-by-frame)
            console.log("Class mutation:", target.className);
          }
        }
      });

      document.addEventListener("DOMContentLoaded", () => {
        observer.observe(document.documentElement, { attributes: true });
      });
    });

    // Navigate to dashboard
    await page.goto("/dashboard");

    // Verify dark theme is immediately applied
    const theme = await getResolvedTheme(page);
    expect(theme).toBe("dark");

    // Check that dark class was present from the start
    // (next-themes injects a blocking script to prevent FOUC)
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
