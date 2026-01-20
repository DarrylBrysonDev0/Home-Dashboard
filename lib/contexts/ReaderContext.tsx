"use client";

/**
 * ReaderContext - State management for the Markdown Reader
 *
 * Provides centralized state for file navigation, content viewing,
 * and user preferences. Follows the same pattern as FilterContext.
 *
 * @see specs/005-markdown-reader/data-model.md#readerstate
 */

import * as React from "react";
import type {
  ReaderState,
  ReaderActions,
  ReaderContextValue,
  DisplayMode,
  FileNode,
  FileContent,
  DocumentHeading,
  RecentFile,
  Favorite,
} from "@/types/reader";
import { defaultPreferences } from "@/types/reader";

/**
 * Default reader state
 */
const defaultState: ReaderState = {
  // Navigation
  currentPath: null,
  expandedPaths: new Set<string>(),
  searchQuery: "",
  searchResults: [],

  // Content
  currentFile: null,
  headings: [],
  isLoading: false,
  error: null,

  // User preferences
  displayMode: defaultPreferences.displayMode,
  tocVisible: true,
  navPaneVisible: true,

  // Quick access
  recentFiles: [],
  favorites: [],
};

/**
 * ReaderContext
 */
const ReaderContext = React.createContext<ReaderContextValue | null>(null);

/**
 * ReaderProvider Props
 */
export interface ReaderProviderProps {
  children: React.ReactNode;
  /** Initial file tree data */
  initialTree?: FileNode[];
  /** Initial preferences */
  initialPreferences?: {
    favorites?: Favorite[];
    recents?: RecentFile[];
    displayMode?: DisplayMode;
  };
}

/**
 * ReaderProvider Component
 *
 * Provides global reader state management for the documentation viewer.
 * Wrap the reader layout with this provider to enable state sharing
 * across all reader components.
 *
 * Usage:
 * ```tsx
 * <ReaderProvider>
 *   <ReaderLayout />
 * </ReaderProvider>
 * ```
 */
export function ReaderProvider({
  children,
  initialPreferences,
}: ReaderProviderProps) {
  const [state, setState] = React.useState<ReaderState>(() => ({
    ...defaultState,
    displayMode: initialPreferences?.displayMode ?? defaultState.displayMode,
    favorites: initialPreferences?.favorites ?? [],
    recentFiles: initialPreferences?.recents ?? [],
  }));

  // ==========================================================================
  // Navigation Actions
  // ==========================================================================

  const selectFile = React.useCallback(async (path: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: T019 - Implement file fetch via /api/reader/file
      const response = await fetch(`/api/reader/file?path=${encodeURIComponent(path)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to load file");
      }

      const data = await response.json();
      const fileContent: FileContent = data.data;

      setState((prev) => ({
        ...prev,
        currentPath: path,
        currentFile: fileContent,
        isLoading: false,
        error: null,
        // TODO: Extract headings for TOC
        headings: [],
      }));

      // TODO: T080 - Update recents list via API
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  const toggleExpand = React.useCallback((path: string): void => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { ...prev, expandedPaths: newExpanded };
    });
  }, []);

  const setSearchQuery = React.useCallback(async (query: string): Promise<void> => {
    setState((prev) => ({ ...prev, searchQuery: query, isLoading: query.length > 0 }));

    // Don't search for empty queries
    if (!query.trim()) {
      setState((prev) => ({ ...prev, searchResults: [], isLoading: false }));
      return;
    }

    try {
      const response = await fetch(`/api/reader/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      if (data.success) {
        setState((prev) => ({
          ...prev,
          searchResults: data.data,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, searchResults: [], isLoading: false }));
      }
    } catch (error) {
      console.error("Search error:", error);
      setState((prev) => ({ ...prev, searchResults: [], isLoading: false }));
    }
  }, []);

  const clearSearch = React.useCallback((): void => {
    setState((prev) => ({
      ...prev,
      searchQuery: "",
      searchResults: [],
    }));
  }, []);

  // ==========================================================================
  // Content Actions
  // ==========================================================================

  const setHeadings = React.useCallback((headings: DocumentHeading[]): void => {
    setState((prev) => ({ ...prev, headings }));
  }, []);

  const refreshContent = React.useCallback(async (): Promise<void> => {
    const currentPath = state.currentPath;
    if (!currentPath) return;

    // Re-fetch current file
    await selectFile(currentPath);
  }, [state.currentPath, selectFile]);

  // ==========================================================================
  // Preference Actions
  // ==========================================================================

  const setDisplayMode = React.useCallback((mode: DisplayMode): void => {
    setState((prev) => ({ ...prev, displayMode: mode }));
    // TODO: T069 - Persist via /api/reader/preferences
  }, []);

  const toggleToc = React.useCallback((): void => {
    setState((prev) => ({ ...prev, tocVisible: !prev.tocVisible }));
  }, []);

  const toggleNavPane = React.useCallback((): void => {
    setState((prev) => ({ ...prev, navPaneVisible: !prev.navPaneVisible }));
  }, []);

  // ==========================================================================
  // Quick Access Actions
  // ==========================================================================

  const toggleFavorite = React.useCallback(
    async (path: string, name: string): Promise<void> => {
      const isFav = state.favorites.some((f) => f.path === path);

      setState((prev) => {
        if (isFav) {
          return {
            ...prev,
            favorites: prev.favorites.filter((f) => f.path !== path),
          };
        } else {
          return {
            ...prev,
            favorites: [
              ...prev.favorites,
              { path, name, addedAt: new Date().toISOString() },
            ],
          };
        }
      });

      // TODO: T074-T075 - Persist via /api/reader/preferences
    },
    [state.favorites]
  );

  const isFavorite = React.useCallback(
    (path: string): boolean => {
      return state.favorites.some((f) => f.path === path);
    },
    [state.favorites]
  );

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const value = React.useMemo<ReaderContextValue>(
    () => ({
      // State
      ...state,
      // Actions
      selectFile,
      toggleExpand,
      setSearchQuery,
      clearSearch,
      setHeadings,
      refreshContent,
      setDisplayMode,
      toggleToc,
      toggleNavPane,
      toggleFavorite,
      isFavorite,
    }),
    [
      state,
      selectFile,
      toggleExpand,
      setSearchQuery,
      clearSearch,
      setHeadings,
      refreshContent,
      setDisplayMode,
      toggleToc,
      toggleNavPane,
      toggleFavorite,
      isFavorite,
    ]
  );

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}

/**
 * useReader Hook
 *
 * Access the reader context in child components.
 * Must be used within a ReaderProvider.
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { currentFile, selectFile, toggleFavorite } = useReader();
 *   // Use reader state and actions...
 * }
 * ```
 */
export function useReader(): ReaderContextValue {
  const context = React.useContext(ReaderContext);
  if (!context) {
    throw new Error("useReader must be used within a ReaderProvider");
  }
  return context;
}

export { ReaderContext };
