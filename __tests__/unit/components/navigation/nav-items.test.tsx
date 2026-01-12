import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavItems } from "@/components/navigation/nav-items";

/**
 * Unit Tests: NavItems Component
 *
 * TDD Phase: RED - These tests should FAIL until components/navigation/nav-items.tsx is implemented.
 * Based on: User Story 1 requirements and data-model.md (NavItemsProps interface)
 *
 * Test Categories:
 * - Rendering of navigation item collection
 * - Required nav items: Home, Finance, Calendar, Settings
 * - Mobile mode vs desktop mode display
 * - onItemClick callback for drawer close
 * - Accessibility attributes
 */

// Mock usePathname to control active state
const mockUsePathname = vi.fn();
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

describe("NavItems", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  describe("Basic Rendering", () => {
    it("should render nav items container", () => {
      render(<NavItems />);

      const container = screen.getByTestId("nav-items");
      expect(container).toBeInTheDocument();
    });

    it("should render all four main navigation items", () => {
      render(<NavItems />);

      // Should have Home, Finance, Calendar, Settings
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Finance")).toBeInTheDocument();
      expect(screen.getByText("Calendar")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("should render items as links", () => {
      render(<NavItems />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Navigation Links", () => {
    it("should have correct href for Home link", () => {
      render(<NavItems />);

      const homeLink = screen.getByRole("link", { name: /home/i });
      expect(homeLink).toHaveAttribute("href", "/");
    });

    it("should have correct href for Finance link", () => {
      render(<NavItems />);

      const financeLink = screen.getByRole("link", { name: /finance/i });
      expect(financeLink).toHaveAttribute("href", "/dashboard");
    });

    it("should have correct href for Calendar link", () => {
      render(<NavItems />);

      const calendarLink = screen.getByRole("link", { name: /calendar/i });
      expect(calendarLink).toHaveAttribute("href", "/calendar");
    });

    it("should have correct href for Settings link", () => {
      render(<NavItems />);

      // Settings may link to /settings or /admin
      const settingsLink = screen.getByRole("link", { name: /settings/i });
      const href = settingsLink.getAttribute("href");
      expect(href).toMatch(/\/(settings|admin)/);
    });
  });

  describe("Icons", () => {
    it("should display icons for each nav item", () => {
      render(<NavItems />);

      const container = screen.getByTestId("nav-items");
      const icons = container.querySelectorAll("svg");

      // Should have at least one icon per nav item
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Desktop Mode (default)", () => {
    it("should render in horizontal layout by default", () => {
      render(<NavItems />);

      const container = screen.getByTestId("nav-items");
      // Should have flex-row or similar horizontal layout class
      expect(container.className).toMatch(/flex|gap/);
    });

    it("should apply desktop-specific styling when isMobile is false", () => {
      render(<NavItems isMobile={false} />);

      const container = screen.getByTestId("nav-items");
      // Should not have mobile-specific vertical layout
      expect(container.className).not.toMatch(/flex-col|space-y/);
    });
  });

  describe("Mobile Mode", () => {
    it("should render in vertical layout when isMobile is true", () => {
      render(<NavItems isMobile={true} />);

      const container = screen.getByTestId("nav-items");
      // Should have flex-col or similar vertical layout class
      expect(container.className).toMatch(/flex-col|space-y|grid/);
    });

    it("should apply mobile-specific styling when isMobile is true", () => {
      render(<NavItems isMobile={true} />);

      const container = screen.getByTestId("nav-items");
      // Should have vertical/stacked layout for mobile drawer
      const links = container.querySelectorAll("a");
      expect(links.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("onItemClick Callback", () => {
    it("should call onItemClick when a nav item is clicked", async () => {
      const user = userEvent.setup();
      const onItemClick = vi.fn();

      render(<NavItems onItemClick={onItemClick} />);

      const homeLink = screen.getByRole("link", { name: /home/i });
      await user.click(homeLink);

      expect(onItemClick).toHaveBeenCalled();
    });

    it("should call onItemClick for each nav item click", async () => {
      const user = userEvent.setup();
      const onItemClick = vi.fn();

      render(<NavItems onItemClick={onItemClick} />);

      const financeLink = screen.getByRole("link", { name: /finance/i });
      await user.click(financeLink);

      expect(onItemClick).toHaveBeenCalled();
    });

    it("should not throw when onItemClick is not provided", async () => {
      const user = userEvent.setup();

      render(<NavItems />);

      const homeLink = screen.getByRole("link", { name: /home/i });

      // Should not throw
      await expect(user.click(homeLink)).resolves.not.toThrow();
    });
  });

  describe("Active States", () => {
    it("should show Home as active when on root path", () => {
      mockUsePathname.mockReturnValue("/");

      render(<NavItems />);

      const homeItem = screen.getByTestId("nav-item-home");
      expect(homeItem).toHaveAttribute("data-active", "true");
    });

    it("should show Finance as active when on dashboard path", () => {
      mockUsePathname.mockReturnValue("/dashboard");

      render(<NavItems />);

      const financeItem = screen.getByTestId("nav-item-finance");
      expect(financeItem).toHaveAttribute("data-active", "true");
    });

    it("should show Calendar as active when on calendar path", () => {
      mockUsePathname.mockReturnValue("/calendar");

      render(<NavItems />);

      const calendarItem = screen.getByTestId("nav-item-calendar");
      expect(calendarItem).toHaveAttribute("data-active", "true");
    });

    it("should show Settings as active when on admin/settings path", () => {
      mockUsePathname.mockReturnValue("/admin");

      render(<NavItems />);

      const settingsItem = screen.getByTestId("nav-item-settings");
      expect(settingsItem).toHaveAttribute("data-active", "true");
    });

    it("should only have one active item at a time", () => {
      mockUsePathname.mockReturnValue("/dashboard");

      render(<NavItems />);

      const activeItems = screen.getAllByRole("link").filter(
        (link) => link.closest("[data-active='true']")
      );

      expect(activeItems.length).toBe(1);
    });
  });

  describe("Accessibility", () => {
    it("should render as a navigation list", () => {
      render(<NavItems />);

      // Should have proper list structure
      const container = screen.getByTestId("nav-items");
      expect(container).toBeInTheDocument();
    });

    it("should have accessible names for all items", () => {
      render(<NavItems />);

      expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /finance/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /calendar/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
    });

    it("should support keyboard navigation between items", () => {
      render(<NavItems />);

      const links = screen.getAllByRole("link");

      // All links should be focusable
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Order", () => {
    it("should render items in correct order: Home, Finance, Calendar, Settings", () => {
      render(<NavItems />);

      const links = screen.getAllByRole("link");
      const labels = links.map((link) => link.textContent?.trim().toLowerCase());

      const homeIndex = labels.indexOf("home");
      const financeIndex = labels.indexOf("finance");
      const calendarIndex = labels.indexOf("calendar");
      const settingsIndex = labels.indexOf("settings");

      // Verify order
      expect(homeIndex).toBeLessThan(financeIndex);
      expect(financeIndex).toBeLessThan(calendarIndex);
      expect(calendarIndex).toBeLessThan(settingsIndex);
    });
  });
});
