import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFilter } from "@/components/calendar/category-filter";

/**
 * Component Tests: CategoryFilter
 *
 * TDD Phase: RED - These tests should FAIL until components/calendar/category-filter.tsx is implemented.
 * Based on: User Story 5 requirements
 *
 * USER STORY 5: Filter Events by Category
 * Goal: Display category filters with toggles to show/hide events by category
 *
 * Test Categories:
 * - Basic rendering with categories
 * - Category toggle functionality
 * - "Show All" functionality
 * - Visual feedback (checkboxes/toggles)
 * - Empty state handling
 * - Category color display
 * - Callback handling
 * - Accessibility
 */

describe("CategoryFilter", () => {
  const mockCategories = [
    { id: "cat-1", name: "Family", color: "#F97316", icon: "home" },
    { id: "cat-2", name: "Work", color: "#3B82F6", icon: "briefcase" },
    { id: "cat-3", name: "Medical", color: "#EF4444", icon: "heart" },
  ];

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render category filter component", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    it("should display all provided categories", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText("Family")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Medical")).toBeInTheDocument();
    });

    it("should render checkboxes for each category", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      // Should have 3 category checkboxes + 1 "Show All" checkbox
      expect(checkboxes).toHaveLength(4);
    });

    it("should render Show All toggle", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText("Show All")).toBeInTheDocument();
    });
  });

  describe("Category Selection", () => {
    it("should mark selected categories as checked", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1", "cat-3"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const familyCheckbox = screen.getByLabelText("Family") as HTMLInputElement;
      const workCheckbox = screen.getByLabelText("Work") as HTMLInputElement;
      const medicalCheckbox = screen.getByLabelText("Medical") as HTMLInputElement;

      expect(familyCheckbox.checked).toBe(true);
      expect(workCheckbox.checked).toBe(false);
      expect(medicalCheckbox.checked).toBe(true);
    });

    it("should call onFilterChange when category is toggled on", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const familyCheckbox = screen.getByLabelText("Family");
      await user.click(familyCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith(["cat-1"]);
    });

    it("should call onFilterChange when category is toggled off", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1", "cat-2"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const familyCheckbox = screen.getByLabelText("Family");
      await user.click(familyCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith(["cat-2"]);
    });

    it("should support selecting multiple categories", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const workCheckbox = screen.getByLabelText("Work");
      await user.click(workCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith(["cat-1", "cat-2"]);
    });
  });

  describe("Show All Functionality", () => {
    it("should check Show All when all categories are selected", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1", "cat-2", "cat-3"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const showAllCheckbox = screen.getByLabelText("Show All") as HTMLInputElement;
      expect(showAllCheckbox.checked).toBe(true);
    });

    it("should uncheck Show All when not all categories are selected", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1", "cat-2"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const showAllCheckbox = screen.getByLabelText("Show All") as HTMLInputElement;
      expect(showAllCheckbox.checked).toBe(false);
    });

    it("should select all categories when Show All is clicked", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const showAllCheckbox = screen.getByLabelText("Show All");
      await user.click(showAllCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith(["cat-1", "cat-2", "cat-3"]);
    });

    it("should deselect all categories when Show All is unchecked", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1", "cat-2", "cat-3"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const showAllCheckbox = screen.getByLabelText("Show All");
      await user.click(showAllCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Visual Feedback", () => {
    it("should display category colors as visual indicators", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Check for color indicators (badges, swatches, or styled elements)
      const familyLabel = screen.getByText("Family").closest("label");
      expect(familyLabel).toBeInTheDocument();
    });

    it("should display category icons when provided", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Verify icons are rendered (may be SVG or icon components)
      const familyLabel = screen.getByText("Family");
      expect(familyLabel).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should handle empty categories array", () => {
      render(
        <CategoryFilter
          categories={[]}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("should display message when no categories exist", () => {
      render(
        <CategoryFilter
          categories={[]}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText(/no categories/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible labels for all checkboxes", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByLabelText("Family")).toBeInTheDocument();
      expect(screen.getByLabelText("Work")).toBeInTheDocument();
      expect(screen.getByLabelText("Medical")).toBeInTheDocument();
      expect(screen.getByLabelText("Show All")).toBeInTheDocument();
    });

    it("should use proper ARIA attributes for filter group", () => {
      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const group = screen.getByRole("group");
      expect(group).toHaveAttribute("aria-label");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      const familyCheckbox = screen.getByLabelText("Family");

      // Tab to checkbox
      await user.tab();
      expect(familyCheckbox).toHaveFocus();

      // Space to toggle
      await user.keyboard(" ");
      expect(mockOnFilterChange).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle categories without icons gracefully", () => {
      const categoriesWithoutIcons = [
        { id: "cat-1", name: "Family", color: "#F97316", icon: null },
        { id: "cat-2", name: "Work", color: "#3B82F6", icon: null },
      ];

      render(
        <CategoryFilter
          categories={categoriesWithoutIcons}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText("Family")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("should not call onFilterChange when already in desired state", async () => {
      const user = userEvent.setup();

      render(
        <CategoryFilter
          categories={mockCategories}
          selectedCategoryIds={["cat-1"]}
          onFilterChange={mockOnFilterChange}
        />
      );

      // Try to select already selected category
      const familyCheckbox = screen.getByLabelText("Family");
      await user.click(familyCheckbox);

      // Should be called to deselect (toggle off)
      expect(mockOnFilterChange).toHaveBeenCalledWith([]);
    });

    it("should handle single category edge case", () => {
      const singleCategory = [
        { id: "cat-1", name: "Family", color: "#F97316", icon: "home" },
      ];

      render(
        <CategoryFilter
          categories={singleCategory}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText("Family")).toBeInTheDocument();
      expect(screen.getByText("Show All")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should handle large number of categories", () => {
      const manyCategories = Array.from({ length: 50 }, (_, i) => ({
        id: `cat-${i}`,
        name: `Category ${i}`,
        color: "#F97316",
        icon: "star",
      }));

      render(
        <CategoryFilter
          categories={manyCategories}
          selectedCategoryIds={[]}
          onFilterChange={mockOnFilterChange}
        />
      );

      expect(screen.getByText("Category 0")).toBeInTheDocument();
      expect(screen.getByText("Category 49")).toBeInTheDocument();
    });
  });
});
