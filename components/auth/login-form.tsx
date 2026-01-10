"use client";

/**
 * LoginForm Component
 *
 * Provides email/password authentication form for household members.
 *
 * Features:
 * - Email and password input fields
 * - Client-side validation
 * - Error display for invalid credentials and account lockout
 * - Loading state during authentication
 * - Integration with NextAuth.js credentials provider
 *
 * @see contracts/auth-api.md
 */

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

/**
 * Props for the LoginForm component
 */
export interface LoginFormProps {
  /** Optional callback URL to redirect to after successful login */
  callbackUrl?: string;
}

/**
 * LoginForm component with email/password fields and error display (FR-001)
 *
 * Implements account lockout protection (FR-005) by displaying lockout messages
 * returned from the NextAuth authorize function.
 */
export function LoginForm({ callbackUrl = "/calendar" }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle form submission
   * Calls NextAuth signIn with credentials and handles response
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Call NextAuth signIn with credentials provider
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // NextAuth returns error codes or error messages
        // Account lockout errors come through as error messages
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password");
        } else {
          // Display the error message directly (e.g., account lockout message)
          setError(result.error);
        }
      } else if (result?.ok) {
        // Successful login - redirect to callback URL
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Sign in form">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <p className="text-sm font-medium">{error}</p>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@home.local"
          disabled={isLoading}
          aria-required="true"
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          aria-required="true"
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
