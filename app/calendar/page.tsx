"use client";

import { useState, useEffect } from "react";
import { CalendarView, type CalendarEvent } from "@/components/calendar/calendar-view";
import { EventDetails, type EventDetailsData } from "@/components/calendar/event-details";
import { EventModal } from "@/components/calendar/event-modal";
import { CategoryFilter, type FilterCategory } from "@/components/calendar/category-filter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Calendar Page
 *
 * Main calendar view for household members to view and interact with events.
 *
 * Features:
 * - Month/week/day view switching via FullCalendar toolbar
 * - Event click opens detail dialog
 * - Date selection for creating events (US3)
 * - Category filtering (US5)
 *
 * User Story 2: View Calendar and Browse Events
 * - AC2.1: Display calendar with month/week/day views ✓
 * - AC2.2: Navigate between time periods ✓
 * - AC2.3: Click event to view details ✓
 * - AC2.4: Calendar loads in <2s (FR-011)
 *
 * User Story 5: Filter Events by Category
 * - AC5.1: Display category filter sidebar ✓
 * - AC5.2: Toggle categories to show/hide events ✓
 * - AC5.3: "Show All" functionality ✓
 *
 * @see contracts/events-api.md
 * @see contracts/categories-api.md
 */
export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventDetailsData | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // Create event modal state (US3)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalDefaults, setCreateModalDefaults] = useState<{
    startTime?: Date;
    endTime?: Date;
    allDay?: boolean;
  }>({});

  // Category filtering state (US5)
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Calendar refresh key - increment to force refresh
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  /**
   * Fetch categories on mount (US5)
   */
  useEffect(() => {
    async function fetchCategories() {
      try {
        setCategoriesLoading(true);
        setCategoriesError(null);

        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const result = await response.json();
        setCategories(result.data || []);

        // Initially select all categories
        setSelectedCategoryIds((result.data || []).map((cat: FilterCategory) => cat.id));
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategoriesError(error instanceof Error ? error.message : "Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    }

    fetchCategories();
  }, []);

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
   */
  const handleDateSelect = (start: Date, end: Date, allDay: boolean) => {
    setCreateModalDefaults({
      startTime: start,
      endTime: end,
      allDay
    });
    setIsCreateModalOpen(true);
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

      {/* Main Content with Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - Category Filter */}
        <aside className="space-y-4">
          <div className="bg-card p-4 rounded-lg border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>

            {categoriesError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{categoriesError}</AlertDescription>
              </Alert>
            )}

            {categoriesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <CategoryFilter
                categories={categories}
                selectedCategoryIds={selectedCategoryIds}
                onFilterChange={setSelectedCategoryIds}
              />
            )}
          </div>
        </aside>

        {/* Calendar View */}
        <div className="min-w-0">
          <CalendarView
            key={calendarRefreshKey}
            initialView="dayGridMonth"
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            onEventDrop={handleEventDrop}
            categoryFilter={selectedCategoryIds}
            categories={categories}
            className="bg-card p-6 rounded-lg border shadow-sm"
          />
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetails event={selectedEvent} />}
        </DialogContent>
      </Dialog>

      {/* Create Event Modal */}
      <EventModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          // Trigger calendar refresh by incrementing the key
          setCalendarRefreshKey(prev => prev + 1);
        }}
        defaultStartTime={createModalDefaults.startTime}
        defaultEndTime={createModalDefaults.endTime}
        defaultAllDay={createModalDefaults.allDay}
        categories={categories}
      />
    </div>
  );
}
