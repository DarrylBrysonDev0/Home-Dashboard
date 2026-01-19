# Cemdash Markdown Reader - Feature Specification

**Version:** 1.0  
**Date:** January 2026  
**Status:** Draft  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [User Stories](#3-user-stories)
4. [Technical Architecture](#4-technical-architecture)
5. [File System Access Layer](#5-file-system-access-layer)
6. [API Routes](#6-api-routes)
7. [Component Architecture](#7-component-architecture)
8. [State Management](#8-state-management)
9. [Markdown Rendering Pipeline](#9-markdown-rendering-pipeline)
10. [Theme Integration](#10-theme-integration)
11. [Responsive Design](#11-responsive-design)
12. [Data Models](#12-data-models)
13. [Implementation Phases](#13-implementation-phases)
14. [Dependencies](#14-dependencies)
15. [Configuration](#15-configuration)
16. [Security Considerations](#16-security-considerations)

---

## 1. Overview

The Markdown Reader is a new feature for Cemdash that provides a read-only document viewer for markdown files, Mermaid diagrams, and plain text files stored in a Docker-mounted volume. It enables users to navigate their documentation directory structure, view rendered content with syntax highlighting and diagram support, and quickly access frequently used files.

### Key Capabilities

- **File Navigation**: Tree-based directory explorer with search functionality
- **Markdown Rendering**: Full CommonMark + GFM support with syntax-highlighted code blocks
- **Mermaid Support**: Standalone `.mmd` files and embedded diagrams in markdown
- **Dual Theme Modes**: Toggle between neon-themed and clean reading modes
- **Auto-Generated TOC**: Document outline for long-form content navigation
- **Quick Access**: Recent files list and favorites/bookmarks system
- **Mobile-First**: Collapsible navigation drawer for responsive layouts

---

## 2. Goals & Non-Goals

### Goals

- Provide a seamless, read-only viewing experience for personal documentation
- Integrate with existing Cemdash navigation and theme system
- Support technical documentation with code blocks and diagrams
- Enable quick file discovery through search, recents, and favorites
- Maintain the established neon aesthetic while offering a clean reading alternative
- Optimize for home lab Docker deployment

### Non-Goals

- File editing or creation capabilities (read-only by design)
- Version control integration (Git history, diffs, etc.)
- Real-time collaboration or sharing features
- External URL/link fetching (local files only)
- Full wiki-style bidirectional linking (future consideration)
- PDF export or print optimization

---

## 3. User Stories

### Navigation

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| N1 | As a user, I want to browse my documentation folder structure | Tree view displays directories and supported files (.md, .mmd, .txt) |
| N2 | As a user, I want to search for files by name | Search input filters visible tree; results highlight matches |
| N3 | As a user, I want to see my current location via breadcrumbs | Clickable breadcrumb trail shows path from root |
| N4 | As a user, I want to quickly access recently viewed files | Recent files panel shows last 10 viewed documents |
| N5 | As a user, I want to bookmark frequently used documents | Favorites persist across sessions; toggle via icon |

### Content Viewing

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| C1 | As a user, I want to view rendered markdown with proper formatting | Headers, lists, tables, links, images render correctly |
| C2 | As a user, I want syntax-highlighted code blocks | Language detection; theme-appropriate colors |
| C3 | As a user, I want to view Mermaid diagrams | Embedded and standalone `.mmd` files render as SVG |
| C4 | As a user, I want an auto-generated table of contents | TOC panel shows document headings; click to scroll |
| C5 | As a user, I want to toggle between themed and reading modes | Instant switch; preference persists |
| C6 | As a user, I want to refresh content without full page reload | Refresh button re-fetches current file |

### Mobile Experience

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| M1 | As a mobile user, I want the nav pane as a collapsible drawer | Hamburger menu toggles overlay; swipe to close |
| M2 | As a mobile user, I want comfortable reading on small screens | Content fills viewport; appropriate font sizing |

---

## 4. Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cemdash Application                          │
├─────────────────────────────────────────────────────────────────────┤
│  /reader route                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    ReaderLayout Component                        ││
│  │  ┌──────────────┐  ┌────────────────────────────────────────┐  ││
│  │  │  Navigation  │  │           Content Viewer               │  ││
│  │  │    Pane      │  │  ┌────────────┐  ┌─────────────────┐  │  ││
│  │  │              │  │  │    TOC     │  │  Rendered       │  │  ││
│  │  │ • File Tree  │  │  │   Panel    │  │  Markdown       │  │  ││
│  │  │ • Search     │  │  │            │  │                 │  │  ││
│  │  │ • Recents    │  │  └────────────┘  │  • Prose        │  │  ││
│  │  │ • Favorites  │  │                  │  • Code blocks  │  │  ││
│  │  │              │  │                  │  • Mermaid      │  │  ││
│  │  └──────────────┘  │                  │  • Tables       │  │  ││
│  │                    │                  └─────────────────┘  │  ││
│  │                    └────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  API Layer (/api/reader/*)                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   /tree     │  │   /file     │  │  /favorites │  │  /recents  │ │
│  │  Directory  │  │   Content   │  │   CRUD      │  │   List     │ │
│  │  Structure  │  │   Fetch     │  │             │  │            │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  File System Access Layer                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  FileSystemService (sandboxed to DOCS_ROOT)                     ││
│  │  • Path validation & sanitization                               ││
│  │  • Directory traversal                                          ││
│  │  • File reading                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  Docker Volume Mount                                                │
│  /app/docs ← Host: /path/to/your/documents                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Alignment

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14+ (App Router) | Consistent with existing Cemdash |
| Language | TypeScript | Full type safety |
| UI Components | shadcn/ui | Consistent component library |
| Markdown | react-markdown + remark/rehype | Extensible pipeline |
| Syntax Highlighting | Shiki | Theme integration, SSR support |
| Mermaid | mermaid.js | Client-side rendering |
| State | React Context + useState | Lightweight, no external deps |
| Persistence | Prisma + MSSQL | Favorites, recents storage |
| Styling | Tailwind CSS | Existing design system |

---

## 5. File System Access Layer

### FileSystemService

A server-side service that provides sandboxed access to the mounted documentation directory.

```typescript
// lib/reader/file-system.service.ts

interface FileSystemConfig {
  rootPath: string;           // From DOCS_ROOT env var
  allowedExtensions: string[]; // ['.md', '.mmd', '.txt']
  maxDepth: number;           // -1 for unlimited
}

interface FileNode {
  name: string;
  path: string;          // Relative to root
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
  modifiedAt?: Date;
}

interface FileContent {
  path: string;
  name: string;
  content: string;
  extension: string;
  modifiedAt: Date;
  size: number;
}

class FileSystemService {
  constructor(config: FileSystemConfig);
  
  // Directory operations
  getTree(): Promise<FileNode>;
  getDirectory(relativePath: string): Promise<FileNode[]>;
  
  // File operations
  getFile(relativePath: string): Promise<FileContent>;
  fileExists(relativePath: string): Promise<boolean>;
  
  // Search
  searchFiles(query: string): Promise<FileNode[]>;
  
  // Path utilities (private)
  private validatePath(relativePath: string): boolean;
  private sanitizePath(relativePath: string): string;
  private isAllowedExtension(filename: string): boolean;
}
```

### Path Validation Rules

1. **No path traversal**: Reject paths containing `..`
2. **Resolve to root**: All paths must resolve within `DOCS_ROOT`
3. **Extension whitelist**: Only serve `.md`, `.mmd`, `.txt` files
4. **Normalize paths**: Handle leading/trailing slashes consistently

```typescript
// Example validation
private validatePath(relativePath: string): boolean {
  // Reject obvious traversal attempts
  if (relativePath.includes('..')) return false;
  
  // Resolve full path and ensure it's within root
  const fullPath = path.resolve(this.config.rootPath, relativePath);
  return fullPath.startsWith(this.config.rootPath);
}
```

---

## 6. API Routes

### Route Structure

```
/api/reader/
├── tree/
│   └── route.ts          GET - Full directory tree
├── file/
│   └── route.ts          GET - File content by path
├── search/
│   └── route.ts          GET - Search files by query
├── favorites/
│   └── route.ts          GET, POST, DELETE - Manage favorites
└── recents/
    └── route.ts          GET, POST - Recent files
```

### Endpoint Specifications

#### GET /api/reader/tree

Returns the complete directory tree structure.

**Response:**
```typescript
interface TreeResponse {
  success: boolean;
  data: FileNode;
  error?: string;
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "name": "docs",
    "path": "/",
    "type": "directory",
    "children": [
      {
        "name": "projects",
        "path": "/projects",
        "type": "directory",
        "children": [
          {
            "name": "cemdash.md",
            "path": "/projects/cemdash.md",
            "type": "file",
            "extension": ".md"
          }
        ]
      },
      {
        "name": "architecture.mmd",
        "path": "/architecture.mmd",
        "type": "file",
        "extension": ".mmd"
      }
    ]
  }
}
```

#### GET /api/reader/file

Retrieves content of a specific file.

**Query Parameters:**
- `path` (required): Relative path to file

**Response:**
```typescript
interface FileResponse {
  success: boolean;
  data: {
    path: string;
    name: string;
    content: string;
    extension: string;
    modifiedAt: string;
    size: number;
  };
  error?: string;
}
```

#### GET /api/reader/search

Searches files by name/path.

**Query Parameters:**
- `q` (required): Search query string
- `limit` (optional): Max results (default: 20)

**Response:**
```typescript
interface SearchResponse {
  success: boolean;
  data: FileNode[];
  query: string;
  total: number;
}
```

#### GET/POST/DELETE /api/reader/favorites

Manages user's bookmarked files.

**GET Response:**
```typescript
interface FavoritesResponse {
  success: boolean;
  data: Array<{
    id: string;
    path: string;
    name: string;
    addedAt: string;
  }>;
}
```

**POST Body:**
```typescript
{ path: string }
```

**DELETE Query:**
- `path`: File path to remove from favorites

#### GET/POST /api/reader/recents

Manages recently viewed files.

**GET Response:**
```typescript
interface RecentsResponse {
  success: boolean;
  data: Array<{
    path: string;
    name: string;
    viewedAt: string;
  }>;
}
```

**POST Body:**
```typescript
{ path: string }
```

---

## 7. Component Architecture

### Component Hierarchy

```
app/reader/
├── layout.tsx                    # Reader-specific layout
├── page.tsx                      # Main reader page
└── [[...path]]/
    └── page.tsx                  # Dynamic file path handling

components/reader/
├── ReaderLayout.tsx              # Main layout orchestrator
├── navigation/
│   ├── NavigationPane.tsx        # Container for all nav elements
│   ├── FileTree.tsx              # Recursive directory tree
│   ├── FileTreeNode.tsx          # Individual tree node
│   ├── SearchInput.tsx           # File search with results
│   ├── RecentFiles.tsx           # Recent files list
│   ├── Favorites.tsx             # Bookmarked files list
│   └── Breadcrumbs.tsx           # Path breadcrumb trail
├── content/
│   ├── ContentViewer.tsx         # Main content container
│   ├── MarkdownRenderer.tsx      # Markdown processing
│   ├── MermaidRenderer.tsx       # Mermaid diagram rendering
│   ├── CodeBlock.tsx             # Syntax-highlighted code
│   ├── TableOfContents.tsx       # Auto-generated TOC
│   └── EmptyState.tsx            # No file selected state
├── controls/
│   ├── ThemeModeToggle.tsx       # Reading/Themed mode switch
│   ├── RefreshButton.tsx         # Content refresh
│   └── FavoriteToggle.tsx        # Bookmark current file
└── mobile/
    └── MobileDrawer.tsx          # Collapsible nav overlay
```

### Key Component Specifications

#### ReaderLayout

Main orchestrator component managing the dual-pane layout.

```typescript
interface ReaderLayoutProps {
  children: React.ReactNode;
}

// Responsibilities:
// - Manages navigation pane visibility (mobile drawer)
// - Provides ReaderContext to children
// - Handles keyboard shortcuts
// - Coordinates responsive breakpoints
```

#### FileTree

Recursive tree component for directory navigation.

```typescript
interface FileTreeProps {
  node: FileNode;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onToggleExpand: (path: string) => void;
  searchHighlight?: string;
}

// Features:
// - Lazy loading of deep directories
// - Expand/collapse with persistence
// - Visual indication of selected file
// - Search term highlighting
// - File type icons by extension
```

#### MarkdownRenderer

Core markdown processing component.

```typescript
interface MarkdownRendererProps {
  content: string;
  mode: 'themed' | 'reading';
  onHeadingsExtracted: (headings: Heading[]) => void;
}

interface Heading {
  id: string;
  text: string;
  level: number;
}

// Responsibilities:
// - Parse and render markdown
// - Extract headings for TOC
// - Handle embedded Mermaid code blocks
// - Apply theme-appropriate styling
```

#### MermaidRenderer

Handles Mermaid diagram rendering.

```typescript
interface MermaidRendererProps {
  code: string;
  mode: 'themed' | 'reading';
}

// Considerations:
// - Client-side only (useEffect + dynamic import)
// - Theme-aware color configuration
// - Error boundary for invalid diagrams
// - Loading state during render
```

---

## 8. State Management

### ReaderContext

Central state management using React Context.

```typescript
// contexts/ReaderContext.tsx

interface ReaderState {
  // Navigation
  currentPath: string | null;
  expandedPaths: Set<string>;
  searchQuery: string;
  searchResults: FileNode[];
  
  // Content
  currentFile: FileContent | null;
  isLoading: boolean;
  error: string | null;
  
  // User preferences
  displayMode: 'themed' | 'reading';
  tocVisible: boolean;
  navPaneVisible: boolean;
  
  // Quick access
  recentFiles: RecentFile[];
  favorites: Favorite[];
}

interface ReaderActions {
  // Navigation
  selectFile: (path: string) => Promise<void>;
  toggleExpand: (path: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Content
  refreshContent: () => Promise<void>;
  
  // Preferences
  setDisplayMode: (mode: 'themed' | 'reading') => void;
  toggleToc: () => void;
  toggleNavPane: () => void;
  
  // Quick access
  toggleFavorite: (path: string) => Promise<void>;
  addToRecents: (path: string) => Promise<void>;
}

interface ReaderContextValue extends ReaderState, ReaderActions {}
```

### State Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  ReaderContext  │
│    dispatch     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────────┐
│ State │  │ API Call  │
│Update │  │ (if needed)│
└───┬───┘  └─────┬─────┘
    │            │
    ▼            ▼
┌─────────────────────┐
│   Component Re-render│
└─────────────────────┘
```

### Persistence Strategy

| Data | Storage | Sync |
|------|---------|------|
| Display mode | localStorage | Immediate |
| Expanded paths | localStorage | Debounced |
| TOC visibility | localStorage | Immediate |
| Recent files | Prisma/MSSQL | On file open |
| Favorites | Prisma/MSSQL | On toggle |

---

## 9. Markdown Rendering Pipeline

### Processing Flow

```
Raw Content (string)
        │
        ▼
┌─────────────────────┐
│   react-markdown    │
│   (CommonMark base) │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│ remark │  │  rehype  │
│plugins │  │ plugins  │
└────┬───┘  └────┬─────┘
     │           │
     ▼           ▼
┌─────────────────────┐
│  Plugin Processing  │
│  • remark-gfm       │  ← Tables, strikethrough, autolinks
│  • remark-slug      │  ← Heading IDs for TOC
│  • rehype-shiki     │  ← Syntax highlighting
│  • rehype-mermaid   │  ← Diagram detection
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Custom Components  │
│  • CodeBlock        │
│  • MermaidRenderer  │
│  • ThemedHeading    │
│  • ThemedTable      │
└──────────┬──────────┘
           │
           ▼
    Rendered React
```

### Plugin Configuration

```typescript
// lib/reader/markdown-config.ts

import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeShiki from '@shikijs/rehype';
import { getHighlighter } from 'shiki';

export const remarkPlugins = [
  remarkGfm,
  remarkSlug,
];

export const rehypePlugins = [
  [rehypeShiki, {
    highlighter: await getHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript', 'typescript', 'python', 'rust',
        'sql', 'bash', 'json', 'yaml', 'markdown',
        'css', 'html', 'jsx', 'tsx', 'csharp',
      ],
    }),
    defaultTheme: 'github-dark',
  }],
];

// Custom components mapping
export const markdownComponents = {
  code: CodeBlock,
  h1: ThemedHeading,
  h2: ThemedHeading,
  h3: ThemedHeading,
  h4: ThemedHeading,
  h5: ThemedHeading,
  h6: ThemedHeading,
  table: ThemedTable,
  pre: PreBlock,
};
```

### Mermaid Integration

```typescript
// components/reader/content/MermaidRenderer.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  mode: 'themed' | 'reading';
}

export function MermaidRenderer({ code, mode }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configure Mermaid based on display mode
    mermaid.initialize({
      startOnLoad: false,
      theme: mode === 'themed' ? 'dark' : 'neutral',
      themeVariables: mode === 'themed' ? {
        primaryColor: '#FF6B6B',      // Coral
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: '#4ECDC4', // Mint
        lineColor: '#4ECDC4',
        secondaryColor: '#2D3748',
        tertiaryColor: '#1A202C',
      } : undefined,
    });

    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(
          `mermaid-${Date.now()}`,
          code
        );
        setSvg(svg);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Diagram error');
      }
    };

    renderDiagram();
  }, [code, mode]);

  if (error) {
    return (
      <div className="mermaid-error">
        <p>Unable to render diagram</p>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

---

## 10. Theme Integration

### Dual Mode System

The reader supports two display modes that integrate with Cemdash's existing theme system:

#### Themed Mode (Neon Aesthetic)

Applies the established Cemdash visual identity:

```css
/* Themed mode variables */
.reader-themed {
  --reader-bg: var(--background);           /* Deep dark */
  --reader-text: var(--foreground);
  --reader-heading: var(--coral-500);       /* Glowing coral */
  --reader-link: var(--mint-400);           /* Mint links */
  --reader-code-bg: var(--card);
  --reader-code-border: var(--mint-500);
  --reader-blockquote: var(--coral-400);
  --reader-table-header: var(--coral-600);
  
  /* Glow effects on headings */
  --heading-glow: 0 0 20px rgba(255, 107, 107, 0.3);
}
```

#### Reading Mode (Clean/Neutral)

Optimized for long-form content consumption:

```css
/* Reading mode variables - light theme base */
.reader-reading {
  --reader-bg: #FAFAFA;
  --reader-text: #1A202C;
  --reader-heading: #2D3748;
  --reader-link: #3182CE;
  --reader-code-bg: #EDF2F7;
  --reader-code-border: #E2E8F0;
  --reader-blockquote: #718096;
  --reader-table-header: #EDF2F7;
  
  /* No glow effects */
  --heading-glow: none;
}

/* Reading mode - dark variant */
.reader-reading.dark {
  --reader-bg: #1A202C;
  --reader-text: #E2E8F0;
  --reader-heading: #F7FAFC;
  --reader-link: #63B3ED;
  --reader-code-bg: #2D3748;
  --reader-code-border: #4A5568;
}
```

### Shiki Theme Mapping

```typescript
// lib/reader/shiki-themes.ts

export const shikiThemes = {
  themed: {
    dark: 'one-dark-pro',  // Neon-friendly
    light: 'one-dark-pro', // Keep dark even in light mode for contrast
  },
  reading: {
    dark: 'github-dark',
    light: 'github-light',
  },
};

export function getShikiTheme(
  displayMode: 'themed' | 'reading',
  systemTheme: 'dark' | 'light'
): string {
  return shikiThemes[displayMode][systemTheme];
}
```

---

## 11. Responsive Design

### Breakpoint Strategy

| Breakpoint | Width | Layout Behavior |
|------------|-------|-----------------|
| Mobile | < 768px | Nav as drawer overlay, single column |
| Tablet | 768px - 1024px | Collapsible nav sidebar, two column |
| Desktop | > 1024px | Fixed nav sidebar, three column (nav + content + TOC) |

### Layout Specifications

#### Desktop (>1024px)

```
┌────────────────────────────────────────────────────────────────┐
│  Cemdash Header / Navigation Bar                               │
├──────────────┬─────────────────────────────────┬───────────────┤
│   Nav Pane   │       Content Area              │    TOC        │
│   280px      │       flex-1                    │    200px      │
│              │                                 │               │
│  ┌────────┐  │  ┌─────────────────────────┐   │  ┌─────────┐  │
│  │Search  │  │  │ Breadcrumbs             │   │  │ On This │  │
│  └────────┘  │  │ ThemeToggle | Refresh   │   │  │  Page   │  │
│              │  └─────────────────────────┘   │  ├─────────┤  │
│  ┌────────┐  │                                │  │ • H1    │  │
│  │Recents │  │  ┌─────────────────────────┐   │  │   • H2  │  │
│  └────────┘  │  │                         │   │  │   • H2  │  │
│              │  │    Rendered Content     │   │  │ • H1    │  │
│  ┌────────┐  │  │                         │   │  │   • H2  │  │
│  │Favs    │  │  │                         │   │  └─────────┘  │
│  └────────┘  │  │                         │   │               │
│              │  │                         │   │               │
│  ┌────────┐  │  │                         │   │               │
│  │ File   │  │  └─────────────────────────┘   │               │
│  │ Tree   │  │                                │               │
│  │        │  │                                │               │
│  └────────┘  │                                │               │
└──────────────┴─────────────────────────────────┴───────────────┘
```

#### Mobile (<768px)

```
┌─────────────────────────────┐
│  ☰  Cemdash       ThemeToggle │
├─────────────────────────────┤
│  Breadcrumbs                │
│  Refresh | ★ Favorite       │
├─────────────────────────────┤
│                             │
│                             │
│     Rendered Content        │
│     (full width)            │
│                             │
│                             │
│                             │
│                             │
└─────────────────────────────┘

     Drawer Overlay (when open)
┌─────────────────────────────┐
│  ✕  Navigation              │
├─────────────────────────────┤
│  🔍 Search...               │
├─────────────────────────────┤
│  Recent Files               │
│  • file1.md                 │
│  • file2.md                 │
├─────────────────────────────┤
│  Favorites                  │
│  • starred.md               │
├─────────────────────────────┤
│  📁 docs/                   │
│    📁 projects/             │
│      📄 readme.md           │
│    📄 notes.md              │
└─────────────────────────────┘
```

### Mobile Drawer Implementation

```typescript
// components/reader/mobile/MobileDrawer.tsx

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileDrawer({ isOpen, onClose, children }: MobileDrawerProps) {
  // Features:
  // - Slide-in from left animation
  // - Backdrop overlay with click-to-close
  // - Swipe gesture to close (touch events)
  // - Focus trap when open
  // - Escape key to close
  // - Scroll lock on body when open
}
```

---

## 12. Data Models

### Prisma Schema Additions

```prisma
// prisma/schema.prisma

model ReaderFavorite {
  id        String   @id @default(cuid())
  userId    String   // For future multi-user support
  path      String   @db.NVarChar(500)
  name      String   @db.NVarChar(255)
  addedAt   DateTime @default(now())
  
  @@unique([userId, path])
  @@index([userId])
}

model ReaderRecent {
  id        String   @id @default(cuid())
  userId    String
  path      String   @db.NVarChar(500)
  name      String   @db.NVarChar(255)
  viewedAt  DateTime @default(now())
  
  @@unique([userId, path])
  @@index([userId, viewedAt])
}
```

### TypeScript Interfaces

```typescript
// types/reader.ts

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
  modifiedAt?: string;
  size?: number;
}

export interface FileContent {
  path: string;
  name: string;
  content: string;
  extension: string;
  modifiedAt: string;
  size: number;
}

export interface Favorite {
  id: string;
  path: string;
  name: string;
  addedAt: string;
}

export interface RecentFile {
  path: string;
  name: string;
  viewedAt: string;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
  children?: Heading[];
}

export type DisplayMode = 'themed' | 'reading';

export interface ReaderPreferences {
  displayMode: DisplayMode;
  tocVisible: boolean;
  expandedPaths: string[];
}
```

---

## 13. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)

**Goal:** Basic read-only viewer with file tree navigation

**Deliverables:**
- [ ] FileSystemService with path validation
- [ ] API routes: `/tree`, `/file`
- [ ] ReaderLayout component
- [ ] FileTree component with expand/collapse
- [ ] Basic MarkdownRenderer (no Mermaid yet)
- [ ] Route structure: `/reader/[[...path]]`
- [ ] Breadcrumb navigation

**Technical Focus:**
- Docker volume mount configuration
- Path security validation
- react-markdown setup with remark-gfm

### Phase 2: Enhanced Rendering (Week 3)

**Goal:** Full markdown support with syntax highlighting and diagrams

**Deliverables:**
- [ ] Shiki integration for code blocks
- [ ] MermaidRenderer component
- [ ] Standalone `.mmd` file support
- [ ] Auto-generated Table of Contents
- [ ] Heading ID generation for TOC links
- [ ] CodeBlock component with copy button

**Technical Focus:**
- Shiki highlighter configuration
- Mermaid client-side initialization
- TOC extraction from markdown AST

### Phase 3: Theme System (Week 4)

**Goal:** Dual display modes with full theme integration

**Deliverables:**
- [ ] ThemeModeToggle component
- [ ] Themed mode CSS variables
- [ ] Reading mode CSS variables
- [ ] Shiki theme switching
- [ ] Mermaid theme configuration
- [ ] localStorage persistence for preference

**Technical Focus:**
- CSS custom properties architecture
- Runtime theme switching
- Consistent styling across components

### Phase 4: Quick Access Features (Week 5)

**Goal:** Search, recents, and favorites

**Deliverables:**
- [ ] SearchInput with file filtering
- [ ] Search results highlighting in tree
- [ ] RecentFiles component
- [ ] Favorites component
- [ ] API routes: `/search`, `/favorites`, `/recents`
- [ ] Prisma models for persistence
- [ ] FavoriteToggle button

**Technical Focus:**
- Efficient file search algorithm
- Prisma integration for favorites/recents
- Debounced search input

### Phase 5: Mobile & Polish (Week 6)

**Goal:** Responsive design and UX refinements

**Deliverables:**
- [ ] MobileDrawer component
- [ ] Responsive breakpoint handling
- [ ] Touch gesture support
- [ ] RefreshButton with loading state
- [ ] Empty state designs
- [ ] Error handling UI
- [ ] Keyboard shortcuts (navigation, search)
- [ ] Performance optimization (lazy loading)

**Technical Focus:**
- Touch event handling
- Animation performance
- Accessibility (keyboard nav, screen readers)

---

## 14. Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "remark-slug": "^7.0.1",
    "rehype-raw": "^7.0.0",
    "shiki": "^1.1.0",
    "@shikijs/rehype": "^1.1.0",
    "mermaid": "^10.6.1"
  }
}
```

### Existing Dependencies (Already in Cemdash)

- Next.js 14+
- TypeScript
- Prisma
- shadcn/ui
- Tailwind CSS
- Lucide React (icons)

---

## 15. Configuration

### Environment Variables

```env
# .env.local

# Required: Root directory for documentation files
DOCS_ROOT=/app/docs

# Optional: Maximum directory depth (-1 for unlimited)
DOCS_MAX_DEPTH=-1

# Optional: Custom allowed extensions (comma-separated)
DOCS_EXTENSIONS=.md,.mmd,.txt
```

### Docker Compose Addition

```yaml
# docker-compose.yml

services:
  cemdash:
    # ... existing configuration
    volumes:
      - ./data:/app/data                    # Existing
      - /path/to/your/docs:/app/docs:ro     # NEW: Read-only mount
    environment:
      - DOCS_ROOT=/app/docs
```

### Next.js Configuration

```typescript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  
  // Enable server-side file system access
  serverExternalPackages: ['shiki'],
  
  // Webpack configuration for Mermaid
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};
```

---

## 16. Security Considerations

### Path Traversal Prevention

```typescript
// lib/reader/file-system.service.ts

import path from 'path';

private validatePath(relativePath: string): boolean {
  // 1. Reject explicit traversal patterns
  if (relativePath.includes('..')) {
    console.warn(`Path traversal attempt blocked: ${relativePath}`);
    return false;
  }
  
  // 2. Normalize and resolve full path
  const normalizedRelative = path.normalize(relativePath);
  const fullPath = path.resolve(this.config.rootPath, normalizedRelative);
  
  // 3. Ensure resolved path is within root
  if (!fullPath.startsWith(path.resolve(this.config.rootPath))) {
    console.warn(`Path escaped root: ${relativePath} -> ${fullPath}`);
    return false;
  }
  
  return true;
}
```

### Extension Whitelist

```typescript
private isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return this.config.allowedExtensions.includes(ext);
}
```

### API Rate Limiting (Optional Enhancement)

For future consideration if exposed beyond home lab:

```typescript
// middleware.ts (conceptual)

import { rateLimit } from '@/lib/rate-limit';

export const readerRateLimit = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});
```

### Content Security

- Files are read-only; no write operations exposed
- Content is rendered client-side; no server-side code execution
- Mermaid diagrams are sandboxed within the browser
- No external URL fetching from markdown content

---

## Appendix A: File Icons Mapping

```typescript
// lib/reader/file-icons.ts

import { 
  FileText, 
  FileCode, 
  GitBranch, 
  File 
} from 'lucide-react';

export const fileIcons = {
  '.md': FileText,
  '.mmd': GitBranch,  // Mermaid
  '.txt': File,
  'directory': FolderIcon,
};
```

---

## Appendix B: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search |
| `Ctrl/Cmd + B` | Toggle navigation pane |
| `Ctrl/Cmd + \` | Toggle TOC |
| `Ctrl/Cmd + D` | Toggle favorite |
| `Ctrl/Cmd + R` | Refresh content |
| `Escape` | Close mobile drawer / Clear search |
| `↑ / ↓` | Navigate file tree |
| `Enter` | Open selected file |
| `← / →` | Collapse / Expand directory |

---

## Appendix C: Sample Mermaid Theme Configuration

```typescript
// lib/reader/mermaid-themes.ts

export const mermaidThemes = {
  themed: {
    theme: 'dark',
    themeVariables: {
      // Primary colors (coral/salmon)
      primaryColor: '#FF6B6B',
      primaryTextColor: '#FFFFFF',
      primaryBorderColor: '#FF8E8E',
      
      // Secondary colors (mint/teal)
      secondaryColor: '#4ECDC4',
      secondaryTextColor: '#1A202C',
      secondaryBorderColor: '#6EE7DE',
      
      // Tertiary/background
      tertiaryColor: '#2D3748',
      tertiaryTextColor: '#E2E8F0',
      tertiaryBorderColor: '#4A5568',
      
      // Lines and borders
      lineColor: '#4ECDC4',
      
      // Backgrounds
      mainBkg: '#1A202C',
      nodeBkg: '#2D3748',
      
      // Text
      textColor: '#E2E8F0',
      
      // Special elements
      noteTextColor: '#1A202C',
      noteBkgColor: '#4ECDC4',
      activationBkgColor: '#FF6B6B',
    },
  },
  reading: {
    theme: 'neutral',
    // Uses Mermaid defaults
  },
};
```

---

*End of Specification*
