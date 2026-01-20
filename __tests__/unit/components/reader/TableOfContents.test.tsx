/**
 * Unit tests for TableOfContents component
 *
 * Tests the auto-generated table of contents that displays document headings
 * with click-to-scroll navigation.
 *
 * @see specs/005-markdown-reader/spec.md User Story 4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableOfContents } from "@/components/reader/content/TableOfContents";
import type { DocumentHeading } from "@/types/reader";

// Mock smooth scrolling
const mockScrollIntoView = vi.fn();

describe("TableOfContents", () => {
  beforeEach(() => {
    // Reset DOM and mocks
    document.body.innerHTML = "";
    mockScrollIntoView.mockClear();

    // Mock getElementById to return elements with scrollIntoView
    vi.spyOn(document, "getElementById").mockImplementation((id) => {
      const element = document.createElement("div");
      element.id = id;
      element.scrollIntoView = mockScrollIntoView;
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleHeadings: DocumentHeading[] = [
    { id: "introduction", text: "Introduction", level: 1 },
    { id: "getting-started", text: "Getting Started", level: 2 },
    { id: "installation", text: "Installation", level: 3 },
    { id: "configuration", text: "Configuration", level: 3 },
    { id: "usage", text: "Usage", level: 2 },
    { id: "api-reference", text: "API Reference", level: 1 },
  ];

  describe("Rendering", () => {
    it("should render all headings", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      expect(screen.getByText("Introduction")).toBeInTheDocument();
      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("Installation")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
      expect(screen.getByText("Usage")).toBeInTheDocument();
      expect(screen.getByText("API Reference")).toBeInTheDocument();
    });

    it("should render with hierarchical indentation based on heading level", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      // Check that the component renders with the correct structure
      const container = screen.getByTestId("table-of-contents");
      expect(container).toBeInTheDocument();

      // Level 1 headings should not be indented
      const h1Items = screen.getAllByRole("listitem").filter((item) => {
        const link = item.querySelector('a[data-level="1"]');
        return link !== null;
      });
      expect(h1Items).toHaveLength(2);

      // Level 2 headings should be indented
      const h2Items = screen.getAllByRole("listitem").filter((item) => {
        const link = item.querySelector('a[data-level="2"]');
        return link !== null;
      });
      expect(h2Items).toHaveLength(2);

      // Level 3 headings should be more indented
      const h3Items = screen.getAllByRole("listitem").filter((item) => {
        const link = item.querySelector('a[data-level="3"]');
        return link !== null;
      });
      expect(h3Items).toHaveLength(2);
    });

    it("should render a title", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      expect(screen.getByText("On this page")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(
        <TableOfContents headings={sampleHeadings} className="custom-class" />
      );

      const container = screen.getByTestId("table-of-contents");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("Empty state", () => {
    it("should show empty state when headings array is empty", () => {
      render(<TableOfContents headings={[]} />);

      expect(screen.getByText("No headings found")).toBeInTheDocument();
    });

    it("should not render list when headings array is empty", () => {
      render(<TableOfContents headings={[]} />);

      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should scroll to section when heading is clicked", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      const introLink = screen.getByText("Introduction");
      fireEvent.click(introLink);

      expect(document.getElementById).toHaveBeenCalledWith("introduction");
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });

    it("should render links with correct href attributes", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      const introLink = screen.getByText("Introduction").closest("a");
      expect(introLink).toHaveAttribute("href", "#introduction");

      const gettingStartedLink = screen
        .getByText("Getting Started")
        .closest("a");
      expect(gettingStartedLink).toHaveAttribute("href", "#getting-started");
    });

    it("should handle missing element gracefully", () => {
      vi.spyOn(document, "getElementById").mockReturnValue(null);

      render(<TableOfContents headings={sampleHeadings} />);

      const introLink = screen.getByText("Introduction");

      // Should not throw when clicking a link to non-existent element
      expect(() => fireEvent.click(introLink)).not.toThrow();
    });

    it("should call onHeadingClick callback when provided", () => {
      const onHeadingClick = vi.fn();
      render(
        <TableOfContents
          headings={sampleHeadings}
          onHeadingClick={onHeadingClick}
        />
      );

      const introLink = screen.getByText("Introduction");
      fireEvent.click(introLink);

      expect(onHeadingClick).toHaveBeenCalledWith("introduction");
    });
  });

  describe("Active heading highlighting", () => {
    it("should highlight active heading when activeHeadingId is provided", () => {
      render(
        <TableOfContents
          headings={sampleHeadings}
          activeHeadingId="getting-started"
        />
      );

      const activeLink = screen.getByText("Getting Started").closest("a");
      expect(activeLink).toHaveAttribute("data-active", "true");
    });

    it("should not highlight any heading when activeHeadingId is not provided", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      const allLinks = screen.getAllByRole("link");
      allLinks.forEach((link) => {
        expect(link).not.toHaveAttribute("data-active", "true");
      });
    });

    it("should update active heading when activeHeadingId changes", () => {
      const { rerender } = render(
        <TableOfContents
          headings={sampleHeadings}
          activeHeadingId="introduction"
        />
      );

      let activeLink = screen.getByText("Introduction").closest("a");
      expect(activeLink).toHaveAttribute("data-active", "true");

      rerender(
        <TableOfContents headings={sampleHeadings} activeHeadingId="usage" />
      );

      activeLink = screen.getByText("Usage").closest("a");
      expect(activeLink).toHaveAttribute("data-active", "true");

      const introLink = screen.getByText("Introduction").closest("a");
      expect(introLink).not.toHaveAttribute("data-active", "true");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA landmark", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Table of contents");
    });

    it("should have proper list structure", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(6);
    });

    it("should have keyboard navigable links", () => {
      render(<TableOfContents headings={sampleHeadings} />);

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });

  describe("Collapsible behavior", () => {
    it("should render collapsed by default on narrow viewports when collapsible is true", () => {
      render(<TableOfContents headings={sampleHeadings} collapsible />);

      const container = screen.getByTestId("table-of-contents");
      expect(container).toHaveAttribute("data-collapsible", "true");
    });

    it("should toggle visibility when collapse button is clicked", () => {
      render(<TableOfContents headings={sampleHeadings} collapsible />);

      const toggleButton = screen.getByRole("button", {
        name: /toggle table of contents/i,
      });
      expect(toggleButton).toBeInTheDocument();

      // Initially visible
      expect(screen.getByRole("list")).toBeVisible();

      // Click to collapse
      fireEvent.click(toggleButton);

      // Check that collapsed state is applied
      const container = screen.getByTestId("table-of-contents");
      expect(container).toHaveAttribute("data-collapsed", "true");
    });
  });

  describe("Long heading text", () => {
    it("should truncate long heading text with ellipsis", () => {
      const longHeadings: DocumentHeading[] = [
        {
          id: "long-heading",
          text: "This is a very long heading that should be truncated when displayed in the table of contents",
          level: 1,
        },
      ];

      render(<TableOfContents headings={longHeadings} />);

      const link = screen.getByRole("link");
      // The link should have truncation styling
      expect(link).toHaveClass("truncate");
    });
  });
});
