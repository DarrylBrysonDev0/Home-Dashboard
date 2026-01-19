# Data Model: Markdown Reader

**Feature**: 005-markdown-reader
**Date**: 2026-01-19
**Status**: Complete

## Overview

The Markdown Reader uses file-based storage rather than database tables. This design allows preferences to travel with the documentation library when moved between environments. All entities are defined as TypeScript interfaces with corresponding Zod schemas for runtime validation.

---

## Entity Definitions

### FileNode

Represents an item in the file tree (file or directory).

```typescript
// types/reader.ts

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
```

**Zod Schema**:

```typescript
// lib/validations/reader.ts

import { z } from 'zod';

export const fileNodeSchema: z.ZodType<FileNode> = z.object({
  name: z.string().min(1),
  path: z.string(),
  type: z.enum(['file', 'directory']),
  extension: z.string().optional(),
  children: z.lazy(() => z.array(fileNodeSchema)).optional(),
  modifiedAt: z.string().datetime().optional(),
  size: z.number().int().nonnegative().optional(),
  isLoaded: z.boolean().optional(),
  hasChildren: z.boolean().optional(),
});
```

---

### FileContent

Represents loaded file data for rendering.

```typescript
export interface FileContent {
  /** Relative path from docs root */
  path: string;

  /** File name (e.g., "readme.md") */
  name: string;

  /** Raw file content as string */
  content: string;

  /** File extension including dot */
  extension: string;

  /** Last modification timestamp (ISO 8601) */
  modifiedAt: string;

  /** File size in bytes */
  size: number;
}
```

**Zod Schema**:

```typescript
export const fileContentSchema = z.object({
  path: z.string(),
  name: z.string().min(1),
  content: z.string(),
  extension: z.enum(['.md', '.mmd', '.txt']),
  modifiedAt: z.string().datetime(),
  size: z.number().int().nonnegative(),
});

export type FileContent = z.infer<typeof fileContentSchema>;
```

---

### Favorite

A bookmarked file reference stored in preferences.

```typescript
export interface Favorite {
  /** Relative path from docs root */
  path: string;

  /** Display name (file name without path) */
  name: string;

  /** When the favorite was added (ISO 8601) */
  addedAt: string;
}
```

**Zod Schema**:

```typescript
export const favoriteSchema = z.object({
  path: z.string(),
  name: z.string().min(1),
  addedAt: z.string().datetime(),
});

export type Favorite = z.infer<typeof favoriteSchema>;
```

---

### RecentFile

A recently viewed file reference stored in preferences.

```typescript
export interface RecentFile {
  /** Relative path from docs root */
  path: string;

  /** Display name (file name without path) */
  name: string;

  /** When the file was last viewed (ISO 8601) */
  viewedAt: string;
}
```

**Zod Schema**:

```typescript
export const recentFileSchema = z.object({
  path: z.string(),
  name: z.string().min(1),
  viewedAt: z.string().datetime(),
});

export type RecentFile = z.infer<typeof recentFileSchema>;
```

---

### ReaderPreferences

Root preferences object stored as `.reader-prefs.json` in docs root.

```typescript
export interface ReaderPreferences {
  /** Schema version for migrations */
  version: 1;

  /** User's bookmarked files */
  favorites: Favorite[];

  /** Recently viewed files (max 10, newest first) */
  recents: RecentFile[];

  /** Current display mode preference */
  displayMode: 'themed' | 'reading';
}
```

**Zod Schema**:

```typescript
export const displayModeSchema = z.enum(['themed', 'reading']);
export type DisplayMode = z.infer<typeof displayModeSchema>;

export const readerPreferencesSchema = z.object({
  version: z.literal(1),
  favorites: z.array(favoriteSchema),
  recents: z.array(recentFileSchema).max(10),
  displayMode: displayModeSchema,
});

export type ReaderPreferences = z.infer<typeof readerPreferencesSchema>;

/** Default preferences when file doesn't exist or is invalid */
export const defaultPreferences: ReaderPreferences = {
  version: 1,
  favorites: [],
  recents: [],
  displayMode: 'themed',
};
```

---

### DocumentHeading

A heading extracted from markdown for the table of contents.

```typescript
export interface DocumentHeading {
  /** Generated ID for anchor linking (kebab-case of text) */
  id: string;

  /** Raw heading text */
  text: string;

  /** Heading level (1-6 for h1-h6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
}
```

**Zod Schema**:

```typescript
export const documentHeadingSchema = z.object({
  id: z.string(),
  text: z.string(),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
});

export type DocumentHeading = z.infer<typeof documentHeadingSchema>;
```

---

## State Interfaces

### ReaderState

Client-side state managed by ReaderContext.

```typescript
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
```

### ReaderActions

Actions available through ReaderContext.

```typescript
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

export interface ReaderContextValue extends ReaderState, ReaderActions {}
```

---

## API Request/Response Types

### Tree Endpoint

```typescript
// GET /api/reader/tree?path=/optional/directory

export const treeQuerySchema = z.object({
  path: z.string().optional().default('/'),
});

export interface TreeResponse {
  success: true;
  data: {
    path: string;
    children: FileNode[];
  };
}

export interface TreeErrorResponse {
  success: false;
  error: string;
}
```

### File Endpoint

```typescript
// GET /api/reader/file?path=/path/to/file.md

export const fileQuerySchema = z.object({
  path: z.string().min(1),
});

export interface FileResponse {
  success: true;
  data: FileContent;
}

export interface FileErrorResponse {
  success: false;
  error: string;
}
```

### Search Endpoint

```typescript
// GET /api/reader/search?q=query&limit=20

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export interface SearchResponse {
  success: true;
  data: FileNode[];
  query: string;
  total: number;
}
```

### Preferences Endpoint

```typescript
// GET /api/reader/preferences
// PUT /api/reader/preferences

export interface PreferencesResponse {
  success: true;
  data: ReaderPreferences;
}

export const preferencesUpdateSchema = z.object({
  favorites: z.array(favoriteSchema).optional(),
  recents: z.array(recentFileSchema).optional(),
  displayMode: displayModeSchema.optional(),
});

export type PreferencesUpdate = z.infer<typeof preferencesUpdateSchema>;
```

---

## Validation Rules

### Path Validation

| Rule | Implementation |
|------|----------------|
| No path traversal | Reject paths containing `..` |
| Within docs root | Resolved path must start with DOCS_ROOT |
| Extension allowlist | Only `.md`, `.mmd`, `.txt` for documents |
| Image extensions | `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp` for images |

### Preferences Validation

| Rule | Implementation |
|------|----------------|
| Recents limit | Maximum 10 entries, newest first |
| Favorites no duplicates | Unique by path |
| Valid timestamps | ISO 8601 format |
| Version migration | Check version field, migrate if needed |

---

## File Storage Structure

```text
/app/docs/                          # DOCS_ROOT (Docker mount)
├── .reader-prefs.json              # Preferences file
├── README.md                       # Documentation files
├── projects/
│   ├── project-a.md
│   └── architecture.mmd
├── notes/
│   └── meeting-notes.txt
└── images/
    └── diagram.png                 # Relative image references
```

### .reader-prefs.json Example

```json
{
  "version": 1,
  "favorites": [
    {
      "path": "/projects/project-a.md",
      "name": "project-a.md",
      "addedAt": "2026-01-19T10:30:00Z"
    }
  ],
  "recents": [
    {
      "path": "/README.md",
      "name": "README.md",
      "viewedAt": "2026-01-19T14:22:00Z"
    },
    {
      "path": "/projects/project-a.md",
      "name": "project-a.md",
      "viewedAt": "2026-01-19T14:15:00Z"
    }
  ],
  "displayMode": "themed"
}
```
