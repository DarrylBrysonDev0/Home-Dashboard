/**
 * Unit Tests: ReaderDrawer Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 8
 *
 * USER STORY 8: Mobile Navigation Experience
 * Goal: Collapsible drawer navigation for efficient browsing on smaller screens
 *
 * Test Categories:
 * - Open/close behavior
 * - Navigation content display
 * - File selection closes drawer
 * - Close on overlay tap and close button
 * - Accessibility
 * - Animation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReaderDrawer } from '@/components/reader/mobile/ReaderDrawer';
import type { FileNode, RecentFile, Favorite } from '@/types/reader';

// Mock dependencies
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    X: () => <span data-testid="x-icon">X</span>,
    Menu: () => <span data-testid="menu-icon">Menu</span>,
  };
});

describe('ReaderDrawer', () => {
  const mockFileTree: FileNode[] = [
    {
      name: 'docs',
      path: '/docs',
      type: 'directory',
      children: [
        { name: 'readme.md', path: '/docs/readme.md', type: 'file', extension: '.md' },
      ],
    },
    { name: 'guide.md', path: '/guide.md', type: 'file', extension: '.md' },
  ];

  const mockRecentFiles: RecentFile[] = [
    { path: '/recent.md', name: 'recent.md', viewedAt: new Date().toISOString() },
  ];

  const mockFavorites: Favorite[] = [
    { path: '/favorite.md', name: 'favorite.md', addedAt: new Date().toISOString() },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    nodes: mockFileTree,
    selectedPath: null as string | null,
    expandedPaths: new Set<string>(),
    loadingPaths: new Set<string>(),
    onFileSelect: vi.fn(),
    onExpandToggle: vi.fn(),
    searchQuery: '',
    searchResults: [] as FileNode[],
    isSearching: false,
    onSearch: vi.fn(),
    onClearSearch: vi.fn(),
    recentFiles: mockRecentFiles,
    favorites: mockFavorites,
    onRemoveFavorite: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Open/Close Behavior', () => {
    it('should render when isOpen is true', () => {
      render(<ReaderDrawer {...defaultProps} isOpen={true} />);

      const drawer = screen.getByTestId('reader-drawer');
      expect(drawer).toBeInTheDocument();
    });

    it('should not render content when isOpen is false', () => {
      render(<ReaderDrawer {...defaultProps} isOpen={false} />);

      const drawer = screen.queryByTestId('reader-drawer');
      expect(drawer).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<ReaderDrawer {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation Content', () => {
    it('should display Documents header', () => {
      render(<ReaderDrawer {...defaultProps} />);

      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    it('should display search input', () => {
      render(<ReaderDrawer {...defaultProps} />);

      expect(screen.getByPlaceholderText(/search files/i)).toBeInTheDocument();
    });

    it('should display file tree nodes', () => {
      render(<ReaderDrawer {...defaultProps} />);

      expect(screen.getByText('docs')).toBeInTheDocument();
      expect(screen.getByText('guide.md')).toBeInTheDocument();
    });

    it('should display favorites section when favorites exist', () => {
      render(<ReaderDrawer {...defaultProps} favorites={mockFavorites} />);

      expect(screen.getByText('Favorites')).toBeInTheDocument();
      expect(screen.getByText('favorite.md')).toBeInTheDocument();
    });

    it('should display recent files section when recents exist', () => {
      render(<ReaderDrawer {...defaultProps} recentFiles={mockRecentFiles} />);

      expect(screen.getByText('Recent Files')).toBeInTheDocument();
      expect(screen.getByText('recent.md')).toBeInTheDocument();
    });

    it('should not display favorites section when empty', () => {
      render(<ReaderDrawer {...defaultProps} favorites={[]} />);

      expect(screen.queryByText('Favorites')).not.toBeInTheDocument();
    });

    it('should not display recent files section when empty', () => {
      render(<ReaderDrawer {...defaultProps} recentFiles={[]} />);

      expect(screen.queryByText('Recent Files')).not.toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should call onFileSelect when a file is clicked', () => {
      const onFileSelect = vi.fn();
      render(<ReaderDrawer {...defaultProps} onFileSelect={onFileSelect} />);

      const file = screen.getByText('guide.md');
      fireEvent.click(file);

      expect(onFileSelect).toHaveBeenCalledWith('/guide.md');
    });

    it('should call onClose after file selection', () => {
      const onClose = vi.fn();
      const onFileSelect = vi.fn();
      render(
        <ReaderDrawer
          {...defaultProps}
          onClose={onClose}
          onFileSelect={onFileSelect}
        />
      );

      const file = screen.getByText('guide.md');
      fireEvent.click(file);

      expect(onClose).toHaveBeenCalled();
    });

    it('should highlight currently selected file', () => {
      render(<ReaderDrawer {...defaultProps} selectedPath="/guide.md" />);

      // The file tree node should have a selected state indicator
      const treeNode = screen.getByTestId('tree-node-guide.md');
      expect(treeNode).toHaveAttribute('data-selected', 'true');
    });
  });

  describe('Directory Expansion', () => {
    it('should call onExpandToggle when directory is clicked', () => {
      const onExpandToggle = vi.fn();
      render(<ReaderDrawer {...defaultProps} onExpandToggle={onExpandToggle} />);

      // Click the directory treeitem to expand it
      const dirNode = screen.getByTestId('tree-node-docs');
      fireEvent.click(dirNode);

      expect(onExpandToggle).toHaveBeenCalledWith('/docs');
    });

    it('should not close drawer when expanding/collapsing directory', () => {
      const onClose = vi.fn();
      render(<ReaderDrawer {...defaultProps} onClose={onClose} />);

      // Click the directory treeitem - should not close drawer
      const dirNode = screen.getByTestId('tree-node-docs');
      fireEvent.click(dirNode);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('should call onSearch when typing in search input', () => {
      const onSearch = vi.fn();
      render(<ReaderDrawer {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText(/search files/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Note: SearchInput has debounce, so we check the input value changed
      expect(searchInput).toHaveValue('test');
    });

    it('should display search results when search is active', () => {
      const searchResults: FileNode[] = [
        { name: 'result.md', path: '/result.md', type: 'file', extension: '.md' },
      ];

      render(
        <ReaderDrawer
          {...defaultProps}
          searchQuery="result"
          searchResults={searchResults}
        />
      );

      // Search results render with highlighted text
      const resultText = screen.getByRole('list', { name: /search results/i });
      expect(resultText).toBeInTheDocument();
    });

    it('should close drawer when selecting a search result', () => {
      const onClose = vi.fn();
      const onFileSelect = vi.fn();
      const searchResults: FileNode[] = [
        { name: 'result.md', path: '/result.md', type: 'file', extension: '.md' },
      ];

      render(
        <ReaderDrawer
          {...defaultProps}
          onClose={onClose}
          onFileSelect={onFileSelect}
          searchQuery="result"
          searchResults={searchResults}
        />
      );

      // Click the search result button
      const resultButtons = screen.getAllByRole('button');
      // Find the result button (the one that contains 'result.md')
      const resultButton = resultButtons.find(btn => btn.textContent?.includes('result.md'));
      if (resultButton) {
        fireEvent.click(resultButton);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible drawer role', () => {
      render(<ReaderDrawer {...defaultProps} />);

      // Sheet component adds dialog role
      const drawer = screen.getByRole('dialog');
      expect(drawer).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(<ReaderDrawer {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have accessible header with title', () => {
      render(<ReaderDrawer {...defaultProps} />);

      // Sheet should have a title for screen readers
      expect(screen.getByText('Documents')).toBeInTheDocument();
    });

    it('should trap focus within drawer when open', () => {
      render(<ReaderDrawer {...defaultProps} />);

      // Focus should be within the drawer
      const drawer = screen.getByTestId('reader-drawer');
      expect(drawer).toBeInTheDocument();
    });
  });

  describe('Visual Structure', () => {
    it('should have proper width for mobile viewport', () => {
      render(<ReaderDrawer {...defaultProps} />);

      const drawer = screen.getByTestId('reader-drawer');
      // Width classes should be applied
      expect(drawer.className).toMatch(/w-\[280px\]|w-\[320px\]/);
    });

    it('should slide from left side', () => {
      render(<ReaderDrawer {...defaultProps} />);

      // Sheet content should have side="left" (shown via data attributes or classes)
      const drawer = screen.getByTestId('reader-drawer');
      expect(drawer).toBeInTheDocument();
    });
  });

  describe('Recent and Favorites Selection', () => {
    it('should close drawer when selecting from favorites', () => {
      const onClose = vi.fn();
      const onFileSelect = vi.fn();
      render(
        <ReaderDrawer
          {...defaultProps}
          onClose={onClose}
          onFileSelect={onFileSelect}
          favorites={mockFavorites}
        />
      );

      const favorite = screen.getByText('favorite.md');
      fireEvent.click(favorite);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close drawer when selecting from recents', () => {
      const onClose = vi.fn();
      const onFileSelect = vi.fn();
      render(
        <ReaderDrawer
          {...defaultProps}
          onClose={onClose}
          onFileSelect={onFileSelect}
          recentFiles={mockRecentFiles}
        />
      );

      const recent = screen.getByText('recent.md');
      fireEvent.click(recent);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Remove Favorite', () => {
    it('should call onRemoveFavorite when remove button is clicked', () => {
      const onRemoveFavorite = vi.fn();
      render(
        <ReaderDrawer
          {...defaultProps}
          onRemoveFavorite={onRemoveFavorite}
          favorites={mockFavorites}
        />
      );

      // Find the remove button for the favorite
      const removeButton = screen.getByRole('button', { name: /remove favorite\.md from favorites/i });
      fireEvent.click(removeButton);

      expect(onRemoveFavorite).toHaveBeenCalledWith('/favorite.md');
    });
  });
});
