import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavItem } from "@/components/navigation/nav-item";
import { Home, DollarSign, Calendar, Settings } from "lucide-react";

/**
 * Unit Tests: NavItem Component
 *
 * TDD Phase: RED - These tests should FAIL until components/navigation/nav-item.tsx is implemented.
 * Based on: User Story 1 requirements and data-model.md (NavItemProps interface)
 *
 * Test Categories:
 * - Rendering of nav item with icon and label
 * - Active state detection via usePathname
 * - Loading/pending state display
 * - Accessibility attributes
 * - Custom className support
 */

// Mock usePathname to control active state in tests
const mockUsePathname = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

describe("NavItem", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  describe("Basic Rendering", () => {
    it("should render nav item with label", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      expect(screen.getByText("Finance")).toBeInTheDocument();
    });

    it("should render with icon", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      // Icon should be present (lucide icons render as svg)
      const navItem = screen.getByRole("link");
      const svg = navItem.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render as a link element", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link", { name: /finance/i });
      expect(link).toBeInTheDocument();
    });

    it("should have correct href attribute", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("Active State Detection", () => {
    it("should show active state when current path matches href", () => {
      mockUsePathname.mockReturnValue("/dashboard");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const navItem = screen.getByTestId("nav-item-finance");
      expect(navItem).toHaveAttribute("data-active", "true");
    });

    it("should not show active state when path does not match", () => {
      mockUsePathname.mockReturnValue("/calendar");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const navItem = screen.getByTestId("nav-item-finance");
      expect(navItem).toHaveAttribute("data-active", "false");
    });

    it("should show active state for home route at root path", () => {
      mockUsePathname.mockReturnValue("/");

      render(<NavItem href="/" icon={Home} label="Home" />);

      const navItem = screen.getByTestId("nav-item-home");
      expect(navItem).toHaveAttribute("data-active", "true");
    });

    it("should show active state for nested routes", () => {
      mockUsePathname.mockReturnValue("/dashboard/settings");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const navItem = screen.getByTestId("nav-item-finance");
      // Should be active for sub-routes of /dashboard
      expect(navItem).toHaveAttribute("data-active", "true");
    });

    it("should apply active styling class when active", () => {
      mockUsePathname.mockReturnValue("/dashboard");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      // Should have visual distinction for active state (bg color, text color, etc.)
      expect(link.className).toMatch(/bg-|text-primary|font-medium|active/);
    });

    it("should apply inactive styling class when not active", () => {
      mockUsePathname.mockReturnValue("/calendar");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      // Should have muted/secondary styling when inactive
      expect(link.className).toMatch(/text-muted|text-foreground|hover:/);
    });
  });

  describe("Loading/Pending State", () => {
    it("should display loading spinner when isPending is true", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" isPending />);

      const spinner = screen.getByTestId("nav-item-spinner");
      expect(spinner).toBeInTheDocument();
    });

    it("should hide icon when isPending is true", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" isPending />);

      const link = screen.getByRole("link");
      // Original icon should be hidden or replaced
      const svgCount = link.querySelectorAll("svg").length;
      // Should have spinner svg, possibly not the original icon
      expect(svgCount).toBeGreaterThanOrEqual(1);
    });

    it("should not display spinner when isPending is false", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" isPending={false} />);

      expect(screen.queryByTestId("nav-item-spinner")).not.toBeInTheDocument();
    });

    it("should not display spinner by default", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      expect(screen.queryByTestId("nav-item-spinner")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply custom className when provided", () => {
      render(
        <NavItem
          href="/dashboard"
          icon={DollarSign}
          label="Finance"
          className="custom-nav-item"
        />
      );

      const link = screen.getByRole("link");
      expect(link.className).toContain("custom-nav-item");
    });

    it("should have hover state styling", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      // Should have hover utility classes
      expect(link.className).toMatch(/hover:/);
    });

    it("should have transition styling for smooth state changes", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      // Should have transition classes
      expect(link.className).toMatch(/transition|duration/);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible name from label", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link", { name: /finance/i });
      expect(link).toBeInTheDocument();
    });

    it("should have aria-current when active", () => {
      mockUsePathname.mockReturnValue("/dashboard");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-current", "page");
    });

    it("should not have aria-current when inactive", () => {
      mockUsePathname.mockReturnValue("/calendar");

      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      expect(link).not.toHaveAttribute("aria-current");
    });

    it("should have aria-busy when loading", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" isPending />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("aria-busy", "true");
    });

    it("should be focusable", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      link.focus();

      expect(document.activeElement).toBe(link);
    });

    it("should have focus-visible styling", () => {
      render(<NavItem href="/dashboard" icon={DollarSign} label="Finance" />);

      const link = screen.getByRole("link");
      // Should have focus ring utility classes
      expect(link.className).toMatch(/focus|ring/);
    });
  });

  describe("Different Nav Items", () => {
    it("should render Home nav item correctly", () => {
      mockUsePathname.mockReturnValue("/");

      render(<NavItem href="/" icon={Home} label="Home" />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "/");
      expect(screen.getByTestId("nav-item-home")).toHaveAttribute("data-active", "true");
    });

    it("should render Calendar nav item correctly", () => {
      mockUsePathname.mockReturnValue("/calendar");

      render(<NavItem href="/calendar" icon={Calendar} label="Calendar" />);

      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "/calendar");
      expect(screen.getByTestId("nav-item-calendar")).toHaveAttribute("data-active", "true");
    });

    it("should render Settings nav item correctly", () => {
      mockUsePathname.mockReturnValue("/admin");

      render(<NavItem href="/admin" icon={Settings} label="Settings" />);

      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByRole("link")).toHaveAttribute("href", "/admin");
      expect(screen.getByTestId("nav-item-settings")).toHaveAttribute("data-active", "true");
    });
  });
});
