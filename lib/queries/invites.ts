import { prisma } from "@/lib/db";
import { EventInvite } from "@/generated/prisma/client";

/**
 * Event invite tracking helpers
 *
 * Provides database operations for tracking email invitations sent for events.
 * Invites are logged after successful email delivery (FR-030).
 */

/**
 * Parameters for logging an event invite
 */
export interface LogInviteParams {
  /** Event ID the invite is for */
  eventId: string;
  /** Email address of the recipient */
  recipientEmail: string;
}

/**
 * Log an email invite that was sent for an event
 *
 * Creates a record in the EventInvite table to track sent invitations.
 * This should be called AFTER the email is successfully sent to ensure
 * we only log invites that were actually delivered.
 *
 * Note: Multiple invites to the same recipient are allowed (no unique
 * constraint on eventId + recipientEmail) to support re-sending invites.
 *
 * @param params - Invite details (eventId, recipientEmail)
 * @returns Created EventInvite record
 *
 * @example
 * ```typescript
 * // After successfully sending email
 * const invite = await logInvite({
 *   eventId: "clx123abc",
 *   recipientEmail: "family@example.com",
 * });
 * // invite.id = "clx456def"
 * // invite.sentAt = 2026-01-10T15:30:00.000Z
 * ```
 */
export async function logInvite(params: LogInviteParams): Promise<EventInvite> {
  const { eventId, recipientEmail } = params;

  return prisma.eventInvite.create({
    data: {
      eventId,
      recipientEmail,
      // sentAt is auto-populated by Prisma default (now())
    },
  });
}

/**
 * Get all invites sent for an event
 *
 * @param eventId - Event ID to get invites for
 * @returns Array of EventInvite records ordered by sentAt descending
 */
export async function getInvitesForEvent(eventId: string): Promise<EventInvite[]> {
  return prisma.eventInvite.findMany({
    where: { eventId },
    orderBy: { sentAt: "desc" },
  });
}
