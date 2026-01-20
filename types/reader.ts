/**
 * TypeScript type definitions for the Markdown Reader feature
 *
 * These types define the data structures for file navigation,
 * content viewing, and user preferences.
 *
 * @see specs/005-markdown-reader/data-model.md
 */

/**
 * Represents an item in the file tree (file or directory)
 */
export interface FileNode {
  /** File or directory name (e.g., "readme.md", "projects") */
  name: string;

  /** Relative path from docs root (e.g., "/projects/readme.md") */
  path: string;

  /** Whether this is a file or directory */
  type: 'file' | 'directory';

  /** File extension including dot (e.g., ".md"), undefined for directories */
  extension?: string;

  /** Child nodes for directories (populated on expand) */
  children?: FileNode[];

  /** Last modification timestamp (ISO 8601) */
  modifiedAt?: string;

  /** File size in bytes (files only) */
  size?: number;

  /** Whether directory has been loaded (client-side tracking) */
  isLoaded?: boolean;

  /** Whether directory contains subdirectories (for expand icon) */
  hasChildren?: boolean;
}

/**
 * Represents loaded file data for rendering
 */
export interface FileContent {
  /** Relative path from docs root */
  path: string;

  /** File name (e.g., "readme.md") */
  name: string;

  /** Raw file content as string */
  content: string;

  /** File extension including dot */
  extension: '.md' | '.mmd' | '.txt';

  /** Last modification timestamp (ISO 8601) */
  modifiedAt: string;

  /** File size in bytes */
  size: number;
}

/**
 * A bookmarked file reference stored in preferences
 */
export interface Favorite {
  /** Relative path from docs root */
  path: string;

  /** Display name (file name without path) */
  name: string;

  /** When the favorite was added (ISO 8601) */
  addedAt: string;
}

/**
 * A recently viewed file reference stored in preferences
 */
export interface RecentFile {
  /** Relative path from docs root */
  path: string;

  /** Display name (file name without path) */
  name: string;

  /** When the file was last viewed (ISO 8601) */
  viewedAt: string;
}

/**
 * Display mode for the reader (themed or reading)
 */
export type DisplayMode = 'themed' | 'reading';

/**
 * Root preferences object stored as `.reader-prefs.json` in docs root
 */
export interface ReaderPreferences {
  /** Schema version for migrations */
  version: 1;

  /** User's bookmarked files */
  favorites: Favorite[];

  /** Recently viewed files (max 10, newest first) */
  recents: RecentFile[];

  /** Current display mode preference */
  displayMode: DisplayMode;
}

/**
 * Default preferences when file doesn't exist or is invalid
 */
export const defaultPreferences: ReaderPreferences = {
  version: 1,
  favorites: [],
  recents: [],
  displayMode: 'themed',
};

/**
 * A heading extracted from markdown for the table of contents
 */
export interface DocumentHeading {
  /** Generated ID for anchor linking (kebab-case of text) */
  id: string;

  /** Raw heading text */
  text: string;

  /** Heading level (1-6 for h1-h6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

// =============================================================================
// API Response Types
// =============================================================================

/**
 * Response for GET /api/reader/tree
 */
export interface TreeResponse {
  success: true;
  data: {
    path: string;
    children: FileNode[];
  };
}

/**
 * Response for GET /api/reader/file
 */
export interface FileResponse {
  success: true;
  data: FileContent;
}

/**
 * Response for GET /api/reader/search
 */
export interface SearchResponse {
  success: true;
  data: FileNode[];
  query: string;
  total: number;
}

/**
 * Response for GET/PUT /api/reader/preferences
 */
export interface PreferencesResponse {
  success: true;
  data: ReaderPreferences;
}

/**
 * Error response for all reader API routes
 */
export interface ReaderErrorResponse {
  success: false;
  error: string;
}

// =============================================================================
// Client-side State Types
// =============================================================================

/**
 * Client-side state managed by ReaderContext
 */
export interface ReaderState {
  // Navigation
  /** Currently selected file path (null if none selected) */
  currentPath: string | null;

  /** Set of expanded directory paths */
  expandedPaths: Set<string>;

  /** Current search query */
  searchQuery: string;

  /** Filtered search results */
  searchResults: FileNode[];

  // Content
  /** Currently loaded file content */
  currentFile: FileContent | null;

  /** Headings extracted from current file (for TOC) */
  headings: DocumentHeading[];

  /** Whether file is currently loading */
  isLoading: boolean;

  /** Error message if file load failed */
  error: string | null;

  // User preferences
  /** Current display mode */
  displayMode: DisplayMode;

  /** Whether TOC sidebar is visible */
  tocVisible: boolean;

  /** Whether navigation pane is visible (mobile) */
  navPaneVisible: boolean;

  // Quick access
  /** Recently viewed files */
  recentFiles: RecentFile[];

  /** Bookmarked files */
  favorites: Favorite[];
}

/**
 * Actions available through ReaderContext
 */
export interface ReaderActions {
  // Navigation
  /** Select and load a file by path */
  selectFile: (path: string) => Promise<void>;

  /** Toggle directory expand/collapse */
  toggleExpand: (path: string) => void;

  /** Update search query and filter results */
  setSearchQuery: (query: string) => void;

  /** Clear search and restore full tree */
  clearSearch: () => void;

  // Content
  /** Update headings extracted from current file (for TOC) */
  setHeadings: (headings: DocumentHeading[]) => void;

  /** Reload current file from disk */
  refreshContent: () => Promise<void>;

  // Preferences
  /** Switch display mode */
  setDisplayMode: (mode: DisplayMode) => void;

  /** Toggle TOC visibility */
  toggleToc: () => void;

  /** Toggle navigation pane (mobile) */
  toggleNavPane: () => void;

  // Quick access
  /** Add/remove file from favorites */
  toggleFavorite: (path: string, name: string) => Promise<void>;

  /** Check if a path is favorited */
  isFavorite: (path: string) => boolean;
}

/**
 * Combined context value type
 */
export interface ReaderContextValue extends ReaderState, ReaderActions {}
