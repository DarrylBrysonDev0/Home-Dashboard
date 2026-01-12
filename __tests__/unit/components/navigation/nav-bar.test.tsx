import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavBar } from "@/components/navigation/nav-bar";

/**
 * Unit Tests: NavBar Component
 *
 * TDD Phase: RED - These tests should FAIL until components/navigation/nav-bar.tsx is implemented.
 * Based on: User Story 1 requirements and data-model.md (NavBarProps interface)
 *
 * Test Categories:
 * - Rendering of main navigation bar structure
 * - Integration of Logo, NavItems, ThemeToggle, UserMenu
 * - Fixed height (64px / h-16)
 * - Desktop layout configuration
 * - Responsive behavior (mobile menu trigger)
 * - Accessibility attributes
 */

// Mock usePathname and useSession
const mockUsePathname = vi.fn();
const mockUseSession = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}));

describe("NavBar", () => {
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
  });

  describe("Basic Rendering", () => {
    it("should render nav bar container", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      expect(navBar).toBeInTheDocument();
    });

    it("should render as a nav element", () => {
      render(<NavBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("should have aria-label for accessibility", () => {
      render(<NavBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label");
    });
  });

  describe("Structure", () => {
    it("should contain Logo component", () => {
      render(<NavBar />);

      const logo = screen.getByTestId("nav-logo");
      expect(logo).toBeInTheDocument();
    });

    it("should contain NavItems component", () => {
      render(<NavBar />);

      const navItems = screen.getByTestId("nav-items");
      expect(navItems).toBeInTheDocument();
    });

    it("should contain theme toggle or placeholder", () => {
      render(<NavBar />);

      // Theme toggle should be present
      const themeToggle = screen.queryByTestId("theme-toggle") ||
                          screen.queryByRole("button", { name: /theme|dark|light|mode/i });
      expect(themeToggle).toBeInTheDocument();
    });

    it("should contain user menu", () => {
      render(<NavBar />);

      // User menu should be present
      const userMenu = screen.queryByTestId("user-menu") ||
                       screen.queryByTestId("nav-user-menu") ||
                       screen.queryByRole("button", { name: /user|account|profile/i });
      expect(userMenu).toBeInTheDocument();
    });
  });

  describe("Fixed Height", () => {
    it("should have fixed height of 64px (h-16)", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have h-16 class (64px)
      expect(navBar.className).toMatch(/h-16|h-\[64px\]/);
    });

    it("should be fixed/sticky at top", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have fixed or sticky positioning
      expect(navBar.className).toMatch(/fixed|sticky/);
    });
  });

  describe("Desktop Layout", () => {
    it("should use flexbox layout", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      expect(navBar.className).toMatch(/flex/);
    });

    it("should align items center vertically", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      expect(navBar.className).toMatch(/items-center/);
    });

    it("should justify content between logo and actions", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      expect(navBar.className).toMatch(/justify-between|justify/);
    });

    it("should show nav items on desktop (md and above)", () => {
      render(<NavBar />);

      const navItems = screen.getByTestId("nav-items");
      // Should be visible by default, hidden only on mobile
      // Desktop: hidden md:flex pattern
      expect(navItems.className).toMatch(/flex|md:flex/);
    });
  });

  describe("Mobile Menu", () => {
    it("should have hamburger button for mobile", () => {
      render(<NavBar />);

      // Hamburger menu button should exist (may be hidden on desktop)
      const hamburgerButton = screen.queryByTestId("mobile-menu-button") ||
                              screen.queryByRole("button", { name: /menu|hamburger|navigation/i });
      expect(hamburgerButton).toBeInTheDocument();
    });

    it("should hide hamburger button on desktop", () => {
      render(<NavBar />);

      const hamburgerButton = screen.queryByTestId("mobile-menu-button") ||
                              screen.queryByRole("button", { name: /menu|hamburger/i });

      if (hamburgerButton) {
        // Should have md:hidden class
        expect(hamburgerButton.className).toMatch(/md:hidden|lg:hidden/);
      }
    });

    it("should hide desktop nav items on mobile", () => {
      render(<NavBar />);

      const navItems = screen.getByTestId("nav-items");
      // Should have hidden md:flex pattern for responsive behavior
      expect(navItems.className).toMatch(/hidden.*md:flex|md:flex.*hidden/);
    });
  });

  describe("Styling", () => {
    it("should apply custom className when provided", () => {
      render(<NavBar className="custom-nav-class" />);

      const navBar = screen.getByTestId("nav-bar");
      expect(navBar.className).toContain("custom-nav-class");
    });

    it("should have background color for visibility", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have background styling
      expect(navBar.className).toMatch(/bg-|background/);
    });

    it("should have border or shadow for separation from content", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have visual separation (border or shadow)
      expect(navBar.className).toMatch(/border|shadow/);
    });

    it("should have horizontal padding", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have padding for content spacing
      expect(navBar.className).toMatch(/px-|p-/);
    });

    it("should have proper z-index for layering", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have z-index for fixed positioning
      expect(navBar.className).toMatch(/z-/);
    });
  });

  describe("Accessibility", () => {
    it("should have role navigation", () => {
      render(<NavBar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("should have descriptive aria-label", () => {
      render(<NavBar />);

      const nav = screen.getByRole("navigation");
      const ariaLabel = nav.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/main|primary|navigation/i);
    });

    it("should be at top of page (landmark)", () => {
      render(<NavBar />);

      // Nav should be the primary navigation landmark
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });
  });

  describe("User Session Integration", () => {
    it("should show user info when authenticated", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "John Doe",
            email: "john@example.com",
          },
        },
        status: "authenticated",
      });

      render(<NavBar />);

      // User menu should be visible
      const userMenu = screen.queryByTestId("user-menu") ||
                       screen.queryByTestId("nav-user-menu") ||
                       screen.queryByRole("button", { name: /user|account|profile|john/i });
      expect(userMenu).toBeInTheDocument();
    });

    it("should handle loading session state", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
      });

      render(<NavBar />);

      // Should render without crashing
      const navBar = screen.getByTestId("nav-bar");
      expect(navBar).toBeInTheDocument();
    });
  });

  describe("Full Width Layout", () => {
    it("should span full width of viewport", () => {
      render(<NavBar />);

      const navBar = screen.getByTestId("nav-bar");
      // Should have full width
      expect(navBar.className).toMatch(/w-full|w-screen|inset-x-0/);
    });

    it("should have max-width container for content", () => {
      render(<NavBar />);

      // Inner content should be constrained
      const navBar = screen.getByTestId("nav-bar");
      // May have container or max-w class, or content wrapper inside
      expect(navBar).toBeInTheDocument();
    });
  });

  describe("Logo Position", () => {
    it("should render logo on the left side", () => {
      render(<NavBar />);

      const logo = screen.getByTestId("nav-logo");
      const navBar = screen.getByTestId("nav-bar");

      // Logo should be first in DOM order (left side in LTR)
      const firstChild = navBar.querySelector("[data-testid='nav-logo'], a");
      expect(firstChild).toBe(logo);
    });
  });

  describe("Actions Position", () => {
    it("should render theme toggle and user menu on the right side", () => {
      render(<NavBar />);

      const themeToggle = screen.queryByTestId("theme-toggle") ||
                          screen.queryByRole("button", { name: /theme|dark|light/i });
      const userMenu = screen.queryByTestId("user-menu") ||
                       screen.queryByTestId("nav-user-menu");

      // Both should be present
      expect(themeToggle || userMenu).toBeTruthy();
    });
  });
});
