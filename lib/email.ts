/**
 * Email service for sending calendar invites
 *
 * Uses Nodemailer with Gmail SMTP and the `ics` package to generate
 * RFC 5545-compliant calendar invitations with METHOD: REQUEST.
 *
 * Configuration via environment variables:
 * - SMTP_USER: Gmail email address
 * - SMTP_APP_PASSWORD: Gmail App Password (16 characters)
 *
 * Setup: Enable 2-Step Verification → Security → App Passwords → Mail
 * Rate Limit: ~100 emails/day for Gmail App Password (sufficient for household use)
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { generateICSContent, type ICSEventParams } from "./utils/ics-generator";
import { formatForDisplay } from "./utils/timezone";

/**
 * Nodemailer transporter instance (singleton)
 * Reuses connections for better performance
 */
let transporter: Transporter | null = null;

/**
 * Get or create the Nodemailer transporter
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Set SMTP_USER and SMTP_APP_PASSWORD environment variables."
    );
  }

  transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/**
 * Parameters for sending a calendar invite
 */
export interface CalendarInviteParams {
  /** Event details */
  event: {
    id: string;
    title: string;
    description?: string | null;
    location?: string | null;
    startTime: Date;
    endTime: Date;
    allDay?: boolean;
    timezone: string;
  };
  /** Email address of the recipient */
  recipientEmail: string;
  /** Email address of the organizer (authenticated user) */
  organizerEmail: string;
  /** Display name of the organizer */
  organizerName: string;
}

/**
 * Send a calendar invite via email with an ICS attachment
 *
 * The ICS file uses METHOD: REQUEST, which allows recipients to:
 * - Accept, decline, or tentatively accept the invitation
 * - Add the event directly to their calendar with one click
 *
 * @param params - Calendar invite parameters
 * @returns Promise that resolves when email is sent
 * @throws Error if SMTP configuration is missing or email fails to send
 *
 * @example
 * ```typescript
 * await sendCalendarInvite({
 *   event: {
 *     id: "event_123",
 *     title: "Family Dinner",
 *     description: "Monthly family gathering",
 *     location: "Home",
 *     startTime: new Date("2026-01-15T18:00:00Z"),
 *     endTime: new Date("2026-01-15T20:00:00Z"),
 *     allDay: false,
 *     timezone: "America/New_York",
 *   },
 *   recipientEmail: "family@example.com",
 *   organizerEmail: "organizer@example.com",
 *   organizerName: "Jane Doe",
 * });
 * ```
 */
export async function sendCalendarInvite(
  params: CalendarInviteParams
): Promise<void> {
  const { event, recipientEmail, organizerEmail, organizerName } = params;

  // Generate ICS file content
  const icsParams: ICSEventParams = {
    eventId: event.id,
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: event.allDay || false,
    timezone: event.timezone,
    organizerName,
    organizerEmail,
    attendeeEmail: recipientEmail,
  };

  const icsContent = generateICSContent(icsParams);

  // Format event time for display in email body
  const formattedTime = formatForDisplay(event.startTime, event.timezone);

  // Send email with ICS attachment
  const transport = getTransporter();

  await transport.sendMail({
    from: `"${organizerName}" <${organizerEmail}>`,
    to: recipientEmail,
    subject: `Calendar Invite: ${event.title}`,
    text: `You've been invited to: ${event.title}\n\nWhen: ${formattedTime}\n${
      event.location ? `Location: ${event.location}\n` : ""
    }${event.description ? `\n${event.description}` : ""}`,
    html: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px;">
        <h2 style="color: #1f2937; margin-bottom: 16px;">${event.title}</h2>
        <p style="color: #4b5563; margin: 8px 0;">
          <strong>When:</strong> ${formattedTime}
        </p>
        ${
          event.location
            ? `<p style="color: #4b5563; margin: 8px 0;">
          <strong>Location:</strong> ${event.location}
        </p>`
            : ""
        }
        ${
          event.description
            ? `<p style="color: #4b5563; margin: 16px 0 8px 0;">
          ${event.description}
        </p>`
            : ""
        }
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This invitation includes a calendar file. Click the attachment to add this event to your calendar.
        </p>
      </div>
    `,
    icalEvent: {
      method: "REQUEST", // Makes it actionable (Accept/Decline buttons)
      content: icsContent,
    },
  });
}

/**
 * Verify SMTP configuration is valid by attempting to connect
 *
 * @returns Promise that resolves to true if connection succeeds, false otherwise
 */
export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error("Email configuration verification failed:", error);
    return false;
  }
}
