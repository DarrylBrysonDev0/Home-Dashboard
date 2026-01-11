/**
 * SMTP Settings Page
 *
 * Admin page for viewing and testing SMTP email configuration.
 *
 * SMTP settings are configured via environment variables for security:
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
 *
 * This page:
 * - Shows current configuration status (without exposing credentials)
 * - Allows sending a test email to verify configuration
 * - Provides setup instructions
 *
 * @see lib/email.ts for email service implementation
 */

import SMTPSettingsClient from "./settings-client";

// Force dynamic rendering to always read fresh env variables
export const dynamic = 'force-dynamic';

/**
 * Server Component - Loads SMTP configuration from environment
 */
export default function SMTPSettingsPage() {
  // Log raw env vars
  console.log('[SMTP Settings] Raw Env Vars:', {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***' : undefined,
    SMTP_FROM: process.env.SMTP_FROM,
  });

  const smtpConfig = {
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT || "",
    user: process.env.SMTP_USER || "",
    from: process.env.SMTP_FROM || "",
    hasPassword: !!process.env.SMTP_PASSWORD,
  };

  console.log('[SMTP Settings] Config Object:', smtpConfig);

  return <SMTPSettingsClient config={smtpConfig} />;
}
