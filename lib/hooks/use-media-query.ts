"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if a media query matches
 *
 * Used for responsive behavior in navigation components.
 * Handles SSR by returning false initially, then updating on client.
 *
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean - Whether the media query currently matches
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 768px)");
 * const isMobile = useMediaQuery("(max-width: 767px)");
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR - will update on client mount
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Handler for media query changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Subscribe to changes
    mediaQueryList.addEventListener("change", handleChange);

    // Cleanup subscription
    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
