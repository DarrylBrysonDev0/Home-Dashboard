/**
 * Reader Layout
 *
 * Server component that wraps the reader pages with the ReaderProvider.
 * Fetches initial data on the server for optimal performance.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import { ReaderProvider } from "@/lib/contexts/ReaderContext";
import { PreferencesService } from "@/lib/reader/preferences.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation Reader",
  description: "Browse and read your documentation files",
};

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch initial preferences on server
  let initialPreferences = undefined;

  try {
    const prefsService = new PreferencesService();
    const prefs = await prefsService.getPreferences();
    initialPreferences = {
      favorites: prefs.favorites,
      recents: prefs.recents,
      displayMode: prefs.displayMode,
    };
  } catch {
    // Use defaults if preferences can't be loaded
  }

  return (
    <ReaderProvider initialPreferences={initialPreferences}>
      <div className="h-[calc(100vh-4rem)]">{children}</div>
    </ReaderProvider>
  );
}
