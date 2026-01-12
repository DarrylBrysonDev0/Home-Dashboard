"use client";

/**
 * ThemeToggle Component
 *
 * A button that toggles between light and dark themes.
 * Displays a sun icon in dark mode, moon icon in light mode.
 *
 * Features:
 * - Accessible button with aria-label
 * - Keyboard navigable (Enter/Space to toggle)
 * - Animated icon transition
 * - Hydration-safe with mounted state check
 *
 * @see User Story 1: Toggle Between Light and Dark Theme
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThemeToggleProps } from "@/lib/theme/types";

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const isDark = resolvedTheme === "dark";

  // Return placeholder during SSR to avoid hydration mismatch
  // Include data-testid so E2E tests can find the element during hydration
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Loading theme toggle"
        data-testid="theme-toggle"
        disabled
      >
        <span className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      data-testid="theme-toggle"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun
          className="h-5 w-5 transition-transform duration-200"
          data-testid="sun-icon"
        />
      ) : (
        <Moon
          className="h-5 w-5 transition-transform duration-200"
          data-testid="moon-icon"
        />
      )}
    </Button>
  );
}
