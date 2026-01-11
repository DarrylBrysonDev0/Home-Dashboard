"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { DateTime } from "luxon";

/**
 * Invite record structure (matches API response)
 */
export interface InviteRecord {
  id: string;
  recipientEmail: string;
  sentAt: string;
}

/**
 * Props for the InviteForm component
 */
export interface InviteFormProps {
  /** Event ID to send invites for */
  eventId: string;
  /** Previously sent invites for display */
  invitesSent?: InviteRecord[];
  /** Callback after successfully sending an invite */
  onInviteSent?: (invite: InviteRecord) => void;
  /** Optional CSS class */
  className?: string;
}

/**
 * Form validation schema for email input
 */
const inviteFormSchema = z.object({
  recipientEmail: z
    .string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .max(320, "Email must be at most 320 characters"),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

/**
 * Format a date for display (e.g., "Jan 10, 2026 at 3:45 PM")
 */
function formatSentAt(sentAt: string): string {
  const dt = DateTime.fromISO(sentAt);
  return dt.toFormat("MMM d, yyyy 'at' h:mm a");
}

/**
 * InviteForm - Send calendar invites via email
 *
 * Features:
 * - Email input with validation
 * - Send button with loading state
 * - Success/error feedback
 * - Display of previously sent invites
 *
 * Used in EventModal (edit mode) and EventDetails to allow
 * users to share calendar events with others via email.
 *
 * @see /api/events/[id]/send-invite for API contract
 */
export function InviteForm({
  eventId,
  invitesSent = [],
  onInviteSent,
  className,
}: InviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localInvites, setLocalInvites] = useState<InviteRecord[]>(invitesSent);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      recipientEmail: "",
    },
  });

  /**
   * Handle form submission - send invite via API
   */
  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/events/${eventId}/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: data.recipientEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invite");
      }

      // Success! Update local state and notify parent
      const newInvite: InviteRecord = {
        id: result.data.inviteId,
        recipientEmail: result.data.recipientEmail,
        sentAt: result.data.sentAt,
      };

      setLocalInvites((prev) => [newInvite, ...prev]);
      setSuccess(`Invite sent to ${data.recipientEmail}`);
      form.reset();
      onInviteSent?.(newInvite);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error sending invite:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* Send Invite Form - using div to avoid nested form issues */}
      <Form {...form}>
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="recipientEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Send Calendar Invite
                </FormLabel>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting}
                    className="shrink-0 w-full sm:w-auto"
                    onClick={form.handleSubmit(onSubmit)}
                    aria-busy={isSubmitting}
                    aria-label="Send calendar invite"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-1" aria-hidden="true" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      {/* Success Message */}
      {success && (
        <Alert className="mt-3 border-green-200 bg-green-50 text-green-800" role="status" aria-live="polite">
          <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mt-3" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Previously Sent Invites */}
      {localInvites.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Previously Sent ({localInvites.length})
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {localInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-1 text-xs text-muted-foreground py-1.5 px-2 bg-muted/50 rounded sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="truncate">{invite.recipientEmail}</span>
                <span className="shrink-0 text-xs opacity-70">
                  {formatSentAt(invite.sentAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InviteForm;
