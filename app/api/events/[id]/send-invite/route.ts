import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEventById } from "@/lib/queries/events";
import { logInvite } from "@/lib/queries/invites";
import { sendCalendarInvite } from "@/lib/email";

/**
 * Validation schema for send-invite request body
 *
 * @see contracts/invites-api.md
 */
const sendInviteSchema = z.object({
  recipientEmail: z
    .string()
    .min(1, "Email address is required")
    .email("Invalid email format")
    .max(320, "Email must be at most 320 characters"),
});

/**
 * POST /api/events/[id]/send-invite
 *
 * Send a calendar invite email with ICS attachment for an event.
 *
 * Path Parameters:
 * - id: Event ID (cuid)
 *
 * Request Body:
 * - recipientEmail: Email address to send invite to
 *
 * Business Logic:
 * 1. Validate recipient email format
 * 2. Verify event exists
 * 3. Generate ICS file with event details
 * 4. Send email via Nodemailer with ICS attachment
 * 5. Log invite in EventInvite table (only on success)
 * 6. Return invite record
 *
 * Note: Authentication check is handled by middleware for /api/events/*
 *
 * @see contracts/invites-api.md
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = sendInviteSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Invalid email format" },
        { status: 400 }
      );
    }

    const { recipientEmail } = validation.data;

    // Verify event exists and get details for the invite
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Send calendar invite email
    // Using event creator as organizer - in a real app this might be
    // the current user, but for a household calendar this works well
    try {
      await sendCalendarInvite({
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startTime: event.startTime,
          endTime: event.endTime,
          allDay: event.allDay,
          timezone: event.timezone,
        },
        recipientEmail,
        // Use a generic organizer since we don't have user email in session
        // In production, you might want to use the authenticated user's email
        organizerEmail: process.env.SMTP_USER || "calendar@cemdash.local",
        organizerName: event.createdBy.name,
      });
    } catch (emailError) {
      console.error("Failed to send calendar invite email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email invite. Please check SMTP configuration." },
        { status: 500 }
      );
    }

    // Log the invite ONLY after successful email send
    const invite = await logInvite({
      eventId: event.id,
      recipientEmail,
    });

    // Return invite details
    return NextResponse.json({
      data: {
        inviteId: invite.id,
        eventId: invite.eventId,
        recipientEmail: invite.recipientEmail,
        sentAt: invite.sentAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error sending event invite:", error);
    return NextResponse.json(
      { error: "Unable to send invite. Please try again." },
      { status: 500 }
    );
  }
}
