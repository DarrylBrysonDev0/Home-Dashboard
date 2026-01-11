/**
 * Component tests for LoginForm
 *
 * Tests the login form UI component including validation,
 * submission handling, error display, and accessibility.
 *
 * NOTE: These tests will FAIL until T037 (LoginForm component) is implemented.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import LoginForm from "@/components/auth/login-form";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("LoginForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render email and password fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /log in|sign in/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("should have email input with type=email", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should have password input with type=password", () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should not show error message initially", () => {
      render(<LoginForm />);

      const errorMessage = screen.queryByRole("alert");
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should require email field", async () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /log in|sign in/i });

      // Try to submit without email
      fireEvent.click(submitButton);

      await waitFor(() => {
        // HTML5 validation or custom error should trigger
        expect(emailInput).toBeInvalid();
      });
    });

    it("should require password field", async () => {
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /log in|sign in/i });

      // Try to submit without password
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toBeInvalid();
      });
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);

      // Enter invalid email
      await user.type(emailInput, "invalid-email");
      await user.tab(); // Trigger blur

      await waitFor(() => {
        // Should show validation error
        expect(screen.queryByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it("should accept valid email format", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);

      // Enter valid email
      await user.type(emailInput, "test@example.com");
      await user.tab();

      // Should not show email validation error
      expect(screen.queryByText(/valid email/i)).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call signIn on valid form submission", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

      render(<LoginForm />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "TestPassword123");

      // Submit
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com",
          password: "TestPassword123",
          redirect: false,
        });
      });
    });

    it("should disable submit button during submission", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);

      // Make signIn take time to resolve
      mockSignIn.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true, error: null } as any), 100))
      );

      render(<LoginForm />);

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "TestPassword123");

      // Submit
      const submitButton = screen.getByRole("button", { name: /log in|sign in/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);

      mockSignIn.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ ok: true, error: null } as any), 100))
      );

      render(<LoginForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "TestPassword123");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      // Should show loading indicator
      expect(screen.getByText(/loading|signing in/i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/loading|signing in/i)).not.toBeInTheDocument();
      });
    });

    it("should trim whitespace from email", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

      render(<LoginForm />);

      // Enter email with whitespace
      await user.type(screen.getByLabelText(/email/i), "  test@example.com  ");
      await user.type(screen.getByLabelText(/password/i), "TestPassword123");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "test@example.com", // Trimmed
          password: "TestPassword123",
          redirect: false,
        });
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error on failed login", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin"
      } as any);

      render(<LoginForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "WrongPassword");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it("should clear error on new input", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin"
      } as any);

      render(<LoginForm />);

      // Submit with wrong credentials
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "WrongPassword");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      // Error should appear
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Type in email field
      await user.type(screen.getByLabelText(/email/i), "x");

      // Error should disappear
      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockRejectedValue(new Error("Network error"));

      render(<LoginForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "TestPassword123");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      // Should show generic error
      await waitFor(() => {
        expect(screen.getByText(/error|try again/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("should mark required fields with aria-required", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute("aria-required", "true");
      expect(passwordInput).toHaveAttribute("aria-required", "true");
    });

    it("should announce errors with role=alert", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({
        ok: false,
        error: "CredentialsSignin"
      } as any);

      render(<LoginForm />);

      // Trigger error
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "WrongPassword");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      // Error should have alert role
      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      });
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /log in|sign in/i })).toHaveFocus();
    });

    it("should submit form with Enter key", async () => {
      const user = userEvent.setup();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

      render(<LoginForm />);

      // Fill email
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      // Fill password and press Enter
      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "TestPassword123{Enter}");

      // Should submit
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });
  });

  describe("Security", () => {
    it("should not log password in console on submission", async () => {
      const user = userEvent.setup();
      const consoleLogSpy = vi.spyOn(console, "log");
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null } as any);

      render(<LoginForm />);

      // Fill and submit
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecretPassword123");
      await user.click(screen.getByRole("button", { name: /log in|sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // Password should not appear in console logs
      const allLogs = consoleLogSpy.mock.calls.flat().join(" ");
      expect(allLogs).not.toContain("SecretPassword123");

      consoleLogSpy.mockRestore();
    });

    it("should use autocomplete attributes correctly", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Email should allow autocomplete
      expect(emailInput).toHaveAttribute("autoComplete", "email");

      // Password should use current-password
      expect(passwordInput).toHaveAttribute("autoComplete", "current-password");
    });
  });
});
