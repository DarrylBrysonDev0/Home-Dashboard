/**
 * Unit Tests: RecentFiles Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 7
 *
 * USER STORY 7: Access Recent and Favorite Files
 * Goal: Display recently viewed files for quick access
 *
 * Test Categories:
 * - Basic rendering
 * - List display
 * - Empty state
 * - Click handling
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentFiles } from '@/components/reader/navigation/RecentFiles';
import type { RecentFile } from '@/types/reader';

describe('RecentFiles', () => {
  const mockRecents: RecentFile[] = [
    { path: '/docs/readme.md', name: 'readme.md', viewedAt: '2024-01-03T00:00:00.000Z' },
    { path: '/docs/api.md', name: 'api.md', viewedAt: '2024-01-02T00:00:00.000Z' },
    { path: '/docs/guide.md', name: 'guide.md', viewedAt: '2024-01-01T00:00:00.000Z' },
  ];

  const defaultProps = {
    recents: mockRecents,
    onSelect: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render with test id for integration', () => {
      render(<RecentFiles {...defaultProps} />);
      expect(screen.getByTestId('recent-files')).toBeInTheDocument();
    });

    it('should render section heading', () => {
      render(<RecentFiles {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /recent/i })).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<RecentFiles {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('recent-files')).toHaveClass('custom-class');
    });
  });

  describe('List Display', () => {
    it('should render all recent files', () => {
      render(<RecentFiles {...defaultProps} />);

      expect(screen.getByText('readme.md')).toBeInTheDocument();
      expect(screen.getByText('api.md')).toBeInTheDocument();
      expect(screen.getByText('guide.md')).toBeInTheDocument();
    });

    it('should display files in provided order', () => {
      render(<RecentFiles {...defaultProps} />);

      const items = screen.getAllByRole('button');
      expect(items[0]).toHaveTextContent('readme.md');
      expect(items[1]).toHaveTextContent('api.md');
      expect(items[2]).toHaveTextContent('guide.md');
    });

    it('should show file icon for each item', () => {
      render(<RecentFiles {...defaultProps} />);

      const icons = screen.getAllByTestId('recent-file-icon');
      expect(icons).toHaveLength(3);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no recents', () => {
      render(<RecentFiles recents={[]} onSelect={vi.fn()} />);
      expect(screen.getByText(/no recent files/i)).toBeInTheDocument();
    });

    it('should not render list when empty', () => {
      render(<RecentFiles recents={[]} onSelect={vi.fn()} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onSelect with path when clicking file', () => {
      const onSelect = vi.fn();
      render(<RecentFiles recents={mockRecents} onSelect={onSelect} />);

      fireEvent.click(screen.getByText('readme.md'));

      expect(onSelect).toHaveBeenCalledWith('/docs/readme.md');
    });

    it('should call onSelect with correct path for each file', () => {
      const onSelect = vi.fn();
      render(<RecentFiles recents={mockRecents} onSelect={onSelect} />);

      fireEvent.click(screen.getByText('api.md'));
      expect(onSelect).toHaveBeenCalledWith('/docs/api.md');

      fireEvent.click(screen.getByText('guide.md'));
      expect(onSelect).toHaveBeenCalledWith('/docs/guide.md');
    });
  });

  describe('Accessibility', () => {
    it('should have list role', () => {
      render(<RecentFiles {...defaultProps} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have listitem role for each file', () => {
      render(<RecentFiles {...defaultProps} />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('should have accessible buttons for each file', () => {
      render(<RecentFiles {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Active State', () => {
    it('should highlight current path', () => {
      render(
        <RecentFiles
          {...defaultProps}
          currentPath="/docs/readme.md"
        />
      );

      const activeButton = screen.getByText('readme.md').closest('button');
      expect(activeButton).toHaveAttribute('data-active', 'true');
    });

    it('should not highlight when current path differs', () => {
      render(
        <RecentFiles
          {...defaultProps}
          currentPath="/docs/other.md"
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('data-active', 'false');
      });
    });
  });

  describe('Max Items', () => {
    it('should limit displayed items to maxItems prop', () => {
      const manyRecents = Array.from({ length: 15 }, (_, i) => ({
        path: `/docs/file${i}.md`,
        name: `file${i}.md`,
        viewedAt: new Date().toISOString(),
      }));

      render(<RecentFiles recents={manyRecents} onSelect={vi.fn()} maxItems={5} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(5);
    });

    it('should default to 10 max items', () => {
      const manyRecents = Array.from({ length: 15 }, (_, i) => ({
        path: `/docs/file${i}.md`,
        name: `file${i}.md`,
        viewedAt: new Date().toISOString(),
      }));

      render(<RecentFiles recents={manyRecents} onSelect={vi.fn()} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(10);
    });
  });
});
