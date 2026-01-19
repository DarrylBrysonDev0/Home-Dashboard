import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "@/components/auth/user-menu";

/**
 * Unit Tests: UserMenu Component
 *
 * TDD Phase: RED - These tests verify the enhanced UserMenu with Profile and Settings links.
 * Based on: User Story 4 - User Menu and Sign Out
 *
 * Test Categories:
 * - Avatar and initials display
 * - Dropdown menu items (Profile, Settings, Admin, Sign Out)
 * - Profile link navigates to /settings/profile
 * - Settings link navigates to /settings
 * - Sign out works without confirmation
 */

// Mock next-auth/react
const mockSignOut = vi.fn();
const mockUseSession = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: (options?: { callbackUrl?: string }) => mockSignOut(options),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john@example.com",
          role: "MEMBER",
          avatarColor: "#F97316",
        },
      },
      status: "authenticated",
    });
  });

  describe("Basic Rendering", () => {
    it("should render user avatar button", () => {
      render(<UserMenu />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      expect(avatarButton).toBeInTheDocument();
    });

    it("should display user initials in avatar", () => {
      render(<UserMenu />);

      // "John Doe" should show "JD"
      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("should not render when session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
      });

      const { container } = render(<UserMenu />);
      expect(container).toBeEmptyDOMElement();
    });

    it("should not render when not authenticated", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      const { container } = render(<UserMenu />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Avatar Initials", () => {
    it("should display first letter of first and last name", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { name: "Alice Smith", email: "alice@example.com", role: "MEMBER" },
        },
        status: "authenticated",
      });

      render(<UserMenu />);
      expect(screen.getByText("AS")).toBeInTheDocument();
    });

    it("should display single letter for single name", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { name: "Alice", email: "alice@example.com", role: "MEMBER" },
        },
        status: "authenticated",
      });

      render(<UserMenu />);
      expect(screen.getByText("A")).toBeInTheDocument();
    });

    it("should display ? when no name is available", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { name: "", email: "user@example.com", role: "MEMBER" },
        },
        status: "authenticated",
      });

      render(<UserMenu />);
      expect(screen.getByText("?")).toBeInTheDocument();
    });
  });

  describe("Dropdown Menu", () => {
    it("should open dropdown when clicking avatar", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      const avatarButton = screen.getByRole("button", { name: /user menu/i });
      await user.click(avatarButton);

      // Dropdown content should be visible
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("should display user name and email in dropdown header", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  describe("Profile Link", () => {
    it("should have enabled Profile menu item", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      const profileLink = screen.getByRole("menuitem", { name: /profile/i });
      expect(profileLink).toBeInTheDocument();
      expect(profileLink).not.toHaveAttribute("aria-disabled", "true");
    });

    it("should link Profile to /settings/profile", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      // The Profile link should be a Next.js Link to /settings/profile
      const profileLink = screen.getByRole("menuitem", { name: /profile/i });
      const link = profileLink.closest("a");
      expect(link).toHaveAttribute("href", "/settings/profile");
    });
  });

  describe("Settings Link", () => {
    it("should have Settings menu item", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      const settingsLink = screen.getByRole("menuitem", { name: /^settings$/i });
      expect(settingsLink).toBeInTheDocument();
    });

    it("should link Settings to /settings", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      const settingsLink = screen.getByRole("menuitem", { name: /^settings$/i });
      const link = settingsLink.closest("a");
      expect(link).toHaveAttribute("href", "/settings");
    });
  });

  describe("Admin Link", () => {
    it("should show Admin Panel link for admin users", async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Admin User",
            email: "admin@example.com",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      });

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByRole("menuitem", { name: /admin panel/i })).toBeInTheDocument();
      expect(screen.getByText("Administrator")).toBeInTheDocument();
    });

    it("should not show Admin Panel link for non-admin users", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.queryByRole("menuitem", { name: /admin panel/i })).not.toBeInTheDocument();
    });

    it("should link Admin Panel to /admin", async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Admin User",
            email: "admin@example.com",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      });

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      const adminLink = screen.getByRole("menuitem", { name: /admin panel/i });
      const link = adminLink.closest("a");
      expect(link).toHaveAttribute("href", "/admin");
    });
  });

  describe("Sign Out", () => {
    it("should have Log out menu item", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      expect(screen.getByRole("menuitem", { name: /log out/i })).toBeInTheDocument();
    });

    it("should call signOut when clicking Log out", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));
      await user.click(screen.getByRole("menuitem", { name: /log out/i }));

      expect(mockSignOut).toHaveBeenCalled();
    });

    it("should sign out immediately without confirmation dialog", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));
      await user.click(screen.getByRole("menuitem", { name: /log out/i }));

      // signOut should be called directly without any confirmation prompt
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it("should redirect to /login after sign out", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));
      await user.click(screen.getByRole("menuitem", { name: /log out/i }));

      // signOut should be called with callbackUrl pointing to login
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/login" });
    });
  });

  describe("Menu Item Order", () => {
    it("should display menu items in correct order for regular users", async () => {
      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      const menuItems = screen.getAllByRole("menuitem");
      const menuItemTexts = menuItems.map((item) => item.textContent?.trim());

      // For regular users: Profile, Settings, Log out
      expect(menuItemTexts).toContain("Profile");
      expect(menuItemTexts).toContain("Settings");
      expect(menuItemTexts).toContain("Log out");
    });

    it("should display Admin Panel before Profile for admin users", async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Admin User",
            email: "admin@example.com",
            role: "ADMIN",
          },
        },
        status: "authenticated",
      });

      const user = userEvent.setup();
      render(<UserMenu />);

      await user.click(screen.getByRole("button", { name: /user menu/i }));

      const menuItems = screen.getAllByRole("menuitem");
      const menuItemTexts = menuItems.map((item) => item.textContent?.trim());

      // Admin Panel should appear before Profile
      const adminIndex = menuItemTexts.findIndex((text) => text?.includes("Admin Panel"));
      const profileIndex = menuItemTexts.findIndex((text) => text?.includes("Profile"));

      expect(adminIndex).toBeLessThan(profileIndex);
    });
  });

  describe("Avatar Color", () => {
    it("should use user avatarColor for avatar background", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Test User",
            email: "test@example.com",
            role: "MEMBER",
            avatarColor: "#3B82F6",
          },
        },
        status: "authenticated",
      });

      render(<UserMenu />);

      const avatar = screen.getByText("TU").closest("div");
      expect(avatar).toHaveStyle({ backgroundColor: "#3B82F6" });
    });

    it("should use default orange color when avatarColor is not set", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            name: "Test User",
            email: "test@example.com",
            role: "MEMBER",
          },
        },
        status: "authenticated",
      });

      render(<UserMenu />);

      const avatar = screen.getByText("TU").closest("div");
      expect(avatar).toHaveStyle({ backgroundColor: "#F97316" });
    });
  });
});
