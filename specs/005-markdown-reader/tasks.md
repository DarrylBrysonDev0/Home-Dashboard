# Tasks: Markdown Reader

**Input**: Design documents from `/specs/005-markdown-reader/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/reader-api.yaml ✓

**Tests**: REQUIRED - spec.md mandates TDD Red-Green-Refactor for ALL implementation.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and basic structure

- [X] T001 Install feature dependencies: `npm install react-markdown remark-gfm shiki mermaid`
- [X] T002 [P] Add DOCS_ROOT environment variable to `.env.local` and `.env.example`
- [X] T003 [P] Update `docker-compose.yml` with documentation volume mount
- [X] T004 [P] Create TypeScript types file `types/reader.ts` with all entity interfaces from data-model.md
- [X] T005 [P] Create Zod validation schemas in `lib/validations/reader.ts` per data-model.md
- [X] T006 Add `/reader` and `/api/reader/*` routes to NextAuth middleware matcher in `middleware.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundation

- [X] T007 [P] Unit tests for path validation security in `__tests__/unit/lib/reader/file-system.service.test.ts`
- [X] T008 [P] Unit tests for preferences service in `__tests__/unit/lib/reader/preferences.service.test.ts`

### Implementation for Foundation

- [X] T009 Implement FileSystemService with path security validation in `lib/reader/file-system.service.ts`
- [X] T010 Implement PreferencesService with atomic file writes in `lib/reader/preferences.service.ts`
- [X] T011 Create ReaderContext provider skeleton in `lib/contexts/ReaderContext.tsx`
- [X] T012 [P] Create API route structure directories: `app/api/reader/{tree,file,search,preferences,image}/`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browse and View Documentation (Priority: P1) 🎯 MVP

**Goal**: Navigate documentation folder and view rendered markdown files with proper formatting

**Independent Test**: Navigate file tree, select a markdown file, verify it renders with headers, lists, code blocks, and links

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US1] Contract tests for GET /api/reader/tree endpoint in `__tests__/integration/api/reader/tree.test.ts`
- [X] T014 [P] [US1] Contract tests for GET /api/reader/file endpoint in `__tests__/integration/api/reader/file.test.ts`
- [X] T015 [P] [US1] Unit tests for FileTree component in `__tests__/unit/components/reader/FileTree.test.tsx`
- [X] T016 [P] [US1] Unit tests for MarkdownRenderer component in `__tests__/unit/components/reader/MarkdownRenderer.test.tsx`
- [ ] T017 [US1] E2E test for file browsing flow in `__tests__/e2e/reader-browse.spec.ts`

### Implementation for User Story 1

- [X] T018 [US1] Implement GET /api/reader/tree route with Zod validation in `app/api/reader/tree/route.ts`
- [X] T019 [US1] Implement GET /api/reader/file route with Zod validation in `app/api/reader/file/route.ts`
- [X] T020 [P] [US1] Create FileTreeNode component with expand/collapse in `components/reader/navigation/FileTreeNode.tsx`
- [X] T021 [US1] Create FileTree component with lazy loading in `components/reader/navigation/FileTree.tsx`
- [X] T022 [P] [US1] Create Breadcrumbs component with clickable path segments in `components/reader/navigation/Breadcrumbs.tsx`
- [X] T023 [P] [US1] Create NavigationPane container component in `components/reader/navigation/NavigationPane.tsx`
- [X] T024 [P] [US1] Create EmptyState component for no file selected in `components/reader/content/EmptyState.tsx`
- [X] T025 [US1] Create markdown-config with react-markdown plugins in `lib/reader/markdown-config.ts`
- [X] T026 [US1] Create MarkdownRenderer component (basic rendering without code highlighting) in `components/reader/content/MarkdownRenderer.tsx`
- [X] T027 [US1] Implement custom link routing (internal docs vs external URLs) in MarkdownRenderer
- [X] T028 [P] [US1] Create ContentViewer container component in `components/reader/content/ContentViewer.tsx`
- [X] T029 [US1] Create ReaderLayout orchestrator component in `components/reader/ReaderLayout.tsx`
- [X] T030 [US1] Implement ReaderContext state management with file tree and selection in `lib/contexts/ReaderContext.tsx`
- [X] T031 [US1] Create reader layout with ReaderProvider in `app/reader/layout.tsx`
- [X] T032 [US1] Create default reader page (empty state) in `app/reader/page.tsx`
- [X] T033 [US1] Create dynamic path handler page in `app/reader/[[...path]]/page.tsx`

**Checkpoint**: User Story 1 complete - can browse file tree and view rendered markdown

---

## Phase 4: User Story 2 - Syntax-Highlighted Code Blocks (Priority: P1) 🎯 MVP

**Goal**: Display code blocks with VS Code-quality syntax highlighting based on language

**Independent Test**: Open markdown file with code blocks in various languages, verify syntax coloring is applied

### Tests for User Story 2

- [X] T034 [P] [US2] Unit tests for CodeBlock component with language detection in `__tests__/unit/components/reader/CodeBlock.test.tsx`
- [X] T035 [P] [US2] Unit tests for shiki highlighter initialization in `__tests__/unit/lib/reader/shiki-highlighter.test.ts`

### Implementation for User Story 2

- [X] T036 [US2] Create shiki highlighter singleton with theme support in `lib/reader/shiki-highlighter.ts`
- [X] T037 [US2] Create CodeBlock component with Shiki rendering in `components/reader/content/CodeBlock.tsx`
- [X] T038 [US2] Integrate CodeBlock into MarkdownRenderer custom components in `components/reader/content/MarkdownRenderer.tsx`
- [X] T039 [US2] Add theme-aware code block styling (light/dark) in CodeBlock component

**Checkpoint**: User Story 2 complete - code blocks display with proper syntax highlighting

---

## Phase 5: User Story 3 - View Mermaid Diagrams (Priority: P1) 🎯 MVP

**Goal**: Render Mermaid diagrams embedded in markdown or as standalone .mmd files

**Independent Test**: Open file with Mermaid syntax, verify it renders as visual diagram (not raw code)

### Tests for User Story 3

- [X] T040 [P] [US3] Unit tests for MermaidRenderer component in `__tests__/unit/components/reader/MermaidRenderer.test.tsx`
- [X] T041 [P] [US3] Unit tests for mermaid theme configuration in `__tests__/unit/lib/reader/mermaid-themes.test.ts`

### Implementation for User Story 3

- [X] T042 [US3] Create mermaid theme configuration for themed/reading modes in `lib/reader/mermaid-themes.ts`
- [X] T043 [US3] Create MermaidRenderer client component with error boundary in `components/reader/content/MermaidRenderer.tsx`
- [X] T044 [US3] Detect mermaid code blocks in MarkdownRenderer and delegate to MermaidRenderer
- [X] T045 [US3] Handle standalone .mmd files in ContentViewer (render entire file as diagram)
- [X] T046 [US3] Add error state UI for invalid Mermaid syntax showing original code

**Checkpoint**: User Stories 1-3 complete - MVP is functional with browsing, markdown, code highlighting, and diagrams

---

## Phase 6: User Story 4 - Navigate Document with Table of Contents (Priority: P2)

**Goal**: Auto-generated table of contents from document headings with click-to-scroll navigation

**Independent Test**: Open long markdown file with multiple heading levels, verify TOC shows all headings with working navigation

### Tests for User Story 4

- [ ] T047 [P] [US4] Unit tests for heading extraction logic in `__tests__/unit/lib/reader/heading-extractor.test.ts`
- [ ] T048 [P] [US4] Unit tests for TableOfContents component in `__tests__/unit/components/reader/TableOfContents.test.tsx`

### Implementation for User Story 4

- [ ] T049 [US4] Create heading extraction utility in `lib/reader/heading-extractor.ts`
- [ ] T050 [US4] Add heading ID generation to MarkdownRenderer (for anchor links)
- [ ] T051 [US4] Create TableOfContents component with hierarchy display in `components/reader/content/TableOfContents.tsx`
- [ ] T052 [US4] Add smooth scroll-to-section on TOC click
- [ ] T053 [US4] Add TOC toggle visibility for narrow viewports in ReaderLayout
- [ ] T054 [US4] Handle empty state when document has no headings

**Checkpoint**: User Story 4 complete - documents have navigable table of contents

---

## Phase 7: User Story 5 - Search for Files (Priority: P2)

**Goal**: Search files by name to quickly find documents without manual browsing

**Independent Test**: Type search query, verify matching files appear with highlighted matches

### Tests for User Story 5

- [ ] T055 [P] [US5] Contract tests for GET /api/reader/search endpoint in `__tests__/integration/api/reader/search.test.ts`
- [ ] T056 [P] [US5] Unit tests for SearchInput component in `__tests__/unit/components/reader/SearchInput.test.tsx`

### Implementation for User Story 5

- [ ] T057 [US5] Implement searchFiles method in FileSystemService with recursive file scanning
- [ ] T058 [US5] Implement GET /api/reader/search route with query validation in `app/api/reader/search/route.ts`
- [ ] T059 [US5] Create SearchInput component with debounced input in `components/reader/navigation/SearchInput.tsx`
- [ ] T060 [US5] Add search results display with match highlighting
- [ ] T061 [US5] Integrate search into NavigationPane with clear/restore functionality
- [ ] T062 [US5] Handle "No files found" empty state

**Checkpoint**: User Story 5 complete - users can search files by name

---

## Phase 8: User Story 6 - Toggle Between Themed and Reading Modes (Priority: P2)

**Goal**: Switch between themed display mode (app aesthetic) and reading mode (clean, neutral)

**Independent Test**: Toggle between modes, verify visual styling changes for content, code, and diagrams

### Tests for User Story 6

- [ ] T063 [P] [US6] Unit tests for DisplayModeToggle component in `__tests__/unit/components/reader/DisplayModeToggle.test.tsx`

### Implementation for User Story 6

- [ ] T064 [US6] Create DisplayModeToggle component in `components/reader/controls/DisplayModeToggle.tsx`
- [ ] T065 [US6] Add display mode state to ReaderContext
- [ ] T066 [US6] Create reading mode CSS variables/styles in reader-specific styles
- [ ] T067 [US6] Update CodeBlock to use mode-appropriate Shiki theme
- [ ] T068 [US6] Update MermaidRenderer to re-render on mode change with appropriate theme
- [ ] T069 [US6] Persist display mode preference via PreferencesService

**Checkpoint**: User Story 6 complete - users can toggle reading modes with persistence

---

## Phase 9: User Story 7 - Access Recent and Favorite Files (Priority: P2)

**Goal**: See recently viewed files and bookmark favorites for quick access

**Independent Test**: View files (check recents list updates), bookmark files, verify both lists persist across sessions

### Tests for User Story 7

- [ ] T070 [P] [US7] Contract tests for GET/PUT /api/reader/preferences endpoints in `__tests__/integration/api/reader/preferences.test.ts`
- [ ] T071 [P] [US7] Unit tests for RecentFiles component in `__tests__/unit/components/reader/RecentFiles.test.tsx`
- [ ] T072 [P] [US7] Unit tests for Favorites component in `__tests__/unit/components/reader/Favorites.test.tsx`
- [ ] T073 [P] [US7] Unit tests for FavoriteToggle component in `__tests__/unit/components/reader/FavoriteToggle.test.tsx`

### Implementation for User Story 7

- [ ] T074 [US7] Implement GET /api/reader/preferences route in `app/api/reader/preferences/route.ts`
- [ ] T075 [US7] Implement PUT /api/reader/preferences route in `app/api/reader/preferences/route.ts`
- [ ] T076 [US7] Create RecentFiles component displaying last 10 viewed in `components/reader/navigation/RecentFiles.tsx`
- [ ] T077 [US7] Create Favorites component displaying bookmarked files in `components/reader/navigation/Favorites.tsx`
- [ ] T078 [US7] Create FavoriteToggle component (bookmark icon) in `components/reader/controls/FavoriteToggle.tsx`
- [ ] T079 [US7] Add recents/favorites state and actions to ReaderContext
- [ ] T080 [US7] Auto-update recents list when file is viewed (max 10, newest first)
- [ ] T081 [US7] Integrate RecentFiles and Favorites into NavigationPane

**Checkpoint**: User Story 7 complete - quick access to recent and favorite files

---

## Phase 10: User Story 8 - Mobile Navigation Experience (Priority: P3)

**Goal**: Collapsible drawer navigation for efficient browsing on smaller screens

**Independent Test**: On mobile viewport, open drawer, navigate files, verify drawer closes on selection

### Tests for User Story 8

- [ ] T082 [P] [US8] Unit tests for ReaderDrawer component in `__tests__/unit/components/reader/ReaderDrawer.test.tsx`
- [ ] T083 [US8] E2E tests for mobile navigation flow in `__tests__/e2e/reader-mobile.spec.ts`

### Implementation for User Story 8

- [ ] T084 [US8] Create ReaderDrawer component with slide animation in `components/reader/mobile/ReaderDrawer.tsx`
- [ ] T085 [US8] Add drawer open/close state to ReaderContext
- [ ] T086 [US8] Add hamburger menu button for mobile viewports in ReaderLayout
- [ ] T087 [US8] Implement drawer close on file selection
- [ ] T088 [US8] Implement drawer close on overlay tap and close button
- [ ] T089 [US8] Add responsive breakpoint styles (hide nav pane < 768px)
- [ ] T090 [US8] Ensure content fills viewport with appropriate text sizing on mobile

**Checkpoint**: User Story 8 complete - mobile users have drawer navigation

---

## Phase 11: User Story 9 - Refresh Content Without Page Reload (Priority: P3)

**Goal**: Reload current file content without full page reload to see external changes

**Independent Test**: Modify file externally, click refresh, verify updated content appears

### Tests for User Story 9

- [ ] T091 [P] [US9] Unit tests for RefreshButton component in `__tests__/unit/components/reader/RefreshButton.test.tsx`

### Implementation for User Story 9

- [ ] T092 [US9] Create RefreshButton component with loading state in `components/reader/controls/RefreshButton.tsx`
- [ ] T093 [US9] Add refreshContent action to ReaderContext
- [ ] T094 [US9] Integrate RefreshButton into reader controls area

**Checkpoint**: User Story 9 complete - users can refresh file content without page reload

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, images, and final improvements

### Tests for Polish

- [ ] T095 [P] Contract tests for GET /api/reader/image endpoint in `__tests__/integration/api/reader/image.test.ts`
- [ ] T096 [P] E2E tests for edge cases (empty directory, file not found) in `__tests__/e2e/reader-edge-cases.spec.ts`

### Implementation for Polish

- [ ] T097 Implement GET /api/reader/image route for relative images in `app/api/reader/image/route.ts`
- [ ] T098 Create custom MarkdownImage component blocking external URLs in MarkdownRenderer
- [ ] T099 Handle edge case: empty documentation directory (friendly empty state)
- [ ] T100 Handle edge case: file deleted while viewing (error message)
- [ ] T101 Handle edge case: mounted volume unavailable (error state)
- [ ] T102 Handle edge case: very large files (>1MB) with performance warning
- [ ] T103 Handle edge case: deeply nested breadcrumbs (scrollable/ellipsis)
- [ ] T104 Add keyboard navigation support (Tab navigation, Enter activation)
- [ ] T105 Run quickstart.md validation and update if needed
- [ ] T106 Final test coverage check (target >80%)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - P1 stories (US1-3) form the MVP - complete before P2
  - P2 stories (US4-7) are enhancements - complete before P3
  - P3 stories (US8-9) are nice-to-have
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Dependencies | Can Start After |
|-------|----------|--------------|-----------------|
| US1 - Browse & View | P1 | Foundation only | Phase 2 |
| US2 - Code Highlighting | P1 | US1 (MarkdownRenderer exists) | Phase 3 |
| US3 - Mermaid Diagrams | P1 | US1 (MarkdownRenderer exists) | Phase 3 |
| US4 - Table of Contents | P2 | US1 (ContentViewer exists) | Phase 3 |
| US5 - File Search | P2 | US1 (NavigationPane exists) | Phase 3 |
| US6 - Display Modes | P2 | US1-3 (for code/diagram theming) | Phase 5 |
| US7 - Recents & Favorites | P2 | US1 (NavigationPane exists) | Phase 3 |
| US8 - Mobile Navigation | P3 | US7 (all nav features for drawer) | Phase 9 |
| US9 - Refresh Content | P3 | US1 (ContentViewer exists) | Phase 3 |

### Within Each User Story (TDD Cycle)

1. **RED**: Write tests - ensure they FAIL
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while tests stay green
4. Commit after each logical unit

### Parallel Opportunities

**Phase 1 (Setup)**:
- T002, T003, T004, T005 can run in parallel

**Phase 2 (Foundational)**:
- T007, T008 (tests) can run in parallel
- T012 (directory creation) can run with T009, T010

**Phase 3 (User Story 1)**:
- T013, T014, T015, T016 (tests) can run in parallel
- T020, T022, T023, T024 (independent components) can run in parallel

**Across User Stories**:
- US4, US5, US7 can start in parallel after US1 completes
- US2 and US3 can run in parallel after US1 completes

---

## Parallel Example: User Story 1

```bash
# Launch all tests for US1 together (RED phase):
Task: "Contract tests for GET /api/reader/tree"
Task: "Contract tests for GET /api/reader/file"
Task: "Unit tests for FileTree component"
Task: "Unit tests for MarkdownRenderer component"

# After tests written, launch independent components in parallel:
Task: "Create FileTreeNode component"
Task: "Create Breadcrumbs component"
Task: "Create NavigationPane container"
Task: "Create EmptyState component"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Browse & View
4. Complete Phase 4: User Story 2 - Code Highlighting
5. Complete Phase 5: User Story 3 - Mermaid Diagrams
6. **STOP and VALIDATE**: Test US1-3 independently
7. Deploy/demo if ready - MVP complete!

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test → Deploy (Minimal viewing)
3. Add US2 + US3 → Test → Deploy (MVP!)
4. Add US4-7 → Test → Deploy (Enhanced experience)
5. Add US8-9 → Test → Deploy (Full feature)

### Parallel Team Strategy

With multiple developers after Foundational:

- **Developer A**: US1 (blocking) → US2 → US4
- **Developer B**: Wait for US1 → US3 → US5
- **Developer C**: Wait for US1 → US7 → US6 → US8/US9

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| Phase 1 | T001-T006 | Setup & Dependencies |
| Phase 2 | T007-T012 | Foundation (Blocks all) |
| Phase 3 | T013-T033 | US1: Browse & View 🎯 |
| Phase 4 | T034-T039 | US2: Code Highlighting 🎯 |
| Phase 5 | T040-T046 | US3: Mermaid Diagrams 🎯 |
| Phase 6 | T047-T054 | US4: Table of Contents |
| Phase 7 | T055-T062 | US5: File Search |
| Phase 8 | T063-T069 | US6: Display Modes |
| Phase 9 | T070-T081 | US7: Recents & Favorites |
| Phase 10 | T082-T090 | US8: Mobile Navigation |
| Phase 11 | T091-T094 | US9: Refresh Content |
| Phase 12 | T095-T106 | Polish & Edge Cases |

**Total Tasks**: 106
**MVP Tasks** (US1-3): 46 tasks
**Suggested MVP Scope**: Phases 1-5 (Setup + Foundation + US1-3)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD is MANDATORY** per spec.md - write failing tests before implementation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
