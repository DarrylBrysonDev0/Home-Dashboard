# Feature Specification: Markdown Reader

**Feature Branch**: `005-markdown-reader`
**Created**: January 19, 2026
**Status**: Draft
**Input**: User description: "Markdown Reader Page - Read-only document viewer for markdown files, Mermaid diagrams, and plain text from Docker-mounted volume"

## Clarifications

### Session 2026-01-19

- Q: How should favorites and recent files be stored (database vs localStorage)? → A: File-based storage in documentation root directory (preferences travel with the library)
- Q: Where should the table of contents be positioned? → A: Right sidebar (separate from file tree navigation)
- Q: How should the file tree load directory contents? → A: Lazy load on expand (scales to any library size)
- Q: How should images in markdown be handled? → A: Relative paths only (images must exist within docs directory, no external URLs)
- Q: How should links in markdown behave when clicked? → A: Smart routing (internal doc links open in reader, external URLs open in new tab)

## Overview

The Markdown Reader provides a read-only document viewing experience for personal documentation stored in a mounted volume. Users can navigate their documentation directory structure, view rendered content with formatted code and diagrams, and quickly access frequently used files. The reader integrates with Cemdash's existing navigation and theme system while offering an optional clean reading mode for long-form content.

### In Scope

| Included | Excluded |
|----------|----------|
| Tree-based file navigation | File editing or creation |
| Markdown rendering with formatted code blocks | Version control integration |
| Mermaid diagram support (.mmd files and embedded) | Real-time collaboration |
| Dual display modes (themed/reading) | External URL fetching |
| Auto-generated document outline | Wiki-style bidirectional linking |
| File search by name | Full-text content search |
| Recent files tracking | PDF export |
| Favorites/bookmarks system | Print optimization |
| Mobile-responsive drawer navigation | File upload capability |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and View Documentation (Priority: P1)

As an authenticated user, I want to navigate my documentation folder and view rendered markdown files so that I can quickly access and read my personal documentation.

**Why this priority**: Core functionality - without file navigation and viewing, the feature has no value. This enables the fundamental use case of reading documentation.

**Independent Test**: Can be fully tested by navigating the file tree, selecting a markdown file, and verifying it renders with proper formatting (headers, lists, code blocks, links).

**Acceptance Scenarios**:

1. **Given** I am logged in and navigate to the Reader page, **When** the page loads, **Then** I see a file tree displaying my documentation folder structure with directories and supported files (.md, .mmd, .txt)
2. **Given** I am viewing the file tree, **When** I click on a directory, **Then** it expands to show its contents (or collapses if already expanded)
3. **Given** I am viewing the file tree, **When** I click on a markdown file, **Then** the content area displays the rendered markdown with proper formatting
4. **Given** a markdown file is displayed, **When** I view the content, **Then** headers, lists, tables, links, and images render correctly
5. **Given** I have navigated deep into the folder structure, **When** I view the breadcrumb trail, **Then** I see clickable path segments showing my current location

---

### User Story 2 - View Syntax-Highlighted Code Blocks (Priority: P1)

As a technical user viewing documentation, I want code blocks to be syntax-highlighted based on the programming language so that code samples are easy to read and understand.

**Why this priority**: Essential for technical documentation - code blocks without syntax highlighting significantly reduce readability and usefulness.

**Independent Test**: Can be fully tested by opening a markdown file containing code blocks in various languages and verifying appropriate syntax coloring is applied.

**Acceptance Scenarios**:

1. **Given** I am viewing a markdown file with code blocks, **When** the code block specifies a language (e.g., ```javascript), **Then** the code displays with appropriate syntax highlighting colors
2. **Given** I am viewing a code block, **When** I look at the rendered output, **Then** the colors are readable and appropriate for the current theme (dark or light)
3. **Given** I am viewing a code block without a specified language, **When** it renders, **Then** it displays as plain monospace text with proper formatting

---

### User Story 3 - View Mermaid Diagrams (Priority: P1)

As a user documenting system architecture, I want to view Mermaid diagrams embedded in markdown or as standalone .mmd files so that I can visualize technical diagrams.

**Why this priority**: Mermaid diagrams are a core differentiator for technical documentation viewing - many documentation systems lack diagram support.

**Independent Test**: Can be fully tested by opening a file with Mermaid diagram syntax and verifying it renders as a visual diagram rather than raw code.

**Acceptance Scenarios**:

1. **Given** I am viewing a markdown file with an embedded Mermaid code block, **When** the file renders, **Then** the Mermaid syntax displays as a visual diagram (flowchart, sequence diagram, etc.)
2. **Given** I select a standalone .mmd file from the file tree, **When** it opens, **Then** the entire file renders as a Mermaid diagram
3. **Given** a Mermaid diagram fails to render, **When** I view the content area, **Then** I see a friendly error message explaining the diagram could not be rendered, with the original syntax visible
4. **Given** I am in themed mode, **When** viewing a Mermaid diagram, **Then** the diagram colors match the application's color scheme

---

### User Story 4 - Navigate Document with Table of Contents (Priority: P2)

As a user reading long documentation, I want an auto-generated table of contents based on document headings so that I can quickly jump to specific sections.

**Why this priority**: Enhances usability for long documents but not required for basic viewing functionality.

**Independent Test**: Can be fully tested by opening a long markdown file with multiple heading levels and verifying the TOC shows all headings with working navigation links.

**Acceptance Scenarios**:

1. **Given** I am viewing a markdown file with headings, **When** the content loads, **Then** a table of contents panel displays in the right sidebar showing all headings organized by level
2. **Given** the TOC is visible, **When** I click on a heading in the TOC, **Then** the content scrolls to that section
3. **Given** I am on a narrow viewport, **When** I view the page, **Then** I can toggle the TOC visibility to maximize reading space
4. **Given** a document has no headings, **When** I view it, **Then** the TOC panel shows an appropriate empty state message

---

### User Story 5 - Search for Files (Priority: P2)

As a user with many documentation files, I want to search for files by name so that I can quickly find specific documents without manual browsing.

**Why this priority**: Improves efficiency for users with large documentation libraries but browsing works as a fallback.

**Independent Test**: Can be fully tested by typing a search query and verifying matching files appear in results with highlighted matches.

**Acceptance Scenarios**:

1. **Given** I am in the Reader page, **When** I type in the search input, **Then** the file tree filters to show only files and directories matching my query
2. **Given** I have entered a search query, **When** results display, **Then** matching text in file names is visually highlighted
3. **Given** I have search results displayed, **When** I clear the search input, **Then** the full file tree is restored
4. **Given** I search for a term with no matches, **When** results display, **Then** I see a "No files found" message

---

### User Story 6 - Toggle Between Themed and Reading Modes (Priority: P2)

As a user reading long content, I want to switch between a themed display mode and a clean reading mode so that I can choose the experience that suits my current task.

**Why this priority**: Enhances reading comfort but the default themed mode provides a complete experience.

**Independent Test**: Can be fully tested by toggling between modes and verifying the visual styling changes appropriately.

**Acceptance Scenarios**:

1. **Given** I am viewing content in themed mode, **When** I click the display mode toggle, **Then** the content switches to reading mode with neutral, distraction-free styling
2. **Given** I am in reading mode, **When** I click the display mode toggle, **Then** the content switches back to themed mode with the application's visual identity
3. **Given** I have selected a display mode, **When** I navigate to another file or return later, **Then** my display mode preference is preserved
4. **Given** I am in either mode, **When** code blocks and diagrams display, **Then** they use colors appropriate for that mode

---

### User Story 7 - Access Recent and Favorite Files (Priority: P2)

As a frequent user, I want to see recently viewed files and bookmark favorites so that I can quickly return to important documents.

**Why this priority**: Convenience feature that improves repeat access but manual navigation works as a fallback.

**Independent Test**: Can be fully tested by viewing files (checking recents list updates), bookmarking files, and verifying both lists persist across sessions.

**Acceptance Scenarios**:

1. **Given** I open a file in the Reader, **When** I look at the recent files section, **Then** the file appears in my recent files list
2. **Given** I have viewed multiple files, **When** I look at the recent files section, **Then** I see up to 10 most recently viewed files in order
3. **Given** I am viewing a file, **When** I click the favorite/bookmark icon, **Then** the file is added to my favorites list
4. **Given** a file is in my favorites, **When** I click the favorite icon again, **Then** it is removed from my favorites
5. **Given** I click on a file in recents or favorites, **When** the action completes, **Then** that file opens in the content viewer

---

### User Story 8 - Mobile Navigation Experience (Priority: P3)

As a mobile user, I want to access the file navigation through a collapsible drawer so that I can browse documentation efficiently on smaller screens.

**Why this priority**: Mobile support extends usability but desktop is the primary use case for documentation viewing.

**Independent Test**: Can be fully tested on a mobile viewport by opening the drawer, navigating files, and verifying the drawer closes appropriately.

**Acceptance Scenarios**:

1. **Given** I am on a viewport below 768px, **When** I view the Reader page, **Then** the navigation pane is hidden and a hamburger menu icon is visible
2. **Given** I am on mobile, **When** I tap the hamburger icon, **Then** a drawer slides in from the left containing the file tree, search, recents, and favorites
3. **Given** the drawer is open, **When** I select a file, **Then** the drawer closes and the file displays in the content area
4. **Given** the drawer is open, **When** I tap outside the drawer or the close button, **Then** the drawer closes
5. **Given** I am on mobile, **When** viewing content, **Then** the content fills the viewport with appropriate text sizing

---

### User Story 9 - Refresh Content Without Page Reload (Priority: P3)

As a user whose documentation may update externally, I want to refresh the current file without a full page reload so that I can see the latest content quickly.

**Why this priority**: Nice-to-have convenience feature - a full page refresh works as a fallback.

**Independent Test**: Can be fully tested by modifying a file externally, clicking refresh, and verifying the updated content appears.

**Acceptance Scenarios**:

1. **Given** I am viewing a file, **When** I click the refresh button, **Then** the file content reloads from the source
2. **Given** I click refresh, **When** the content is loading, **Then** I see a loading indicator
3. **Given** the refresh completes, **When** I view the content, **Then** any external changes to the file are reflected

---

### Edge Cases

- What happens when the documentation directory is empty? Display a friendly empty state with guidance
- What happens when a file is deleted while being viewed? Show an error message that the file no longer exists
- What happens when the mounted volume is unavailable? Display an error state explaining the documentation source is unavailable
- How does the system handle very large files (>1MB)? Display the content with potential performance warnings for extremely large files
- What happens with unsupported file types? Show only supported file types (.md, .mmd, .txt) in the tree; attempting to access unsupported files via URL returns an appropriate error
- What happens when a deeply nested path exceeds display width? Breadcrumbs should be scrollable or collapsed with ellipsis

## Requirements *(mandatory)*

### Functional Requirements

**Navigation**

- **FR-001**: System MUST display a tree-based view of the documentation directory showing folders and supported files (.md, .mmd, .txt), with root-level contents loaded initially
- **FR-002**: System MUST lazy-load directory contents when a folder is expanded (fetch on demand, not upfront)
- **FR-003**: System MUST display a breadcrumb trail showing the current file's path with clickable segments
- **FR-004**: System MUST provide file search functionality that filters the tree by file name
- **FR-005**: System MUST display a recent files list showing up to 10 most recently viewed documents
- **FR-006**: System MUST allow users to bookmark/favorite files that persist across sessions
- **FR-007**: System MUST highlight the currently selected file in the file tree

**Content Viewing**

- **FR-008**: System MUST render markdown files with proper formatting (headers, lists, tables, links, inline images via relative paths, blockquotes)
- **FR-008a**: System MUST route internal document links (relative paths to .md/.mmd/.txt files) to open within the reader
- **FR-008b**: System MUST open external URL links (http/https) in a new browser tab
- **FR-009**: System MUST apply syntax highlighting to code blocks based on the specified language
- **FR-010**: System MUST render Mermaid diagram syntax as visual diagrams (flowcharts, sequence diagrams, class diagrams, etc.)
- **FR-011**: System MUST support standalone .mmd files rendered entirely as Mermaid diagrams
- **FR-012**: System MUST generate an automatic table of contents from document headings
- **FR-013**: System MUST allow users to click TOC entries to scroll to that section
- **FR-014**: System MUST display plain text files (.txt) with basic formatting
- **FR-015**: System MUST provide a refresh button to reload the current file content

**Display Modes**

- **FR-016**: System MUST support two display modes: "themed" (application aesthetic) and "reading" (clean, neutral)
- **FR-017**: System MUST persist the user's display mode preference
- **FR-018**: System MUST apply appropriate color schemes to code blocks and diagrams based on display mode

**Responsive Design**

- **FR-019**: System MUST transform the navigation pane into a slide-out drawer on viewports below 768px
- **FR-020**: System MUST close the mobile drawer when a file is selected
- **FR-021**: System MUST provide a hamburger menu icon to toggle the mobile drawer
- **FR-022**: System MUST allow closing the drawer via overlay tap, close button, or swipe gesture

**Security**

- **FR-023**: System MUST restrict file access to the designated documentation root directory only
- **FR-024**: System MUST reject any path containing directory traversal patterns (..)
- **FR-025**: System MUST only serve files with allowed extensions (.md, .mmd, .txt)
- **FR-026**: System MUST only render images from relative paths within the documentation directory (block external URLs)

### Key Entities

- **FileNode**: Represents an item in the file tree with name, path, type (file/directory), extension, and optional children
- **FileContent**: Represents loaded file data including path, name, content string, extension, modification date, and size
- **Favorite**: A bookmarked file reference with path, name, and timestamp (stored in `.reader-prefs.json` in docs root)
- **RecentFile**: A recently viewed file reference with path, name, and last viewed timestamp (stored in `.reader-prefs.json` in docs root)
- **ReaderPreferences**: JSON file (`.reader-prefs.json`) in documentation root containing favorites array, recents array, and display mode preference
- **DocumentHeading**: A heading extracted from markdown for TOC with id, text, and heading level

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to any document in their documentation folder within 3 clicks or via search
- **SC-002**: Markdown files render with all formatting elements (headers, lists, tables, code blocks, links) displaying correctly
- **SC-003**: Mermaid diagrams render as visual graphics within 2 seconds of file load
- **SC-004**: File search returns matching results as the user types with under 300ms response time
- **SC-005**: Display mode toggle switches themes instantly (under 100ms visual feedback)
- **SC-006**: Recent files list accurately reflects the last 10 viewed documents in order
- **SC-007**: Favorited files persist and remain available across browser sessions
- **SC-008**: Mobile drawer opens and closes within 200ms animation duration
- **SC-009**: On mobile viewports, content is readable without horizontal scrolling
- **SC-010**: 100% of navigation elements are accessible via keyboard (Tab navigation, Enter activation)
- **SC-011**: Invalid file paths or directory traversal attempts are blocked with appropriate error messages

## Development Methodology *(mandatory)*

### Test-Driven Development (TDD) Red-Green-Refactor

All implementation MUST follow strict TDD Red-Green-Refactor methodology:

1. **Red Phase**: Write a failing test that defines desired behavior before writing any implementation code
2. **Green Phase**: Write the minimal code necessary to make the test pass
3. **Refactor Phase**: Improve code quality while keeping all tests passing

### TDD Requirements

- **Every** user story acceptance scenario MUST have corresponding automated tests written BEFORE implementation
- Tests MUST be written at the appropriate level:
  - Unit tests for individual components and functions
  - Integration tests for component interactions and API routes
  - End-to-end tests for complete user flows
- Implementation MUST NOT begin until failing tests exist for that functionality
- All tests MUST pass before code is considered complete
- Test coverage MUST be maintained at >80% for all new code
- Each commit MUST include both tests and implementation, demonstrating the Red-Green cycle

### Test-First Workflow Example

For User Story 1 (Browse and View Documentation):
1. Write E2E test verifying file tree displays (Red - test fails, component doesn't exist)
2. Create minimal FileTree component rendering basic structure (Green - test passes)
3. Write test for directory expand/collapse (Red - test fails, no expand logic)
4. Implement expand/collapse functionality (Green - test passes)
5. Refactor FileTree for better organization (Green - tests still pass)

This cycle repeats for each acceptance scenario and functional requirement.

## Assumptions

- The application runs via Docker Compose (`docker compose up`) - do not run `npm run dev` directly to avoid port conflicts with the containerized database
- The documentation directory will be mounted as a volume in docker-compose.yml (e.g., `/path/to/docs:/app/docs`) with write access for `.reader-prefs.json` preferences file
- NextAuth.js authentication is available for page access control
- The existing Cemdash theme system and navigation bar are available for integration
- Users primarily access documentation from desktop browsers, with mobile as secondary
- Document files are reasonably sized (most under 100KB, rare cases up to 1MB)
- Environment variable `DOCS_ROOT` will specify the container path to the documentation directory
