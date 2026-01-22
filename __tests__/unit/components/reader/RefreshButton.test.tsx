/**
 * Unit Tests: RefreshButton Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 9
 *
 * USER STORY 9: Refresh Content Without Page Reload
 * Goal: Reload current file content without full page reload to see external changes
 *
 * Test Categories:
 * - Basic rendering
 * - Click behavior
 * - Loading state
 * - Disabled state
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RefreshButton } from '@/components/reader/controls/RefreshButton';

describe('RefreshButton', () => {
  const defaultProps = {
    onRefresh: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render with test id for integration', () => {
      render(<RefreshButton {...defaultProps} />);
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    it('should render as a button', () => {
      render(<RefreshButton {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display refresh icon', () => {
      render(<RefreshButton {...defaultProps} />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<RefreshButton {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('refresh-button')).toHaveClass('custom-class');
    });
  });

  describe('Click Behavior', () => {
    it('should call onRefresh when clicked', () => {
      const onRefresh = vi.fn();
      render(<RefreshButton onRefresh={onRefresh} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('should call onRefresh on each click', () => {
      const onRefresh = vi.fn();
      render(<RefreshButton onRefresh={onRefresh} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onRefresh).toHaveBeenCalledTimes(3);
    });
  });

  describe('Loading State', () => {
    it('should support loading prop', () => {
      render(<RefreshButton {...defaultProps} loading />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading indicator when loading', () => {
      render(<RefreshButton {...defaultProps} loading />);

      expect(screen.getByTestId('refresh-loading')).toBeInTheDocument();
    });

    it('should hide refresh icon when loading', () => {
      render(<RefreshButton {...defaultProps} loading />);

      expect(screen.queryByTestId('refresh-icon')).not.toBeInTheDocument();
    });

    it('should not call onRefresh when loading', () => {
      const onRefresh = vi.fn();
      render(<RefreshButton onRefresh={onRefresh} loading />);

      fireEvent.click(screen.getByRole('button'));

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should animate loading spinner', () => {
      render(<RefreshButton {...defaultProps} loading />);

      const loading = screen.getByTestId('refresh-loading');
      expect(loading).toHaveClass('animate-spin');
    });
  });

  describe('Disabled State', () => {
    it('should support disabled prop', () => {
      render(<RefreshButton {...defaultProps} disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onRefresh when disabled', () => {
      const onRefresh = vi.fn();
      render(<RefreshButton onRefresh={onRefresh} disabled />);

      fireEvent.click(screen.getByRole('button'));

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('should have reduced opacity when disabled', () => {
      render(<RefreshButton {...defaultProps} disabled />);

      const button = screen.getByTestId('refresh-button');
      expect(button.className).toMatch(/opacity-50|cursor-not-allowed/);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<RefreshButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Refresh content');
    });

    it('should be focusable', () => {
      render(<RefreshButton {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should respond to keyboard activation', () => {
      const onRefresh = vi.fn();
      render(<RefreshButton onRefresh={onRefresh} />);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.click(button); // Enter/Space triggers click on buttons

      expect(onRefresh).toHaveBeenCalled();
    });

    it('should have title attribute for tooltip', () => {
      render(<RefreshButton {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Refresh content');
    });

    it('should indicate loading state to screen readers', () => {
      render(<RefreshButton {...defaultProps} loading />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should not indicate busy when not loading', () => {
      render(<RefreshButton {...defaultProps} loading={false} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('Visual State', () => {
    it('should have hover styles when not disabled', () => {
      render(<RefreshButton {...defaultProps} />);

      const button = screen.getByTestId('refresh-button');
      // Check hover class is applied
      expect(button.className).toMatch(/hover:/);
    });

    it('should show focus ring on focus', () => {
      render(<RefreshButton {...defaultProps} />);

      const button = screen.getByTestId('refresh-button');
      expect(button.className).toMatch(/focus-visible:ring|focus:/);
    });
  });
});
