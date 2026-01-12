import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Home, DollarSign, Calendar, Settings } from "lucide-react";
import { AppCard } from "@/components/home/app-card";

/**
 * Component Tests: AppCard
 *
 * TDD Phase: RED - These tests should FAIL until components/home/app-card.tsx is implemented.
 * Based on: User Story 2 requirements and data-model.md interface
 *
 * Test Categories:
 * - Basic rendering (title, description, icon)
 * - Navigation behavior (link to href)
 * - Hover effects and animations
 * - Current page state (disabled/highlighted)
 * - Accessibility (aria-labels, focus states)
 */

// Mock next/link to capture navigation
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

describe("AppCard", () => {
  const defaultProps = {
    href: "/dashboard",
    icon: DollarSign,
    title: "Finance",
    description: "Manage your finances and track expenses",
  };

  describe("Basic Rendering", () => {
    it("should render title correctly", () => {
      render(<AppCard {...defaultProps} />);

      expect(screen.getByText("Finance")).toBeInTheDocument();
    });

    it("should render description correctly", () => {
      render(<AppCard {...defaultProps} />);

      expect(
        screen.getByText("Manage your finances and track expenses")
      ).toBeInTheDocument();
    });

    it("should render the icon", () => {
      render(<AppCard {...defaultProps} />);

      // Icon should be rendered (check for SVG element)
      const icon = screen.getByTestId("app-card-icon");
      expect(icon).toBeInTheDocument();
    });

    it("should apply data-testid for E2E testing", () => {
      render(<AppCard {...defaultProps} />);

      expect(screen.getByTestId("app-card")).toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      render(<AppCard {...defaultProps} className="custom-class" />);

      const card = screen.getByTestId("app-card");
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("Navigation Behavior", () => {
    it("should render as a link with correct href", () => {
      render(<AppCard {...defaultProps} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/dashboard");
    });

    it("should navigate to calendar route when calendar card is clicked", () => {
      render(
        <AppCard
          href="/calendar"
          icon={Calendar}
          title="Calendar"
          description="View and manage your schedule"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/calendar");
    });

    it("should navigate to settings route when settings card is clicked", () => {
      render(
        <AppCard
          href="/settings"
          icon={Settings}
          title="Settings"
          description="Configure your preferences"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/settings");
    });

    it("should navigate to home route when home card is clicked", () => {
      render(
        <AppCard
          href="/"
          icon={Home}
          title="Home"
          description="Return to the landing page"
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/");
    });
  });

  describe("Hover Effects and Animations", () => {
    it("should have hover-related CSS classes for animation", () => {
      render(<AppCard {...defaultProps} />);

      const card = screen.getByTestId("app-card");
      // Card should have transition classes for smooth hover effect
      const classes = card.className;

      // Should have transition or transform related classes
      expect(classes).toMatch(/transition|hover|transform/i);
    });

    it("should apply scale effect class for hover state", () => {
      render(<AppCard {...defaultProps} />);

      const card = screen.getByTestId("app-card");
      // Should have the hover:scale class or similar
      expect(card.className).toMatch(/hover:scale|scale/);
    });
  });

  describe("Current Page State", () => {
    it("should apply current page styling when isCurrentPage is true", () => {
      render(<AppCard {...defaultProps} isCurrentPage={true} />);

      const card = screen.getByTestId("app-card");
      // Should have visual indication of current page (border, background, etc.)
      expect(card.className).toMatch(/current|active|ring|border/i);
    });

    it("should not apply current page styling when isCurrentPage is false", () => {
      render(<AppCard {...defaultProps} isCurrentPage={false} />);

      const card = screen.getByTestId("app-card");
      // Should not have the current page indicator classes
      expect(card.className).not.toMatch(/current|active.*ring/i);
    });

    it("should still be clickable when isCurrentPage is true", () => {
      render(<AppCard {...defaultProps} isCurrentPage={true} />);

      // Should still be a link even when on current page
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("Icon Styling", () => {
    it("should render icon with correct size (48px)", () => {
      render(<AppCard {...defaultProps} />);

      const icon = screen.getByTestId("app-card-icon");
      // Icon container should have 48px sizing per spec
      expect(icon.className).toMatch(/w-12|h-12|48|size-12/);
    });

    it("should render different icons for different apps", () => {
      const { rerender } = render(<AppCard {...defaultProps} icon={Home} />);

      let icon = screen.getByTestId("app-card-icon");
      expect(icon).toBeInTheDocument();

      rerender(<AppCard {...defaultProps} icon={Calendar} />);
      icon = screen.getByTestId("app-card-icon");
      expect(icon).toBeInTheDocument();

      rerender(<AppCard {...defaultProps} icon={Settings} />);
      icon = screen.getByTestId("app-card-icon");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should be focusable via keyboard", () => {
      render(<AppCard {...defaultProps} />);

      const link = screen.getByRole("link");
      link.focus();
      expect(link).toHaveFocus();
    });

    it("should have accessible name", () => {
      render(<AppCard {...defaultProps} />);

      const link = screen.getByRole("link");
      // Link should have accessible name (via aria-label or visible text)
      expect(link).toHaveAccessibleName();
    });

    it("should have proper focus-visible styling classes", () => {
      render(<AppCard {...defaultProps} />);

      const card = screen.getByTestId("app-card");
      // Should have focus-visible styling for keyboard navigation
      expect(card.className).toMatch(/focus|outline|ring/);
    });

    it("should work with screen readers via aria-label", () => {
      render(<AppCard {...defaultProps} />);

      const link = screen.getByRole("link");
      // Should have descriptive aria-label
      const ariaLabel = link.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/Finance/i);
    });
  });

  describe("Card Structure", () => {
    it("should render with card-like styling", () => {
      render(<AppCard {...defaultProps} />);

      const card = screen.getByTestId("app-card");
      // Should have card styling (rounded corners, shadow, border, etc.)
      expect(card.className).toMatch(/rounded|shadow|border|card/);
    });

    it("should have proper content hierarchy", () => {
      render(<AppCard {...defaultProps} />);

      // Title should be prominent
      const title = screen.getByText("Finance");
      expect(title).toBeInTheDocument();

      // Description should be present and less prominent
      const description = screen.getByText(
        "Manage your finances and track expenses"
      );
      expect(description.className).toMatch(/text-muted|text-sm|text-gray/);
    });
  });
});

describe("AppCard with Various App Types", () => {
  it("should render Home app card correctly", () => {
    render(
      <AppCard
        href="/"
        icon={Home}
        title="Home"
        description="Your personal dashboard hub"
      />
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Your personal dashboard hub")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  it("should render Finance app card correctly", () => {
    render(
      <AppCard
        href="/dashboard"
        icon={DollarSign}
        title="Finance"
        description="Track income and expenses"
      />
    );

    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Track income and expenses")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard");
  });

  it("should render Calendar app card correctly", () => {
    render(
      <AppCard
        href="/calendar"
        icon={Calendar}
        title="Calendar"
        description="Manage your schedule"
      />
    );

    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Manage your schedule")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/calendar");
  });

  it("should render Settings app card correctly", () => {
    render(
      <AppCard
        href="/settings"
        icon={Settings}
        title="Settings"
        description="Configure your preferences"
      />
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Configure your preferences")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/settings");
  });
});
