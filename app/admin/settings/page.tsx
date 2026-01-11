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
 * Note: SMTP config is fetched via API route (/api/admin/smtp-config)
 * to ensure environment variables are read at request time, not build time.
 * This fixes the static rendering issue in Next.js standalone mode.
 *
 * @see lib/email.ts for email service implementation
 * @see app/api/admin/smtp-config/route.ts for config API
 */

import SMTPSettingsClient from "./settings-client";

/**
 * Server Component - Renders SMTP settings client
 * Config is fetched client-side from API to ensure runtime env vars
 */
export default function SMTPSettingsPage() {
  return <SMTPSettingsClient />;
}
