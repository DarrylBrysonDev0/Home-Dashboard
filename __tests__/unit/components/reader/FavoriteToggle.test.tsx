/**
 * Unit Tests: FavoriteToggle Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 7
 *
 * USER STORY 7: Access Recent and Favorite Files
 * Goal: Toggle favorite status of a file via star button
 *
 * Test Categories:
 * - Basic rendering
 * - Toggle states (favorited/unfavorited)
 * - Click handling
 * - Accessibility
 * - Loading state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteToggle } from '@/components/reader/controls/FavoriteToggle';

describe('FavoriteToggle', () => {
  const defaultProps = {
    isFavorite: false,
    onToggle: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render with test id for integration', () => {
      render(<FavoriteToggle {...defaultProps} />);
      expect(screen.getByTestId('favorite-toggle')).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<FavoriteToggle {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<FavoriteToggle {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('favorite-toggle')).toHaveClass('custom-class');
    });
  });

  describe('Toggle States', () => {
    it('should show unfilled star when not favorited', () => {
      render(<FavoriteToggle isFavorite={false} onToggle={vi.fn()} />);
      expect(screen.getByTestId('star-outline-icon')).toBeInTheDocument();
    });

    it('should show filled star when favorited', () => {
      render(<FavoriteToggle isFavorite={true} onToggle={vi.fn()} />);
      expect(screen.getByTestId('star-filled-icon')).toBeInTheDocument();
    });

    it('should have data-favorited attribute', () => {
      const { rerender } = render(<FavoriteToggle {...defaultProps} isFavorite={false} />);

      expect(screen.getByTestId('favorite-toggle')).toHaveAttribute('data-favorited', 'false');

      rerender(<FavoriteToggle {...defaultProps} isFavorite={true} />);
      expect(screen.getByTestId('favorite-toggle')).toHaveAttribute('data-favorited', 'true');
    });

    it('should update visual state when isFavorite prop changes', () => {
      const { rerender } = render(<FavoriteToggle {...defaultProps} isFavorite={false} />);

      expect(screen.getByTestId('star-outline-icon')).toBeInTheDocument();

      rerender(<FavoriteToggle {...defaultProps} isFavorite={true} />);
      expect(screen.getByTestId('star-filled-icon')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call onToggle when clicked', () => {
      const onToggle = vi.fn();
      render(<FavoriteToggle isFavorite={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should call onToggle regardless of current state', () => {
      const onToggle = vi.fn();
      const { rerender } = render(<FavoriteToggle isFavorite={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole('button'));
      expect(onToggle).toHaveBeenCalledTimes(1);

      rerender(<FavoriteToggle isFavorite={true} onToggle={onToggle} />);
      fireEvent.click(screen.getByRole('button'));
      expect(onToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label when not favorited', () => {
      render(<FavoriteToggle isFavorite={false} onToggle={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Add to favorites');
    });

    it('should have accessible label when favorited', () => {
      render(<FavoriteToggle isFavorite={true} onToggle={vi.fn()} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
    });

    it('should be focusable', () => {
      render(<FavoriteToggle {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should have aria-pressed attribute', () => {
      const { rerender } = render(<FavoriteToggle {...defaultProps} isFavorite={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');

      rerender(<FavoriteToggle {...defaultProps} isFavorite={true} />);
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should support disabled prop', () => {
      render(<FavoriteToggle {...defaultProps} disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onToggle when disabled', () => {
      const onToggle = vi.fn();
      render(<FavoriteToggle isFavorite={false} onToggle={onToggle} disabled />);

      fireEvent.click(screen.getByRole('button'));

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      render(<FavoriteToggle {...defaultProps} loading />);
      expect(screen.getByTestId('favorite-loading')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<FavoriteToggle {...defaultProps} loading />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onToggle when loading', () => {
      const onToggle = vi.fn();
      render(<FavoriteToggle isFavorite={false} onToggle={onToggle} loading />);

      fireEvent.click(screen.getByRole('button'));

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip with action description', () => {
      const { rerender } = render(<FavoriteToggle {...defaultProps} isFavorite={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Add to favorites');

      rerender(<FavoriteToggle {...defaultProps} isFavorite={true} />);
      expect(button).toHaveAttribute('title', 'Remove from favorites');
    });
  });
});
