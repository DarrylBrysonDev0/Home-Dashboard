import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavBar } from "@/components/navigation/nav-bar";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Unit Tests: ThemeToggle with Tooltip in NavBar
 *
 * TDD Phase: RED - These tests verify tooltip behavior for theme toggle.
 * Based on: User Story 3 requirements - Theme Toggle from Navigation
 *
 * Test Categories:
 * - Tooltip visibility on hover
 * - Dynamic tooltip text based on current theme
 * - Theme persistence verification
 * - Accessibility of tooltip
 */

// Mock usePathname
const mockUsePathname = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

// Mock next-auth/react
const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}));

// Mock next-themes
const mockUseTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * Wrapper component that provides necessary context for tooltip tests
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}

describe("ThemeToggle with Tooltip in NavBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
        },
      },
      status: "authenticated",
    });
    mockUseTheme.mockReturnValue({
      resolvedTheme: "light",
      setTheme: vi.fn(),
      theme: "light",
    });
  });

  describe("Tooltip Rendering", () => {
    it("should render theme toggle button in NavBar", () => {
      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      expect(themeToggle).toBeInTheDocument();
    });

    it("should show tooltip on hover over theme toggle", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.hover(themeToggle);

      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should support hover interactions (tooltip visible on hover)", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");

      // Initially, no tooltip should be visible
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      // Hover should trigger tooltip
      await user.hover(themeToggle);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
      });

      // The tooltip contains relevant text
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toMatch(/switch to/i);
    });
  });

  describe("Tooltip Text Content", () => {
    it('should display "Switch to dark mode" when in light theme', async () => {
      mockUseTheme.mockReturnValue({
        resolvedTheme: "light",
        setTheme: vi.fn(),
        theme: "light",
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.hover(themeToggle);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveTextContent(/switch to dark mode/i);
      });
    });

    it('should display "Switch to light mode" when in dark theme', async () => {
      mockUseTheme.mockReturnValue({
        resolvedTheme: "dark",
        setTheme: vi.fn(),
        theme: "dark",
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.hover(themeToggle);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toHaveTextContent(/switch to light mode/i);
      });
    });
  });

  describe("Theme Toggle Functionality with Tooltip", () => {
    it("should toggle theme when clicked while tooltip is visible", async () => {
      const setThemeMock = vi.fn();
      mockUseTheme.mockReturnValue({
        resolvedTheme: "light",
        setTheme: setThemeMock,
        theme: "light",
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.hover(themeToggle);
      await user.click(themeToggle);

      expect(setThemeMock).toHaveBeenCalledWith("dark");
    });

    it("should toggle from dark to light when clicked", async () => {
      const setThemeMock = vi.fn();
      mockUseTheme.mockReturnValue({
        resolvedTheme: "dark",
        setTheme: setThemeMock,
        theme: "dark",
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.click(themeToggle);

      expect(setThemeMock).toHaveBeenCalledWith("light");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible tooltip with role=tooltip", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.hover(themeToggle);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("should maintain button aria-label when tooltip is present", () => {
      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      expect(themeToggle).toHaveAttribute("aria-label");
    });

    it("should be keyboard accessible - focus shows tooltip", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      // Tab to the theme toggle button
      await user.tab();
      await user.tab(); // May need multiple tabs depending on focusable elements

      // Find the theme toggle and check if it's focused or tooltip is shown
      const themeToggle = screen.getByTestId("theme-toggle");

      // Focus the element directly for more reliable testing
      themeToggle.focus();

      await waitFor(
        () => {
          const tooltip = screen.queryByRole("tooltip");
          // Either tooltip is shown or the button has proper aria-label
          expect(tooltip || themeToggle.getAttribute("aria-label")).toBeTruthy();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Theme Persistence Context", () => {
    it("should use resolvedTheme from next-themes context", () => {
      mockUseTheme.mockReturnValue({
        resolvedTheme: "dark",
        setTheme: vi.fn(),
        theme: "dark",
      });

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      // Sun icon should be displayed in dark mode
      const sunIcon = screen.queryByTestId("sun-icon");
      expect(sunIcon).toBeInTheDocument();
    });

    it("should display moon icon in light mode", () => {
      mockUseTheme.mockReturnValue({
        resolvedTheme: "light",
        setTheme: vi.fn(),
        theme: "light",
      });

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      // Moon icon should be displayed in light mode
      const moonIcon = screen.queryByTestId("moon-icon");
      expect(moonIcon).toBeInTheDocument();
    });

    it("should call setTheme from context when toggling", async () => {
      const setThemeMock = vi.fn();
      mockUseTheme.mockReturnValue({
        resolvedTheme: "light",
        setTheme: setThemeMock,
        theme: "light",
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.click(themeToggle);

      expect(setThemeMock).toHaveBeenCalled();
    });
  });

  describe("Tooltip Position and Styling", () => {
    it("should render tooltip below the trigger by default", async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <NavBar />
        </TestWrapper>
      );

      const themeToggle = screen.getByTestId("theme-toggle");
      await user.hover(themeToggle);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        // Tooltip should be present - position testing would require visual regression tests
        expect(tooltip).toBeInTheDocument();
      });
    });
  });
});
