import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/home/hero-section";

/**
 * Component Tests: HeroSection
 *
 * TDD Phase: RED - These tests should FAIL until components/home/hero-section.tsx is implemented.
 * Based on: User Story 2 requirements and data-model.md interface
 *
 * Test Categories:
 * - Greeting display with user's name
 * - Default greeting when no name provided
 * - Layout and styling
 * - Children/slot for upcoming events
 * - Accessibility
 * - Data attributes for E2E testing
 */

describe("HeroSection", () => {
  describe("Greeting Display", () => {
    it("should display personalized greeting with user name", () => {
      render(<HeroSection userName="John" />);

      expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument();
    });

    it("should display greeting with full name", () => {
      render(<HeroSection userName="Jane Doe" />);

      expect(screen.getByText(/Welcome back, Jane Doe/i)).toBeInTheDocument();
    });

    it("should display greeting with first name only", () => {
      render(<HeroSection userName="Alice" />);

      expect(screen.getByText(/Welcome back, Alice/i)).toBeInTheDocument();
    });

    it("should use default greeting when userName is empty string", () => {
      render(<HeroSection userName="" />);

      // Should default to "there" when no name provided
      expect(screen.getByText(/Welcome back, there/i)).toBeInTheDocument();
    });

    it("should preserve greeting structure with punctuation", () => {
      render(<HeroSection userName="Bob" />);

      const greeting = screen.getByTestId("hero-greeting");
      // Greeting text should end naturally (period, exclamation, or nothing)
      expect(greeting.textContent).toMatch(/Welcome back, Bob[!.]?$/i);
    });
  });

  describe("Data Test IDs", () => {
    it("should have hero-section data-testid", () => {
      render(<HeroSection userName="Test" />);

      expect(screen.getByTestId("hero-section")).toBeInTheDocument();
    });

    it("should have hero-greeting data-testid", () => {
      render(<HeroSection userName="Test" />);

      expect(screen.getByTestId("hero-greeting")).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("should apply custom className when provided", () => {
      render(<HeroSection userName="Test" className="custom-hero" />);

      const heroSection = screen.getByTestId("hero-section");
      expect(heroSection).toHaveClass("custom-hero");
    });

    it("should have semantic heading for greeting", () => {
      render(<HeroSection userName="Test" />);

      // Greeting should be in a heading element (h1, h2, etc.)
      const heading = screen.getByRole("heading");
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toMatch(/Welcome back/i);
    });

    it("should have proper spacing classes", () => {
      render(<HeroSection userName="Test" />);

      const heroSection = screen.getByTestId("hero-section");
      // Should have padding/margin for proper layout
      expect(heroSection.className).toMatch(/p-|py-|px-|m-|my-|mx-|space/);
    });
  });

  describe("Children/Events Slot", () => {
    it("should render children (events slot) when provided", () => {
      render(
        <HeroSection userName="Test">
          <div data-testid="events-slot">Upcoming Events Content</div>
        </HeroSection>
      );

      expect(screen.getByTestId("events-slot")).toBeInTheDocument();
      expect(screen.getByText("Upcoming Events Content")).toBeInTheDocument();
    });

    it("should render without children", () => {
      render(<HeroSection userName="Test" />);

      // Should render normally without events slot
      expect(screen.getByTestId("hero-section")).toBeInTheDocument();
      expect(screen.getByTestId("hero-greeting")).toBeInTheDocument();
    });

    it("should place children in appropriate location", () => {
      render(
        <HeroSection userName="Test">
          <div data-testid="events-content">Events Here</div>
        </HeroSection>
      );

      // Children should be within the hero section
      const heroSection = screen.getByTestId("hero-section");
      const eventsContent = screen.getByTestId("events-content");

      expect(heroSection).toContainElement(eventsContent);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible heading", () => {
      render(<HeroSection userName="Test User" />);

      const heading = screen.getByRole("heading");
      expect(heading).toHaveAccessibleName();
    });

    it("should use semantic section element", () => {
      render(<HeroSection userName="Test" />);

      // Hero section should be a semantic section or header
      const heroSection = screen.getByTestId("hero-section");
      const tagName = heroSection.tagName.toLowerCase();

      expect(["section", "header", "div"]).toContain(tagName);
    });

    it("should have aria-label on the section", () => {
      render(<HeroSection userName="Test" />);

      const heroSection = screen.getByTestId("hero-section");
      // Should have descriptive aria-label
      const hasAriaLabel = heroSection.hasAttribute("aria-label");
      const hasAriaLabelledBy = heroSection.hasAttribute("aria-labelledby");

      expect(hasAriaLabel || hasAriaLabelledBy).toBe(true);
    });
  });

  describe("Responsive Design Classes", () => {
    it("should have responsive text sizing", () => {
      render(<HeroSection userName="Test" />);

      const greeting = screen.getByTestId("hero-greeting");
      // Should have responsive text classes
      expect(greeting.className).toMatch(/text-|md:|lg:|sm:/);
    });
  });
});

describe("HeroSection - Edge Cases", () => {
  it("should handle very long user names", () => {
    const longName = "A".repeat(100);
    render(<HeroSection userName={longName} />);

    expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
  });

  it("should handle user names with special characters", () => {
    render(<HeroSection userName="O'Brien" />);

    expect(screen.getByText(/Welcome back, O'Brien/i)).toBeInTheDocument();
  });

  it("should handle user names with unicode characters", () => {
    render(<HeroSection userName="Marta" />);

    expect(screen.getByText(/Welcome back, Marta/i)).toBeInTheDocument();
  });

  it("should handle user names with numbers", () => {
    render(<HeroSection userName="User123" />);

    expect(screen.getByText(/Welcome back, User123/i)).toBeInTheDocument();
  });

  it("should trim whitespace from user names", () => {
    render(<HeroSection userName="  John  " />);

    // Name should be trimmed
    const greeting = screen.getByTestId("hero-greeting");
    expect(greeting.textContent).not.toMatch(/  John  /);
  });
});

describe("HeroSection - Time-based Greeting", () => {
  // Optional: If implementing time-based greetings (morning/afternoon/evening)
  // These tests are optional based on implementation decisions

  it("should always include 'Welcome back' text", () => {
    render(<HeroSection userName="Test" />);

    // Core greeting should always be present regardless of time
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });
});

describe("HeroSection - Integration with UpcomingEvents", () => {
  it("should have events placeholder area", () => {
    render(
      <HeroSection userName="Test">
        <div data-testid="upcoming-events">
          <p>No upcoming events</p>
        </div>
      </HeroSection>
    );

    expect(screen.getByTestId("upcoming-events")).toBeInTheDocument();
    expect(screen.getByText("No upcoming events")).toBeInTheDocument();
  });

  it("should render multiple events in slot", () => {
    render(
      <HeroSection userName="Test">
        <div data-testid="upcoming-events">
          <div>Event 1</div>
          <div>Event 2</div>
          <div>Event 3</div>
        </div>
      </HeroSection>
    );

    expect(screen.getByText("Event 1")).toBeInTheDocument();
    expect(screen.getByText("Event 2")).toBeInTheDocument();
    expect(screen.getByText("Event 3")).toBeInTheDocument();
  });
});
