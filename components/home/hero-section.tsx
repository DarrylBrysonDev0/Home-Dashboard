"use client";

import { cn } from "@/lib/utils";

/**
 * HeroSection Component Props
 * @see data-model.md HeroSectionProps interface
 */
export interface HeroSectionProps {
  /** User's name for greeting */
  userName: string;
  /** Custom class names */
  className?: string;
  /** Children slot for upcoming events */
  children?: React.ReactNode;
}

/**
 * HeroSection Component
 *
 * Landing page hero with personalized greeting and events slot.
 * Displays a warm welcome message using the user's name.
 *
 * Features:
 * - Personalized greeting with user's name
 * - Falls back to "there" when name is empty
 * - Responsive text sizing
 * - Slot for upcoming events via children
 * - Accessible with proper heading structure
 *
 * @see User Story 2: Landing Page App Selection
 */
export function HeroSection({ userName, className, children }: HeroSectionProps) {
  // Clean up the name - trim whitespace and provide fallback
  const displayName = userName?.trim() || "there";

  return (
    <section
      data-testid="hero-section"
      aria-label="Welcome section"
      className={cn(
        // Spacing
        "py-8 md:py-12",
        className
      )}
    >
      {/* Greeting */}
      <h1
        data-testid="hero-greeting"
        className={cn(
          // Typography - responsive sizing
          "text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl",
          // Spacing
          "mb-6"
        )}
      >
        Welcome back, {displayName}!
      </h1>

      {/* Events slot (children) */}
      {children}
    </section>
  );
}
