import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

/**
 * Unit Tests for Theme Hooks
 *
 * T016: Unit test - useTheme hook returns theme and setTheme
 *
 * TDD Phase: RED - These tests should FAIL until:
 * - T018: useTheme hook is created in lib/theme/hooks/useTheme.ts
 * - T019: Hook is exported from lib/theme/index.ts
 *
 * This test validates the useTheme hook contract defined in:
 * - specs/003-theme-style-system/contracts/theme-types.ts (ThemeContextValue)
 *
 * The hook should provide:
 * - theme: Current theme mode ('light' | 'dark' | 'system')
 * - resolvedTheme: Actual applied theme ('light' | 'dark')
 * - setTheme: Function to change theme
 * - themes: List of available theme names
 * - systemTheme: Current OS color scheme preference
 */

// Mock state that can be modified per test
const mockSetTheme = vi.fn();
let mockThemeState = {
  theme: "light",
  setTheme: mockSetTheme,
  resolvedTheme: "light",
  themes: ["light", "dark", "system"],
  systemTheme: "light" as const,
};

// Mock next-themes before importing useTheme
vi.mock("next-themes", () => ({
  useTheme: () => mockThemeState,
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

// Import after mocking is set up (ESM hoisting ensures mock is applied)
import { useTheme } from "@/lib/theme/hooks/useTheme";

// Helper to update mock state for individual tests
const setMockThemeState = (state: Partial<typeof mockThemeState>) => {
  mockThemeState = { ...mockThemeState, ...state };
};

describe("T016: useTheme hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockThemeState({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light" as const,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Return Values", () => {
    it("should return current theme mode", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("light");
    });

    it("should return setTheme function", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.setTheme).toBeDefined();
      expect(typeof result.current.setTheme).toBe("function");
    });

    it("should return resolvedTheme (never 'system')", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.resolvedTheme).toBeDefined();
      expect(["light", "dark"]).toContain(result.current.resolvedTheme);
    });

    it("should return list of available themes", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.themes).toBeDefined();
      expect(Array.isArray(result.current.themes)).toBe(true);
      expect(result.current.themes).toContain("light");
      expect(result.current.themes).toContain("dark");
    });

    it("should return systemTheme preference", () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.systemTheme).toBeDefined();
      expect(["light", "dark"]).toContain(result.current.systemTheme);
    });
  });

  describe("Theme Switching", () => {
    it("should call setTheme with 'dark' when switching to dark mode", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme("dark");
      });

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("should call setTheme with 'light' when switching to light mode", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme("light");
      });

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("should call setTheme with 'system' when using system preference", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme("system");
      });

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });
  });

  describe("Theme State Updates", () => {
    it("should reflect dark theme when set to dark", () => {
      setMockThemeState({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
    });

    it("should resolve system theme to actual value", () => {
      // System preference is dark, so resolved should be dark
      setMockThemeState({
        theme: "system",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
        themes: ["light", "dark", "system"],
        systemTheme: "dark",
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(result.current.systemTheme).toBe("dark");
    });

    it("should resolve system theme to light when OS prefers light", () => {
      setMockThemeState({
        theme: "system",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
        themes: ["light", "dark", "system"],
        systemTheme: "light",
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toBe("light");
      expect(result.current.systemTheme).toBe("light");
    });
  });

  describe("Type Safety", () => {
    it("should only accept valid theme modes", () => {
      const { result } = renderHook(() => useTheme());

      // Valid theme modes
      const validModes = ["light", "dark", "system"];
      validModes.forEach((mode) => {
        act(() => {
          result.current.setTheme(mode);
        });
        expect(mockSetTheme).toHaveBeenCalledWith(mode);
      });
    });
  });
});

describe("useTheme hook - Integration Behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should maintain stable references across renders", () => {
    const { result, rerender } = renderHook(() => useTheme());

    const initialSetTheme = result.current.setTheme;
    const initialThemes = result.current.themes;

    rerender();

    // setTheme function reference should remain stable
    expect(result.current.setTheme).toBe(initialSetTheme);
    // themes array should remain stable
    expect(result.current.themes).toBe(initialThemes);
  });

  it("should handle rapid theme changes", async () => {
    const { result } = renderHook(() => useTheme());

    // Simulate rapid theme switching
    await act(async () => {
      result.current.setTheme("dark");
      result.current.setTheme("light");
      result.current.setTheme("dark");
    });

    // All calls should have been made
    expect(mockSetTheme).toHaveBeenCalledTimes(3);
    expect(mockSetTheme).toHaveBeenNthCalledWith(1, "dark");
    expect(mockSetTheme).toHaveBeenNthCalledWith(2, "light");
    expect(mockSetTheme).toHaveBeenNthCalledWith(3, "dark");
  });
});

describe("useTheme hook - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle undefined theme gracefully", () => {
    setMockThemeState({
      theme: undefined,
      setTheme: mockSetTheme,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: "light",
    });

    const { result } = renderHook(() => useTheme());

    // Should fall back to a default or handle undefined
    // The resolved theme should still be available
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("should handle missing systemTheme gracefully", () => {
    setMockThemeState({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
      themes: ["light", "dark", "system"],
      systemTheme: undefined,
    });

    const { result } = renderHook(() => useTheme());

    // Hook should not throw
    expect(result.current.theme).toBe("light");
  });
});
