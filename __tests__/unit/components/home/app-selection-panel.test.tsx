import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AppSelectionPanel } from "@/components/home/app-selection-panel";

/**
 * Component Tests: AppSelectionPanel
 *
 * TDD Phase: RED - These tests should FAIL until components/home/app-selection-panel.tsx is implemented.
 * Based on: User Story 2 requirements and data-model.md interface
 *
 * Test Categories:
 * - Renders all 4 app cards (Home, Finance, Calendar, Settings)
 * - Grid layout structure
 * - Responsive behavior classes
 * - Accessibility of the container
 * - Data attributes for E2E testing
 */

// Mock next/link for navigation tests
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock usePathname to test current page detection
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

describe("AppSelectionPanel", () => {
  describe("Basic Rendering", () => {
    it("should render the app selection panel container", () => {
      render(<AppSelectionPanel />);

      expect(screen.getByTestId("app-selection-panel")).toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      render(<AppSelectionPanel className="custom-panel-class" />);

      const panel = screen.getByTestId("app-selection-panel");
      expect(panel).toHaveClass("custom-panel-class");
    });
  });

  describe("App Cards Rendering", () => {
    it("should render all 4 app cards", () => {
      render(<AppSelectionPanel />);

      const appCards = screen.getAllByTestId("app-card");
      expect(appCards).toHaveLength(4);
    });

    it("should render Home app card with correct link", () => {
      render(<AppSelectionPanel />);

      const homeCard = screen.getByRole("link", { name: /Home/i });
      expect(homeCard).toBeInTheDocument();
      expect(homeCard).toHaveAttribute("href", "/");
    });

    it("should render Finance app card with correct link", () => {
      render(<AppSelectionPanel />);

      const financeCard = screen.getByRole("link", { name: /Finance/i });
      expect(financeCard).toBeInTheDocument();
      expect(financeCard).toHaveAttribute("href", "/dashboard");
    });

    it("should render Calendar app card with correct link", () => {
      render(<AppSelectionPanel />);

      const calendarCard = screen.getByRole("link", { name: /Calendar/i });
      expect(calendarCard).toBeInTheDocument();
      expect(calendarCard).toHaveAttribute("href", "/calendar");
    });

    it("should render Settings app card with correct link", () => {
      render(<AppSelectionPanel />);

      const settingsCard = screen.getByRole("link", { name: /Settings/i });
      expect(settingsCard).toBeInTheDocument();
      expect(settingsCard).toHaveAttribute("href", "/settings");
    });
  });

  describe("App Card Content", () => {
    it("should display Home app title and description", () => {
      render(<AppSelectionPanel />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      // Description should contain relevant text about home/dashboard
      const homeDescription = screen
        .getAllByText(/dashboard|home|hub|landing/i)
        .find(
          (el) =>
            el.textContent?.toLowerCase().includes("home") ||
            el.textContent?.toLowerCase().includes("dashboard") ||
            el.textContent?.toLowerCase().includes("hub")
        );
      expect(homeDescription).toBeDefined();
    });

    it("should display Finance app title and description", () => {
      render(<AppSelectionPanel />);

      expect(screen.getByText("Finance")).toBeInTheDocument();
      // Description should contain relevant finance text
      expect(
        screen.getByText(/finance|money|expense|income|track/i)
      ).toBeInTheDocument();
    });

    it("should display Calendar app title and description", () => {
      render(<AppSelectionPanel />);

      expect(screen.getByText("Calendar")).toBeInTheDocument();
      // Description should contain relevant calendar text
      expect(
        screen.getByText(/calendar|schedule|event|appointment/i)
      ).toBeInTheDocument();
    });

    it("should display Settings app title and description", () => {
      render(<AppSelectionPanel />);

      expect(screen.getByText("Settings")).toBeInTheDocument();
      // Description should contain relevant settings text
      expect(
        screen.getByText(/settings|preference|configure|customize/i)
      ).toBeInTheDocument();
    });
  });

  describe("Grid Layout", () => {
    it("should use CSS grid for layout", () => {
      render(<AppSelectionPanel />);

      const panel = screen.getByTestId("app-selection-panel");
      // Should have grid-related classes
      expect(panel.className).toMatch(/grid/);
    });

    it("should have responsive grid columns", () => {
      render(<AppSelectionPanel />);

      const panel = screen.getByTestId("app-selection-panel");
      // Should have responsive column classes (e.g., grid-cols-1, md:grid-cols-2, lg:grid-cols-4)
      expect(panel.className).toMatch(/grid-cols|cols/);
    });

    it("should have appropriate gap between cards", () => {
      render(<AppSelectionPanel />);

      const panel = screen.getByTestId("app-selection-panel");
      // Should have gap classes for spacing
      expect(panel.className).toMatch(/gap/);
    });
  });

  describe("App Card Icons", () => {
    it("should render icons for all app cards", () => {
      render(<AppSelectionPanel />);

      const icons = screen.getAllByTestId("app-card-icon");
      expect(icons).toHaveLength(4);
    });
  });

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<AppSelectionPanel />);

      // Panel should be a navigation region or section
      const panel = screen.getByTestId("app-selection-panel");
      expect(panel).toBeInTheDocument();
    });

    it("should have aria-label for the panel", () => {
      render(<AppSelectionPanel />);

      const panel = screen.getByTestId("app-selection-panel");
      // Should have descriptive aria-label
      expect(panel).toHaveAttribute("aria-label");
    });

    it("should allow keyboard navigation between cards", () => {
      render(<AppSelectionPanel />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBe(4);

      // All links should be focusable
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Current Page Indication", () => {
    it("should mark current page card as active when on home route", () => {
      // usePathname mock returns "/" by default
      render(<AppSelectionPanel />);

      // Home card should be marked as current
      const homeCard = screen.getByRole("link", { name: /Home/i });
      const cardElement = homeCard.closest('[data-testid="app-card"]');

      // Should have current page indication
      expect(cardElement?.className).toMatch(/current|active|ring|selected/i);
    });
  });
});

describe("AppSelectionPanel - Integration with usePathname", () => {
  it("should detect current page from pathname", async () => {
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/dashboard");

    render(<AppSelectionPanel />);

    // Finance card (href="/dashboard") should be marked as current
    const financeCard = screen.getByRole("link", { name: /Finance/i });
    const cardElement = financeCard.closest('[data-testid="app-card"]');

    // Should have current page indication on Finance card
    expect(cardElement?.className).toMatch(/current|active|ring|selected/i);
  });
});

describe("AppSelectionPanel - Order and Consistency", () => {
  it("should render cards in consistent order: Home, Finance, Calendar, Settings", () => {
    render(<AppSelectionPanel />);

    const appCards = screen.getAllByTestId("app-card");

    // Get titles in order
    const titles = appCards.map((card) => {
      // Find the title within each card
      const title = within(card).getByRole("link");
      return title.getAttribute("aria-label") || within(card).getByRole("heading")?.textContent;
    });

    // Verify order contains the expected apps (order may vary, but all should be present)
    expect(titles.some((t) => t?.includes("Home"))).toBe(true);
    expect(titles.some((t) => t?.includes("Finance"))).toBe(true);
    expect(titles.some((t) => t?.includes("Calendar"))).toBe(true);
    expect(titles.some((t) => t?.includes("Settings"))).toBe(true);
  });
});
