"use client";

import { CalendarEvent } from "./calendar-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, Users, Mail } from "lucide-react";
import { DateTime } from "luxon";

/**
 * Extended event data structure with attendees and invites
 */
export interface EventDetailsData extends CalendarEvent {
  attendees?: Array<{
    id: string;
    user: { id: string; name: string };
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
  }>;
  invitesSent?: Array<{
    id: string;
    recipientEmail: string;
    sentAt: string;
  }>;
}

/**
 * Props for the EventDetails component
 */
export interface EventDetailsProps {
  /** Event data to display */
  event: EventDetailsData;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format a date range for display
 */
function formatDateRange(
  startTime: string,
  endTime: string,
  allDay: boolean,
  timezone: string
): string {
  const start = DateTime.fromISO(startTime, { zone: timezone });
  const end = DateTime.fromISO(endTime, { zone: timezone });

  if (allDay) {
    // All-day event
    if (start.hasSame(end, "day")) {
      // Single day
      return start.toFormat("MMMM d, yyyy");
    } else {
      // Multi-day
      return `${start.toFormat("MMM d")} - ${end.toFormat("MMM d, yyyy")}`;
    }
  } else {
    // Timed event
    if (start.hasSame(end, "day")) {
      // Same day
      return `${start.toFormat("MMMM d, yyyy · h:mm a")} - ${end.toFormat("h:mm a")}`;
    } else {
      // Multi-day with times
      return `${start.toFormat("MMM d, h:mm a")} - ${end.toFormat("MMM d, h:mm a")}`;
    }
  }
}

/**
 * Format duration between two times
 */
function formatDuration(startTime: string, endTime: string): string {
  const start = DateTime.fromISO(startTime);
  const end = DateTime.fromISO(endTime);
  const diff = end.diff(start, ["hours", "minutes"]);

  const hours = Math.floor(diff.hours);
  const minutes = Math.round(diff.minutes);

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Get badge variant for attendee status
 */
function getAttendeeStatusVariant(
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE"
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACCEPTED":
      return "default";
    case "DECLINED":
      return "destructive";
    case "TENTATIVE":
      return "secondary";
    case "PENDING":
    default:
      return "outline";
  }
}

/**
 * EventDetails - Displays comprehensive event information
 *
 * Shows all event details including:
 * - Title and description
 * - Date/time with timezone
 * - Location
 * - Category badge
 * - Creator information
 * - Attendees with status
 * - Email invites sent
 *
 * Used when clicking on a calendar event to view full details
 */
export function EventDetails({ event, className }: EventDetailsProps) {
  const dateRange = formatDateRange(event.startTime, event.endTime, event.allDay, event.timezone);
  const duration = !event.allDay ? formatDuration(event.startTime, event.endTime) : null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-2xl break-words">{event.title}</CardTitle>
            {event.category && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  style={{
                    borderColor: event.category.color,
                    color: event.category.color,
                  }}
                >
                  {event.category.name}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {event.description && (
          <CardDescription className="mt-3 whitespace-pre-wrap break-words">
            {event.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date and Time */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Date & Time</p>
            <p className="text-sm text-muted-foreground break-words">{dateRange}</p>
            {duration && (
              <p className="text-xs text-muted-foreground mt-1">Duration: {duration}</p>
            )}
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground break-words">{event.location}</p>
              </div>
            </div>
          </>
        )}

        {/* Creator */}
        <Separator />
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Created by</p>
            <p className="text-sm text-muted-foreground">{event.createdBy.name}</p>
          </div>
        </div>

        {/* Attendees */}
        {event.attendees && event.attendees.length > 0 && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-2">
                  Attendees ({event.attendees.length})
                </p>
                <div className="space-y-2">
                  {event.attendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">
                        {attendee.user.name}
                      </span>
                      <Badge variant={getAttendeeStatusVariant(attendee.status)} className="text-xs">
                        {attendee.status.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Email Invites */}
        {event.invitesSent && event.invitesSent.length > 0 && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-2">
                  Email Invites Sent ({event.invitesSent.length})
                </p>
                <div className="space-y-1">
                  {event.invitesSent.map((invite) => (
                    <div key={invite.id} className="text-sm text-muted-foreground break-all">
                      {invite.recipientEmail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Timezone info */}
        {!event.allDay && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Timezone</p>
                <p className="text-sm text-muted-foreground">{event.timezone}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
