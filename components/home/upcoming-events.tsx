"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CalendarPlus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCardMini, UpcomingEvent } from "./event-card-mini";

/**
 * UpcomingEvents Component Props
 * @see data-model.md UpcomingEventsProps interface
 */
export interface UpcomingEventsProps {
  /** Maximum number of events to display (default: 3) */
  maxEvents?: number;
  /** Number of days to look ahead (default: 7) */
  daysAhead?: number;
  /** Custom class names */
  className?: string;
}

/**
 * API response type from /api/events/upcoming
 */
interface UpcomingEventsAPIResponse {
  data?: Array<{
    id: string;
    title: string;
    startTime: string;
    location: string | null;
  }>;
  error?: string;
}

/**
 * UpcomingEvents Component
 *
 * Fetches and displays upcoming calendar events for the landing page.
 * Handles loading, empty, and error states appropriately.
 *
 * Features:
 * - Fetches from /api/events/upcoming
 * - Loading state with skeleton placeholders
 * - Empty state with CTA to create event
 * - Error state with message (no retry button per spec)
 * - Horizontal scroll with snap points on mobile
 * - Section header with "View all" link
 *
 * @see User Story 6: Upcoming Events on Landing Page
 */
export function UpcomingEvents({
  maxEvents = 3,
  daysAhead = 7,
  className,
}: UpcomingEventsProps) {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/events/upcoming?limit=${maxEvents}&days=${daysAhead}`
        );

        const json: UpcomingEventsAPIResponse = await response.json();

        if (!response.ok) {
          setError(json.error || "Unable to load upcoming events. Please try again.");
          setEvents([]);
          return;
        }

        // Handle malformed response or null data
        if (!json.data || !Array.isArray(json.data)) {
          setEvents([]);
          return;
        }

        // Transform API response to UpcomingEvent type (parse startTime string to Date)
        const transformedEvents: UpcomingEvent[] = json.data.map((event) => ({
          id: event.id,
          title: event.title,
          startTime: new Date(event.startTime),
          location: event.location,
        }));

        setEvents(transformedEvents);
      } catch {
        setError("Unable to load upcoming events. Please try again.");
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [maxEvents, daysAhead]);

  // Loading State
  if (isLoading) {
    return (
      <div
        data-testid="upcoming-events-loading"
        aria-live="polite"
        role="status"
        className={cn("space-y-4", className)}
      >
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              data-testid={`event-skeleton-${i}`}
              className="min-w-[200px] h-24 bg-muted animate-pulse rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <section
        data-testid="upcoming-events-error"
        role="alert"
        aria-live="assertive"
        className={cn(
          "rounded-lg border border-destructive/20 bg-destructive/5 p-4",
          className
        )}
      >
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          <p className="text-sm font-medium">Error loading events</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {error}
        </p>
      </section>
    );
  }

  // Empty State
  if (events.length === 0) {
    return (
      <section
        data-testid="upcoming-events"
        aria-label="Upcoming events"
        className={cn("space-y-3", className)}
      >
        <div
          data-testid="upcoming-events-empty"
          className="rounded-lg border border-dashed p-6 text-center"
        >
          <Calendar
            data-testid="empty-state-icon"
            className="h-10 w-10 mx-auto text-muted-foreground mb-3"
            aria-hidden="true"
          />
          <p className="text-muted-foreground mb-3">
            No upcoming events this week
          </p>
          <Link
            href="/calendar?create=true"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-medium",
              "text-primary hover:text-primary/80 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            )}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Schedule an event
          </Link>
        </div>
      </section>
    );
  }

  // Data State - Events list with horizontal scroll
  return (
    <section
      data-testid="upcoming-events"
      aria-label="Upcoming events"
      role="region"
      className={cn("space-y-3", className)}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upcoming Events</h3>
        <Link
          href="/calendar"
          className={cn(
            "text-sm text-muted-foreground hover:text-foreground transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
          )}
        >
          View all
        </Link>
      </div>

      {/* Events List with Horizontal Scroll */}
      <div
        data-testid="upcoming-events-list"
        className={cn(
          // Layout
          "flex gap-3",
          // Horizontal scroll on mobile
          "overflow-x-auto pb-2",
          // Snap scrolling
          "snap-x snap-mandatory",
          // Hide scrollbar on webkit browsers
          "scrollbar-hide",
          // On desktop, wrap to grid
          "md:grid md:grid-cols-3 md:overflow-visible md:pb-0"
        )}
      >
        {events.map((event) => (
          <EventCardMini
            key={event.id}
            event={event}
            className="snap-start"
          />
        ))}
      </div>
    </section>
  );
}
