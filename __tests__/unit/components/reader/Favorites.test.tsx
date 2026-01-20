/**
 * Unit Tests: Favorites Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 7
 *
 * USER STORY 7: Access Recent and Favorite Files
 * Goal: Display bookmarked files for quick access
 *
 * Test Categories:
 * - Basic rendering
 * - List display
 * - Empty state
 * - Click handling
 * - Remove functionality
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Favorites } from '@/components/reader/navigation/Favorites';
import type { Favorite } from '@/types/reader';

describe('Favorites', () => {
  const mockFavorites: Favorite[] = [
    { path: '/docs/readme.md', name: 'readme.md', addedAt: '2024-01-03T00:00:00.000Z' },
    { path: '/docs/api.md', name: 'api.md', addedAt: '2024-01-02T00:00:00.000Z' },
    { path: '/docs/guide.md', name: 'guide.md', addedAt: '2024-01-01T00:00:00.000Z' },
  ];

  const defaultProps = {
    favorites: mockFavorites,
    onSelect: vi.fn(),
    onRemove: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render with test id for integration', () => {
      render(<Favorites {...defaultProps} />);
      expect(screen.getByTestId('favorites')).toBeInTheDocument();
    });

    it('should render section heading', () => {
      render(<Favorites {...defaultProps} />);
      expect(screen.getByRole('heading', { name: /favorites/i })).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<Favorites {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('favorites')).toHaveClass('custom-class');
    });
  });

  describe('List Display', () => {
    it('should render all favorites', () => {
      render(<Favorites {...defaultProps} />);

      expect(screen.getByText('readme.md')).toBeInTheDocument();
      expect(screen.getByText('api.md')).toBeInTheDocument();
      expect(screen.getByText('guide.md')).toBeInTheDocument();
    });

    it('should show star/bookmark icon for each item', () => {
      render(<Favorites {...defaultProps} />);

      const icons = screen.getAllByTestId('favorite-icon');
      expect(icons).toHaveLength(3);
    });

    it('should show remove button for each item', () => {
      render(<Favorites {...defaultProps} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      expect(removeButtons).toHaveLength(3);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no favorites', () => {
      render(<Favorites favorites={[]} onSelect={vi.fn()} onRemove={vi.fn()} />);
      expect(screen.getByText(/no favorites/i)).toBeInTheDocument();
    });

    it('should show helpful message in empty state', () => {
      render(<Favorites favorites={[]} onSelect={vi.fn()} onRemove={vi.fn()} />);
      expect(screen.getByText(/star icon to add/i)).toBeInTheDocument();
    });

    it('should not render list when empty', () => {
      render(<Favorites favorites={[]} onSelect={vi.fn()} onRemove={vi.fn()} />);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onSelect with path when clicking file', () => {
      const onSelect = vi.fn();
      render(<Favorites {...defaultProps} onSelect={onSelect} />);

      fireEvent.click(screen.getByText('readme.md'));

      expect(onSelect).toHaveBeenCalledWith('/docs/readme.md');
    });

    it('should call onSelect with correct path for each file', () => {
      const onSelect = vi.fn();
      render(<Favorites {...defaultProps} onSelect={onSelect} />);

      fireEvent.click(screen.getByText('api.md'));
      expect(onSelect).toHaveBeenCalledWith('/docs/api.md');

      fireEvent.click(screen.getByText('guide.md'));
      expect(onSelect).toHaveBeenCalledWith('/docs/guide.md');
    });
  });

  describe('Remove Functionality', () => {
    it('should call onRemove with path when clicking remove button', () => {
      const onRemove = vi.fn();
      render(<Favorites {...defaultProps} onRemove={onRemove} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      expect(onRemove).toHaveBeenCalledWith('/docs/readme.md');
    });

    it('should not call onSelect when clicking remove button', () => {
      const onSelect = vi.fn();
      const onRemove = vi.fn();
      render(<Favorites {...defaultProps} onSelect={onSelect} onRemove={onRemove} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      expect(onRemove).toHaveBeenCalled();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have list role', () => {
      render(<Favorites {...defaultProps} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have listitem role for each file', () => {
      render(<Favorites {...defaultProps} />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('should have accessible buttons for select and remove', () => {
      render(<Favorites {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Active State', () => {
    it('should highlight current path', () => {
      render(
        <Favorites
          {...defaultProps}
          currentPath="/docs/readme.md"
        />
      );

      const activeItem = screen.getByText('readme.md').closest('li');
      expect(activeItem).toHaveAttribute('data-active', 'true');
    });

    it('should not highlight when current path differs', () => {
      render(
        <Favorites
          {...defaultProps}
          currentPath="/docs/other.md"
        />
      );

      const items = screen.getAllByRole('listitem');
      items.forEach((item) => {
        expect(item).toHaveAttribute('data-active', 'false');
      });
    });
  });
});
