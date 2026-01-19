"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Upcoming Event interface for mini card display
 * @see data-model.md UpcomingEvent interface
 */
export interface UpcomingEvent {
  id: string;
  title: string;
  startTime: Date;
  location?: string | null;
}

/**
 * EventCardMini Component Props
 * @see data-model.md EventCardMiniProps interface
 */
export interface EventCardMiniProps {
  /** Event data to display */
  event: UpcomingEvent;
  /** Custom class names */
  className?: string;
}

/**
 * Format a date to display relative labels or formatted date
 * Returns "Today", "Tomorrow", or a formatted date string
 */
function formatEventDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Normalize dates to compare only date portion
  const eventDate = new Date(date);
  const isToday =
    eventDate.getFullYear() === today.getFullYear() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getDate() === today.getDate();

  const isTomorrow =
    eventDate.getFullYear() === tomorrow.getFullYear() &&
    eventDate.getMonth() === tomorrow.getMonth() &&
    eventDate.getDate() === tomorrow.getDate();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";

  // Return formatted date for other days
  return eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time to display (e.g., "2:00 PM")
 */
function formatEventTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * EventCardMini Component
 *
 * Compact event card for landing page display.
 * Shows event title, date/time, and optional location.
 *
 * Features:
 * - Links to calendar event detail page
 * - Relative date labeling (Today, Tomorrow)
 * - Icon indicators for time and location
 * - Keyboard accessible
 * - Hover and focus states
 *
 * @see User Story 6: Upcoming Events on Landing Page
 */
export function EventCardMini({ event, className }: EventCardMiniProps) {
  const formattedDate = formatEventDate(event.startTime);
  const formattedTime = formatEventTime(event.startTime);
  const hasLocation = event.location && event.location.trim() !== "";

  return (
    <Link
      href={`/calendar?event=${event.id}`}
      aria-label={`View event: ${event.title}`}
      data-testid="event-card-mini"
      className={cn(
        // Card styling
        "block rounded-lg border bg-card p-3 shadow-sm",
        // Hover effects
        "transition-all duration-200 hover:shadow-md hover:border-primary/20",
        // Focus styling
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        // Min width for horizontal scroll
        "min-w-[200px] flex-shrink-0",
        className
      )}
    >
      {/* Event Title */}
      <h4 className="font-medium text-sm line-clamp-2 mb-2">{event.title}</h4>

      {/* Date and Time */}
      <div
        data-testid="event-date"
        className="flex items-center gap-1.5 text-muted-foreground text-sm mb-1"
      >
        <Clock
          data-testid="event-time-icon"
          className="h-3.5 w-3.5 flex-shrink-0"
          aria-hidden="true"
        />
        <span data-testid="event-time">{formattedTime}</span>
        <span className="text-muted-foreground/50">·</span>
        <span>{formattedDate}</span>
      </div>

      {/* Location (optional) */}
      {hasLocation && (
        <div
          data-testid="event-location"
          className="flex items-center gap-1.5 text-muted-foreground text-sm"
        >
          <MapPin
            data-testid="event-location-icon"
            className="h-3.5 w-3.5 flex-shrink-0"
            aria-hidden="true"
          />
          <span className="truncate">{event.location}</span>
        </div>
      )}
    </Link>
  );
}
