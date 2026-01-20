/**
 * Unit Tests: MermaidRenderer Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 3
 * Reference: specs/005-markdown-reader/research.md Section 3 (Mermaid Diagram Rendering)
 *
 * USER STORY 3: View Mermaid Diagrams
 * Goal: Render Mermaid diagrams embedded in markdown or as standalone .mmd files
 *
 * Test Categories:
 * - Basic diagram rendering
 * - Theme support (dark/light/reading modes)
 * - Error handling for invalid syntax
 * - Unique ID generation (multiple diagrams)
 * - Re-render on theme change
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import MermaidRenderer from '@/components/reader/content/MermaidRenderer';

// Use vi.hoisted to define mocks before vi.mock hoisting
const { mockRender, mockInitialize } = vi.hoisted(() => ({
  mockRender: vi.fn(),
  mockInitialize: vi.fn(),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: mockInitialize,
    render: mockRender,
    parse: vi.fn().mockResolvedValue(true),
  },
}));

// Mock the mermaid-themes module
vi.mock('@/lib/reader/mermaid-themes', () => ({
  getMermaidThemeConfig: vi.fn((theme: string) => ({
    theme: theme === 'light' ? 'neutral' : 'dark',
    themeVariables: {
      primaryColor: theme === 'light' ? '#4F46E5' : '#818CF8',
      primaryTextColor: theme === 'light' ? '#1F2937' : '#F3F4F6',
      primaryBorderColor: theme === 'light' ? '#6366F1' : '#6366F1',
      lineColor: theme === 'light' ? '#6B7280' : '#9CA3AF',
      secondaryColor: theme === 'light' ? '#E0E7FF' : '#312E81',
      tertiaryColor: theme === 'light' ? '#F3F4F6' : '#1F2937',
    },
  })),
  MERMAID_THEMES: {
    dark: 'dark',
    light: 'neutral',
    reading: 'base',
  },
  DEFAULT_MERMAID_THEME: 'dark',
}));

describe('MermaidRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful render
    mockRender.mockResolvedValue({
      svg: '<svg class="mermaid-diagram"><g>Mock SVG Content</g></svg>',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with test id for integration', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('should render a flowchart diagram', async () => {
      const code = `graph TD
        A[Start] --> B{Decision}
        B -->|Yes| C[OK]
        B -->|No| D[Cancel]`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container.querySelector('svg')).toBeInTheDocument();
      });
    });

    it('should render a sequence diagram', async () => {
      const code = `sequenceDiagram
        Alice->>Bob: Hello Bob
        Bob-->>Alice: Hi Alice`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toBeInTheDocument();
      });
    });

    it('should render a class diagram', async () => {
      const code = `classDiagram
        class Animal
        Animal : +name
        Animal : +makeSound()`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('should render a state diagram', async () => {
      const code = `stateDiagram-v2
        [*] --> Still
        Still --> Moving
        Moving --> Still`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('should render an ER diagram', async () => {
      const code = `erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('should render a pie chart', async () => {
      const code = `pie title Pets
        "Dogs" : 386
        "Cats" : 85
        "Rats" : 15`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('should render a Gantt chart', async () => {
      const code = `gantt
        title A Gantt Diagram
        section Section
        A task : a1, 2024-01-01, 30d`;

      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });
    });

    it('should call mermaid.render with the code', async () => {
      const code = 'graph TD; A-->B';
      render(<MermaidRenderer code={code} />);

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
        // Check that render was called with code containing the diagram
        const renderCalls = mockRender.mock.calls;
        expect(renderCalls.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique IDs for multiple diagrams', async () => {
      const { rerender } = render(<MermaidRenderer code="graph TD; A-->B" id="diagram-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toBeInTheDocument();
      });

      const firstCallId = mockRender.mock.calls[0]?.[0];

      rerender(<MermaidRenderer code="graph TD; C-->D" id="diagram-2" />);

      await waitFor(() => {
        const secondCallId = mockRender.mock.calls[1]?.[0];
        // IDs should be different
        if (firstCallId && secondCallId) {
          expect(firstCallId).not.toBe(secondCallId);
        }
      });
    });

    it('should accept custom id prop', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" id="my-custom-id" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveAttribute('data-diagram-id', 'my-custom-id');
      });
    });

    it('should generate a unique id when not provided', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        const diagramId = container.getAttribute('data-diagram-id');
        expect(diagramId).toBeTruthy();
        expect(diagramId).toMatch(/^mermaid-/);
      });
    });
  });

  describe('Theme Support', () => {
    it('should use dark theme by default', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
        const initConfig = mockInitialize.mock.calls[0]?.[0];
        expect(initConfig?.theme).toBe('dark');
      });
    });

    it('should apply light theme when specified', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" theme="light" />);

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
        const initConfig = mockInitialize.mock.calls[0]?.[0];
        expect(initConfig?.theme).toBe('neutral');
      });
    });

    it('should apply dark theme when specified', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" theme="dark" />);

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
        const initConfig = mockInitialize.mock.calls[0]?.[0];
        expect(initConfig?.theme).toBe('dark');
      });
    });

    it('should have data-theme attribute', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" theme="light" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveAttribute('data-theme', 'light');
      });
    });

    it('should re-render when theme changes', async () => {
      const { rerender } = render(<MermaidRenderer code="graph TD; A-->B" theme="dark" />);

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });

      const initialRenderCount = mockRender.mock.calls.length;

      // Change theme
      rerender(<MermaidRenderer code="graph TD; A-->B" theme="light" />);

      await waitFor(() => {
        // Should have been called again for theme change
        expect(mockRender.mock.calls.length).toBeGreaterThan(initialRenderCount);
      });
    });

    it('should initialize mermaid with startOnLoad: false', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
        const initConfig = mockInitialize.mock.calls[0]?.[0];
        expect(initConfig?.startOnLoad).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error state for invalid syntax', async () => {
      mockRender.mockRejectedValueOnce(new Error('Parse error: Invalid syntax'));

      render(<MermaidRenderer code="invalid mermaid syntax @@##" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveAttribute('data-error', 'true');
      });
    });

    it('should display error message', async () => {
      mockRender.mockRejectedValueOnce(new Error('Parse error: Invalid syntax'));

      render(<MermaidRenderer code="invalid @@##" />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show original code on error', async () => {
      const invalidCode = 'not valid mermaid';
      mockRender.mockRejectedValueOnce(new Error('Parse error'));

      render(<MermaidRenderer code={invalidCode} />);

      await waitFor(() => {
        expect(screen.getByText(invalidCode)).toBeInTheDocument();
      });
    });

    it('should have error styling distinct from success', async () => {
      mockRender.mockRejectedValueOnce(new Error('Error'));

      render(<MermaidRenderer code="invalid" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveClass('mermaid-error');
      });
    });

    it('should handle empty code gracefully', async () => {
      render(<MermaidRenderer code="" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toBeInTheDocument();
      });
    });

    it('should recover from error when valid code is provided', async () => {
      // First render with error
      mockRender.mockRejectedValueOnce(new Error('Parse error'));
      const { rerender } = render(<MermaidRenderer code="invalid" />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).toHaveAttribute('data-error', 'true');
      });

      // Reset mock to succeed
      mockRender.mockResolvedValueOnce({
        svg: '<svg><g>Valid</g></svg>',
      });

      // Rerender with valid code
      rerender(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).not.toHaveAttribute('data-error', 'true');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state while rendering', async () => {
      // Make render hang
      mockRender.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<MermaidRenderer code="graph TD; A-->B" />);

      // Should show loading state initially
      expect(screen.getByTestId('mermaid-renderer')).toHaveAttribute('data-loading', 'true');
    });

    it('should remove loading state after render completes', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(screen.getByTestId('mermaid-renderer')).not.toHaveAttribute('data-loading', 'true');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attribute', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveAttribute('role', 'img');
      });
    });

    it('should have aria-label describing the diagram', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveAttribute('aria-label', 'Mermaid diagram');
      });
    });

    it('should accept custom aria-label', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" ariaLabel="Flow chart showing process" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveAttribute('aria-label', 'Flow chart showing process');
      });
    });

    it('should have aria-busy during loading', async () => {
      mockRender.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<MermaidRenderer code="graph TD; A-->B" />);

      expect(screen.getByTestId('mermaid-renderer')).toHaveAttribute('aria-busy', 'true');
    });

    it('should have error announcement for screen readers', async () => {
      mockRender.mockRejectedValueOnce(new Error('Parse error'));

      render(<MermaidRenderer code="invalid" />);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
      });
    });
  });

  describe('className Prop', () => {
    it('should accept custom className', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" className="custom-class" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveClass('custom-class');
      });
    });

    it('should merge with default classes', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" className="custom-class" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        expect(container).toHaveClass('mermaid-container');
        expect(container).toHaveClass('custom-class');
      });
    });
  });

  describe('SVG Output', () => {
    it('should inject SVG into container', async () => {
      mockRender.mockResolvedValueOnce({
        svg: '<svg class="rendered"><rect /></svg>',
      });

      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        const container = screen.getByTestId('mermaid-renderer');
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should update SVG when code changes', async () => {
      const { rerender } = render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalled();
      });

      mockRender.mockResolvedValueOnce({
        svg: '<svg class="updated"><circle /></svg>',
      });

      rerender(<MermaidRenderer code="graph LR; X-->Y" />);

      await waitFor(() => {
        expect(mockRender.mock.calls.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Security', () => {
    it('should configure mermaid with securityLevel strict', async () => {
      render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled();
        const initConfig = mockInitialize.mock.calls[0]?.[0];
        expect(initConfig?.securityLevel).toBe('strict');
      });
    });
  });

  describe('Re-rendering Behavior', () => {
    it('should not re-render if code is unchanged', async () => {
      const { rerender } = render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalledTimes(1);
      });

      // Rerender with same code
      rerender(<MermaidRenderer code="graph TD; A-->B" />);

      // Should not have called render again
      await waitFor(() => {
        expect(mockRender).toHaveBeenCalledTimes(1);
      });
    });

    it('should re-render when code changes', async () => {
      const { rerender } = render(<MermaidRenderer code="graph TD; A-->B" />);

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalledTimes(1);
      });

      rerender(<MermaidRenderer code="graph TD; C-->D" />);

      await waitFor(() => {
        expect(mockRender).toHaveBeenCalledTimes(2);
      });
    });
  });
});
