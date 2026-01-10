"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { DateTime } from "luxon";
import { createEventSchema, updateEventSchema } from "@/lib/validations/event";
import type { CalendarEvent } from "./calendar-view";

/**
 * Event category data structure
 */
export interface EventCategory {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

/**
 * Props for the EventModal component
 */
export interface EventModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Callback when an event is created/updated successfully */
  onSuccess?: () => void;
  /** Event to edit (undefined = create mode) */
  event?: CalendarEvent;
  /** Default start time (for create mode) */
  defaultStartTime?: Date;
  /** Default end time (for create mode) */
  defaultEndTime?: Date;
  /** Whether the default times represent an all-day event */
  defaultAllDay?: boolean;
  /** Available categories for the dropdown */
  categories?: EventCategory[];
}

/**
 * Form schema for event creation/editing
 * Uses the API validation schemas as the base
 */
const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().max(2000, "Description must be at most 2000 characters").optional(),
  location: z.string().max(500, "Location must be at most 500 characters").optional(),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().optional(),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  categoryId: z.string().optional(),
  timezone: z.string().default("America/New_York"),
});

type EventFormData = z.infer<typeof eventFormSchema>;

/**
 * EventModal - Dialog for creating and editing calendar events
 *
 * Features:
 * - Create new events with default date/time from calendar selection
 * - Edit existing events with pre-filled form
 * - All-day event toggle
 * - Category selection dropdown
 * - Timezone support (default: America/New_York)
 * - Form validation with Zod
 * - Loading states and error handling
 */
export function EventModal({
  open,
  onClose,
  onSuccess,
  event,
  defaultStartTime,
  defaultEndTime,
  defaultAllDay = false,
  categories = [],
}: EventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = !!event;

  /**
   * Initialize form with default values
   */
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: getDefaultValues(event, defaultStartTime, defaultEndTime, defaultAllDay),
  });

  /**
   * Reset form when modal opens/closes or event changes
   */
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(event, defaultStartTime, defaultEndTime, defaultAllDay));
      setError(null);
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  }, [open, event, defaultStartTime, defaultEndTime, defaultAllDay, form]);

  /**
   * Watch allDay checkbox to show/hide time inputs
   */
  const allDay = form.watch("allDay");

  /**
   * Handle form submission
   */
  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Combine date and time fields into ISO timestamps
      const startTime = combineDateTime(data.startDate, data.startTime, data.allDay);
      const endTime = combineDateTime(data.endDate, data.endTime, data.allDay);

      // Prepare payload for API
      const payload = {
        title: data.title,
        description: data.description || undefined,
        location: data.location || undefined,
        startTime: startTime.toISO()!,
        endTime: endTime.toISO()!,
        allDay: data.allDay,
        categoryId: data.categoryId || undefined,
        timezone: data.timezone,
      };

      // Create or update event
      const url = isEditMode ? `/api/events/${event.id}` : "/api/events";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? "update" : "create"} event`);
      }

      // Success! Close modal and trigger refresh
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error submitting event:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!event) return;

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete event");
      }

      // Success! Close confirmation dialog and main modal, trigger refresh
      setShowDeleteConfirm(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showDeleteConfirm} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of your calendar event."
              : "Add a new event to your shared calendar."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Event description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Event location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* All-Day Checkbox */}
            <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">All-day event</FormLabel>
                </FormItem>
              )}
            />

            {/* Start Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!allDay && (
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* End Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!allDay && (
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center gap-3 pt-4">
              <div>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting}
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{isEditMode ? "Update Event" : "Create Event"}</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {event && (
            <div className="py-4">
              <p className="text-sm font-medium">Event: {event.title}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Helper: Get default form values based on mode (create/edit)
 */
function getDefaultValues(
  event?: CalendarEvent,
  defaultStartTime?: Date,
  defaultEndTime?: Date,
  defaultAllDay = false
): EventFormData {
  if (event) {
    // Edit mode: populate from existing event
    const start = DateTime.fromISO(event.startTime);
    const end = DateTime.fromISO(event.endTime);

    return {
      title: event.title,
      description: event.description || "",
      location: event.location || "",
      startDate: start.toFormat("yyyy-MM-dd"),
      startTime: event.allDay ? "" : start.toFormat("HH:mm"),
      endDate: end.toFormat("yyyy-MM-dd"),
      endTime: event.allDay ? "" : end.toFormat("HH:mm"),
      allDay: event.allDay,
      categoryId: event.category?.id || "",
      timezone: event.timezone || "America/New_York",
    };
  } else {
    // Create mode: use defaults from calendar selection
    const start = defaultStartTime ? DateTime.fromJSDate(defaultStartTime) : DateTime.now();
    const end = defaultEndTime ? DateTime.fromJSDate(defaultEndTime) : start.plus({ hours: 1 });

    return {
      title: "",
      description: "",
      location: "",
      startDate: start.toFormat("yyyy-MM-dd"),
      startTime: defaultAllDay ? "" : start.toFormat("HH:mm"),
      endDate: end.toFormat("yyyy-MM-dd"),
      endTime: defaultAllDay ? "" : end.toFormat("HH:mm"),
      allDay: defaultAllDay,
      categoryId: "",
      timezone: "America/New_York",
    };
  }
}

/**
 * Helper: Combine date and time strings into a Luxon DateTime
 */
function combineDateTime(date: string, time: string | undefined, allDay: boolean): DateTime {
  if (allDay || !time) {
    // All-day events: use start of day
    return DateTime.fromISO(date).startOf("day");
  } else {
    // Timed events: combine date and time
    return DateTime.fromISO(`${date}T${time}`);
  }
}

// Default export for compatibility with tests
export default EventModal;
