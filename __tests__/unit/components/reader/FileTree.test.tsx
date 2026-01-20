/**
 * Unit Tests: FileTree Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 1
 *
 * USER STORY 1: Browse and View Documentation
 * Goal: Navigate documentation folder structure
 *
 * Test Categories:
 * - Basic rendering
 * - Directory expand/collapse
 * - File selection
 * - Loading states
 * - Empty state
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTree } from '@/components/reader/navigation/FileTree';
import type { FileNode } from '@/types/reader';

// Mock fetch for async operations
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FileTree', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnExpandToggle = vi.fn();

  const sampleTree: FileNode[] = [
    {
      name: 'projects',
      path: '/projects',
      type: 'directory',
      hasChildren: true,
    },
    {
      name: 'notes',
      path: '/notes',
      type: 'directory',
      hasChildren: false,
    },
    {
      name: 'readme.md',
      path: '/readme.md',
      type: 'file',
      extension: '.md',
    },
    {
      name: 'todo.txt',
      path: '/todo.txt',
      type: 'file',
      extension: '.txt',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render file tree with provided nodes', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      expect(screen.getByText('projects')).toBeInTheDocument();
      expect(screen.getByText('notes')).toBeInTheDocument();
      expect(screen.getByText('readme.md')).toBeInTheDocument();
      expect(screen.getByText('todo.txt')).toBeInTheDocument();
    });

    it('should render directories before files', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const items = screen.getAllByRole('treeitem');
      expect(items[0]).toHaveTextContent('projects');
      expect(items[1]).toHaveTextContent('notes');
      expect(items[2]).toHaveTextContent('readme.md');
      expect(items[3]).toHaveTextContent('todo.txt');
    });

    it('should render folder icon for directories', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const dirItem = screen.getByTestId('tree-node-projects');
      expect(dirItem.querySelector('[data-icon="folder"]')).toBeInTheDocument();
    });

    it('should render file icon for files', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const fileItem = screen.getByTestId('tree-node-readme.md');
      // .md files get file-markdown icon
      expect(fileItem.querySelector('[data-icon="file-markdown"]')).toBeInTheDocument();
    });

    it('should show expand arrow for directories with children', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const projectsDir = screen.getByTestId('tree-node-projects');
      expect(projectsDir.querySelector('[data-expand-arrow]')).toBeInTheDocument();
    });

    it('should not show expand arrow for empty directories', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const notesDir = screen.getByTestId('tree-node-notes');
      expect(notesDir.querySelector('[data-expand-arrow]')).not.toBeInTheDocument();
    });
  });

  describe('Directory Expand/Collapse', () => {
    it('should call onExpandToggle when directory is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const projectsDir = screen.getByText('projects');
      await user.click(projectsDir);

      expect(mockOnExpandToggle).toHaveBeenCalledWith('/projects');
    });

    it('should show expanded state for directories in expandedPaths', () => {
      const expandedPaths = new Set(['/projects']);

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      const projectsDir = screen.getByTestId('tree-node-projects');
      expect(projectsDir).toHaveAttribute('data-expanded', 'true');
    });

    it('should show collapsed state for directories not in expandedPaths', () => {
      const expandedPaths = new Set<string>();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      const projectsDir = screen.getByTestId('tree-node-projects');
      expect(projectsDir).toHaveAttribute('data-expanded', 'false');
    });

    it('should render children when directory is expanded', () => {
      const expandedPaths = new Set(['/projects']);
      const treeWithChildren: FileNode[] = [
        {
          name: 'projects',
          path: '/projects',
          type: 'directory',
          hasChildren: true,
          children: [
            {
              name: 'project-a.md',
              path: '/projects/project-a.md',
              type: 'file',
              extension: '.md',
            },
          ],
        },
      ];

      render(
        <FileTree
          nodes={treeWithChildren}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      expect(screen.getByText('project-a.md')).toBeInTheDocument();
    });

    it('should not render children when directory is collapsed', () => {
      const expandedPaths = new Set<string>();
      const treeWithChildren: FileNode[] = [
        {
          name: 'projects',
          path: '/projects',
          type: 'directory',
          hasChildren: true,
          children: [
            {
              name: 'project-a.md',
              path: '/projects/project-a.md',
              type: 'file',
              extension: '.md',
            },
          ],
        },
      ];

      render(
        <FileTree
          nodes={treeWithChildren}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      expect(screen.queryByText('project-a.md')).not.toBeInTheDocument();
    });

    it('should rotate expand arrow when expanded', () => {
      const expandedPaths = new Set(['/projects']);

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      const arrowButton = screen
        .getByTestId('tree-node-projects')
        .querySelector('[data-expand-arrow]');
      // The rotate-90 class is on the ChevronRight SVG inside the button
      const arrowSvg = arrowButton?.querySelector('svg');
      expect(arrowSvg).toHaveClass('rotate-90');
    });
  });

  describe('File Selection', () => {
    it('should call onFileSelect when file is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const readmeFile = screen.getByText('readme.md');
      await user.click(readmeFile);

      expect(mockOnFileSelect).toHaveBeenCalledWith('/readme.md');
    });

    it('should highlight selected file', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          selectedPath="/readme.md"
        />
      );

      const readmeItem = screen.getByTestId('tree-node-readme.md');
      expect(readmeItem).toHaveAttribute('data-selected', 'true');
    });

    it('should not highlight unselected files', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          selectedPath="/readme.md"
        />
      );

      const todoItem = screen.getByTestId('tree-node-todo.txt');
      expect(todoItem).toHaveAttribute('data-selected', 'false');
    });

    it('should not call onFileSelect when directory is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const projectsDir = screen.getByText('projects');
      await user.click(projectsDir);

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator for directory being loaded', () => {
      const loadingPaths = new Set(['/projects']);

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          loadingPaths={loadingPaths}
        />
      );

      const projectsDir = screen.getByTestId('tree-node-projects');
      expect(
        projectsDir.querySelector('[data-loading-spinner]')
      ).toBeInTheDocument();
    });

    it('should hide loading indicator when not loading', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          loadingPaths={new Set()}
        />
      );

      const projectsDir = screen.getByTestId('tree-node-projects');
      expect(
        projectsDir.querySelector('[data-loading-spinner]')
      ).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no nodes provided', () => {
      render(
        <FileTree
          nodes={[]}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      expect(screen.getByText(/no files/i)).toBeInTheDocument();
    });

    it('should show guidance message in empty state', () => {
      render(
        <FileTree
          nodes={[]}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      expect(
        screen.getByText(/add.*markdown.*files|empty.*documentation/i)
      ).toBeInTheDocument();
    });
  });

  describe('Nested Structure', () => {
    it('should render deeply nested files correctly', () => {
      const expandedPaths = new Set(['/docs', '/docs/api']);
      const nestedTree: FileNode[] = [
        {
          name: 'docs',
          path: '/docs',
          type: 'directory',
          hasChildren: true,
          children: [
            {
              name: 'api',
              path: '/docs/api',
              type: 'directory',
              hasChildren: true,
              children: [
                {
                  name: 'endpoints.md',
                  path: '/docs/api/endpoints.md',
                  type: 'file',
                  extension: '.md',
                },
              ],
            },
          ],
        },
      ];

      render(
        <FileTree
          nodes={nestedTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      expect(screen.getByText('docs')).toBeInTheDocument();
      expect(screen.getByText('api')).toBeInTheDocument();
      expect(screen.getByText('endpoints.md')).toBeInTheDocument();
    });

    it('should indent nested items correctly', () => {
      const expandedPaths = new Set(['/docs']);
      const nestedTree: FileNode[] = [
        {
          name: 'docs',
          path: '/docs',
          type: 'directory',
          hasChildren: true,
          children: [
            {
              name: 'readme.md',
              path: '/docs/readme.md',
              type: 'file',
              extension: '.md',
            },
          ],
        },
      ];

      render(
        <FileTree
          nodes={nestedTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      const docsItem = screen.getByTestId('tree-node-docs');
      const readmeItem = screen.getByTestId('tree-node-readme.md');

      expect(docsItem).toHaveAttribute('data-level', '0');
      expect(readmeItem).toHaveAttribute('data-level', '1');
    });
  });

  describe('Accessibility', () => {
    it('should have tree role on container', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      expect(screen.getByRole('tree')).toBeInTheDocument();
    });

    it('should have treeitem role on nodes', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const items = screen.getAllByRole('treeitem');
      expect(items.length).toBe(4);
    });

    it('should have aria-expanded for directories', () => {
      const expandedPaths = new Set(['/projects']);

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          expandedPaths={expandedPaths}
        />
      );

      const projectsDir = screen.getByRole('treeitem', { name: /projects/i });
      expect(projectsDir).toHaveAttribute('aria-expanded', 'true');

      const notesDir = screen.getByRole('treeitem', { name: /notes/i });
      expect(notesDir).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-selected for selected file', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
          selectedPath="/readme.md"
        />
      );

      const readmeItem = screen.getByRole('treeitem', { name: /readme.md/i });
      expect(readmeItem).toHaveAttribute('aria-selected', 'true');
    });

    it('should support keyboard navigation with Enter', async () => {
      const user = userEvent.setup();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const readmeItem = screen.getByRole('treeitem', { name: /readme.md/i });
      readmeItem.focus();
      await user.keyboard('{Enter}');

      expect(mockOnFileSelect).toHaveBeenCalledWith('/readme.md');
    });

    it('should support keyboard navigation with Space for directories', async () => {
      const user = userEvent.setup();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const projectsDir = screen.getByRole('treeitem', { name: /projects/i });
      projectsDir.focus();
      await user.keyboard(' ');

      expect(mockOnExpandToggle).toHaveBeenCalledWith('/projects');
    });

    it('should be focusable via Tab', async () => {
      const user = userEvent.setup();

      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      await user.tab();

      const focusedItem = screen.getAllByRole('treeitem')[0];
      expect(document.activeElement).toBe(focusedItem);
    });
  });

  describe('File Type Icons', () => {
    it('should show markdown icon for .md files', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const mdFile = screen.getByTestId('tree-node-readme.md');
      expect(
        mdFile.querySelector('[data-icon="file-markdown"]')
      ).toBeInTheDocument();
    });

    it('should show text icon for .txt files', () => {
      render(
        <FileTree
          nodes={sampleTree}
          onFileSelect={mockOnFileSelect}
          onExpandToggle={mockOnExpandToggle}
        />
      );

      const txtFile = screen.getByTestId('tree-node-todo.txt');
      expect(txtFile.querySelector('[data-icon="file-text"]')).toBeInTheDocument();
    });
  });
});
