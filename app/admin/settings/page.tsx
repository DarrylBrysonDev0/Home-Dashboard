"use client";

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

import { useState } from "react";
import { Mail, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

/**
 * SMTP Settings Page Component
 */
export default function SMTPSettingsPage() {
  // Test email state
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  /**
   * Send a test email to verify SMTP configuration
   */
  async function handleSendTestEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!testEmail) return;

    setIsSending(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "Failed to send test email",
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      setTestResult({
        success: false,
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Settings</h1>
        <p className="text-muted-foreground">
          Configure SMTP settings for calendar invite emails
        </p>
      </div>

      {/* SMTP Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Email settings are configured via environment variables for security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Items */}
          <div className="space-y-3">
            <ConfigItem
              label="SMTP_HOST"
              description="SMTP server hostname"
              configured={true}
              placeholder="smtp.gmail.com"
            />
            <ConfigItem
              label="SMTP_PORT"
              description="SMTP server port"
              configured={true}
              placeholder="587"
            />
            <ConfigItem
              label="SMTP_USER"
              description="SMTP authentication username"
              configured={true}
              placeholder="your-email@gmail.com"
            />
            <ConfigItem
              label="SMTP_PASSWORD"
              description="SMTP authentication password"
              configured={true}
              placeholder="••••••••"
              isSecret
            />
            <ConfigItem
              label="SMTP_FROM"
              description="Default sender email address"
              configured={true}
              placeholder="Home Calendar <calendar@home.local>"
            />
          </div>

          {/* Configuration Instructions */}
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <div className="ml-2">
              <p className="font-medium">Configuration via Environment Variables</p>
              <p className="text-sm text-muted-foreground mt-1">
                SMTP settings are configured in your <code className="bg-muted px-1 rounded">.env.local</code> file.
                Update the file and restart the server to apply changes.
              </p>
            </div>
          </Alert>
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Email Configuration
          </CardTitle>
          <CardDescription>
            Send a test email to verify your SMTP configuration is working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTestEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Recipient Email</Label>
              <div className="flex gap-2">
                <Input
                  id="testEmail"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  disabled={isSending}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !testEmail}>
                  {isSending ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <p className="ml-2 text-sm">{testResult.message}</p>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Gmail SMTP Setup Guide</CardTitle>
          <CardDescription>
            Instructions for configuring Gmail as your SMTP provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <p className="font-medium">1. Enable 2-Factor Authentication</p>
              <p className="text-muted-foreground">
                Go to your Google Account security settings and enable 2FA.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">2. Create an App Password</p>
              <p className="text-muted-foreground">
                In Google Account &gt; Security &gt; App passwords, create a new app password for "Mail".
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium">3. Configure Environment Variables</p>
              <p className="text-muted-foreground">
                Add the following to your <code className="bg-muted px-1 rounded">.env.local</code> file:
              </p>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Home Calendar <your-email@gmail.com>"`}
              </pre>
            </div>
            <div className="space-y-1">
              <p className="font-medium">4. Restart the Server</p>
              <p className="text-muted-foreground">
                Restart your Next.js development server to apply the new settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Configuration item display component
 */
interface ConfigItemProps {
  label: string;
  description: string;
  configured: boolean;
  placeholder: string;
  isSecret?: boolean;
}

function ConfigItem({
  label,
  description,
  configured,
  placeholder,
  isSecret,
}: ConfigItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
            {label}
          </code>
          {configured ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-sm text-muted-foreground">
        {isSecret ? "••••••••" : placeholder}
      </span>
    </div>
  );
}
