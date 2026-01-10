"use client";

import { useState } from "react";
import { CalendarView, type CalendarEvent } from "@/components/calendar/calendar-view";
import { EventDetails, type EventDetailsData } from "@/components/calendar/event-details";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Calendar Page
 *
 * Main calendar view for household members to view and interact with events.
 *
 * Features:
 * - Month/week/day view switching via FullCalendar toolbar
 * - Event click opens detail dialog
 * - Date selection for creating events (future: US3)
 * - Category filtering (future: US5)
 *
 * User Story 2: View Calendar and Browse Events
 * - AC2.1: Display calendar with month/week/day views ✓
 * - AC2.2: Navigate between time periods ✓
 * - AC2.3: Click event to view details ✓
 * - AC2.4: Calendar loads in <2s (FR-011)
 *
 * @see contracts/events-api.md
 */
export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventDetailsData | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  /**
   * Handle event click - fetch full details and open dialog
   */
  const handleEventClick = async (event: CalendarEvent) => {
    try {
      // Fetch full event details including attendees and invites
      const response = await fetch(`/api/events/${event.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch event details");
      }

      const result = await response.json();
      setSelectedEvent(result.data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error("Error fetching event details:", error);
      // Fallback: show basic event info from calendar
      setSelectedEvent(event as EventDetailsData);
      setIsDetailDialogOpen(true);
    }
  };

  /**
   * Handle date selection for creating events (US3)
   * Currently a placeholder for future implementation
   */
  const handleDateSelect = (start: Date, end: Date, allDay: boolean) => {
    // TODO: Open create event modal (US3 - T058)
    console.log("Date selected:", { start, end, allDay });
  };

  /**
   * Handle event drop for drag-and-drop rescheduling (US3)
   * Currently a placeholder for future implementation
   */
  const handleEventDrop = async (eventId: string, newStart: Date, newEnd: Date) => {
    // TODO: Update event via PUT /api/events/[id] (US3 - T060)
    console.log("Event dropped:", { eventId, newStart, newEnd });
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your family events
        </p>
      </div>

      {/* Calendar View */}
      <CalendarView
        initialView="dayGridMonth"
        onEventClick={handleEventClick}
        onDateSelect={handleDateSelect}
        onEventDrop={handleEventDrop}
        className="bg-card p-6 rounded-lg border shadow-sm"
      />

      {/* Event Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetails event={selectedEvent} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
