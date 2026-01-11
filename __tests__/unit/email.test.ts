/**
 * Unit tests for email service
 *
 * Tests the sendCalendarInvite and verifyEmailConfiguration functions
 * that send calendar invites via Nodemailer with ICS attachments (FR-027).
 *
 * Test Categories:
 * - Email sending with valid parameters
 * - ICS attachment generation
 * - SMTP configuration validation
 * - Error handling for missing config
 * - Email content validation (subject, body, from/to)
 * - Integration with ICS generator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendCalendarInvite, verifyEmailConfiguration } from "@/lib/email";
import * as icsGenerator from "@/lib/utils/ics-generator";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
      verify: vi.fn().mockResolvedValue(true),
    })),
  },
}));

// Mock ICS generator
vi.mock("@/lib/utils/ics-generator", () => ({
  generateICSContent: vi.fn(() => "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR"),
}));

// Mock timezone utility
vi.mock("@/lib/utils/timezone", () => ({
  formatForDisplay: vi.fn(() => "Wednesday, January 15 at 6:00 PM EST"),
}));

describe("Email Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = {
      ...originalEnv,
      SMTP_USER: "test@example.com",
      SMTP_APP_PASSWORD: "test-password-1234",
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("sendCalendarInvite", () => {
    const validParams = {
      event: {
        id: "event_123",
        title: "Family Dinner",
        description: "Monthly family gathering",
        location: "123 Main St",
        startTime: new Date("2026-01-15T23:00:00Z"), // 6 PM EST
        endTime: new Date("2026-01-16T01:00:00Z"),   // 8 PM EST
        allDay: false,
        timezone: "America/New_York",
      },
      recipientEmail: "recipient@example.com",
      organizerEmail: "organizer@example.com",
      organizerName: "Jane Doe",
    };

    it("should send email with valid parameters", async () => {
      await expect(sendCalendarInvite(validParams)).resolves.not.toThrow();
    });

    it("should call generateICSContent with correct parameters", async () => {
      const generateICSSpy = vi.spyOn(icsGenerator, "generateICSContent");

      await sendCalendarInvite(validParams);

      expect(generateICSSpy).toHaveBeenCalledWith({
        eventId: "event_123",
        title: "Family Dinner",
        description: "Monthly family gathering",
        location: "123 Main St",
        startTime: validParams.event.startTime,
        endTime: validParams.event.endTime,
        allDay: false,
        timezone: "America/New_York",
        organizerName: "Jane Doe",
        organizerEmail: "organizer@example.com",
        attendeeEmail: "recipient@example.com",
      });
    });

    it("should include correct email subject", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      await sendCalendarInvite(validParams);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: "Calendar Invite: Family Dinner",
        })
      );
    });

    it("should include correct from and to addresses", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      await sendCalendarInvite(validParams);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Jane Doe" <organizer@example.com>',
          to: "recipient@example.com",
        })
      );
    });

    it("should include event details in plain text body", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      await sendCalendarInvite(validParams);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("Family Dinner"),
        })
      );
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("Wednesday, January 15 at 6:00 PM EST"),
        })
      );
    });

    it("should include event details in HTML body", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      await sendCalendarInvite(validParams);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("<h2"),
        })
      );
      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("Family Dinner"),
        })
      );
    });

    it("should attach ICS file with METHOD: REQUEST", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      await sendCalendarInvite(validParams);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          icalEvent: {
            method: "REQUEST",
            content: expect.stringContaining("BEGIN:VCALENDAR"),
          },
        })
      );
    });

    it("should handle null description", async () => {
      const paramsWithNullDescription = {
        ...validParams,
        event: {
          ...validParams.event,
          description: null,
        },
      };

      await expect(
        sendCalendarInvite(paramsWithNullDescription)
      ).resolves.not.toThrow();
    });

    it("should handle null location", async () => {
      const paramsWithNullLocation = {
        ...validParams,
        event: {
          ...validParams.event,
          location: null,
        },
      };

      await expect(
        sendCalendarInvite(paramsWithNullLocation)
      ).resolves.not.toThrow();
    });

    it("should handle events without location in email body", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      const paramsWithoutLocation = {
        ...validParams,
        event: {
          ...validParams.event,
          location: null,
        },
      };

      await sendCalendarInvite(paramsWithoutLocation);

      const callArgs = sendMailSpy.mock.calls[0][0];
      expect(callArgs.text).not.toContain("Location:");
    });

    it("should handle events without description in email body", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      const paramsWithoutDescription = {
        ...validParams,
        event: {
          ...validParams.event,
          description: null,
        },
      };

      await sendCalendarInvite(paramsWithoutDescription);

      // Should still send successfully
      expect(sendMailSpy).toHaveBeenCalled();
    });

    it("should handle all-day events", async () => {
      const allDayParams = {
        ...validParams,
        event: {
          ...validParams.event,
          allDay: true,
        },
      };

      await expect(sendCalendarInvite(allDayParams)).resolves.not.toThrow();
    });

    it("should handle events in different timezones", async () => {
      const pacificParams = {
        ...validParams,
        event: {
          ...validParams.event,
          timezone: "America/Los_Angeles",
        },
      };

      await expect(sendCalendarInvite(pacificParams)).resolves.not.toThrow();
    });

    it("should throw error if ICS generation fails", async () => {
      vi.spyOn(icsGenerator, "generateICSContent").mockImplementation(() => {
        throw new Error("ICS generation failed");
      });

      await expect(sendCalendarInvite(validParams)).rejects.toThrow(
        "ICS generation failed"
      );
    });

    it("should throw error if email sending fails", async () => {
      const nodemailer = await import("nodemailer");
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: vi.fn().mockRejectedValue(new Error("SMTP connection failed")),
        verify: vi.fn().mockResolvedValue(true),
      });

      await expect(sendCalendarInvite(validParams)).rejects.toThrow(
        "SMTP connection failed"
      );
    });

    it("should reuse transporter for multiple invites", async () => {
      const nodemailer = await import("nodemailer");
      const createTransportSpy = vi.spyOn(nodemailer.default, "createTransport");

      // Send multiple invites
      await sendCalendarInvite(validParams);
      await sendCalendarInvite(validParams);
      await sendCalendarInvite(validParams);

      // Transporter should only be created once (singleton pattern)
      expect(createTransportSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("SMTP Configuration", () => {
    it("should throw error if SMTP_USER is missing", async () => {
      delete process.env.SMTP_USER;

      const nodemailer = await import("nodemailer");
      (nodemailer.default.createTransport as any).mockImplementation(() => {
        throw new Error(
          "Missing SMTP configuration. Set SMTP_USER and SMTP_APP_PASSWORD environment variables."
        );
      });

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "Jane Doe",
      };

      await expect(sendCalendarInvite(params)).rejects.toThrow();
    });

    it("should throw error if SMTP_APP_PASSWORD is missing", async () => {
      delete process.env.SMTP_APP_PASSWORD;

      const nodemailer = await import("nodemailer");
      (nodemailer.default.createTransport as any).mockImplementation(() => {
        throw new Error(
          "Missing SMTP configuration. Set SMTP_USER and SMTP_APP_PASSWORD environment variables."
        );
      });

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "Jane Doe",
      };

      await expect(sendCalendarInvite(params)).rejects.toThrow();
    });

    it("should use Gmail service configuration", async () => {
      const nodemailer = await import("nodemailer");
      const createTransportSpy = vi.spyOn(nodemailer.default, "createTransport");

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "Jane Doe",
      };

      await sendCalendarInvite(params);

      expect(createTransportSpy).toHaveBeenCalledWith({
        service: "Gmail",
        auth: {
          user: "test@example.com",
          pass: "test-password-1234",
        },
      });
    });
  });

  describe("verifyEmailConfiguration", () => {
    it("should return true for valid SMTP configuration", async () => {
      const result = await verifyEmailConfiguration();
      expect(result).toBe(true);
    });

    it("should return false for invalid SMTP configuration", async () => {
      const nodemailer = await import("nodemailer");
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: vi.fn(),
        verify: vi.fn().mockRejectedValue(new Error("Connection failed")),
      });

      const result = await verifyEmailConfiguration();
      expect(result).toBe(false);
    });

    it("should call verify on transporter", async () => {
      const nodemailer = await import("nodemailer");
      const verifySpy = vi.fn().mockResolvedValue(true);
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: vi.fn(),
        verify: verifySpy,
      });

      await verifyEmailConfiguration();

      expect(verifySpy).toHaveBeenCalled();
    });

    it("should handle missing SMTP credentials gracefully", async () => {
      delete process.env.SMTP_USER;
      delete process.env.SMTP_APP_PASSWORD;

      const nodemailer = await import("nodemailer");
      (nodemailer.default.createTransport as any).mockImplementation(() => {
        throw new Error("Missing SMTP configuration");
      });

      const result = await verifyEmailConfiguration();
      expect(result).toBe(false);
    });
  });

  describe("Email Content Formatting", () => {
    it("should include location in text body when provided", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          location: "Conference Room A",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "Jane Doe",
      };

      await sendCalendarInvite(params);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("Location: Conference Room A"),
        })
      );
    });

    it("should include description in text body when provided", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          description: "Discuss project updates",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "Jane Doe",
      };

      await sendCalendarInvite(params);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining("Discuss project updates"),
        })
      );
    });

    it("should format organizer name with email in from field", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "John Smith",
      };

      await sendCalendarInvite(params);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"John Smith" <organizer@example.com>',
        })
      );
    });

    it("should handle special characters in organizer name", async () => {
      const nodemailer = await import("nodemailer");
      const sendMailSpy = vi.fn().mockResolvedValue({ messageId: "test-id" });
      (nodemailer.default.createTransport as any).mockReturnValue({
        sendMail: sendMailSpy,
        verify: vi.fn().mockResolvedValue(true),
      });

      const params = {
        event: {
          id: "event_123",
          title: "Meeting",
          startTime: new Date("2026-01-15T14:00:00Z"),
          endTime: new Date("2026-01-15T15:00:00Z"),
          timezone: "America/New_York",
        },
        recipientEmail: "recipient@example.com",
        organizerEmail: "organizer@example.com",
        organizerName: "Jane O'Doe-Smith",
      };

      await sendCalendarInvite(params);

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Jane O\'Doe-Smith" <organizer@example.com>',
        })
      );
    });
  });
});
