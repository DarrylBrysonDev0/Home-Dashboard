/**
 * SMTP Configuration API Route
 *
 * Returns SMTP configuration from environment variables at request time.
 * This ensures env vars are read dynamically in production Docker builds,
 * avoiding the static rendering issue with server components.
 *
 * GET /api/admin/smtp-config
 * Response: { data: SMTPConfig } | { error: string }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Read environment variables at request time
    const smtpConfig = {
      host: process.env.SMTP_HOST || "",
      port: process.env.SMTP_PORT || "",
      user: process.env.SMTP_USER || "",
      from: process.env.SMTP_FROM || "",
      hasPassword: !!process.env.SMTP_PASSWORD,
    };

    return NextResponse.json({ data: smtpConfig });
  } catch (error) {
    console.error("SMTP config error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMTP configuration" },
      { status: 500 }
    );
  }
}
