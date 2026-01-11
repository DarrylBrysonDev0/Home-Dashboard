/**
 * Test Email API Route
 * 
 * Sends a test email to verify SMTP configuration.
 * Requires admin authentication.
 * 
 * POST /api/email/test
 * Body: { email: string }
 * Response: { success: true } | { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";
import { z } from "zod";

const testEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = testEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Send test email
    await sendTestEmail(email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test email error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to send test email";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
