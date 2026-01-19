import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCardMini } from "@/components/home/event-card-mini";

/**
 * Component Tests: EventCardMini
 *
 * TDD Phase: RED - These tests should FAIL until components/home/event-card-mini.tsx is implemented.
 * Based on: User Story 6 requirements and data-model.md interface
 *
 * Test Categories:
 * - Basic rendering (title, date/time, location)
 * - Date/time formatting
 * - Optional location handling
 * - Navigation behavior (link to calendar event)
 * - Accessibility
 * - Styling and visual design
 *
 * Interface (from data-model.md):
 * export interface UpcomingEvent {
 *   id: string;
 *   title: string;
 *   startTime: Date;
 *   location?: string | null;
 * }
 *
 * export interface EventCardMiniProps {
 *   event: UpcomingEvent;
 *   className?: string;
 * }
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

describe("EventCardMini", () => {
  const baseEvent = {
    id: "event-123",
    title: "Team Meeting",
    startTime: new Date("2026-01-15T14:00:00.000Z"),
    location: "Conference Room A",
  };

  describe("Basic Rendering", () => {
    it("should render event title", () => {
      render(<EventCardMini event={baseEvent} />);

      expect(screen.getByText("Team Meeting")).toBeInTheDocument();
    });

    it("should render event location when provided", () => {
      render(<EventCardMini event={baseEvent} />);

      expect(screen.getByText("Conference Room A")).toBeInTheDocument();
    });

    it("should not render location element when location is null", () => {
      const eventWithoutLocation = {
        ...baseEvent,
        location: null,
      };

      render(<EventCardMini event={eventWithoutLocation} />);

      expect(screen.queryByTestId("event-location")).not.toBeInTheDocument();
    });

    it("should not render location element when location is undefined", () => {
      const eventWithoutLocation = {
        id: "event-456",
        title: "Quick Sync",
        startTime: new Date("2026-01-16T10:00:00.000Z"),
      };

      render(<EventCardMini event={eventWithoutLocation} />);

      expect(screen.queryByTestId("event-location")).not.toBeInTheDocument();
    });

    it("should apply data-testid for E2E testing", () => {
      render(<EventCardMini event={baseEvent} />);

      expect(screen.getByTestId("event-card-mini")).toBeInTheDocument();
    });

    it("should apply custom className when provided", () => {
      render(<EventCardMini event={baseEvent} className="custom-class" />);

      const card = screen.getByTestId("event-card-mini");
      expect(card).toHaveClass("custom-class");
    });
  });

  describe("Date/Time Display", () => {
    it("should display formatted date", () => {
      render(<EventCardMini event={baseEvent} />);

      // Should show the date in a readable format
      // Exact format may vary, but should contain month and day
      const dateElement = screen.getByTestId("event-date");
      expect(dateElement).toBeInTheDocument();
    });

    it("should display formatted time", () => {
      render(<EventCardMini event={baseEvent} />);

      // Should show time in a readable format
      const timeElement = screen.getByTestId("event-time");
      expect(timeElement).toBeInTheDocument();
    });

    it("should handle today's date with appropriate labeling", () => {
      const todayEvent = {
        ...baseEvent,
        startTime: new Date(), // Today
      };

      render(<EventCardMini event={todayEvent} />);

      // Should indicate it's today or show today's date
      const dateElement = screen.getByTestId("event-date");
      expect(dateElement).toBeInTheDocument();
    });

    it("should handle tomorrow's date with appropriate labeling", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tomorrowEvent = {
        ...baseEvent,
        startTime: tomorrow,
      };

      render(<EventCardMini event={tomorrowEvent} />);

      const dateElement = screen.getByTestId("event-date");
      expect(dateElement).toBeInTheDocument();
    });
  });

  describe("Navigation Behavior", () => {
    it("should render as a link to the calendar event", () => {
      render(<EventCardMini event={baseEvent} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/calendar?event=event-123");
    });

    it("should navigate to correct event ID", () => {
      const differentEvent = {
        ...baseEvent,
        id: "event-different-456",
      };

      render(<EventCardMini event={differentEvent} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/calendar?event=event-different-456");
    });
  });

  describe("Accessibility", () => {
    it("should be focusable via keyboard", () => {
      render(<EventCardMini event={baseEvent} />);

      const link = screen.getByRole("link");
      link.focus();
      expect(link).toHaveFocus();
    });

    it("should have accessible name", () => {
      render(<EventCardMini event={baseEvent} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAccessibleName();
    });

    it("should have descriptive aria-label including event title", () => {
      render(<EventCardMini event={baseEvent} />);

      const link = screen.getByRole("link");
      const ariaLabel = link.getAttribute("aria-label");
      expect(ariaLabel).toMatch(/Team Meeting/i);
    });

    it("should have proper focus-visible styling classes", () => {
      render(<EventCardMini event={baseEvent} />);

      const card = screen.getByTestId("event-card-mini");
      expect(card.className).toMatch(/focus|outline|ring/);
    });
  });

  describe("Visual Design", () => {
    it("should have compact card styling", () => {
      render(<EventCardMini event={baseEvent} />);

      const card = screen.getByTestId("event-card-mini");
      // Should have card-like styling
      expect(card.className).toMatch(/rounded|border|shadow|bg/);
    });

    it("should have hover effect classes", () => {
      render(<EventCardMini event={baseEvent} />);

      const card = screen.getByTestId("event-card-mini");
      expect(card.className).toMatch(/hover|transition/);
    });

    it("should display title prominently", () => {
      render(<EventCardMini event={baseEvent} />);

      const title = screen.getByText("Team Meeting");
      // Title should be styled as heading or prominent text
      expect(title.className).toMatch(/font-medium|font-semibold|text-base|text-sm/);
    });

    it("should display date/time in muted style", () => {
      render(<EventCardMini event={baseEvent} />);

      const dateElement = screen.getByTestId("event-date");
      expect(dateElement.className).toMatch(/text-muted|text-sm|text-gray/);
    });

    it("should display location in muted style when present", () => {
      render(<EventCardMini event={baseEvent} />);

      const locationElement = screen.getByTestId("event-location");
      expect(locationElement.className).toMatch(/text-muted|text-sm|text-gray/);
    });
  });

  describe("Icon Display", () => {
    it("should display calendar or clock icon for date/time", () => {
      render(<EventCardMini event={baseEvent} />);

      // Should have an icon element
      const icon = screen.getByTestId("event-time-icon") || screen.getByTestId("event-date-icon");
      expect(icon).toBeInTheDocument();
    });

    it("should display location icon when location is provided", () => {
      render(<EventCardMini event={baseEvent} />);

      const locationIcon = screen.getByTestId("event-location-icon");
      expect(locationIcon).toBeInTheDocument();
    });
  });
});

describe("EventCardMini with Various Event Types", () => {
  it("should render event with long title", () => {
    const longTitleEvent = {
      id: "event-long",
      title: "This is a very long event title that might need truncation or wrapping",
      startTime: new Date("2026-01-17T09:00:00.000Z"),
      location: "Main Office",
    };

    render(<EventCardMini event={longTitleEvent} />);

    expect(
      screen.getByText(
        "This is a very long event title that might need truncation or wrapping"
      )
    ).toBeInTheDocument();
  });

  it("should render event with long location", () => {
    const longLocationEvent = {
      id: "event-loc",
      title: "Office Party",
      startTime: new Date("2026-01-18T18:00:00.000Z"),
      location: "The Grand Ballroom at the Riverside Convention Center, 123 Main Street",
    };

    render(<EventCardMini event={longLocationEvent} />);

    expect(
      screen.getByText(
        "The Grand Ballroom at the Riverside Convention Center, 123 Main Street"
      )
    ).toBeInTheDocument();
  });

  it("should render medical appointment event", () => {
    const medicalEvent = {
      id: "event-med",
      title: "Doctor Appointment",
      startTime: new Date("2026-01-19T10:30:00.000Z"),
      location: "City Medical Center",
    };

    render(<EventCardMini event={medicalEvent} />);

    expect(screen.getByText("Doctor Appointment")).toBeInTheDocument();
    expect(screen.getByText("City Medical Center")).toBeInTheDocument();
  });

  it("should render birthday event without location", () => {
    const birthdayEvent = {
      id: "event-bday",
      title: "Mom's Birthday",
      startTime: new Date("2026-01-20T00:00:00.000Z"),
      location: null,
    };

    render(<EventCardMini event={birthdayEvent} />);

    expect(screen.getByText("Mom's Birthday")).toBeInTheDocument();
    expect(screen.queryByTestId("event-location")).not.toBeInTheDocument();
  });
});

describe("EventCardMini Edge Cases", () => {
  it("should handle event starting at midnight", () => {
    const midnightEvent = {
      id: "event-midnight",
      title: "New Year Celebration",
      startTime: new Date("2026-01-01T00:00:00.000Z"),
      location: "Times Square",
    };

    render(<EventCardMini event={midnightEvent} />);

    expect(screen.getByText("New Year Celebration")).toBeInTheDocument();
    const timeElement = screen.getByTestId("event-time");
    expect(timeElement).toBeInTheDocument();
  });

  it("should handle event with empty string location (treat as no location)", () => {
    const emptyLocationEvent = {
      id: "event-empty-loc",
      title: "Virtual Meeting",
      startTime: new Date("2026-01-21T15:00:00.000Z"),
      location: "",
    };

    render(<EventCardMini event={emptyLocationEvent} />);

    // Empty string location should not show location element
    expect(screen.queryByTestId("event-location")).not.toBeInTheDocument();
  });

  it("should handle special characters in title", () => {
    const specialCharEvent = {
      id: "event-special",
      title: "Meeting @ HQ - Q1 Review & Planning <2026>",
      startTime: new Date("2026-01-22T13:00:00.000Z"),
      location: "Room #101",
    };

    render(<EventCardMini event={specialCharEvent} />);

    expect(
      screen.getByText("Meeting @ HQ - Q1 Review & Planning <2026>")
    ).toBeInTheDocument();
  });
});
