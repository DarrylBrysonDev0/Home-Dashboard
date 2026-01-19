# Research: Markdown Reader

**Feature**: 005-markdown-reader
**Date**: 2026-01-19
**Status**: Complete

## Overview

This document captures research findings and technology decisions for the Markdown Reader feature. Each section addresses a specific technical area identified during planning.

---

## 1. Markdown Rendering Library

### Decision: `react-markdown` v9+

### Rationale

- **React-native integration**: Renders markdown directly to React components, enabling custom component overrides for code blocks, headings, etc.
- **Plugin ecosystem**: Supports remark (parsing) and rehype (transformation) plugins for extensibility
- **Active maintenance**: Regular updates, TypeScript support, React 19 compatibility
- **CommonMark compliant**: Follows the CommonMark specification with optional GFM extensions
- **Safe by default**: Does not use innerHTML, avoiding XSS vulnerabilities

### Alternatives Considered

| Library | Pros | Cons | Why Rejected |
|---------|------|------|--------------|
| `marked` + innerHTML | Fast, lightweight | XSS risk without sanitization, no React integration | Security concerns, requires sanitization library |
| `markdown-it` | Extensible, fast | Requires HTML output + sanitization | Similar issues to marked |
| `mdx` | Full React in markdown | Overkill for read-only viewer, build-time compilation | Adds complexity, not needed for display-only |
| `@mdx-js/mdx` (runtime) | Runtime compilation | Performance overhead, security considerations | Too heavy for simple rendering |

### Implementation Notes

```typescript
// Basic setup with plugins - safe by design (no innerHTML)
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {content}
</ReactMarkdown>
```

---

## 2. Syntax Highlighting

### Decision: `shiki` v1+

### Rationale

- **VS Code accuracy**: Uses TextMate grammars (same as VS Code) for accurate highlighting
- **Theme variety**: Supports VS Code themes out of the box
- **SSR-friendly**: Can pre-render HTML on server (unlike Prism which requires DOM)
- **No runtime styles**: Outputs inline styles, no CSS conflicts
- **TypeScript support**: Full type definitions

### Alternatives Considered

| Library | Pros | Cons | Why Rejected |
|---------|------|------|--------------|
| `prism-react-renderer` | React integration, popular | Limited themes, requires client-side rendering | SSR limitations |
| `highlight.js` | Lightweight, many languages | Less accurate than TextMate grammars | Quality trade-off |
| `rehype-highlight` | rehype plugin | Uses highlight.js underneath | Same limitations |

### Implementation Notes

```typescript
// Pre-create highlighter with commonly used languages
import { getHighlighter, Highlighter } from 'shiki';

const highlighter = await getHighlighter({
  themes: ['github-dark', 'github-light', 'one-dark-pro'],
  langs: ['typescript', 'javascript', 'python', 'bash', 'sql', 'json', 'yaml', 'markdown', 'css', 'html'],
});
```

**Performance consideration**: Initialize highlighter once at server startup, not per-request.

---

## 3. Mermaid Diagram Rendering

### Decision: Client-side `mermaid` v10+ with lazy loading

### Rationale

- **Official library**: Mermaid.js is the standard for these diagrams
- **Client-side required**: Mermaid renders to SVG in browser (requires DOM)
- **Theme customization**: Supports custom theme variables for integration with app themes
- **Wide diagram support**: Flowcharts, sequence, class, state, ER, Gantt, pie charts

### Alternatives Considered

| Approach | Pros | Cons | Why Rejected |
|----------|------|------|--------------|
| Server-side rendering (Puppeteer) | Pre-rendered SVG | Heavy dependency, slow, Docker complexity | Infrastructure overhead |
| `mermaid-cli` | Pre-process files | Requires build step, not dynamic | Static content only |
| `kroki.io` API | External service | External dependency, latency, privacy concerns | Self-hosted requirement |

### Implementation Notes

```typescript
'use client';
import mermaid from 'mermaid';

// Initialize with theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark', // or 'neutral' for reading mode
  themeVariables: { /* custom colors */ }
});

// Render on mount using mermaid.render() API
const { svg } = await mermaid.render(`mermaid-${id}`, code);
// Insert SVG into container element via React ref
```

**Key considerations**:
- Use `'use client'` directive - Mermaid requires browser DOM
- Generate unique IDs for each diagram to avoid conflicts
- Implement error boundary for invalid diagram syntax
- Re-render when theme changes

---

## 4. File-Based Preferences Storage

### Decision: JSON file (`.reader-prefs.json`) in documentation root

### Rationale (from spec clarification)

- **Portability**: Preferences travel with the documentation library
- **Simplicity**: No database schema changes needed
- **User control**: Users can backup/modify preferences with documentation
- **Docker-friendly**: Works with volume mounts

### Schema Design

```typescript
interface ReaderPreferences {
  version: 1;
  favorites: Array<{
    path: string;      // Relative path from docs root
    name: string;      // Display name
    addedAt: string;   // ISO 8601 timestamp
  }>;
  recents: Array<{
    path: string;
    name: string;
    viewedAt: string;  // ISO 8601 timestamp
  }>;
  displayMode: 'themed' | 'reading';
}
```

### Implementation Notes

- **Atomic writes**: Write to temp file, then rename (prevents corruption)
- **Graceful degradation**: If file is missing/corrupted, use defaults
- **Concurrent access**: Single-user app, but use file locking for safety
- **Validation**: Zod schema to validate on read

```typescript
// Safe write pattern
import { writeFile, rename } from 'fs/promises';

const tempPath = `${prefsPath}.tmp`;
await writeFile(tempPath, JSON.stringify(prefs, null, 2));
await rename(tempPath, prefsPath);
```

---

## 5. Path Security (Directory Traversal Prevention)

### Decision: Multi-layer validation with path resolution

### Rationale

- **Defense in depth**: Multiple validation layers prevent bypasses
- **Node.js standard**: Use `path.resolve()` for canonical path resolution
- **Allowlist approach**: Only serve explicitly allowed extensions

### Validation Strategy

1. **Reject explicit traversal**: Check for `..` in raw input
2. **Normalize path**: Use `path.normalize()` to handle `./`, `//`, etc.
3. **Resolve and compare**: Resolve full path, verify starts with DOCS_ROOT
4. **Extension check**: Only allow `.md`, `.mmd`, `.txt`

```typescript
function validatePath(relativePath: string, docsRoot: string): string | null {
  // Layer 1: Reject obvious traversal
  if (relativePath.includes('..')) return null;

  // Layer 2: Normalize
  const normalized = path.normalize(relativePath);

  // Layer 3: Resolve and check containment
  const fullPath = path.resolve(docsRoot, normalized);
  if (!fullPath.startsWith(path.resolve(docsRoot))) return null;

  // Layer 4: Extension allowlist
  const ext = path.extname(fullPath).toLowerCase();
  if (!['.md', '.mmd', '.txt'].includes(ext)) return null;

  return fullPath;
}
```

### Additional Safeguards

- **Symlink handling**: Use `fs.realpath()` to resolve symlinks, then re-validate
- **Hidden files**: Optionally skip files/directories starting with `.` (except `.reader-prefs.json`)
- **Error messages**: Don't reveal internal paths in error responses

---

## 6. Internal Link Routing

### Decision: Client-side link interception with smart routing

### Rationale (from spec clarification)

- **Internal links**: Relative paths to `.md/.mmd/.txt` files open in reader
- **External links**: HTTP/HTTPS URLs open in new tab
- **Seamless UX**: No page reloads for internal navigation

### Implementation Notes

```typescript
// Custom link component for react-markdown
function MarkdownLink({ href, children }: { href?: string; children: React.ReactNode }) {
  const router = useRouter();

  if (!href) return <span>{children}</span>;

  // External URLs
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }

  // Internal document links
  const isDocLink = /\.(md|mmd|txt)$/i.test(href);
  if (isDocLink) {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(`/reader/${href}`);
    };
    return <a href={href} onClick={handleClick}>{children}</a>;
  }

  // Anchor links within document
  if (href.startsWith('#')) {
    return <a href={href}>{children}</a>;
  }

  // Unknown - render as text
  return <span>{children}</span>;
}
```

---

## 7. Image Handling

### Decision: Relative paths only, validated against docs root

### Rationale (from spec clarification)

- **Security**: Prevent fetching external resources
- **Simplicity**: Images must exist within documentation directory
- **Consistency**: Same path validation as documents

### Implementation Notes

```typescript
// Custom image component
function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;

  // Block external URLs
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return <span className="text-muted-foreground">[External image blocked: {alt}]</span>;
  }

  // Construct API path for image serving
  const imagePath = `/api/reader/image?path=${encodeURIComponent(src)}`;
  return <img src={imagePath} alt={alt || ''} className="max-w-full h-auto" />;
}
```

**API endpoint**: `/api/reader/image` route validates path and streams image with appropriate MIME type.

---

## 8. Lazy Directory Loading

### Decision: Fetch-on-expand with caching

### Rationale (from spec requirement FR-002)

- **Scalability**: Support large documentation libraries
- **Performance**: Don't load entire tree upfront
- **UX**: Fast initial load, progressive disclosure

### Implementation Pattern

```typescript
// API: GET /api/reader/tree?path=/some/directory
// Returns immediate children only

interface DirectoryResponse {
  path: string;
  children: FileNode[];
  hasMore: boolean; // If children have subdirectories
}

// Client-side caching
const directoryCache = new Map<string, FileNode[]>();

async function loadDirectory(path: string): Promise<FileNode[]> {
  if (directoryCache.has(path)) {
    return directoryCache.get(path)!;
  }
  const response = await fetch(`/api/reader/tree?path=${encodeURIComponent(path)}`);
  const { data } = await response.json();
  directoryCache.set(path, data.children);
  return data.children;
}
```

---

## Summary of Key Decisions

| Area | Decision | Key Factor |
|------|----------|------------|
| Markdown rendering | react-markdown v9 | React integration, plugin ecosystem, safe by default |
| Syntax highlighting | shiki v1 | VS Code accuracy, SSR support |
| Diagrams | mermaid v10 (client-side) | Official library, theme customization |
| Preferences | JSON file in docs root | Portability (spec requirement) |
| Path security | Multi-layer validation | Defense in depth |
| Link routing | Client-side interception | UX (no page reloads) |
| Images | Relative paths only | Security (spec requirement) |
| Directory loading | Lazy fetch-on-expand | Scalability |

---

## Dependencies to Install

```bash
npm install react-markdown remark-gfm shiki mermaid
```

**Note**: All dependencies are well-maintained with TypeScript support and compatible with React 19 / Next.js 16.
