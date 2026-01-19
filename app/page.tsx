"use client";

import { HeroSection } from "@/components/home/hero-section";
import { AppSelectionPanel } from "@/components/home/app-selection-panel";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { useSession } from "@/lib/hooks/use-session";

/**
 * Landing Page
 *
 * Home page for the dashboard with personalized greeting, upcoming events,
 * and app selection panel. Displays a welcome message using the user's name
 * and provides navigation to all main modules via app cards.
 *
 * @see User Story 2: Landing Page App Selection
 * @see User Story 6: Upcoming Events on Landing Page
 */
export default function LandingPage() {
  const { user, isLoading } = useSession();

  // Get user's display name (first name or full name)
  const displayName = user?.name?.split(" ")[0] || "";

  return (
    <div className="container mx-auto px-4">
      <HeroSection userName={displayName}>
        <UpcomingEvents maxEvents={3} daysAhead={7} />
      </HeroSection>

      <AppSelectionPanel className="pb-8" />
    </div>
  );
}
