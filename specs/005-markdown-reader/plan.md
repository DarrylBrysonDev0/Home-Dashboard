# Implementation Plan: Markdown Reader

**Branch**: `005-markdown-reader` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-markdown-reader/spec.md`

## Summary

The Markdown Reader provides a read-only document viewing experience for personal documentation stored in a Docker-mounted volume. Key capabilities include tree-based file navigation with lazy loading, CommonMark + GFM markdown rendering with syntax-highlighted code blocks (Shiki), Mermaid diagram support, auto-generated table of contents, dual display modes (themed/reading), and file-based preferences storage (`.reader-prefs.json`). The feature integrates with Cemdash's existing navigation bar and theme system while providing responsive mobile support through a collapsible drawer.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled), React 19.x, Next.js 16.x
**Primary Dependencies**:
- react-markdown (markdown parsing/rendering)
- remark-gfm (GitHub Flavored Markdown)
- shiki (syntax highlighting)
- mermaid (diagram rendering)
- Existing: shadcn/ui, Lucide React, Tailwind CSS

**Storage**:
- File system: Docker-mounted volume at `DOCS_ROOT` (read-only for docs, write for `.reader-prefs.json`)
- No database persistence required (preferences stored in JSON file within docs directory)

**Testing**: Vitest (unit/integration), Playwright (E2E), Testing Library
**Target Platform**: Next.js server (Node.js) + Browser (Chrome, Firefox, Safari)
**Project Type**: Web application (monorepo single Next.js app)
**Performance Goals**:
- File tree load: <500ms for 1000 files
- Markdown render: <300ms for typical documents (<100KB)
- Mermaid diagrams: <2s render time
- Search filtering: <300ms response

**Constraints**:
- Read-only document access (no editing)
- Sandboxed to DOCS_ROOT directory
- Relative image paths only (no external URLs)
- Supported extensions: .md, .mmd, .txt

**Scale/Scope**: Personal documentation library (hundreds to low thousands of files)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | ✅ PASS | All reader components isolated in `components/reader/`, clear props interfaces |
| II. Type Safety (NON-NEGOTIABLE) | ✅ PASS | Zod schemas for API validation, explicit TypeScript interfaces for all components |
| III. Database-First Design | ✅ N/A | No database models needed - file-based preferences storage |
| IV. API Contract Clarity | ✅ PASS | REST API routes with Zod validation, consistent response shapes |
| V. MVP-First, Iterate Second | ✅ PASS | P1 stories deliver standalone file navigation + viewing; P2/P3 are enhancements |
| VI. Authentication (NON-NEGOTIABLE) | ✅ PASS | `/reader` route added to middleware.ts matcher, API routes protected |

### Pre-Design Gate: PASSED

All constitution principles satisfied. Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/005-markdown-reader/
├── plan.md              # This file
├── research.md          # Phase 0 output - technology decisions
├── data-model.md        # Phase 1 output - entity definitions
├── quickstart.md        # Phase 1 output - developer onboarding
├── contracts/           # Phase 1 output - API specifications
│   └── reader-api.yaml  # OpenAPI spec for reader endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Next.js App Router structure (following existing patterns)
app/
├── reader/
│   ├── layout.tsx              # Reader layout with ReaderProvider
│   ├── page.tsx                # Default reader page (empty state)
│   └── [[...path]]/
│       └── page.tsx            # Dynamic file path handling
└── api/
    └── reader/
        ├── tree/
        │   └── route.ts        # GET - Directory tree structure
        ├── file/
        │   └── route.ts        # GET - File content by path
        ├── search/
        │   └── route.ts        # GET - Search files by name
        └── preferences/
            └── route.ts        # GET, PUT - Reader preferences (favorites, recents)

# Component structure (following existing dashboard/calendar patterns)
components/
└── reader/
    ├── ReaderLayout.tsx        # Main layout orchestrator
    ├── navigation/
    │   ├── NavigationPane.tsx  # Container for nav elements
    │   ├── FileTree.tsx        # Recursive directory tree
    │   ├── FileTreeNode.tsx    # Individual tree node
    │   ├── SearchInput.tsx     # File search with filtering
    │   ├── RecentFiles.tsx     # Recent files list
    │   ├── Favorites.tsx       # Bookmarked files list
    │   └── Breadcrumbs.tsx     # Path breadcrumb trail
    ├── content/
    │   ├── ContentViewer.tsx   # Main content container
    │   ├── MarkdownRenderer.tsx # Markdown processing
    │   ├── MermaidRenderer.tsx # Diagram rendering
    │   ├── CodeBlock.tsx       # Syntax-highlighted code
    │   ├── TableOfContents.tsx # Auto-generated TOC
    │   └── EmptyState.tsx      # No file selected state
    ├── controls/
    │   ├── DisplayModeToggle.tsx # Reading/themed mode switch
    │   ├── RefreshButton.tsx   # Content refresh
    │   └── FavoriteToggle.tsx  # Bookmark current file
    └── mobile/
        └── ReaderDrawer.tsx    # Collapsible nav overlay

# Library code
lib/
├── reader/
│   ├── file-system.service.ts  # Sandboxed file access
│   ├── preferences.service.ts  # Read/write .reader-prefs.json
│   ├── markdown-config.ts      # react-markdown plugins config
│   ├── shiki-highlighter.ts    # Syntax highlighter setup
│   └── mermaid-themes.ts       # Theme configuration for diagrams
├── contexts/
│   └── ReaderContext.tsx       # Reader state management
└── validations/
    └── reader.ts               # Zod schemas for reader API

# Tests (following existing structure)
__tests__/
├── unit/
│   └── components/
│       └── reader/             # Component unit tests
├── integration/
│   └── api/
│       └── reader/             # API integration tests
└── e2e/
    └── reader.spec.ts          # E2E user flows
```

**Structure Decision**: Following existing Next.js App Router patterns with route groups and feature-based component organization. API routes use consistent Zod validation and response shapes matching the existing `/api/analytics/*` and `/api/events/*` patterns.

## Complexity Tracking

> No constitution violations requiring justification. Design follows MVP-first principles.

| Decision | Rationale |
|----------|-----------|
| File-based preferences vs DB | Spec requirement: preferences travel with documentation library |
| No external state management | React Context sufficient for reader-scoped state |
| Lazy-load directories | Scale requirement: support large documentation libraries |
