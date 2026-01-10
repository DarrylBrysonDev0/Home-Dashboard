"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxon3Plugin from "@fullcalendar/luxon3";
import { DateTime } from "luxon";
import type { EventClickArg, DateSelectArg, EventDropArg, DatesSetArg } from "@fullcalendar/core";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { EventModal, type EventCategory } from "./event-modal";

/**
 * Event data structure from the API
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  allDay: boolean;
  timezone: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Props for the CalendarView component
 */
export interface CalendarViewProps {
  /** Initial view type (month, week, day) */
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
  /** Callback when an event is clicked (if not provided, modal opens by default) */
  onEventClick?: (event: CalendarEvent) => void;
  /** Callback when a date range is selected (if not provided, modal opens by default) */
  onDateSelect?: (start: Date, end: Date, allDay: boolean) => void;
  /** Callback when an event is dropped (drag and drop) */
  onEventDrop?: (eventId: string, newStart: Date, newEnd: Date) => void;
  /** Optional category filter (array of category IDs to show) */
  categoryFilter?: string[];
  /** Available categories for event creation/editing */
  categories?: EventCategory[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * CalendarView - FullCalendar wrapper component
 *
 * Displays calendar events with support for:
 * - Month/week/day view switching
 * - Date range navigation
 * - Event click handling
 * - Date selection for creating events
 * - Drag-and-drop rescheduling (future enhancement)
 *
 * Fetches events from GET /api/events with date range filtering
 */
export function CalendarView({
  initialView = "dayGridMonth",
  onEventClick,
  onDateSelect,
  onEventDrop,
  categoryFilter,
  categories = [],
  className,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [modalDefaultStart, setModalDefaultStart] = useState<Date | undefined>(undefined);
  const [modalDefaultEnd, setModalDefaultEnd] = useState<Date | undefined>(undefined);
  const [modalDefaultAllDay, setModalDefaultAllDay] = useState(false);

  /**
   * Fetch events from the API for a given date range
   */
  const fetchEvents = useCallback(async (start: Date, end: Date) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const result = await response.json();
      setEvents(result.data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle date range changes (view navigation)
   */
  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      // Fetch events for the visible date range
      fetchEvents(arg.start, arg.end);
    },
    [fetchEvents]
  );

  /**
   * Handle event clicks
   */
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const eventId = clickInfo.event.id;
      const event = events.find((e) => e.id === eventId);

      if (event) {
        if (onEventClick) {
          // Use custom callback if provided
          onEventClick(event);
        } else {
          // Default behavior: open modal in edit mode
          setSelectedEvent(event);
          setModalDefaultStart(undefined);
          setModalDefaultEnd(undefined);
          setModalDefaultAllDay(false);
          setIsModalOpen(true);
        }
      }
    },
    [events, onEventClick]
  );

  /**
   * Handle date selection (for creating new events)
   */
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (onDateSelect) {
        // Use custom callback if provided
        onDateSelect(selectInfo.start, selectInfo.end, selectInfo.allDay);
      } else {
        // Default behavior: open modal in create mode
        setSelectedEvent(undefined);
        setModalDefaultStart(selectInfo.start);
        setModalDefaultEnd(selectInfo.end);
        setModalDefaultAllDay(selectInfo.allDay);
        setIsModalOpen(true);
      }

      // Unselect the dates
      const calendarApi = calendarRef.current?.getApi();
      calendarApi?.unselect();
    },
    [onDateSelect]
  );

  /**
   * Handle event drop (drag and drop)
   */
  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      const eventId = dropInfo.event.id;
      const newStart = dropInfo.event.start!;
      const newEnd = dropInfo.event.end || dropInfo.event.start!;

      if (onEventDrop) {
        // Use custom callback if provided
        onEventDrop(eventId, newStart, newEnd);
      } else {
        // Default behavior: update event via API
        try {
          const response = await fetch(`/api/events/${eventId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              startTime: newStart.toISOString(),
              endTime: newEnd.toISOString(),
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update event");
          }

          // Refetch events to ensure consistency
          const calendarApi = calendarRef.current?.getApi();
          if (calendarApi) {
            const view = calendarApi.view;
            fetchEvents(view.activeStart, view.activeEnd);
          }
        } catch (err) {
          console.error("Error updating event:", err);
          // Revert the event to its original position
          dropInfo.revert();
          setError(err instanceof Error ? err.message : "Failed to update event");
        }
      }
    },
    [onEventDrop, fetchEvents]
  );

  /**
   * Handle modal close
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedEvent(undefined);
    setModalDefaultStart(undefined);
    setModalDefaultEnd(undefined);
    setModalDefaultAllDay(false);
  }, []);

  /**
   * Handle successful event creation/update
   */
  const handleModalSuccess = useCallback(() => {
    // Refetch events to show the new/updated event
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const view = calendarApi.view;
      fetchEvents(view.activeStart, view.activeEnd);
    }
  }, [fetchEvents]);

  /**
   * Transform API events to FullCalendar event format
   */
  const calendarEvents = events
    .filter((event) => {
      // Apply category filter if provided
      if (categoryFilter && categoryFilter.length > 0) {
        return event.category && categoryFilter.includes(event.category.id);
      }
      return true;
    })
    .map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime,
      end: event.endTime,
      allDay: event.allDay,
      backgroundColor: event.category?.color || "#6B7280",
      borderColor: event.category?.color || "#6B7280",
      extendedProps: {
        description: event.description,
        location: event.location,
        category: event.category,
        createdBy: event.createdBy,
      },
    }));

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className={className}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, luxon3Plugin]}
        initialView={initialView}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={calendarEvents}
        editable={!!onEventDrop}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        select={handleDateSelect}
        eventDrop={handleEventDrop}
        height="auto"
        timeZone="America/New_York"
        // Styling
        eventDisplay="block"
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        // Accessibility
        eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
      />

      {/* Event creation/editing modal */}
      <EventModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        event={selectedEvent}
        defaultStartTime={modalDefaultStart}
        defaultEndTime={modalDefaultEnd}
        defaultAllDay={modalDefaultAllDay}
        categories={categories}
      />
    </div>
  );
}
