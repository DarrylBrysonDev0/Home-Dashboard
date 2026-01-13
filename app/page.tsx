"use client";

import { HeroSection } from "@/components/home/hero-section";
import { AppSelectionPanel } from "@/components/home/app-selection-panel";
import { useSession } from "@/lib/hooks/use-session";

/**
 * Landing Page
 *
 * Home page for the dashboard with personalized greeting and app selection.
 * Displays a welcome message using the user's name and provides navigation
 * to all main modules via app cards.
 *
 * @see User Story 2: Landing Page App Selection
 */
export default function LandingPage() {
  const { user, isLoading } = useSession();

  // Get user's display name (first name or full name)
  const displayName = user?.name?.split(" ")[0] || "";

  return (
    <div className="container mx-auto px-4">
      <HeroSection userName={displayName}>
        {/* Events slot - will be populated in Phase 8 (US6) */}
      </HeroSection>

      <AppSelectionPanel className="pb-8" />
    </div>
  );
}
