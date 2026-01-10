/**
 * Component tests for UserForm
 *
 * Tests the admin user management form component including:
 * - Create mode (new user)
 * - Edit mode (existing user)
 * - Form validation
 * - Submission handling
 * - Error display
 * - Accessibility
 *
 * NOTE: These tests will FAIL until T090 (UserForm component) is implemented.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserForm from "@/components/admin/user-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe("UserForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "new-user-id" } }),
    } as Response);
  });

  describe("Rendering - Create Mode", () => {
    it("should render all required fields for creating a new user", () => {
      render(<UserForm mode="create" />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it("should render submit button with 'Create User' text", () => {
      render(<UserForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /create user/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("should render optional avatar color field", () => {
      render(<UserForm mode="create" />);

      expect(screen.getByLabelText(/avatar color/i)).toBeInTheDocument();
    });

    it("should have password field as required in create mode", () => {
      render(<UserForm mode="create" />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("aria-required", "true");
    });

    it("should default role to MEMBER", () => {
      render(<UserForm mode="create" />);

      const roleSelect = screen.getByLabelText(/role/i);
      expect(roleSelect).toHaveValue("MEMBER");
    });
  });

  describe("Rendering - Edit Mode", () => {
    const existingUser = {
      id: "user-123",
      email: "existing@example.com",
      name: "Existing User",
      role: "MEMBER" as const,
      avatarColor: "#3B82F6",
    };

    it("should render with existing user data", () => {
      render(<UserForm mode="edit" user={existingUser} />);

      expect(screen.getByLabelText(/email/i)).toHaveValue(existingUser.email);
      expect(screen.getByLabelText(/name/i)).toHaveValue(existingUser.name);
      expect(screen.getByLabelText(/role/i)).toHaveValue(existingUser.role);
    });

    it("should render submit button with 'Update User' text", () => {
      render(<UserForm mode="edit" user={existingUser} />);

      const submitButton = screen.getByRole("button", { name: /update user|save/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("should have password field as optional in edit mode", () => {
      render(<UserForm mode="edit" user={existingUser} />);

      const passwordInput = screen.getByLabelText(/password/i);
      // In edit mode, password is not required (leave blank to keep existing)
      expect(passwordInput).not.toHaveAttribute("aria-required", "true");
    });

    it("should show password placeholder indicating optional in edit mode", () => {
      render(<UserForm mode="edit" user={existingUser} />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput.getAttribute("placeholder")).toMatch(
        /leave blank|unchanged|optional/i
      );
    });

    it("should render cancel button", () => {
      render(<UserForm mode="edit" user={existingUser} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should require email field", async () => {
      render(<UserForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /create user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInvalid();
      });
    });

    it("should require name field", async () => {
      render(<UserForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /create user/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInvalid();
      });
    });

    it("should require password field in create mode", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      // Fill other required fields but not password
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");

      const submitButton = screen.getByRole("button", { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
      });
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      await user.type(screen.getByLabelText(/email/i), "invalid-email");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it("should validate password minimum length (8 chars)", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      await user.type(screen.getByLabelText(/password/i), "short1");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it("should validate password contains number (FR-004)", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      await user.type(screen.getByLabelText(/password/i), "NoNumbersHere");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
      });
    });

    it("should accept valid password", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      await user.type(screen.getByLabelText(/password/i), "ValidPass123");
      await user.tab();

      expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/at least one number/i)).not.toBeInTheDocument();
    });

    it("should validate avatar color format", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      const colorInput = screen.getByLabelText(/avatar color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "not-a-color");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid.*color|hex/i)).toBeInTheDocument();
      });
    });

    it("should validate name max length (100 chars)", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      const longName = "a".repeat(101);
      await user.type(screen.getByLabelText(/name/i), longName);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/100 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission - Create Mode", () => {
    it("should call API with form data on valid submission", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "newuser@example.com");
      await user.type(screen.getByLabelText(/name/i), "New User");
      await user.type(screen.getByLabelText(/password/i), "NewPassword123");
      await user.selectOptions(screen.getByLabelText(/role/i), "ADMIN");

      // Submit
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/users",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("newuser@example.com"),
          })
        );
      });
    });

    it("should disable submit button during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: { id: "new-id" } }),
                } as Response),
              100
            )
          )
      );

      render(<UserForm mode="create" />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");

      // Submit
      const submitButton = screen.getByRole("button", { name: /create user/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ data: { id: "new-id" } }),
                } as Response),
              100
            )
          )
      );

      render(<UserForm mode="create" />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      expect(screen.getByText(/loading|creating|saving/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading|creating|saving/i)).not.toBeInTheDocument();
      });
    });

    it("should call onSuccess callback after successful creation", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<UserForm mode="create" onSuccess={onSuccess} />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission - Edit Mode", () => {
    const existingUser = {
      id: "user-123",
      email: "existing@example.com",
      name: "Existing User",
      role: "MEMBER" as const,
      avatarColor: "#3B82F6",
    };

    it("should call API with PUT method for edit mode", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="edit" user={existingUser} />);

      // Update name
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      // Submit
      await user.click(screen.getByRole("button", { name: /update user|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/users/${existingUser.id}`,
          expect.objectContaining({
            method: "PUT",
          })
        );
      });
    });

    it("should not include password in request if left empty", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="edit" user={existingUser} />);

      // Update only name, leave password empty
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      await user.click(screen.getByRole("button", { name: /update user|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.password).toBeUndefined();
      });
    });

    it("should include password in request if provided", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="edit" user={existingUser} />);

      // Update password
      await user.type(screen.getByLabelText(/password/i), "NewPassword123");

      await user.click(screen.getByRole("button", { name: /update user|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.password).toBe("NewPassword123");
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error on duplicate email", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
          details: {
            fieldErrors: {
              email: ["Email already exists"],
            },
          },
        }),
      } as Response);

      render(<UserForm mode="create" />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "duplicate@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it("should display general error message on server error", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Internal server error",
        }),
      } as Response);

      render(<UserForm mode="create" />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText(/error|failed|try again/i)).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      render(<UserForm mode="create" />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText(/error|failed|try again/i)).toBeInTheDocument();
      });
    });

    it("should clear error on new input", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
          details: {
            fieldErrors: {
              email: ["Email already exists"],
            },
          },
        }),
      } as Response);

      render(<UserForm mode="create" />);

      // Trigger error
      await user.type(screen.getByLabelText(/email/i), "duplicate@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      // Type in email field
      await user.type(screen.getByLabelText(/email/i), "x");

      // Error should disappear
      expect(screen.queryByText(/email already exists/i)).not.toBeInTheDocument();
    });
  });

  describe("Role Selection", () => {
    it("should have ADMIN and MEMBER role options", () => {
      render(<UserForm mode="create" />);

      const roleSelect = screen.getByLabelText(/role/i);
      expect(roleSelect).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      const roleValues = options.map((o) => o.getAttribute("value"));
      expect(roleValues).toContain("ADMIN");
      expect(roleValues).toContain("MEMBER");
    });

    it("should allow changing role", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, "ADMIN");

      expect(roleSelect).toHaveValue("ADMIN");
    });
  });

  describe("Cancel Button", () => {
    it("should call onCancel callback when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <UserForm
          mode="edit"
          user={{ id: "1", email: "t@t.com", name: "T", role: "MEMBER", avatarColor: null }}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });

    it("should not submit form when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <UserForm
          mode="edit"
          user={{ id: "1", email: "t@t.com", name: "T", role: "MEMBER", avatarColor: null }}
        />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<UserForm mode="create" />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it("should mark required fields with aria-required", () => {
      render(<UserForm mode="create" />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-required", "true");
      expect(screen.getByLabelText(/name/i)).toHaveAttribute("aria-required", "true");
      expect(screen.getByLabelText(/password/i)).toHaveAttribute("aria-required", "true");
    });

    it("should announce errors with role=alert", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
        }),
      } as Response);

      render(<UserForm mode="create" />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      });
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/role/i)).toHaveFocus();
    });

    it("should have input type=email for email field", () => {
      render(<UserForm mode="create" />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should have input type=password for password field", () => {
      render(<UserForm mode="create" />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Form Reset", () => {
    it("should reset form after successful submission in create mode", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/name/i), "Test User");
      await user.type(screen.getByLabelText(/password/i), "TestPass123");

      // Submit
      await user.click(screen.getByRole("button", { name: /create user/i }));

      await waitFor(() => {
        // Form should be reset after successful submission
        expect(screen.getByLabelText(/email/i)).toHaveValue("");
        expect(screen.getByLabelText(/name/i)).toHaveValue("");
        expect(screen.getByLabelText(/password/i)).toHaveValue("");
      });
    });
  });

  describe("Unlock Account Option (Edit Mode)", () => {
    const lockedUser = {
      id: "locked-user",
      email: "locked@example.com",
      name: "Locked User",
      role: "MEMBER" as const,
      avatarColor: null,
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    it("should show unlock account checkbox for locked users", () => {
      render(<UserForm mode="edit" user={lockedUser} />);

      expect(screen.getByLabelText(/unlock account/i)).toBeInTheDocument();
    });

    it("should not show unlock account checkbox for unlocked users", () => {
      const unlockedUser = { ...lockedUser, failedLoginAttempts: 0, lockedUntil: null };
      render(<UserForm mode="edit" user={unlockedUser} />);

      expect(screen.queryByLabelText(/unlock account/i)).not.toBeInTheDocument();
    });

    it("should include unlockAccount in request when checked", async () => {
      const user = userEvent.setup();
      render(<UserForm mode="edit" user={lockedUser} />);

      // Check unlock account
      await user.click(screen.getByLabelText(/unlock account/i));

      // Submit
      await user.click(screen.getByRole("button", { name: /update user|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.unlockAccount).toBe(true);
      });
    });
  });
});
