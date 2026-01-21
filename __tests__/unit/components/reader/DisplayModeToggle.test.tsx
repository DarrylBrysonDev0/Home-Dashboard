/**
 * Unit Tests: DisplayModeToggle Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 6
 *
 * USER STORY 6: Toggle Between Themed and Reading Modes
 * Goal: Switch between themed display mode (app aesthetic) and reading mode (clean, neutral)
 *
 * Test Categories:
 * - Basic rendering
 * - Display mode switching
 * - Visual state feedback
 * - Accessibility
 * - Controlled mode
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisplayModeToggle } from '@/components/reader/controls/DisplayModeToggle';
import type { DisplayMode } from '@/types/reader';

describe('DisplayModeToggle', () => {
  const defaultProps = {
    mode: 'themed' as DisplayMode,
    onModeChange: vi.fn(),
  };

  describe('Basic Rendering', () => {
    it('should render with test id for integration', () => {
      render(<DisplayModeToggle {...defaultProps} />);
      expect(screen.getByTestId('display-mode-toggle')).toBeInTheDocument();
    });

    it('should render toggle button', () => {
      render(<DisplayModeToggle {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display themed mode icon when in themed mode', () => {
      render(<DisplayModeToggle {...defaultProps} mode="themed" />);
      expect(screen.getByTestId('themed-mode-icon')).toBeInTheDocument();
    });

    it('should display reading mode icon when in reading mode', () => {
      render(<DisplayModeToggle {...defaultProps} mode="reading" />);
      expect(screen.getByTestId('reading-mode-icon')).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(<DisplayModeToggle {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('display-mode-toggle')).toHaveClass('custom-class');
    });
  });

  describe('Mode Switching', () => {
    it('should call onModeChange with "reading" when clicking in themed mode', () => {
      const onModeChange = vi.fn();
      render(<DisplayModeToggle mode="themed" onModeChange={onModeChange} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onModeChange).toHaveBeenCalledWith('reading');
    });

    it('should call onModeChange with "themed" when clicking in reading mode', () => {
      const onModeChange = vi.fn();
      render(<DisplayModeToggle mode="reading" onModeChange={onModeChange} />);

      fireEvent.click(screen.getByRole('button'));

      expect(onModeChange).toHaveBeenCalledWith('themed');
    });

    it('should toggle mode on each click', () => {
      const onModeChange = vi.fn();
      const { rerender } = render(
        <DisplayModeToggle mode="themed" onModeChange={onModeChange} />
      );

      // First click: themed -> reading
      fireEvent.click(screen.getByRole('button'));
      expect(onModeChange).toHaveBeenLastCalledWith('reading');

      // Update mode to reading
      rerender(<DisplayModeToggle mode="reading" onModeChange={onModeChange} />);

      // Second click: reading -> themed
      fireEvent.click(screen.getByRole('button'));
      expect(onModeChange).toHaveBeenLastCalledWith('themed');
    });
  });

  describe('Visual State', () => {
    it('should indicate current mode visually', () => {
      const { rerender } = render(<DisplayModeToggle {...defaultProps} mode="themed" />);

      const toggle = screen.getByTestId('display-mode-toggle');
      expect(toggle).toHaveAttribute('data-mode', 'themed');

      rerender(<DisplayModeToggle {...defaultProps} mode="reading" />);
      expect(toggle).toHaveAttribute('data-mode', 'reading');
    });

    it('should update visual state when mode prop changes', () => {
      const { rerender } = render(<DisplayModeToggle {...defaultProps} mode="themed" />);

      expect(screen.getByTestId('themed-mode-icon')).toBeInTheDocument();

      rerender(<DisplayModeToggle {...defaultProps} mode="reading" />);

      expect(screen.getByTestId('reading-mode-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<DisplayModeToggle {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should indicate target mode in aria-label', () => {
      const { rerender } = render(<DisplayModeToggle {...defaultProps} mode="themed" />);

      const button = screen.getByRole('button');
      // When in themed mode, label indicates switching to reading
      expect(button.getAttribute('aria-label')).toMatch(/reading/i);

      rerender(<DisplayModeToggle {...defaultProps} mode="reading" />);
      // When in reading mode, label indicates switching to themed
      expect(button.getAttribute('aria-label')).toMatch(/themed/i);
    });

    it('should be focusable', () => {
      render(<DisplayModeToggle {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should respond to keyboard activation', () => {
      const onModeChange = vi.fn();
      render(<DisplayModeToggle mode="themed" onModeChange={onModeChange} />);

      const button = screen.getByRole('button');
      // Simulate keyboard activation by triggering click (Enter/Space on button triggers click)
      button.focus();
      fireEvent.click(button);

      expect(onModeChange).toHaveBeenCalled();
    });

    it('should have aria-pressed attribute', () => {
      const { rerender } = render(<DisplayModeToggle {...defaultProps} mode="themed" />);

      const button = screen.getByRole('button');
      // When in themed mode (default), reading is not pressed
      expect(button).toHaveAttribute('aria-pressed');

      rerender(<DisplayModeToggle {...defaultProps} mode="reading" />);
      // Reading mode is active
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should support disabled prop', () => {
      render(<DisplayModeToggle {...defaultProps} disabled />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onModeChange when disabled', () => {
      const onModeChange = vi.fn();
      render(<DisplayModeToggle mode="themed" onModeChange={onModeChange} disabled />);

      fireEvent.click(screen.getByRole('button'));

      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('Tooltip/Title', () => {
    it('should show tooltip with current mode description', () => {
      const { rerender } = render(<DisplayModeToggle {...defaultProps} mode="themed" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title');
      expect(button.getAttribute('title')).toMatch(/reading/i);

      rerender(<DisplayModeToggle {...defaultProps} mode="reading" />);
      expect(button.getAttribute('title')).toMatch(/themed/i);
    });
  });
});
