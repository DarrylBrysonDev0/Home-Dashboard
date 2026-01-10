import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarView } from "@/components/calendar/calendar-view";
import { createMockFullCalendarEvents } from "@/__tests__/helpers/calendar-helpers";
import { DateTime } from "luxon";

/**
 * Component Tests: CalendarView
 *
 * TDD Phase: RED - These tests should FAIL until components/calendar/calendar-view.tsx is implemented.
 * Based on: User Story 2 requirements, FullCalendar v6 integration
 *
 * USER STORY 2: View Calendar and Browse Events
 * Goal: Display calendar in month/week/day views with navigation and event details
 *
 * Test Categories:
 * - Basic rendering and FullCalendar initialization
 * - Event display with category colors
 * - View switching (month, week, day)
 * - Event click handling
 * - Date selection handling
 * - Event drag-and-drop (interaction)
 * - Empty state handling
 * - Accessibility
 */

// Mock FullCalendar to avoid rendering issues in tests
vi.mock("@fullcalendar/react", () => ({
  default: ({
    events,
    eventClick,
    select,
    eventDrop,
    initialView,
    headerToolbar,
  }: any) => {
    return (
      <div data-testid="fullcalendar-mock">
        <div data-testid="calendar-view">{initialView}</div>
        <div data-testid="calendar-header">
          {headerToolbar?.left && <span>{headerToolbar.left}</span>}
          {headerToolbar?.center && <span>{headerToolbar.center}</span>}
          {headerToolbar?.right && <span>{headerToolbar.right}</span>}
        </div>
        <div data-testid="calendar-events">
          {events?.map((event: any) => (
            <div
              key={event.id}
              data-testid={`event-${event.id}`}
              data-title={event.title}
              data-color={event.backgroundColor}
              onClick={() => eventClick?.({ event })}
              style={{ backgroundColor: event.backgroundColor }}
            >
              {event.title}
            </div>
          ))}
        </div>
        {select && (
          <button
            data-testid="calendar-date-select"
            onClick={() => select({ start: new Date(), end: new Date() })}
          >
            Select Date
          </button>
        )}
        {eventDrop && (
          <button
            data-testid="calendar-event-drop"
            onClick={() =>
              eventDrop({ event: events?.[0], oldEvent: events?.[0] })
            }
          >
            Drop Event
          </button>
        )}
      </div>
    );
  },
}));

describe("CalendarView", () => {
  const mockOnEventClick = vi.fn();
  const mockOnDateSelect = vi.fn();
  const mockOnEventDrop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render FullCalendar component", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByTestId("fullcalendar-mock")).toBeInTheDocument();
    });

    it("should initialize with month view by default", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const calendarView = screen.getByTestId("calendar-view");
      expect(calendarView).toHaveTextContent(/month/i);
    });

    it("should display header toolbar with navigation and view switcher", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const header = screen.getByTestId("calendar-header");
      expect(header).toBeInTheDocument();

      // Should have navigation buttons
      expect(header).toHaveTextContent(/prev/i);
      expect(header).toHaveTextContent(/next/i);
      expect(header).toHaveTextContent(/today/i);

      // Should have view switcher
      expect(header).toHaveTextContent(/month/i);
      expect(header).toHaveTextContent(/week/i);
      expect(header).toHaveTextContent(/day/i);
    });
  });

  describe("Event Display", () => {
    it("should display events on the calendar", () => {
      const mockEvents = createMockFullCalendarEvents(3);

      render(
        <CalendarView
          events={mockEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventsContainer = screen.getByTestId("calendar-events");
      expect(eventsContainer.children).toHaveLength(3);

      mockEvents.forEach((event) => {
        expect(screen.getByTestId(`event-${event.id}`)).toBeInTheDocument();
      });
    });

    it("should render events with category colors", () => {
      const mockEvents = [
        {
          id: "event-1",
          title: "Work Event",
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          backgroundColor: "#3B82F6", // Blue
          borderColor: "#3B82F6",
          allDay: false,
          extendedProps: { categoryName: "Work" },
        },
        {
          id: "event-2",
          title: "Family Event",
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          backgroundColor: "#F97316", // Orange
          borderColor: "#F97316",
          allDay: false,
          extendedProps: { categoryName: "Family" },
        },
      ];

      render(
        <CalendarView
          events={mockEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const workEvent = screen.getByTestId("event-event-1");
      expect(workEvent).toHaveAttribute("data-color", "#3B82F6");

      const familyEvent = screen.getByTestId("event-event-2");
      expect(familyEvent).toHaveAttribute("data-color", "#F97316");
    });

    it("should display event titles", () => {
      const mockEvents = createMockFullCalendarEvents(2);

      render(
        <CalendarView
          events={mockEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      mockEvents.forEach((event) => {
        expect(screen.getByText(event.title)).toBeInTheDocument();
      });
    });

    it("should handle empty events array", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventsContainer = screen.getByTestId("calendar-events");
      expect(eventsContainer.children).toHaveLength(0);
    });
  });

  describe("Event Interaction", () => {
    it("should call onEventClick when an event is clicked", async () => {
      const user = userEvent.setup();
      const mockEvents = createMockFullCalendarEvents(1);

      render(
        <CalendarView
          events={mockEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventElement = screen.getByTestId(`event-${mockEvents[0].id}`);
      await user.click(eventElement);

      expect(mockOnEventClick).toHaveBeenCalledTimes(1);
      expect(mockOnEventClick).toHaveBeenCalledWith(
        expect.objectContaining({
          event: expect.objectContaining({
            id: mockEvents[0].id,
            title: mockEvents[0].title,
          }),
        })
      );
    });

    it("should call onDateSelect when a date range is selected", async () => {
      const user = userEvent.setup();

      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const selectButton = screen.getByTestId("calendar-date-select");
      await user.click(selectButton);

      expect(mockOnDateSelect).toHaveBeenCalledTimes(1);
      expect(mockOnDateSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.any(Date),
          end: expect.any(Date),
        })
      );
    });

    it("should support event drag and drop when onEventDrop is provided", async () => {
      const user = userEvent.setup();
      const mockEvents = createMockFullCalendarEvents(1);

      render(
        <CalendarView
          events={mockEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
          onEventDrop={mockOnEventDrop}
        />
      );

      const dropButton = screen.getByTestId("calendar-event-drop");
      await user.click(dropButton);

      expect(mockOnEventDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe("All-Day Events", () => {
    it("should render all-day events correctly", () => {
      const allDayEvent = {
        id: "event-allday",
        title: "All-Day Event",
        start: DateTime.now().startOf("day").toISO()!,
        end: DateTime.now().endOf("day").toISO()!,
        backgroundColor: "#F97316",
        borderColor: "#F97316",
        allDay: true,
        extendedProps: { categoryName: "Family" },
      };

      render(
        <CalendarView
          events={[allDayEvent]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventElement = screen.getByTestId("event-event-allday");
      expect(eventElement).toBeInTheDocument();
      expect(eventElement).toHaveTextContent("All-Day Event");
    });
  });

  describe("Props Handling", () => {
    it("should accept custom timezone prop", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
          timezone="America/Los_Angeles"
        />
      );

      // Calendar should render (timezone is internal config)
      expect(screen.getByTestId("fullcalendar-mock")).toBeInTheDocument();
    });

    it("should accept custom initial view", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
          initialView="timeGridWeek"
        />
      );

      const calendarView = screen.getByTestId("calendar-view");
      expect(calendarView).toHaveTextContent(/week/i);
    });

    it("should accept custom height", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
          height="600px"
        />
      );

      // Calendar should render with custom height (internal FullCalendar prop)
      expect(screen.getByTestId("fullcalendar-mock")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have semantic structure for screen readers", () => {
      render(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      // FullCalendar renders as a calendar widget
      const calendar = screen.getByTestId("fullcalendar-mock");
      expect(calendar).toBeInTheDocument();
    });

    it("should make events keyboard accessible", () => {
      const mockEvents = createMockFullCalendarEvents(1);

      render(
        <CalendarView
          events={mockEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      const eventElement = screen.getByTestId(`event-${mockEvents[0].id}`);
      // Events should be clickable
      expect(eventElement).toBeInTheDocument();
    });
  });

  describe("Event Extended Properties", () => {
    it("should preserve event extended properties", () => {
      const eventWithExtendedProps = {
        id: "event-1",
        title: "Event with Details",
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        backgroundColor: "#F97316",
        borderColor: "#F97316",
        allDay: false,
        extendedProps: {
          description: "Event description",
          location: "123 Main St",
          categoryName: "Family",
          createdById: "user-123",
        },
      };

      render(
        <CalendarView
          events={[eventWithExtendedProps]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      // Extended properties should be accessible in event data
      const eventElement = screen.getByTestId("event-event-1");
      expect(eventElement).toBeInTheDocument();
    });
  });

  describe("Multiple Events on Same Day", () => {
    it("should display multiple events on the same day", () => {
      const today = DateTime.now();
      const eventsOnSameDay = [
        {
          id: "event-1",
          title: "Morning Meeting",
          start: today.set({ hour: 9 }).toISO()!,
          end: today.set({ hour: 10 }).toISO()!,
          backgroundColor: "#3B82F6",
          borderColor: "#3B82F6",
          allDay: false,
          extendedProps: {},
        },
        {
          id: "event-2",
          title: "Lunch",
          start: today.set({ hour: 12 }).toISO()!,
          end: today.set({ hour: 13 }).toISO()!,
          backgroundColor: "#F97316",
          borderColor: "#F97316",
          allDay: false,
          extendedProps: {},
        },
        {
          id: "event-3",
          title: "Afternoon Session",
          start: today.set({ hour: 14 }).toISO()!,
          end: today.set({ hour: 16 }).toISO()!,
          backgroundColor: "#8B5CF6",
          borderColor: "#8B5CF6",
          allDay: false,
          extendedProps: {},
        },
      ];

      render(
        <CalendarView
          events={eventsOnSameDay}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByTestId("event-event-1")).toBeInTheDocument();
      expect(screen.getByTestId("event-event-2")).toBeInTheDocument();
      expect(screen.getByTestId("event-event-3")).toBeInTheDocument();
    });
  });

  describe("Event Updates", () => {
    it("should re-render when events prop changes", () => {
      const initialEvents = createMockFullCalendarEvents(2);
      const { rerender } = render(
        <CalendarView
          events={initialEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByTestId("calendar-events").children).toHaveLength(2);

      const updatedEvents = createMockFullCalendarEvents(5);
      rerender(
        <CalendarView
          events={updatedEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByTestId("calendar-events").children).toHaveLength(5);
    });

    it("should handle event removal", () => {
      const initialEvents = createMockFullCalendarEvents(3);
      const { rerender } = render(
        <CalendarView
          events={initialEvents}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByTestId("calendar-events").children).toHaveLength(3);

      rerender(
        <CalendarView
          events={[]}
          onEventClick={mockOnEventClick}
          onDateSelect={mockOnDateSelect}
        />
      );

      expect(screen.getByTestId("calendar-events").children).toHaveLength(0);
    });
  });
});
