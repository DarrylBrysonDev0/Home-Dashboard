import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { UpcomingEvents } from "@/components/home/upcoming-events";

/**
 * Component Tests: UpcomingEvents
 *
 * TDD Phase: RED - These tests should FAIL until components/home/upcoming-events.tsx is implemented.
 * Based on: User Story 6 requirements and data-model.md interface
 *
 * Test Categories:
 * - Loading state
 * - Empty state (no events, CTA to create)
 * - Error state (API failure, no retry button per spec)
 * - Data state (displays EventCardMini components)
 * - Props handling (maxEvents, daysAhead)
 * - Mobile scroll behavior
 * - Accessibility
 *
 * Interface (from data-model.md):
 * export interface UpcomingEventsProps {
 *   maxEvents?: number; // Default: 3
 *   daysAhead?: number; // Default: 7
 *   className?: string;
 * }
 */

// Mock next/link for navigation testing
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

// Mock EventCardMini component
vi.mock("@/components/home/event-card-mini", () => ({
  EventCardMini: ({ event }: { event: { id: string; title: string } }) => (
    <div data-testid={`event-card-mini-${event.id}`}>{event.title}</div>
  ),
}));

// Mock data for tests
const mockEvents = [
  {
    id: "event-1",
    title: "Team Meeting",
    startTime: "2026-01-15T14:00:00.000Z",
    location: "Conference Room A",
  },
  {
    id: "event-2",
    title: "Doctor Appointment",
    startTime: "2026-01-16T10:30:00.000Z",
    location: null,
  },
  {
    id: "event-3",
    title: "Birthday Party",
    startTime: "2026-01-17T18:00:00.000Z",
    location: "123 Main Street",
  },
];

describe("UpcomingEvents", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading state while fetching events", async () => {
      // Create a promise that won't resolve immediately
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      render(<UpcomingEvents />);

      // Should show loading indicator
      expect(screen.getByTestId("upcoming-events-loading")).toBeInTheDocument();
    });

    it("should show loading skeletons for event cards", async () => {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      render(<UpcomingEvents />);

      // Should show skeleton placeholders
      const skeletons = screen.getAllByTestId(/event-skeleton/);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should hide loading state after data loads", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.queryByTestId("upcoming-events-loading")).not.toBeInTheDocument();
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no events are returned", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByTestId("upcoming-events-empty")).toBeInTheDocument();
      });
    });

    it("should show appropriate empty message", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument();
      });
    });

    it("should show link to create new event", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const createLink = screen.getByRole("link", { name: /create|add|schedule/i });
        expect(createLink).toHaveAttribute("href", "/calendar?create=true");
      });
    });

    it("should display calendar icon or illustration in empty state", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const emptyState = screen.getByTestId("upcoming-events-empty");
        expect(emptyState).toBeInTheDocument();
        // Should have some visual element (icon or illustration)
        const icon = emptyState.querySelector("svg") || screen.queryByTestId("empty-state-icon");
        expect(icon).toBeTruthy();
      });
    });
  });

  describe("Error State", () => {
    it("should show error state when API fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Unable to load upcoming events. Please try again." }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByTestId("upcoming-events-error")).toBeInTheDocument();
      });
    });

    it("should display error message from API", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Unable to load upcoming events. Please try again." }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
      });
    });

    it("should NOT show retry button (per spec clarification)", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Unable to load upcoming events. Please try again." }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByTestId("upcoming-events-error")).toBeInTheDocument();
      });

      // Should NOT have a retry button per spec clarification
      expect(screen.queryByRole("button", { name: /retry|try again/i })).not.toBeInTheDocument();
    });

    it("should handle network error gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByTestId("upcoming-events-error")).toBeInTheDocument();
      });
    });
  });

  describe("Data State", () => {
    it("should render EventCardMini for each event", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByTestId("event-card-mini-event-1")).toBeInTheDocument();
        expect(screen.getByTestId("event-card-mini-event-2")).toBeInTheDocument();
        expect(screen.getByTestId("event-card-mini-event-3")).toBeInTheDocument();
      });
    });

    it("should display event titles", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByText("Team Meeting")).toBeInTheDocument();
        expect(screen.getByText("Doctor Appointment")).toBeInTheDocument();
        expect(screen.getByText("Birthday Party")).toBeInTheDocument();
      });
    });

    it("should apply data-testid to container", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByTestId("upcoming-events")).toBeInTheDocument();
      });
    });
  });

  describe("Props Handling", () => {
    it("should use default maxEvents=3 when not specified", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/limit=3/)
        );
      });
    });

    it("should use default daysAhead=7 when not specified", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/days=7/)
        );
      });
    });

    it("should use custom maxEvents when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents.slice(0, 5) }),
      });

      render(<UpcomingEvents maxEvents={5} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/limit=5/)
        );
      });
    });

    it("should use custom daysAhead when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents daysAhead={14} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/days=14/)
        );
      });
    });

    it("should apply custom className when provided", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents className="custom-class" />);

      await waitFor(() => {
        const container = screen.getByTestId("upcoming-events");
        expect(container).toHaveClass("custom-class");
      });
    });
  });

  describe("API Call", () => {
    it("should call correct API endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/events/upcoming")
        );
      });
    });

    it("should include both limit and days in query params", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<UpcomingEvents maxEvents={5} daysAhead={14} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/limit=5.*days=14|days=14.*limit=5/)
        );
      });
    });
  });

  describe("Section Header", () => {
    it("should display section title", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        expect(screen.getByText(/upcoming|events|this week/i)).toBeInTheDocument();
      });
    });

    it("should have link to view all events in calendar", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const viewAllLink = screen.getByRole("link", { name: /view all|see all|calendar/i });
        expect(viewAllLink).toHaveAttribute("href", "/calendar");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible section landmark", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const section = screen.getByRole("region") || screen.getByTestId("upcoming-events");
        expect(section).toBeInTheDocument();
      });
    });

    it("should have descriptive aria-label on container", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const container = screen.getByTestId("upcoming-events");
        const ariaLabel = container.getAttribute("aria-label");
        expect(ariaLabel).toMatch(/upcoming|events/i);
      });
    });

    it("should announce loading state to screen readers", async () => {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValue(fetchPromise);

      render(<UpcomingEvents />);

      const loadingElement = screen.getByTestId("upcoming-events-loading");
      // Should have aria-live or role="status" for screen reader announcement
      expect(
        loadingElement.getAttribute("aria-live") ||
        loadingElement.getAttribute("role")
      ).toBeTruthy();
    });

    it("should announce error state to screen readers", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Error" }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const errorElement = screen.getByTestId("upcoming-events-error");
        // Should have aria-live="assertive" or role="alert" for error
        expect(
          errorElement.getAttribute("aria-live") === "assertive" ||
          errorElement.getAttribute("role") === "alert"
        ).toBe(true);
      });
    });
  });

  describe("Mobile Scroll Behavior", () => {
    it("should have horizontal scroll container classes for mobile", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const container = screen.getByTestId("upcoming-events-list");
        // Should have overflow and scroll snap classes
        expect(container.className).toMatch(/overflow-x|scroll|snap/);
      });
    });

    it("should have snap points on event cards", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockEvents }),
      });

      render(<UpcomingEvents />);

      await waitFor(() => {
        const container = screen.getByTestId("upcoming-events-list");
        // Container should have snap behavior classes
        expect(container.className).toMatch(/snap-x|snap-mandatory/);
      });
    });
  });
});

describe("UpcomingEvents with Single Event", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render single event correctly", async () => {
    const singleEvent = [mockEvents[0]];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: singleEvent }),
    });

    render(<UpcomingEvents />);

    await waitFor(() => {
      expect(screen.getByTestId("event-card-mini-event-1")).toBeInTheDocument();
      expect(screen.queryByTestId("event-card-mini-event-2")).not.toBeInTheDocument();
    });
  });
});

describe("UpcomingEvents Edge Cases", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle malformed API response gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ wrong: "shape" }),
    });

    render(<UpcomingEvents />);

    await waitFor(() => {
      // Should show error or empty state, not crash
      const container = screen.getByTestId("upcoming-events");
      expect(container).toBeInTheDocument();
    });
  });

  it("should handle API returning null data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    });

    render(<UpcomingEvents />);

    await waitFor(() => {
      // Should show empty state or handle gracefully
      expect(
        screen.getByTestId("upcoming-events-empty") ||
        screen.getByTestId("upcoming-events")
      ).toBeInTheDocument();
    });
  });

  it("should handle 401 unauthorized error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    render(<UpcomingEvents />);

    await waitFor(() => {
      expect(screen.getByTestId("upcoming-events-error")).toBeInTheDocument();
    });
  });

  it("should handle 400 bad request error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Invalid query parameters" }),
    });

    render(<UpcomingEvents />);

    await waitFor(() => {
      expect(screen.getByTestId("upcoming-events-error")).toBeInTheDocument();
    });
  });
});
