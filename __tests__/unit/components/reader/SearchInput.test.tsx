/**
 * Unit tests for SearchInput component
 *
 * Tests the search input with debounced search functionality,
 * loading states, and clear functionality.
 *
 * @see specs/005-markdown-reader/spec.md User Story 5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SearchInput } from "@/components/reader/navigation/SearchInput";

describe("SearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("should render search input with placeholder", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search/i);
      expect(input).toBeInTheDocument();
    });

    it("should render search icon", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const icon = screen.getByTestId("search-icon");
      expect(icon).toBeInTheDocument();
    });

    it("should accept custom placeholder", () => {
      render(<SearchInput onSearch={vi.fn()} placeholder="Find files..." />);

      const input = screen.getByPlaceholderText("Find files...");
      expect(input).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<SearchInput onSearch={vi.fn()} className="custom-class" />);

      const container = screen.getByTestId("search-input-container");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("Input Handling", () => {
    it("should update input value on change", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });

      expect(input).toHaveValue("test");
    });

    it("should call onSearch with debounced value", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });

      // Should not call immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Advance timers past debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onSearch).toHaveBeenCalledWith("test");
    });

    it("should debounce multiple rapid inputs", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByRole("searchbox");

      // Type character by character with small delays
      fireEvent.change(input, { target: { value: "t" } });
      await act(async () => { vi.advanceTimersByTime(100); });
      fireEvent.change(input, { target: { value: "te" } });
      await act(async () => { vi.advanceTimersByTime(100); });
      fireEvent.change(input, { target: { value: "tes" } });
      await act(async () => { vi.advanceTimersByTime(100); });
      fireEvent.change(input, { target: { value: "test" } });

      // Should not have called yet (still within debounce)
      expect(onSearch).not.toHaveBeenCalled();

      // Wait for debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Should only call once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("test");
    });

    it("should use default debounce of 300ms", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });

      // Not called before 300ms
      await act(async () => { vi.advanceTimersByTime(299); });
      expect(onSearch).not.toHaveBeenCalled();

      // Called after 300ms
      await act(async () => { vi.advanceTimersByTime(1); });
      expect(onSearch).toHaveBeenCalledWith("test");
    });
  });

  describe("Clear Button", () => {
    it("should not show clear button when input is empty", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    });

    it("should show clear button when input has value", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });

      expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
    });

    it("should clear input when clear button is clicked", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });

      const clearButton = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearButton);

      expect(input).toHaveValue("");
    });

    it("should call onClear callback when clear button is clicked", () => {
      const onClear = vi.fn();
      render(<SearchInput onSearch={vi.fn()} onClear={onClear} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });

      const clearButton = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearButton);

      expect(onClear).toHaveBeenCalled();
    });

    it("should call onSearch with empty string when cleared", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      // Reset mock to track clear action
      onSearch.mockClear();

      const clearButton = screen.getByRole("button", { name: /clear/i });
      fireEvent.click(clearButton);

      // Should call immediately without debounce
      expect(onSearch).toHaveBeenCalledWith("");
    });
  });

  describe("Loading State", () => {
    it("should show loading indicator when isLoading is true", () => {
      render(<SearchInput onSearch={vi.fn()} isLoading />);

      expect(screen.getByTestId("search-loading")).toBeInTheDocument();
    });

    it("should hide search icon when loading", () => {
      render(<SearchInput onSearch={vi.fn()} isLoading />);

      expect(screen.queryByTestId("search-icon")).not.toBeInTheDocument();
    });

    it("should show search icon when not loading", () => {
      render(<SearchInput onSearch={vi.fn()} isLoading={false} />);

      expect(screen.getByTestId("search-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("search-loading")).not.toBeInTheDocument();
    });
  });

  describe("Controlled Value", () => {
    it("should accept initial value prop", () => {
      render(<SearchInput onSearch={vi.fn()} value="initial" />);

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("initial");
    });

    it("should update when value prop changes", () => {
      const { rerender } = render(<SearchInput onSearch={vi.fn()} value="initial" />);

      const input = screen.getByRole("searchbox");
      expect(input).toHaveValue("initial");

      rerender(<SearchInput onSearch={vi.fn()} value="updated" />);
      expect(input).toHaveValue("updated");
    });
  });

  describe("Accessibility", () => {
    it("should have proper role", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });

    it("should have aria-label", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByRole("searchbox");
      expect(input).toHaveAttribute("aria-label");
    });

    it("should be focusable", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByRole("searchbox");
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it("should clear search with Escape key", () => {
      render(<SearchInput onSearch={vi.fn()} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyDown(input, { key: "Escape" });

      expect(input).toHaveValue("");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<SearchInput onSearch={vi.fn()} disabled />);

      const input = screen.getByRole("searchbox");
      expect(input).toBeDisabled();
    });

    it("should not call onSearch when disabled", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} disabled />);

      const input = screen.getByRole("searchbox");

      // Try to type (should be blocked by browser)
      fireEvent.change(input, { target: { value: "test" } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string search", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "test" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      onSearch.mockClear();

      // Clear the input
      fireEvent.change(input, { target: { value: "" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(onSearch).toHaveBeenCalledWith("");
    });

    it("should handle whitespace-only input", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByRole("searchbox");
      fireEvent.change(input, { target: { value: "   " } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(onSearch).toHaveBeenCalledWith("   ");
    });

    it("should handle very long input", async () => {
      const onSearch = vi.fn();
      render(<SearchInput onSearch={onSearch} />);

      const input = screen.getByRole("searchbox");
      const longText = "a".repeat(1000);

      fireEvent.change(input, { target: { value: longText } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(onSearch).toHaveBeenCalledWith(longText);
    });
  });
});
