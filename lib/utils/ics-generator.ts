/**
 * ICS (iCalendar) file generation utility
 *
 * Generates RFC 5545-compliant .ics calendar files for email attachments.
 * Uses the `ics` package with Luxon for timezone-aware date conversion.
 *
 * Key features:
 * - Globally unique UIDs (eventId@domain pattern)
 * - Timezone-aware date handling
 * - Organizer and attendee support with RSVP
 * - All-day event support
 */

import { createEvent, type EventAttributes } from "ics";
import { DateTime } from "luxon";

/**
 * Parameters for generating an ICS event
 */
export interface ICSEventParams {
  /** Unique event identifier (used to generate UID) */
  eventId: string;
  /** Event title */
  title: string;
  /** Event description (optional) */
  description?: string;
  /** Event location (optional) */
  location?: string;
  /** Event start time (Date object in UTC) */
  startTime: Date;
  /** Event end time (Date object in UTC) */
  endTime: Date;
  /** Whether this is an all-day event */
  allDay?: boolean;
  /** IANA timezone name (e.g., "America/New_York") */
  timezone: string;
  /** Organizer's display name */
  organizerName: string;
  /** Organizer's email address */
  organizerEmail: string;
  /** Attendee's email address */
  attendeeEmail: string;
}

/**
 * DateArray format expected by the `ics` package: [year, month, day, hour, minute]
 * Month is 1-indexed (January = 1)
 */
type DateArray = [number, number, number, number, number];

/**
 * Convert a UTC Date object to the DateArray format required by `ics`
 *
 * @param utcDate - Date object in UTC
 * @param timezone - IANA timezone name for display
 * @param allDay - Whether this is an all-day event (omits hour/minute if true)
 * @returns DateArray in the specified timezone
 */
function toDateArray(
  utcDate: Date,
  timezone: string,
  allDay: boolean = false
): DateArray {
  const dt = DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(timezone);

  if (allDay) {
    // All-day events only need year, month, day (hour and minute set to 0)
    return [dt.year, dt.month, dt.day, 0, 0];
  }

  return [dt.year, dt.month, dt.day, dt.hour, dt.minute];
}

/**
 * Generate ICS file content for a calendar event
 *
 * Creates an RFC 5545-compliant iCalendar file with:
 * - Unique UID: `{eventId}@cemdash.local`
 * - ORGANIZER and ATTENDEE fields with RSVP
 * - Timezone-aware dates
 * - STATUS: CONFIRMED and BUSYSTATUS: BUSY
 *
 * @param params - Event parameters
 * @returns ICS file content as a string
 * @throws Error if ICS generation fails
 *
 * @example
 * ```typescript
 * const icsContent = generateICSContent({
 *   eventId: "event_abc123",
 *   title: "Family Dinner",
 *   description: "Monthly gathering",
 *   location: "123 Main St",
 *   startTime: new Date("2026-01-15T23:00:00Z"), // UTC
 *   endTime: new Date("2026-01-16T01:00:00Z"),   // UTC
 *   allDay: false,
 *   timezone: "America/New_York",
 *   organizerName: "Jane Doe",
 *   organizerEmail: "jane@example.com",
 *   attendeeEmail: "john@example.com",
 * });
 * ```
 */
export function generateICSContent(params: ICSEventParams): string {
  const {
    eventId,
    title,
    description = "",
    location = "",
    startTime,
    endTime,
    allDay = false,
    timezone,
    organizerName,
    organizerEmail,
    attendeeEmail,
  } = params;

  // Convert UTC dates to timezone-aware DateArrays
  const start = toDateArray(startTime, timezone, allDay);
  const end = toDateArray(endTime, timezone, allDay);

  // Build ICS event attributes
  const eventAttributes: EventAttributes = {
    start,
    end,
    title,
    description,
    location,
    // Organizer information
    organizer: {
      name: organizerName,
      email: organizerEmail,
    },
    // Attendee with RSVP enabled
    attendees: [
      {
        name: attendeeEmail.split("@")[0], // Use email prefix as name
        email: attendeeEmail,
        rsvp: true,
        partstat: "NEEDS-ACTION", // Pending response
        role: "REQ-PARTICIPANT",
      },
    ],
    // Event status
    status: "CONFIRMED",
    busyStatus: "BUSY",
    // Product identifier
    productId: "cemdash-calendar",
    // Globally unique identifier (critical for calendar apps)
    uid: `${eventId}@cemdash.local`,
  };

  // Generate ICS content
  const { error, value: icsContent } = createEvent(eventAttributes);

  if (error) {
    throw new Error(`ICS generation failed: ${error.message || error}`);
  }

  if (!icsContent) {
    throw new Error("ICS generation returned empty content");
  }

  return icsContent;
}
