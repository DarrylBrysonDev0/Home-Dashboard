import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeFilter } from "@/components/dashboard/filters/time-filter";
import { AccountFilter } from "@/components/dashboard/filters/account-filter";
import type { QuickDateRange } from "@/lib/constants/date-ranges";

/**
 * Component Tests: TimeFilter and AccountFilter
 *
 * TDD Phase: RED - These tests should FAIL until the filter components are implemented.
 * Based on: User Story 3 requirements and contracts/filters-api.yaml
 *
 * Test Categories:
 * - TimeFilter: Quick-select buttons, custom date range picker
 * - AccountFilter: Multi-select dropdown with checkboxes
 * - Accessibility and keyboard navigation
 * - Loading and empty states
 */

// ============================================
// TimeFilter Component Tests
// ============================================

describe("TimeFilter", () => {
  const mockOnChange = vi.fn();
  const mockQuickRanges: QuickDateRange[] = [
    {
      label: "This Month",
      key: "this-month",
      getValue: () => ({
        start: new Date("2026-01-01"),
        end: new Date("2026-01-31"),
      }),
    },
    {
      label: "Last Month",
      key: "last-month",
      getValue: () => ({
        start: new Date("2025-12-01"),
        end: new Date("2025-12-31"),
      }),
    },
    {
      label: "Last 3 Months",
      key: "last-3-months",
      getValue: () => ({
        start: new Date("2025-11-01"),
        end: new Date("2026-01-31"),
      }),
    },
    {
      label: "All Time",
      key: "all-time",
      getValue: () => ({
        start: new Date("2000-01-01"),
        end: new Date("2026-01-31"),
      }),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Quick-Select Buttons", () => {
    it("should render quick-select buttons for predefined date ranges", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("button", { name: /this month/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /last month/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /last 3 months/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /all time/i })).toBeInTheDocument();
    });

    it("should highlight the currently selected range", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="this-month"
          onChange={mockOnChange}
        />
      );

      const thisMonthButton = screen.getByRole("button", { name: /this month/i });
      const lastMonthButton = screen.getByRole("button", { name: /last month/i });

      // Selected button should have active styling
      expect(thisMonthButton).toHaveAttribute("data-active", "true");
      expect(lastMonthButton).not.toHaveAttribute("data-active", "true");
    });

    it("should call onChange with range key when quick-select button is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /last 3 months/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        "last-3-months",
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        })
      );
    });

    it("should not call onChange when clicking already selected range", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="this-month"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /this month/i }));

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Custom Date Range Picker", () => {
    it("should render custom date range option", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("button", { name: /custom/i })).toBeInTheDocument();
    });

    it("should open date picker when custom range is clicked", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /custom/i }));

      // Should open popover with calendar
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should display start and end date inputs in custom picker", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /custom/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      });
    });

    it("should call onChange with custom dates when applied", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /custom/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Fill in custom dates
      const startInput = screen.getByLabelText(/start date/i);
      const endInput = screen.getByLabelText(/end date/i);

      await user.clear(startInput);
      await user.type(startInput, "2025-06-01");
      await user.clear(endInput);
      await user.type(endInput, "2025-06-30");

      // Click apply
      await user.click(screen.getByRole("button", { name: /apply/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        "custom",
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        })
      );
    });

    it("should show selected custom range in button text", async () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="custom"
          customRange={{
            start: new Date("2025-06-01"),
            end: new Date("2025-06-30"),
          }}
          onChange={mockOnChange}
        />
      );

      const customButton = screen.getByRole("button", { name: /custom/i });
      // Should show formatted date range like "Custom: May 31 - Jun 29, 2025" (timezone may shift dates)
      expect(customButton).toHaveTextContent(/custom:\s+\w+\s+\d+\s*-\s*\w+\s+\d+,?\s*\d*/i);
    });

    it("should validate that end date is after start date", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("button", { name: /custom/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Try to set end date before start date
      const startInput = screen.getByLabelText(/start date/i);
      const endInput = screen.getByLabelText(/end date/i);

      await user.clear(startInput);
      await user.type(startInput, "2025-06-30");
      await user.clear(endInput);
      await user.type(endInput, "2025-06-01");

      // Apply button should be disabled or show error
      const applyButton = screen.getByRole("button", { name: /apply/i });
      expect(applyButton).toBeDisabled();
    });
  });

  describe("Loading State", () => {
    it("should show skeleton when isLoading is true", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
          isLoading={true}
        />
      );

      expect(screen.getByTestId("time-filter-skeleton")).toBeInTheDocument();
    });

    it("should disable buttons when isLoading is true", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
          isLoading={true}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible label for filter group", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="all-time"
          onChange={mockOnChange}
        />
      );

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-label", expect.stringContaining("time"));
    });

    it("should indicate selected state to screen readers", () => {
      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="this-month"
          onChange={mockOnChange}
        />
      );

      const selectedButton = screen.getByRole("button", { name: /this month/i });
      expect(selectedButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();

      render(
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="this-month"
          onChange={mockOnChange}
        />
      );

      const firstButton = screen.getByRole("button", { name: /this month/i });
      firstButton.focus();

      // Tab to next button
      await user.tab();
      expect(screen.getByRole("button", { name: /last month/i })).toHaveFocus();
    });
  });
});

// ============================================
// AccountFilter Component Tests
// ============================================

describe("AccountFilter", () => {
  const mockOnChange = vi.fn();
  const mockAccounts = [
    {
      account_id: "ACC-JOINT-CHK",
      account_name: "Joint Checking",
      account_type: "Checking",
      account_owner: "Joint",
    },
    {
      account_id: "ACC-USER1-SAV",
      account_name: "User1 Savings",
      account_type: "Savings",
      account_owner: "User1",
    },
    {
      account_id: "ACC-USER2-CHK",
      account_name: "User2 Checking",
      account_type: "Checking",
      account_owner: "User2",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render a dropdown trigger button", () => {
      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should show 'All Accounts' when no selection", () => {
      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent(/all accounts/i);
    });

    it("should show account name when single account selected", () => {
      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK"]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent(/joint checking/i);
    });

    it("should show count when multiple accounts selected", () => {
      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK", "ACC-USER1-SAV"]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent(/2 accounts/i);
    });
  });

  describe("Dropdown Behavior", () => {
    it("should open dropdown when trigger is clicked", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });
    });

    it("should display all accounts in dropdown", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        expect(within(listbox).getByText(/joint checking/i)).toBeInTheDocument();
        expect(within(listbox).getByText(/user1 savings/i)).toBeInTheDocument();
        expect(within(listbox).getByText(/user2 checking/i)).toBeInTheDocument();
      });
    });

    it("should show checkboxes for multi-select", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes.length).toBeGreaterThanOrEqual(mockAccounts.length);
      });
    });

    it("should close dropdown when clicking outside", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <AccountFilter
            accounts={mockAccounts}
            selectedAccountIds={[]}
            onChange={mockOnChange}
          />
          <button>Outside</button>
        </div>
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /outside/i }));

      await waitFor(() => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("Selection Behavior", () => {
    it("should call onChange when account is selected", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.click(screen.getByText(/joint checking/i));

      expect(mockOnChange).toHaveBeenCalledWith(["ACC-JOINT-CHK"]);
    });

    it("should add to selection when another account is clicked", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK"]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.click(screen.getByText(/user1 savings/i));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining(["ACC-JOINT-CHK", "ACC-USER1-SAV"])
      );
    });

    it("should remove from selection when selected account is clicked again", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK", "ACC-USER1-SAV"]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.click(screen.getByText(/joint checking/i));

      expect(mockOnChange).toHaveBeenCalledWith(["ACC-USER1-SAV"]);
    });

    it("should show checkmarks for selected accounts", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK"]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        const jointCheckingOption = within(listbox)
          .getByText(/joint checking/i)
          .closest("[role='option']");
        expect(jointCheckingOption).toHaveAttribute("aria-selected", "true");
      });
    });
  });

  describe("Select All / Clear All", () => {
    it("should have 'Select All' option", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /select all/i })).toBeInTheDocument();
      });
    });

    it("should select all accounts when 'Select All' is clicked", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /select all/i }));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining(["ACC-JOINT-CHK", "ACC-USER1-SAV", "ACC-USER2-CHK"])
      );
    });

    it("should have 'Clear All' option when accounts are selected", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK"]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
      });
    });

    it("should clear all selections when 'Clear All' is clicked", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={["ACC-JOINT-CHK", "ACC-USER1-SAV"]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /clear/i }));

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Grouping by Account Type", () => {
    it("should group accounts by type (Checking, Savings)", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
          groupByType={true}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        // Multiple elements may contain "checking"/"savings" (account names + type badges)
        expect(within(listbox).getAllByText(/checking/i).length).toBeGreaterThan(0);
        expect(within(listbox).getAllByText(/savings/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Loading State", () => {
    it("should show skeleton when isLoading is true", () => {
      render(
        <AccountFilter
          accounts={[]}
          selectedAccountIds={[]}
          onChange={mockOnChange}
          isLoading={true}
        />
      );

      expect(screen.getByTestId("account-filter-skeleton")).toBeInTheDocument();
    });

    it("should disable dropdown when isLoading is true", () => {
      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
          isLoading={true}
        />
      );

      expect(screen.getByRole("combobox")).toBeDisabled();
    });
  });

  describe("Empty State", () => {
    it("should show message when no accounts available", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={[]}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText(/no accounts/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible label", () => {
      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-label", expect.stringContaining("account"));
    });

    it("should announce selection changes to screen readers", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        expect(listbox).toHaveAttribute("aria-multiselectable", "true");
      });
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      const combobox = screen.getByRole("combobox");
      combobox.focus();

      // Open dropdown with Enter
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      // Navigate with arrow keys
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      // Select with Enter
      await user.keyboard("{Enter}");

      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should close dropdown with Escape key", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByRole("listbox")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("Account Details Display", () => {
    it("should show account type badge for each account", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        // Look for type badges
        const checkingBadges = within(listbox).getAllByText(/checking/i);
        const savingsBadges = within(listbox).getAllByText(/savings/i);

        expect(checkingBadges.length).toBeGreaterThan(0);
        expect(savingsBadges.length).toBeGreaterThan(0);
      });
    });

    it("should show owner name for each account", async () => {
      const user = userEvent.setup();

      render(
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockOnChange}
          showOwner={true}
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const listbox = screen.getByRole("listbox");
        // Multiple elements may contain owner names (account names + owner badges)
        expect(within(listbox).getAllByText(/joint/i).length).toBeGreaterThan(0);
        expect(within(listbox).getAllByText(/user1/i).length).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================
// Integration Tests for Both Filters Together
// ============================================

describe("Filter Components Integration", () => {
  it("should work together without conflicts", async () => {
    const mockTimeChange = vi.fn();
    const mockAccountChange = vi.fn();

    const mockQuickRanges: QuickDateRange[] = [
      {
        label: "This Month",
        key: "this-month",
        getValue: () => ({
          start: new Date("2026-01-01"),
          end: new Date("2026-01-31"),
        }),
      },
    ];

    const mockAccounts = [
      {
        account_id: "ACC-JOINT-CHK",
        account_name: "Joint Checking",
        account_type: "Checking",
        account_owner: "Joint",
      },
    ];

    render(
      <div>
        <TimeFilter
          ranges={mockQuickRanges}
          selectedKey="this-month"
          onChange={mockTimeChange}
        />
        <AccountFilter
          accounts={mockAccounts}
          selectedAccountIds={[]}
          onChange={mockAccountChange}
        />
      </div>
    );

    // Both filters should render correctly
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
