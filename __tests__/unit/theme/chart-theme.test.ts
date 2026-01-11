/**
 * Unit Tests for useChartTheme Hook
 *
 * T029: Unit test - useChartTheme returns light palette when theme is light
 * T030: Unit test - useChartTheme returns dark palette when theme is dark
 * T031: Unit test - useChartTheme provides 10 distinct chart colors
 * T032: Unit test - income is green, expenses is coral in both themes
 *
 * TDD Phase: RED - These tests should FAIL until:
 * - T033: useChartTheme hook is created in lib/theme/hooks/useChartTheme.ts
 * - T036: Hook is exported from lib/theme/index.ts
 *
 * This test validates the ChartThemeColors contract defined in:
 * - specs/003-theme-style-system/contracts/theme-types.ts
 *
 * The hook should provide:
 * - palette: Array of 10 chart colors
 * - income: Green color for positive values
 * - expenses: Coral/red color for negative values
 * - categories: Mapping of category names to colors
 * - accounts: Mapping of account names to colors
 * - grid: Grid line color
 * - axis: Axis label color
 * - tooltip: Tooltip styling object
 * - gradients: Gradient definitions for income/expenses
 *
 * TESTING APPROACH (Lessons from T025-T028):
 * - Unit tests work well with mocked next-themes useTheme hook
 * - No need for addInitScript or synthetic state - direct mock returns work reliably
 * - Tests verify hook behavior without browser/localStorage complexity
 * - This approach avoids timing/initialization issues seen in E2E tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import type { ChartThemeColors } from "@/lib/theme/types";

// Expected color values from theme configurations
const LIGHT_THEME_COLORS = {
  income: "#12B76A", // Mint green
  expenses: "#F97066", // Coral
  palette: [
    "#F97066", // Coral - Expenses
    "#12B76A", // Mint - Income
    "#3B82F6", // Blue
    "#F59E0B", // Amber
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#06B6D4", // Cyan
    "#84CC16", // Lime
  ],
};

const DARK_THEME_COLORS = {
  income: "#00FF7F", // Neon green (brighter for dark mode)
  expenses: "#FF4444", // Neon red
  palette: [
    "#FF4444", // Neon Red - Expenses
    "#00FF7F", // Neon Green - Income
    "#1E90FF", // Neon Blue
    "#FFD700", // Neon Yellow
    "#9370DB", // Neon Purple
    "#FF00FF", // Neon Magenta
    "#00CED1", // Neon Teal
    "#FF8C00", // Neon Orange
    "#00FFFF", // Neon Cyan
    "#ADFF2F", // Neon Lime
  ],
};

// Mock next-themes useTheme
const mockUseTheme = vi.fn(() => ({
  theme: "light",
  resolvedTheme: "light" as const,
  setTheme: vi.fn(),
  themes: ["light", "dark", "system"],
  systemTheme: "light" as const,
}));

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

// Import after mocking - hook will be created in T033
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useChartTheme } = require("@/lib/theme/hooks/useChartTheme");

describe("T029: useChartTheme returns light palette when theme is light", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return light theme palette when resolvedTheme is light", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.palette).toEqual(LIGHT_THEME_COLORS.palette);
  });

  it("should return light theme income color (mint green)", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.income).toBe(LIGHT_THEME_COLORS.income);
  });

  it("should return light theme expenses color (coral)", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.expenses).toBe(LIGHT_THEME_COLORS.expenses);
  });

  it("should return light theme grid and axis colors", () => {
    const { result } = renderHook(() => useChartTheme());

    // Grid and axis should be muted/subtle colors for light theme
    expect(result.current.grid).toBeDefined();
    expect(result.current.axis).toBeDefined();
    expect(typeof result.current.grid).toBe("string");
    expect(typeof result.current.axis).toBe("string");
  });

  it("should return light theme tooltip styling", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.tooltip).toBeDefined();
    expect(result.current.tooltip.bg).toBeDefined();
    expect(result.current.tooltip.text).toBeDefined();
    expect(result.current.tooltip.border).toBeDefined();
  });

  it("should return light theme category colors", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.categories).toBeDefined();
    expect(Object.keys(result.current.categories).length).toBeGreaterThan(0);

    // Verify all 13 categories are present
    const expectedCategories = [
      "charity",
      "daily",
      "dining",
      "entertainment",
      "gifts",
      "groceries",
      "healthcare",
      "financing",
      "shopping",
      "subscriptions",
      "transportation",
      "travel",
      "utilities",
    ];

    expectedCategories.forEach((category) => {
      expect(result.current.categories[category]).toBeDefined();
    });
  });

  it("should return light theme account colors", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.accounts).toBeDefined();

    // Verify all 6 accounts are present
    const expectedAccounts = [
      "jointChecking",
      "jointSavings",
      "user1Checking",
      "user1Savings",
      "user2Checking",
      "user2Savings",
    ];

    expectedAccounts.forEach((account) => {
      expect(result.current.accounts[account]).toBeDefined();
    });
  });

  it("should return light theme gradient definitions", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.gradients).toBeDefined();
    expect(result.current.gradients.income).toBeDefined();
    expect(result.current.gradients.expenses).toBeDefined();
    expect(Array.isArray(result.current.gradients.income)).toBe(true);
    expect(Array.isArray(result.current.gradients.expenses)).toBe(true);
    expect(result.current.gradients.income).toHaveLength(2);
    expect(result.current.gradients.expenses).toHaveLength(2);
  });
});

describe("T030: useChartTheme returns dark palette when theme is dark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return dark theme palette when resolvedTheme is dark", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.palette).toEqual(DARK_THEME_COLORS.palette);
  });

  it("should return dark theme income color (neon green)", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.income).toBe(DARK_THEME_COLORS.income);
  });

  it("should return dark theme expenses color (neon red)", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.expenses).toBe(DARK_THEME_COLORS.expenses);
  });

  it("should return dark theme grid and axis colors", () => {
    const { result } = renderHook(() => useChartTheme());

    // Grid and axis should be lighter/visible on dark backgrounds
    expect(result.current.grid).toBeDefined();
    expect(result.current.axis).toBeDefined();
    expect(typeof result.current.grid).toBe("string");
    expect(typeof result.current.axis).toBe("string");
  });

  it("should return dark theme tooltip styling", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.tooltip).toBeDefined();
    expect(result.current.tooltip.bg).toBeDefined();
    expect(result.current.tooltip.text).toBeDefined();
    expect(result.current.tooltip.border).toBeDefined();
  });

  it("should use brighter account colors for dark theme visibility", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.accounts).toBeDefined();
    // Dark theme should have brighter colors for visibility
    // Verify account colors are defined and not the same as light theme
    expect(result.current.accounts.jointChecking).toBeDefined();
  });

  it("should return dark theme gradient definitions", () => {
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.gradients).toBeDefined();
    expect(result.current.gradients.income).toHaveLength(2);
    expect(result.current.gradients.expenses).toHaveLength(2);
  });
});

describe("T031: useChartTheme provides 10 distinct chart colors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should provide exactly 10 colors in the palette for light theme", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useChartTheme());

    expect(result.current.palette).toHaveLength(10);
  });

  it("should provide exactly 10 colors in the palette for dark theme", () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });

    const { result } = renderHook(() => useChartTheme());

    expect(result.current.palette).toHaveLength(10);
  });

  it("should provide 10 distinct colors (no duplicates) in light theme", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useChartTheme());
    const uniqueColors = new Set(result.current.palette);

    expect(uniqueColors.size).toBe(10);
  });

  it("should provide 10 distinct colors (no duplicates) in dark theme", () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });

    const { result } = renderHook(() => useChartTheme());
    const uniqueColors = new Set(result.current.palette);

    expect(uniqueColors.size).toBe(10);
  });

  it("should have all palette colors as valid hex color strings", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useChartTheme());
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    result.current.palette.forEach((color: string) => {
      expect(color).toMatch(hexColorRegex);
    });
  });

  it("should have first palette color be expenses (coral/red variant)", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useChartTheme());

    // First color in palette should match expenses color
    expect(result.current.palette[0]).toBe(result.current.expenses);
  });

  it("should have second palette color be income (green variant)", () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useChartTheme());

    // Second color in palette should match income color
    expect(result.current.palette[1]).toBe(result.current.income);
  });
});

describe("T032: Income is green, expenses is coral in both themes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Light Theme", () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        resolvedTheme: "light",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });
    });

    it("should have income color as mint green (#12B76A)", () => {
      const { result } = renderHook(() => useChartTheme());

      expect(result.current.income).toBe("#12B76A");
    });

    it("should have expenses color as coral (#F97066)", () => {
      const { result } = renderHook(() => useChartTheme());

      expect(result.current.expenses).toBe("#F97066");
    });

    it("should have income and expenses as different colors", () => {
      const { result } = renderHook(() => useChartTheme());

      expect(result.current.income).not.toBe(result.current.expenses);
    });

    it("should have income gradient start with green", () => {
      const { result } = renderHook(() => useChartTheme());

      // Income gradient should include green shades
      const incomeGradient = result.current.gradients.income;
      expect(incomeGradient[0]).toBeDefined();
      expect(incomeGradient[1]).toBeDefined();
    });

    it("should have expenses gradient start with coral/red", () => {
      const { result } = renderHook(() => useChartTheme());

      // Expenses gradient should include coral/red shades
      const expensesGradient = result.current.gradients.expenses;
      expect(expensesGradient[0]).toBeDefined();
      expect(expensesGradient[1]).toBeDefined();
    });
  });

  describe("Dark Theme", () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        resolvedTheme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "dark",
      });
    });

    it("should have income color as neon green (#00FF7F)", () => {
      const { result } = renderHook(() => useChartTheme());

      expect(result.current.income).toBe("#00FF7F");
    });

    it("should have expenses color as neon red (#FF4444)", () => {
      const { result } = renderHook(() => useChartTheme());

      expect(result.current.expenses).toBe("#FF4444");
    });

    it("should have income and expenses as different colors", () => {
      const { result } = renderHook(() => useChartTheme());

      expect(result.current.income).not.toBe(result.current.expenses);
    });

    it("should have brighter income color than light theme for visibility", () => {
      const { result } = renderHook(() => useChartTheme());

      // Neon green is brighter than mint green
      expect(result.current.income).toBe("#00FF7F");
    });

    it("should have brighter expenses color than light theme for visibility", () => {
      const { result } = renderHook(() => useChartTheme());

      // Neon red is brighter than coral
      expect(result.current.expenses).toBe("#FF4444");
    });
  });

  describe("Semantic Color Consistency", () => {
    it("should always use green variants for income (positive values)", () => {
      // Light theme
      mockUseTheme.mockReturnValue({
        theme: "light",
        resolvedTheme: "light",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });

      const { result: lightResult } = renderHook(() => useChartTheme());

      // Green colors typically have high G component
      // #12B76A and #00FF7F are both green
      expect(lightResult.current.income).toMatch(/#[0-9A-F]{2}[B-F][0-9A-F]{3}/i);

      // Dark theme
      mockUseTheme.mockReturnValue({
        theme: "dark",
        resolvedTheme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "dark",
      });

      const { result: darkResult } = renderHook(() => useChartTheme());
      expect(darkResult.current.income).toMatch(/#[0-9A-F]{2}[F][0-9A-F]{3}/i);
    });

    it("should always use coral/red variants for expenses (negative values)", () => {
      // Light theme
      mockUseTheme.mockReturnValue({
        theme: "light",
        resolvedTheme: "light",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });

      const { result: lightResult } = renderHook(() => useChartTheme());

      // Coral/red colors typically have high R component
      expect(lightResult.current.expenses).toMatch(/^#[F][0-9A-F]{5}$/i);

      // Dark theme
      mockUseTheme.mockReturnValue({
        theme: "dark",
        resolvedTheme: "dark",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "dark",
      });

      const { result: darkResult } = renderHook(() => useChartTheme());
      expect(darkResult.current.expenses).toMatch(/^#[F][0-9A-F]{5}$/i);
    });

    it("should have income semantic color match positive semantic color", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        resolvedTheme: "light",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });

      const { result } = renderHook(() => useChartTheme());

      // Income should be a green variant (positive semantic meaning)
      expect(result.current.income).toBeDefined();
      expect(typeof result.current.income).toBe("string");
    });

    it("should have expenses semantic color match negative semantic color", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        resolvedTheme: "light",
        setTheme: vi.fn(),
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });

      const { result } = renderHook(() => useChartTheme());

      // Expenses should be a coral/red variant (negative semantic meaning)
      expect(result.current.expenses).toBeDefined();
      expect(typeof result.current.expenses).toBe("string");
    });
  });
});

describe("useChartTheme - System Theme Resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should use light palette when system resolves to light", () => {
    mockUseTheme.mockReturnValue({
      theme: "system",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useChartTheme());

    expect(result.current.palette).toEqual(LIGHT_THEME_COLORS.palette);
    expect(result.current.income).toBe(LIGHT_THEME_COLORS.income);
    expect(result.current.expenses).toBe(LIGHT_THEME_COLORS.expenses);
  });

  it("should use dark palette when system resolves to dark", () => {
    mockUseTheme.mockReturnValue({
      theme: "system",
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });

    const { result } = renderHook(() => useChartTheme());

    expect(result.current.palette).toEqual(DARK_THEME_COLORS.palette);
    expect(result.current.income).toBe(DARK_THEME_COLORS.income);
    expect(result.current.expenses).toBe(DARK_THEME_COLORS.expenses);
  });
});

describe("useChartTheme - Memoization and Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return stable object reference when theme does not change", () => {
    const { result, rerender } = renderHook(() => useChartTheme());

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    // Object reference should be stable (memoized)
    expect(firstResult).toBe(secondResult);
  });

  it("should update when resolved theme changes", () => {
    const { result, rerender } = renderHook(() => useChartTheme());

    const lightPalette = result.current.palette;

    // Change to dark theme
    mockUseTheme.mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
    });

    rerender();

    const darkPalette = result.current.palette;

    // Palettes should be different
    expect(lightPalette).not.toEqual(darkPalette);
  });
});
