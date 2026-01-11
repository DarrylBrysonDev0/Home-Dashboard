"use client";

/**
 * UserForm Component
 *
 * Form for creating and editing household member accounts.
 *
 * Features:
 * - Create mode (new user) with required password
 * - Edit mode (existing user) with optional password change
 * - Client-side validation matching server-side Zod schemas
 * - Account unlock option for locked users
 * - Loading and error states
 * - Accessible form controls with ARIA attributes
 *
 * @see contracts/users-api.md
 * @see lib/validations/auth.ts
 */

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

/**
 * User data for edit mode
 */
export interface UserFormUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  avatarColor: string | null;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
}

/**
 * Props for UserForm component
 */
export interface UserFormProps {
  /** Form mode - create for new users, edit for existing */
  mode: "create" | "edit";
  /** Existing user data (required for edit mode) */
  user?: UserFormUser;
  /** Callback after successful submission */
  onSuccess?: () => void;
  /** Callback when cancel is clicked */
  onCancel?: () => void;
}

/**
 * Field validation errors
 */
interface FieldErrors {
  email?: string;
  name?: string;
  password?: string;
  avatarColor?: string;
}

/**
 * Validate email format
 */
function validateEmail(email: string): string | undefined {
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
  if (email.length > 320) return "Email must be at most 320 characters";
  return undefined;
}

/**
 * Validate name
 */
function validateName(name: string): string | undefined {
  if (!name) return "Name is required";
  if (name.length > 100) return "Name must be at most 100 characters";
  return undefined;
}

/**
 * Validate password (FR-004)
 */
function validatePassword(password: string, required: boolean): string | undefined {
  if (!password) {
    return required ? "Password is required" : undefined;
  }
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be at most 72 characters";
  if (!/\d/.test(password)) return "Password must contain at least one number";
  return undefined;
}

/**
 * Validate hex color format
 */
function validateAvatarColor(color: string): string | undefined {
  if (!color) return undefined; // Optional field
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return "Invalid hex color format (must be #RRGGBB)";
  return undefined;
}

/**
 * Check if user is currently locked
 */
function isUserLocked(user?: UserFormUser): boolean {
  if (!user?.lockedUntil) return false;
  if (!user.failedLoginAttempts || user.failedLoginAttempts === 0) return false;
  return new Date(user.lockedUntil) > new Date();
}

/**
 * UserForm component for creating and editing users
 */
export default function UserForm({
  mode,
  user,
  onSuccess,
  onCancel,
}: UserFormProps) {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">(user?.role || "MEMBER");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#6B7280");
  const [unlockAccount, setUnlockAccount] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Track if user is locked for showing unlock option
  const showUnlockOption = mode === "edit" && isUserLocked(user);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
      setRole(user.role);
      setAvatarColor(user.avatarColor || "#6B7280");
    }
  }, [user]);

  // Clear field error when user types
  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError(null);
  }

  // Validate all fields and return whether form is valid
  function validateForm(): boolean {
    const errors: FieldErrors = {};

    errors.email = validateEmail(email);
    errors.name = validateName(name);
    errors.password = validatePassword(password, mode === "create");
    errors.avatarColor = validateAvatarColor(avatarColor);

    setFieldErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(Boolean);
  }

  // Handle form blur for individual field validation
  function handleBlur(field: keyof FieldErrors) {
    let error: string | undefined;

    switch (field) {
      case "email":
        error = validateEmail(email);
        break;
      case "name":
        error = validateName(name);
        break;
      case "password":
        error = validatePassword(password, mode === "create");
        break;
      case "avatarColor":
        error = validateAvatarColor(avatarColor);
        break;
    }

    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Build request body
      const body: Record<string, unknown> = {
        email,
        name,
        role,
        avatarColor: avatarColor || null,
      };

      // Only include password if provided
      if (password) {
        body.password = password;
      }

      // Include unlock flag if checked
      if (unlockAccount) {
        body.unlockAccount = true;
      }

      // Determine URL and method based on mode
      const url = mode === "create" ? "/api/users" : `/api/users/${user?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.details?.fieldErrors) {
          const apiFieldErrors: FieldErrors = {};
          for (const [field, messages] of Object.entries(data.details.fieldErrors)) {
            apiFieldErrors[field as keyof FieldErrors] = (messages as string[])[0];
          }
          setFieldErrors(apiFieldErrors);
        }
        setError(data.error || "An error occurred");
        return;
      }

      // Success - reset form in create mode
      if (mode === "create") {
        setEmail("");
        setName("");
        setPassword("");
        setRole("MEMBER");
        setAvatarColor("#6B7280");
      }

      // Call success callback
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancel() {
    onCancel?.();
  }

  const isCreateMode = mode === "create";
  const submitLabel = isCreateMode ? "Create User" : "Update User";
  const loadingLabel = isCreateMode ? "Creating..." : "Saving...";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert">
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
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError("email");
          }}
          onBlur={() => handleBlur("email")}
          placeholder="user@home.local"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearFieldError("name");
          }}
          onBlur={() => handleBlur("name")}
          placeholder="John Doe"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-sm text-destructive">
            {fieldErrors.name}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isCreateMode ? "new-password" : "new-password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError("password");
          }}
          onBlur={() => handleBlur("password")}
          placeholder={isCreateMode ? "••••••••" : "Leave blank to keep unchanged"}
          disabled={isLoading}
          aria-required={isCreateMode ? "true" : undefined}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Minimum 8 characters, including one number
        </p>
      </div>

      {/* Role Field */}
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "MEMBER")}
          disabled={isLoading}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Role"
        >
          <option value="MEMBER">MEMBER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>

      {/* Avatar Color Field */}
      <div className="space-y-2">
        <Label htmlFor="avatarColor">Avatar Color</Label>
        <div className="flex items-center gap-3">
          <Input
            id="avatarColor"
            name="avatarColor"
            type="text"
            value={avatarColor}
            onChange={(e) => {
              setAvatarColor(e.target.value);
              clearFieldError("avatarColor");
            }}
            onBlur={() => handleBlur("avatarColor")}
            placeholder="#6B7280"
            disabled={isLoading}
            className="flex-1"
            aria-invalid={!!fieldErrors.avatarColor}
            aria-describedby={fieldErrors.avatarColor ? "avatarColor-error" : undefined}
          />
          <div
            className="h-9 w-9 rounded-md border"
            style={{ backgroundColor: avatarColor || "#6B7280" }}
            aria-hidden="true"
          />
        </div>
        {fieldErrors.avatarColor && (
          <p id="avatarColor-error" className="text-sm text-destructive">
            {fieldErrors.avatarColor}
          </p>
        )}
      </div>

      {/* Unlock Account Option (edit mode only, locked users) */}
      {showUnlockOption && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="unlockAccount"
            checked={unlockAccount}
            onCheckedChange={(checked) => setUnlockAccount(checked === true)}
            disabled={isLoading}
          />
          <Label
            htmlFor="unlockAccount"
            className="text-sm font-normal cursor-pointer"
          >
            Unlock account (reset failed login attempts)
          </Label>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        {mode === "edit" && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} aria-busy={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {loadingLabel}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
