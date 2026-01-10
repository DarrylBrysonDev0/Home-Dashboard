/**
 * Component tests for EventModal
 *
 * Tests the event create/edit modal UI component including:
 * - Create mode vs Edit mode rendering
 * - Form field validation (title, times, categories)
 * - Successful submission (create and update)
 * - Cancel/close functionality
 * - Error handling and display
 * - Category selection
 * - All-day event toggle
 * - Timezone selection
 *
 * USER STORY 3: Create and Edit Events
 *
 * NOTE: These tests will FAIL until T058 (EventModal component) is implemented.
 * This follows TDD methodology: write tests first, then implement.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";
import EventModal from "@/components/calendar/event-modal";
import { createMockEvent } from "@/__tests__/helpers/calendar-helpers";
import type { EventCategory } from "@/generated/prisma/client";

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("EventModal Component", () => {
  const mockCategories: EventCategory[] = [
    {
      id: "cat-1",
      name: "Family",
      color: "#F97316",
      icon: "home",
      createdAt: new Date(),
    },
    {
      id: "cat-2",
      name: "Work",
      color: "#3B82F6",
      icon: "briefcase",
      createdAt: new Date(),
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  // ============================================
  // CREATE MODE RENDERING
  // ============================================

  describe("Create Mode - Rendering", () => {
    it("should render modal with create title when no event provided", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      expect(screen.getByText(/create event|new event|add event/i)).toBeInTheDocument();
    });

    it("should render all form fields in create mode", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start.*time|start.*date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end.*time|end.*date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/all.day/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it("should render create and cancel buttons", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      expect(screen.getByRole("button", { name: /create|save|add/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should display category options", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      // Check that categories are available (might be in a select or combobox)
      const categoryField = screen.getByLabelText(/category/i);
      expect(categoryField).toBeInTheDocument();
    });

    it("should pre-populate start and end times when initialDate provided", () => {
      const initialDate = DateTime.now().plus({ days: 1 }).toJSDate();

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          initialDate={initialDate}
        />
      );

      const startInput = screen.getByLabelText(/start.*time|start.*date/i) as HTMLInputElement;
      // Check that it has some value (exact format depends on implementation)
      expect(startInput.value).not.toBe("");
    });
  });

  // ============================================
  // EDIT MODE RENDERING
  // ============================================

  describe("Edit Mode - Rendering", () => {
    const mockEvent = createMockEvent({
      id: "event-123",
      title: "Existing Event",
      description: "Existing description",
      location: "Conference Room",
      categoryId: "cat-1",
    });

    it("should render modal with edit title when event provided", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      expect(screen.getByText(/edit event|update event/i)).toBeInTheDocument();
    });

    it("should pre-populate form fields with event data", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput.value).toBe("Existing Event");

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe("Existing description");

      const locationInput = screen.getByLabelText(/location/i) as HTMLInputElement;
      expect(locationInput.value).toBe("Conference Room");
    });

    it("should show update button instead of create button", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      expect(screen.getByRole("button", { name: /update|save/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^create$/i })).not.toBeInTheDocument();
    });
  });

  // ============================================
  // FORM VALIDATION
  // ============================================

  describe("Form Validation", () => {
    it("should require title field", async () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should show validation error
        expect(screen.getByText(/title.*required/i)).toBeInTheDocument();
      });

      // Should not call onSuccess
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should validate title max length (200 chars)", async () => {
      const user = userEvent.setup();
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "A".repeat(201));

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/200 characters/i)).toBeInTheDocument();
      });
    });

    it("should validate description max length (2000 chars)", async () => {
      const user = userEvent.setup();
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, "A".repeat(2001));

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/2000 characters/i)).toBeInTheDocument();
      });
    });

    it("should validate location max length (500 chars)", async () => {
      const user = userEvent.setup();
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const locationInput = screen.getByLabelText(/location/i);
      await user.type(locationInput, "A".repeat(501));

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/500 characters/i)).toBeInTheDocument();
      });
    });

    it("should require start time", async () => {
      const user = userEvent.setup();
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/start.*required|start time.*required/i)).toBeInTheDocument();
      });
    });

    it("should require end time", async () => {
      const user = userEvent.setup();
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/end.*required|end time.*required/i)).toBeInTheDocument();
      });
    });

    it("should validate end time is after start time", async () => {
      const user = userEvent.setup();
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      // Set end time before start time
      const startInput = screen.getByLabelText(/start.*time|start.*date/i);
      const endInput = screen.getByLabelText(/end.*time|end.*date/i);

      const now = DateTime.now();
      await user.clear(startInput);
      await user.type(startInput, now.plus({ hours: 2 }).toFormat("yyyy-MM-dd'T'HH:mm"));

      await user.clear(endInput);
      await user.type(endInput, now.plus({ hours: 1 }).toFormat("yyyy-MM-dd'T'HH:mm"));

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/after start time/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // SUCCESSFUL SUBMISSION - CREATE MODE
  // ============================================

  describe("Successful Submission - Create", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: "new-event-123",
            title: "New Event",
            description: null,
            location: null,
            startTime: DateTime.now().plus({ hours: 1 }).toISO(),
            endTime: DateTime.now().plus({ hours: 2 }).toISO(),
            allDay: false,
            timezone: "America/New_York",
            category: null,
            createdBy: { id: "user-1", name: "Test User" },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "New Event");

      const startInput = screen.getByLabelText(/start.*time|start.*date/i);
      const endInput = screen.getByLabelText(/end.*time|end.*date/i);

      const now = DateTime.now();
      await user.type(startInput, now.plus({ hours: 1 }).toFormat("yyyy-MM-dd'T'HH:mm"));
      await user.type(endInput, now.plus({ hours: 2 }).toFormat("yyyy-MM-dd'T'HH:mm"));

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/events",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should submit all-day event correctly", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: "new-event-123",
            title: "All-Day Event",
            allDay: true,
          },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "All-Day Event");

      const allDayCheckbox = screen.getByLabelText(/all.day/i);
      await user.click(allDayCheckbox);

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.allDay).toBe(true);
      });
    });

    it("should submit with selected category", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            id: "new-event-123",
            title: "Categorized Event",
            category: mockCategories[0],
          },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Categorized Event");

      const categorySelect = screen.getByLabelText(/category/i);
      await user.selectOptions(categorySelect, "cat-1");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.categoryId).toBe("cat-1");
      });
    });
  });

  // ============================================
  // SUCCESSFUL SUBMISSION - EDIT MODE
  // ============================================

  describe("Successful Submission - Edit", () => {
    const mockEvent = createMockEvent({
      id: "event-123",
      title: "Existing Event",
      description: "Old description",
    });

    it("should update event with modified data", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            ...mockEvent,
            title: "Updated Event",
          },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Event");

      const submitButton = screen.getByRole("button", { name: /update|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/events/${mockEvent.id}`,
          expect.objectContaining({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe("Error Handling", () => {
    it("should display error message when API call fails", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Invalid event data",
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid event data/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should display error when network request fails", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CANCEL/CLOSE FUNCTIONALITY
  // ============================================

  describe("Cancel/Close Functionality", () => {
    it("should call onClose when cancel button clicked", async () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not submit when closed", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should not render when open=false", () => {
      render(
        <EventModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    });
  });

  // ============================================
  // LOADING STATES
  // ============================================

  describe("Loading States", () => {
    it("should disable submit button while submitting", async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 201,
                  json: async () => ({ data: {} }),
                }),
              1000
            )
          )
      );

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("should show loading indicator while submitting", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 201,
                  json: async () => ({ data: {} }),
                }),
              1000
            )
          )
      );

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, "Test Event");

      const submitButton = screen.getByRole("button", { name: /create|save/i });
      fireEvent.click(submitButton);

      // Should show loading indicator (spinner, text change, etc.)
      await waitFor(() => {
        expect(
          screen.getByText(/creating|saving|loading/i) || submitButton.textContent
        ).toBeTruthy();
      });
    });
  });

  // ============================================
  // DELETE CONFIRMATION (USER STORY 4)
  // ============================================

  describe("Delete Confirmation", () => {
    const mockEvent = createMockEvent({
      id: "event-to-delete",
      title: "Event to Delete",
      description: "This will be deleted",
    });

    it("should show delete button in edit mode", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Delete button should be present in edit mode
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("should NOT show delete button in create mode", () => {
      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />
      );

      // Delete button should NOT be present in create mode
      expect(screen.queryByRole("button", { name: /^delete$/i })).not.toBeInTheDocument();
    });

    it("should show confirmation dialog when delete button clicked", async () => {
      const user = userEvent.setup();

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure|confirm.*delete|delete.*event/i)
        ).toBeInTheDocument();
      });
    });

    it("should show event title in confirmation dialog", async () => {
      const user = userEvent.setup();

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Event title should be shown in confirmation
      await waitFor(() => {
        expect(screen.getByText(/Event to Delete/i)).toBeInTheDocument();
      });
    });

    it("should have confirm and cancel buttons in confirmation dialog", async () => {
      const user = userEvent.setup();

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        // Confirm button (might be labeled "Delete", "Confirm", "Yes", etc.)
        expect(
          screen.getByRole("button", { name: /^delete$|confirm|yes/i })
        ).toBeInTheDocument();
        // Cancel button
        expect(screen.getByRole("button", { name: /cancel|no/i })).toBeInTheDocument();
      });
    });

    it("should close confirmation dialog when cancel is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel|no/i });
      await user.click(cancelButton);

      // Confirmation dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/are you sure|confirm.*delete/i)).not.toBeInTheDocument();
      });

      // Should NOT call API
      expect(global.fetch).not.toHaveBeenCalled();
      // Should NOT call onSuccess
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should call DELETE API when deletion is confirmed", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { success: true },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Wait for dialog
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      // Click confirm
      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should call DELETE API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/events/${mockEvent.id}`,
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });

    it("should call onSuccess after successful deletion", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { success: true },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should call onSuccess callback
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should close modal after successful deletion", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: { success: true },
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should close modal (or call onClose)
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should display error message when deletion fails", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Failed to delete event",
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should display error
      await waitFor(() => {
        expect(screen.getByText(/failed to delete|error/i)).toBeInTheDocument();
      });

      // Should NOT call onSuccess
      expect(mockOnSuccess).not.toHaveBeenCalled();
      // Should NOT close modal on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should display error when event not found (404)", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Event not found",
        }),
      });

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should display error
      await waitFor(() => {
        expect(screen.getByText(/not found|error/i)).toBeInTheDocument();
      });
    });

    it("should disable delete button while deletion is in progress", async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({ data: { success: true } }),
                }),
              1000
            )
          )
      );

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Button should be disabled during deletion
      await waitFor(() => {
        expect(confirmButton).toBeDisabled();
      });
    });

    it("should show loading state during deletion", async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({ data: { success: true } }),
                }),
              1000
            )
          )
      );

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByText(/deleting|loading/i) || confirmButton.textContent).toBeTruthy();
      });
    });

    it("should handle network error during deletion gracefully", async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(
        <EventModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          event={mockEvent}
        />
      );

      // Open confirmation dialog
      const deleteButton = screen.getByRole("button", { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion
      await waitFor(() => {
        expect(screen.getByText(/are you sure|confirm.*delete/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /^delete$|confirm|yes/i });
      await user.click(confirmButton);

      // Should display error
      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Should NOT call onSuccess
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});
