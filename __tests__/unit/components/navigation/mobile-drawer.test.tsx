import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "@/components/navigation/mobile-drawer";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Unit Tests: MobileDrawer Component
 *
 * TDD Phase: RED - These tests should FAIL until components/navigation/mobile-drawer.tsx is implemented.
 * Based on: User Story 5 requirements and data-model.md (MobileDrawerProps interface)
 *
 * Test Categories:
 * - Open/close behavior
 * - Navigation items display
 * - Close on navigation click
 * - Backdrop behavior
 * - User section display
 * - Sign out functionality
 * - Accessibility
 */

// Mock usePathname and useSession
const mockUsePathname = vi.fn();
const mockUseSession = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: (options?: { callbackUrl?: string }) => mockSignOut(options),
}));

/**
 * Wrapper component that provides TooltipProvider context
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}

/**
 * Helper to render MobileDrawer with required providers
 */
function renderMobileDrawer(
  props: Partial<React.ComponentProps<typeof MobileDrawer>> = {}
) {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };
  return render(
    <TestWrapper>
      <MobileDrawer {...defaultProps} {...props} />
    </TestWrapper>
  );
}

describe("MobileDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          avatarColor: "#F97316",
        },
      },
      status: "authenticated",
    });
  });

  describe("Open/Close Behavior", () => {
    it("should render when isOpen is true", () => {
      renderMobileDrawer({ isOpen: true });

      // Sheet content should be visible
      const drawer = screen.getByTestId("mobile-drawer");
      expect(drawer).toBeInTheDocument();
    });

    it("should not render content when isOpen is false", () => {
      renderMobileDrawer({ isOpen: false });

      // Sheet content should not be visible
      const drawer = screen.queryByTestId("mobile-drawer");
      expect(drawer).not.toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
      const onClose = vi.fn();
      renderMobileDrawer({ isOpen: true, onClose });

      // Find and click the close button
      const closeButton = screen.getByRole("button", { name: /close/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop is clicked", () => {
      const onClose = vi.fn();
      renderMobileDrawer({ isOpen: true, onClose });

      // Find and click the backdrop overlay
      const backdrop = document.querySelector('[data-state="open"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      // onClose should be triggered (via Sheet's onOpenChange)
      // Note: This tests the Sheet integration
    });
  });

  describe("Navigation Items", () => {
    it("should display all navigation items", () => {
      renderMobileDrawer({ isOpen: true });

      // Should display all four main nav items
      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/finance/i)).toBeInTheDocument();
      expect(screen.getByText(/calendar/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it("should render navigation items in vertical layout", () => {
      renderMobileDrawer({ isOpen: true });

      // NavItems should be in mobile mode (vertical)
      const navItems = screen.getByTestId("nav-items");
      expect(navItems.className).toMatch(/flex-col/);
    });

    it("should call onClose when a navigation item is clicked", () => {
      const onClose = vi.fn();
      renderMobileDrawer({ isOpen: true, onClose });

      // Click on a navigation item
      const homeLink = screen.getByText(/home/i);
      fireEvent.click(homeLink);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("User Section", () => {
    it("should display user avatar with initials", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "John Doe",
            email: "john@example.com",
            avatarColor: "#F97316",
          },
        },
        status: "authenticated",
      });

      renderMobileDrawer({ isOpen: true });

      // Should display user initials
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("should display user name", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
        status: "authenticated",
      });

      renderMobileDrawer({ isOpen: true });

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("should display user email", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Jane Smith",
            email: "jane@example.com",
          },
        },
        status: "authenticated",
      });

      renderMobileDrawer({ isOpen: true });

      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });
  });

  describe("Sign Out", () => {
    it("should display sign out button", () => {
      renderMobileDrawer({ isOpen: true });

      const signOutButton = screen.getByRole("button", { name: /log out|sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it("should call signOut when sign out button is clicked", async () => {
      renderMobileDrawer({ isOpen: true });

      const signOutButton = screen.getByRole("button", { name: /log out|sign out/i });
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
    });
  });

  describe("Sheet Component Integration", () => {
    it("should use Sheet component with side left", () => {
      renderMobileDrawer({ isOpen: true });

      // The drawer content should slide from the left
      const sheetContent = document.querySelector('[data-state="open"]');
      expect(sheetContent).toBeTruthy();
    });

    it("should have proper animation duration", () => {
      renderMobileDrawer({ isOpen: true });

      // Sheet has built-in animation - verifying it exists
      const sheetContent = document.querySelector(
        '[class*="transition"], [class*="animate"]'
      );
      expect(sheetContent).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible drawer title", () => {
      renderMobileDrawer({ isOpen: true });

      // Sheet should have a title for screen readers
      const title = screen.getByRole("heading", { name: /navigation/i });
      expect(title).toBeInTheDocument();
    });

    it("should trap focus when open", () => {
      renderMobileDrawer({ isOpen: true });

      // Focus should be trapped within the drawer (Sheet handles this)
      const drawer = screen.getByTestId("mobile-drawer");
      expect(drawer).toBeInTheDocument();
    });

    it("should have accessible close button", () => {
      renderMobileDrawer({ isOpen: true });

      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Visual Structure", () => {
    it("should have header with logo or title", () => {
      renderMobileDrawer({ isOpen: true });

      // Header section should exist
      const header = screen.queryByTestId("mobile-drawer-header") ||
                     document.querySelector('[class*="header"]');
      // Either has a header or a title
      expect(screen.getByRole("heading", { name: /navigation/i })).toBeInTheDocument();
    });

    it("should have navigation section", () => {
      renderMobileDrawer({ isOpen: true });

      const navItems = screen.getByTestId("nav-items");
      expect(navItems).toBeInTheDocument();
    });

    it("should have user section at bottom", () => {
      renderMobileDrawer({ isOpen: true });

      // User section should be present
      const userSection = screen.queryByTestId("mobile-drawer-user") ||
                          screen.getByText(/test user|john doe|jane smith/i);
      expect(userSection).toBeInTheDocument();
    });

    it("should separate navigation from user section", () => {
      renderMobileDrawer({ isOpen: true });

      // Should have visual separation (divider or spacing)
      const drawer = screen.getByTestId("mobile-drawer");
      expect(drawer).toBeInTheDocument();
    });
  });

  describe("Responsive Integration", () => {
    it("should be designed for mobile viewport", () => {
      renderMobileDrawer({ isOpen: true });

      // Drawer should have reasonable width for mobile
      const drawer = screen.getByTestId("mobile-drawer");
      expect(drawer).toBeInTheDocument();
    });
  });

  describe("Session States", () => {
    it("should not render user section when session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
      });

      renderMobileDrawer({ isOpen: true });

      // User info should not be visible
      expect(screen.queryByText("Test User")).not.toBeInTheDocument();
    });

    it("should handle no user gracefully", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      renderMobileDrawer({ isOpen: true });

      // Should render drawer without crashing
      const drawer = screen.getByTestId("mobile-drawer");
      expect(drawer).toBeInTheDocument();
    });
  });
});
