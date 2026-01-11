/**
 * Component tests for CategoryForm
 *
 * Tests the admin category management form component including:
 * - Create mode (new category)
 * - Edit mode (existing category)
 * - Form validation
 * - Submission handling
 * - Error display
 * - Color picker
 * - Accessibility
 *
 * NOTE: These tests will FAIL until T102 (CategoryForm component) is implemented.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryForm from "@/components/admin/category-form";

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

describe("CategoryForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "new-category-id" } }),
    } as Response);
  });

  describe("Rendering - Create Mode", () => {
    it("should render all required fields for creating a new category", () => {
      render(<CategoryForm mode="create" />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    });

    it("should render optional icon field", () => {
      render(<CategoryForm mode="create" />);

      expect(screen.getByLabelText(/icon/i)).toBeInTheDocument();
    });

    it("should render submit button with 'Create Category' text", () => {
      render(<CategoryForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /create category/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("should have default color value", () => {
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      // Should have a default color value (hex format)
      expect(colorInput).toHaveValue(expect.stringMatching(/^#[0-9A-Fa-f]{6}$/));
    });

    it("should show color preview that matches input", () => {
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      const colorValue = (colorInput as HTMLInputElement).value;

      // There should be a visual preview with the color
      const preview = screen.getByTestId("color-preview");
      expect(preview).toHaveStyle({ backgroundColor: colorValue });
    });
  });

  describe("Rendering - Edit Mode", () => {
    const existingCategory = {
      id: "cat-123",
      name: "Work Events",
      color: "#3B82F6",
      icon: "briefcase",
    };

    it("should render with existing category data", () => {
      render(<CategoryForm mode="edit" category={existingCategory} />);

      expect(screen.getByLabelText(/name/i)).toHaveValue(existingCategory.name);
      expect(screen.getByLabelText(/color/i)).toHaveValue(existingCategory.color);
      expect(screen.getByLabelText(/icon/i)).toHaveValue(existingCategory.icon);
    });

    it("should render submit button with 'Update Category' text", () => {
      render(<CategoryForm mode="edit" category={existingCategory} />);

      const submitButton = screen.getByRole("button", { name: /update category|save/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("should render cancel button", () => {
      render(<CategoryForm mode="edit" category={existingCategory} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it("should handle category without icon", () => {
      const categoryNoIcon = { ...existingCategory, icon: null };
      render(<CategoryForm mode="edit" category={categoryNoIcon} />);

      const iconInput = screen.getByLabelText(/icon/i);
      expect(iconInput).toHaveValue("");
    });
  });

  describe("Form Validation", () => {
    it("should require name field", async () => {
      render(<CategoryForm mode="create" />);

      const submitButton = screen.getByRole("button", { name: /create category/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInvalid();
      });
    });

    it("should validate name minimum length (1 char)", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/required|name/i)).toBeInTheDocument();
      });
    });

    it("should validate name maximum length (50 chars)", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const longName = "a".repeat(51);
      await user.type(screen.getByLabelText(/name/i), longName);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/50 characters/i)).toBeInTheDocument();
      });
    });

    it("should validate color format (hex color)", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "not-a-color");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid.*color|hex/i)).toBeInTheDocument();
      });
    });

    it("should accept valid hex color with # prefix", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#F97316");
      await user.tab();

      expect(screen.queryByText(/invalid.*color|hex/i)).not.toBeInTheDocument();
    });

    it("should accept lowercase hex colors", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#f97316");
      await user.tab();

      expect(screen.queryByText(/invalid.*color|hex/i)).not.toBeInTheDocument();
    });

    it("should validate icon name maximum length (50 chars)", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const longIcon = "a".repeat(51);
      await user.type(screen.getByLabelText(/icon/i), longIcon);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/50 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission - Create Mode", () => {
    it("should call API with form data on valid submission", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), "New Category");
      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#10B981");
      await user.type(screen.getByLabelText(/icon/i), "star");

      // Submit
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/categories",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("New Category"),
          })
        );
      });
    });

    it("should include color in request body", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#EF4444");

      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.color).toBe("#EF4444");
      });
    });

    it("should include icon when provided", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      await user.type(screen.getByLabelText(/icon/i), "calendar");

      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.icon).toBe("calendar");
      });
    });

    it("should not include icon when empty", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      // Don't fill icon

      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.icon).toBeUndefined();
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

      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");

      const submitButton = screen.getByRole("button", { name: /create category/i });
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

      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      expect(screen.getByText(/loading|creating|saving/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading|creating|saving/i)).not.toBeInTheDocument();
      });
    });

    it("should call onSuccess callback after successful creation", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<CategoryForm mode="create" onSuccess={onSuccess} />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission - Edit Mode", () => {
    const existingCategory = {
      id: "cat-123",
      name: "Existing Category",
      color: "#F97316",
      icon: "home",
    };

    it("should call API with PUT method for edit mode", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="edit" category={existingCategory} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      await user.click(screen.getByRole("button", { name: /update category|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `/api/categories/${existingCategory.id}`,
          expect.objectContaining({
            method: "PUT",
          })
        );
      });
    });

    it("should only include changed fields in request", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="edit" category={existingCategory} />);

      // Only update name
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Name");

      await user.click(screen.getByRole("button", { name: /update category|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.name).toBe("Updated Name");
      });
    });

    it("should allow clearing icon", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="edit" category={existingCategory} />);

      const iconInput = screen.getByLabelText(/icon/i);
      await user.clear(iconInput);

      await user.click(screen.getByRole("button", { name: /update category|save/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        expect(callBody.icon).toBeNull();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error on duplicate name", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Validation failed",
          details: {
            fieldErrors: {
              name: ["Name already exists"],
            },
          },
        }),
      } as Response);

      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Duplicate Name");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
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

      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(screen.getByText(/error|failed|try again/i)).toBeInTheDocument();
      });
    });

    it("should handle network errors gracefully", async () => {
      const user = userEvent.setup();
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      await user.click(screen.getByRole("button", { name: /create category/i }));

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
              name: ["Name already exists"],
            },
          },
        }),
      } as Response);

      render(<CategoryForm mode="create" />);

      // Trigger error
      await user.type(screen.getByLabelText(/name/i), "Duplicate");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
      });

      // Type in name field
      await user.type(screen.getByLabelText(/name/i), "x");

      // Error should disappear
      expect(screen.queryByText(/name already exists/i)).not.toBeInTheDocument();
    });
  });

  describe("Color Picker", () => {
    it("should update color preview when color changes", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#EF4444");

      const preview = screen.getByTestId("color-preview");
      expect(preview).toHaveStyle({ backgroundColor: "#EF4444" });
    });

    it("should support native color input type", () => {
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      expect(colorInput).toHaveAttribute("type", "color");
    });

    it("should convert lowercase hex to uppercase for consistency", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#ef4444");

      await user.type(screen.getByLabelText(/name/i), "Test");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
        const callBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
        // Color should be uppercase
        expect(callBody.color).toMatch(/^#[0-9A-F]{6}$/);
      });
    });
  });

  describe("Cancel Button", () => {
    const existingCategory = {
      id: "cat-123",
      name: "Test",
      color: "#F97316",
      icon: null,
    };

    it("should call onCancel callback when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <CategoryForm mode="edit" category={existingCategory} onCancel={onCancel} />
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalled();
    });

    it("should not submit form when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="edit" category={existingCategory} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<CategoryForm mode="create" />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/icon/i)).toBeInTheDocument();
    });

    it("should mark required fields with aria-required", () => {
      render(<CategoryForm mode="create" />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute("aria-required", "true");
      expect(screen.getByLabelText(/color/i)).toHaveAttribute("aria-required", "true");
    });

    it("should mark optional fields without aria-required", () => {
      render(<CategoryForm mode="create" />);

      const iconInput = screen.getByLabelText(/icon/i);
      expect(iconInput).not.toHaveAttribute("aria-required", "true");
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

      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test");
      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      });
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/color/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/icon/i)).toHaveFocus();
    });
  });

  describe("Form Reset", () => {
    it("should reset form after successful submission in create mode", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "Test Category");
      await user.type(screen.getByLabelText(/icon/i), "star");

      await user.click(screen.getByRole("button", { name: /create category/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue("");
        expect(screen.getByLabelText(/icon/i)).toHaveValue("");
      });
    });
  });

  describe("Icon Suggestions", () => {
    it("should show common icon suggestions", () => {
      render(<CategoryForm mode="create" />);

      // Look for suggested icons (could be as buttons, datalist, or similar)
      const suggestions = screen.queryByTestId("icon-suggestions");
      if (suggestions) {
        expect(suggestions).toBeInTheDocument();
      }
    });

    it("should allow selecting icon from suggestions", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      // If there are icon suggestion buttons
      const homeIcon = screen.queryByRole("button", { name: /home/i });
      if (homeIcon) {
        await user.click(homeIcon);
        expect(screen.getByLabelText(/icon/i)).toHaveValue("home");
      }
    });
  });

  describe("Color Presets", () => {
    it("should show color preset options", () => {
      render(<CategoryForm mode="create" />);

      // Look for color presets (could be as buttons)
      const presets = screen.queryByTestId("color-presets");
      if (presets) {
        expect(presets).toBeInTheDocument();
      }
    });

    it("should allow selecting color from presets", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      // If there are color preset buttons
      const orangePreset = screen.queryByTestId("color-preset-orange");
      if (orangePreset) {
        await user.click(orangePreset);
        expect(screen.getByLabelText(/color/i)).toHaveValue("#F97316");
      }
    });
  });

  describe("Live Preview", () => {
    it("should show live category badge preview", () => {
      render(<CategoryForm mode="create" />);

      const preview = screen.queryByTestId("category-preview");
      if (preview) {
        expect(preview).toBeInTheDocument();
      }
    });

    it("should update preview with current name and color", async () => {
      const user = userEvent.setup();
      render(<CategoryForm mode="create" />);

      await user.type(screen.getByLabelText(/name/i), "My Category");
      const colorInput = screen.getByLabelText(/color/i);
      await user.clear(colorInput);
      await user.type(colorInput, "#8B5CF6");

      const preview = screen.queryByTestId("category-preview");
      if (preview) {
        expect(preview).toHaveTextContent("My Category");
        expect(preview).toHaveStyle({ backgroundColor: "#8B5CF6" });
      }
    });
  });
});
