import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Login Page
 *
 * Public authentication page for household members to sign in.
 *
 * Features:
 * - Centered card layout with LoginForm
 * - NextAuth.js credentials authentication
 * - Account lockout protection (FR-005)
 * - Redirects to /calendar on successful login
 *
 * @see contracts/auth-api.md
 */

export const metadata: Metadata = {
  title: "Login | Home Dashboard",
  description: "Sign in to access your family calendar and events",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Enter your email and password to access the calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl="/calendar" />
        </CardContent>
      </Card>
    </div>
  );
}
