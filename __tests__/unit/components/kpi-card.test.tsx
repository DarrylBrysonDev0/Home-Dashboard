import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "@/components/dashboard/kpi-card";
import type { Trend } from "@/lib/validations/analytics";

/**
 * Component Tests: KPICard
 *
 * TDD Phase: RED - These tests should FAIL until components/dashboard/kpi-card.tsx is implemented.
 * Based on: User Story 1 requirements and OpenAPI spec
 *
 * Test Categories:
 * - Rendering of title and value
 * - Trend indicator display (up/down/neutral with arrow and color)
 * - Currency formatting
 * - Loading and empty states
 * - Accessibility (aria-labels)
 */

describe("KPICard", () => {
  describe("Basic Rendering", () => {
    it("should render title and value", () => {
      render(
        <KPICard
          title="Net Cash Flow"
          value={5420.5}
          format="currency"
        />
      );

      expect(screen.getByText("Net Cash Flow")).toBeInTheDocument();
      expect(screen.getByText(/\$5,420\.50/)).toBeInTheDocument();
    });

    it("should render with card styling", () => {
      render(
        <KPICard
          title="Total Balance"
          value={48322.15}
          format="currency"
        />
      );

      // Should be wrapped in a card container
      const card = screen.getByRole("article");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass(/card/i);
    });
  });

  describe("Trend Indicator", () => {
    it("should display up arrow with positive color for upward trend", () => {
      render(
        <KPICard
          title="Net Cash Flow"
          value={5420.5}
          format="currency"
          trend="up"
          trendValue={12.5}
        />
      );

      // Should show up arrow
      const trendIndicator = screen.getByTestId("trend-indicator");
      expect(trendIndicator).toBeInTheDocument();

      // Should have positive/green styling
      expect(trendIndicator).toHaveClass(/text-green|text-emerald|text-mint/i);

      // Should show percentage
      expect(screen.getByText(/12\.5%/)).toBeInTheDocument();
    });

    it("should display down arrow with negative color for downward trend", () => {
      render(
        <KPICard
          title="Expenses"
          value={-3200}
          format="currency"
          trend="down"
          trendValue={-8.3}
        />
      );

      const trendIndicator = screen.getByTestId("trend-indicator");
      expect(trendIndicator).toBeInTheDocument();

      // Should have negative/red styling
      expect(trendIndicator).toHaveClass(/text-red|text-coral|text-rose/i);

      // Should show percentage (negative)
      expect(screen.getByText(/-8\.3%/)).toBeInTheDocument();
    });

    it("should display neutral indicator for no change", () => {
      render(
        <KPICard
          title="Balance"
          value={10000}
          format="currency"
          trend="neutral"
          trendValue={0}
        />
      );

      const trendIndicator = screen.getByTestId("trend-indicator");
      expect(trendIndicator).toBeInTheDocument();

      // Should have neutral/gray styling
      expect(trendIndicator).toHaveClass(/text-gray|text-neutral|text-slate/i);
    });

    it("should not display trend indicator when trend is not provided", () => {
      render(
        <KPICard
          title="Simple Value"
          value={1000}
          format="currency"
        />
      );

      expect(screen.queryByTestId("trend-indicator")).not.toBeInTheDocument();
    });
  });

  describe("Currency Formatting", () => {
    it("should format positive currency values with dollar sign and commas", () => {
      render(
        <KPICard
          title="Income"
          value={8500}
          format="currency"
        />
      );

      expect(screen.getByText(/\$8,500\.00/)).toBeInTheDocument();
    });

    it("should format negative currency values with minus sign", () => {
      render(
        <KPICard
          title="Expenses"
          value={-3200.75}
          format="currency"
        />
      );

      // Should display negative amount
      expect(screen.getByText(/-\$3,200\.75/)).toBeInTheDocument();
    });

    it("should format zero currency value", () => {
      render(
        <KPICard
          title="Net"
          value={0}
          format="currency"
        />
      );

      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });

    it("should handle large currency values", () => {
      render(
        <KPICard
          title="Total"
          value={1234567.89}
          format="currency"
        />
      );

      expect(screen.getByText(/\$1,234,567\.89/)).toBeInTheDocument();
    });
  });

  describe("Percentage Formatting", () => {
    it("should format percentage values with percent sign", () => {
      render(
        <KPICard
          title="Change"
          value={12.5}
          format="percentage"
        />
      );

      expect(screen.getByText(/12\.5%/)).toBeInTheDocument();
    });

    it("should format negative percentage values", () => {
      render(
        <KPICard
          title="Change"
          value={-5.25}
          format="percentage"
        />
      );

      // Component formats to 1 decimal place: -5.25 becomes -5.3%
      expect(screen.getByText(/-5\.3%/)).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display skeleton loader when loading", () => {
      render(
        <KPICard
          title="Net Cash Flow"
          value={0}
          format="currency"
          isLoading={true}
        />
      );

      // Title should still be visible
      expect(screen.getByText("Net Cash Flow")).toBeInTheDocument();

      // Value should be replaced with skeleton
      expect(screen.getByTestId("kpi-skeleton")).toBeInTheDocument();
      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it("should hide trend indicator when loading", () => {
      render(
        <KPICard
          title="Balance"
          value={1000}
          format="currency"
          trend="up"
          trendValue={5}
          isLoading={true}
        />
      );

      expect(screen.queryByTestId("trend-indicator")).not.toBeInTheDocument();
    });
  });

  describe("Empty/Null States", () => {
    it("should display dash or placeholder for null value", () => {
      render(
        <KPICard
          title="Largest Expense"
          value={null}
          format="currency"
        />
      );

      // Should show placeholder text instead of null
      expect(screen.getByText(/—|N\/A|No data/i)).toBeInTheDocument();
    });

    it("should display zero value correctly (not as empty)", () => {
      render(
        <KPICard
          title="Net Cash Flow"
          value={0}
          format="currency"
        />
      );

      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible title with aria-label", () => {
      render(
        <KPICard
          title="Net Cash Flow"
          value={5420.5}
          format="currency"
        />
      );

      const card = screen.getByRole("article");
      expect(card).toHaveAttribute("aria-label", expect.stringContaining("Net Cash Flow"));
    });

    it("should have accessible trend description", () => {
      render(
        <KPICard
          title="Balance"
          value={10000}
          format="currency"
          trend="up"
          trendValue={12.5}
        />
      );

      // Trend should have accessible description
      const trendIndicator = screen.getByTestId("trend-indicator");
      expect(trendIndicator).toHaveAttribute("aria-label");
      expect(trendIndicator.getAttribute("aria-label")).toMatch(/increased|up/i);
    });

    it("should use semantic heading for title", () => {
      render(
        <KPICard
          title="Monthly Summary"
          value={5000}
          format="currency"
        />
      );

      // Title should be in a heading element for screen readers
      expect(
        screen.getByRole("heading", { name: /Monthly Summary/i })
      ).toBeInTheDocument();
    });
  });

  describe("Additional Info", () => {
    it("should display subtitle when provided", () => {
      render(
        <KPICard
          title="Largest Expense"
          value={-1250}
          format="currency"
          subtitle="Mortgage Payment"
        />
      );

      expect(screen.getByText("Mortgage Payment")).toBeInTheDocument();
    });

    it("should display description when provided", () => {
      render(
        <KPICard
          title="Recurring Expenses"
          value={2840}
          format="currency"
          description="Monthly recurring charges"
        />
      );

      expect(screen.getByText("Monthly recurring charges")).toBeInTheDocument();
    });
  });

  describe("Icon Support", () => {
    it("should render icon when provided", () => {
      const MockIcon = () => <svg data-testid="mock-icon" />;

      render(
        <KPICard
          title="Balance"
          value={10000}
          format="currency"
          icon={<MockIcon />}
        />
      );

      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    });
  });

  describe("Color Variants", () => {
    it("should apply positive color for positive values when specified", () => {
      render(
        <KPICard
          title="Profit"
          value={5000}
          format="currency"
          valueColor="positive"
        />
      );

      const valueElement = screen.getByTestId("kpi-value");
      expect(valueElement).toHaveClass(/text-green|text-emerald|text-mint/i);
    });

    it("should apply negative color for negative values when specified", () => {
      render(
        <KPICard
          title="Loss"
          value={-2000}
          format="currency"
          valueColor="negative"
        />
      );

      const valueElement = screen.getByTestId("kpi-value");
      expect(valueElement).toHaveClass(/text-red|text-coral|text-rose/i);
    });

    it("should apply auto color based on value sign when valueColor is auto", () => {
      const { rerender } = render(
        <KPICard
          title="Net"
          value={1000}
          format="currency"
          valueColor="auto"
        />
      );

      let valueElement = screen.getByTestId("kpi-value");
      expect(valueElement).toHaveClass(/text-green|text-emerald|text-mint/i);

      rerender(
        <KPICard
          title="Net"
          value={-1000}
          format="currency"
          valueColor="auto"
        />
      );

      valueElement = screen.getByTestId("kpi-value");
      expect(valueElement).toHaveClass(/text-red|text-coral|text-rose/i);
    });
  });
});

describe("KPICard with LargestExpense variant", () => {
  it("should render as compound component with expense details", () => {
    const expenseData = {
      amount: -1250,
      description: "Mortgage Payment",
      category: "Housing",
      date: new Date("2024-01-01"),
    };

    render(
      <KPICard
        title="Largest Expense"
        value={expenseData.amount}
        format="currency"
        subtitle={expenseData.description}
        description={`${expenseData.category} • ${expenseData.date.toLocaleDateString()}`}
      />
    );

    expect(screen.getByText("Largest Expense")).toBeInTheDocument();
    expect(screen.getByText(/-\$1,250\.00/)).toBeInTheDocument();
    expect(screen.getByText("Mortgage Payment")).toBeInTheDocument();
    expect(screen.getByText(/Housing/)).toBeInTheDocument();
  });

  it("should display placeholder when no expenses", () => {
    render(
      <KPICard
        title="Largest Expense"
        value={null}
        format="currency"
        subtitle="No expenses this period"
      />
    );

    expect(screen.getByText("Largest Expense")).toBeInTheDocument();
    expect(screen.getByText("No expenses this period")).toBeInTheDocument();
  });
});
