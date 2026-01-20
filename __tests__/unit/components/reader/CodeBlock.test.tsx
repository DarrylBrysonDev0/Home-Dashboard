/**
 * Unit Tests: CodeBlock Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 2
 *
 * USER STORY 2: Syntax-Highlighted Code Blocks
 * Goal: Display code blocks with VS Code-quality syntax highlighting
 *
 * Test Categories:
 * - Language detection and display
 * - Syntax highlighting via shiki
 * - Theme support (light/dark mode)
 * - Copy to clipboard functionality
 * - Error handling for unknown languages
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CodeBlock } from '@/components/reader/content/CodeBlock';

// Mock the shiki highlighter module
vi.mock('@/lib/reader/shiki-highlighter', () => ({
  getHighlighter: vi.fn().mockResolvedValue({
    codeToHtml: vi.fn((code: string, options: { lang: string; theme: string }) => {
      return `<pre class="shiki ${options.theme}"><code><span class="line">${code}</span></code></pre>`;
    }),
  }),
  highlightCode: vi.fn(async (code: string, _lang: string, theme: string) => {
    // Split code by lines and wrap each in a span.line
    const lines = code.split('\n').map(line => `<span class="line">${line}</span>`).join('');
    return `<pre class="shiki ${theme}"><code>${lines}</code></pre>`;
  }),
  isLanguageSupported: vi.fn((lang: string) => {
    const supported = ['typescript', 'javascript', 'python', 'bash', 'sql', 'json', 'yaml', 'markdown', 'css', 'html', 'tsx', 'jsx', 'go', 'rust'];
    return supported.includes(lang);
  }),
  // Theme constants
  DARK_THEME: 'github-dark',
  LIGHT_THEME: 'github-light',
  DEFAULT_THEME: 'github-dark',
  SUPPORTED_THEMES: ['github-dark', 'github-light', 'one-dark-pro'],
}));

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render code content', () => {
      const code = 'const x = 1;';
      render(<CodeBlock code={code} language="typescript" />);
      expect(screen.getByText(code)).toBeInTheDocument();
    });

    it('should render with test id for integration', () => {
      render(<CodeBlock code="console.log('test')" language="javascript" />);
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
    });

    it('should display language label', () => {
      render(<CodeBlock code="print('hello')" language="python" />);
      expect(screen.getByText('python')).toBeInTheDocument();
    });

    it('should render without language label when language is empty', () => {
      render(<CodeBlock code="plain text" language="" />);
      expect(screen.getByTestId('code-block')).toBeInTheDocument();
      // Should not have a language label element or it should be empty
      const labelElement = screen.queryByTestId('code-block-language');
      if (labelElement) {
        expect(labelElement).toHaveTextContent('');
      }
    });
  });

  describe('Language Detection', () => {
    it('should detect typescript from language prop', () => {
      render(<CodeBlock code="const x: number = 1;" language="typescript" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'typescript');
    });

    it('should detect javascript from language prop', () => {
      render(<CodeBlock code="const x = 1;" language="javascript" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'javascript');
    });

    it('should handle ts as alias for typescript', () => {
      render(<CodeBlock code="const x: number = 1;" language="ts" />);
      const block = screen.getByTestId('code-block');
      // Should normalize to typescript or accept ts
      expect(['typescript', 'ts']).toContain(block.getAttribute('data-language'));
    });

    it('should handle js as alias for javascript', () => {
      render(<CodeBlock code="const x = 1;" language="js" />);
      const block = screen.getByTestId('code-block');
      expect(['javascript', 'js']).toContain(block.getAttribute('data-language'));
    });

    it('should handle Python language', () => {
      render(<CodeBlock code="def hello(): pass" language="python" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'python');
    });

    it('should handle bash/shell language', () => {
      render(<CodeBlock code="echo 'hello'" language="bash" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'bash');
    });

    it('should handle SQL language', () => {
      render(<CodeBlock code="SELECT * FROM users" language="sql" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'sql');
    });

    it('should handle JSON language', () => {
      render(<CodeBlock code='{"key": "value"}' language="json" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'json');
    });

    it('should handle YAML language', () => {
      render(<CodeBlock code="key: value" language="yaml" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'yaml');
    });

    it('should handle CSS language', () => {
      render(<CodeBlock code=".class { color: red; }" language="css" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'css');
    });

    it('should handle HTML language', () => {
      render(<CodeBlock code="<div>Hello</div>" language="html" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'html');
    });

    it('should handle TSX language', () => {
      render(<CodeBlock code="const App: FC = () => <div />" language="tsx" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'tsx');
    });

    it('should handle JSX language', () => {
      render(<CodeBlock code="const App = () => <div />" language="jsx" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'jsx');
    });
  });

  describe('Theme Support', () => {
    it('should use dark theme by default', () => {
      render(<CodeBlock code="const x = 1;" language="typescript" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-theme', 'github-dark');
    });

    it('should apply light theme when specified', () => {
      render(<CodeBlock code="const x = 1;" language="typescript" theme="light" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-theme', 'github-light');
    });

    it('should apply dark theme when specified', () => {
      render(<CodeBlock code="const x = 1;" language="typescript" theme="dark" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-theme', 'github-dark');
    });

    it('should update theme when prop changes', () => {
      const { rerender } = render(
        <CodeBlock code="const x = 1;" language="typescript" theme="dark" />
      );
      expect(screen.getByTestId('code-block')).toHaveAttribute('data-theme', 'github-dark');

      rerender(<CodeBlock code="const x = 1;" language="typescript" theme="light" />);
      expect(screen.getByTestId('code-block')).toHaveAttribute('data-theme', 'github-light');
    });
  });

  describe('Copy to Clipboard', () => {
    it('should render copy button', () => {
      render(<CodeBlock code="const x = 1;" language="typescript" />);
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render plain code for unsupported languages', () => {
      render(<CodeBlock code="some code" language="unknown-lang" />);
      expect(screen.getByText('some code')).toBeInTheDocument();
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('data-language', 'unknown-lang');
    });

    it('should handle empty code gracefully', () => {
      render(<CodeBlock code="" language="typescript" />);
      const block = screen.getByTestId('code-block');
      expect(block).toBeInTheDocument();
    });

    it('should handle very long code lines', () => {
      const longLine = 'x'.repeat(1000);
      render(<CodeBlock code={longLine} language="text" />);
      const block = screen.getByTestId('code-block');
      expect(block).toBeInTheDocument();
      // Should have overflow handling
      expect(block).toHaveClass('overflow-x-auto');
    });

    it('should handle unicode characters', () => {
      const code = 'const emoji = "🎉";\nconst chinese = "你好";';
      render(<CodeBlock code={code} language="javascript" />);
      expect(screen.getByText(/🎉/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<CodeBlock code="const x = 1;" language="typescript" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('aria-label', 'typescript code block');
    });

    it('should have generic aria-label for unknown language', () => {
      render(<CodeBlock code="some code" language="" />);
      const block = screen.getByTestId('code-block');
      expect(block).toHaveAttribute('aria-label', 'code block');
    });
  });

  describe('Syntax Highlighting', () => {
    it('should apply shiki highlighting', async () => {
      render(<CodeBlock code="const x = 1;" language="typescript" />);
      // Wait for async highlighting to complete
      await waitFor(() => {
        const block = screen.getByTestId('code-block');
        const highlighted = block.querySelector('.shiki');
        expect(highlighted).toBeInTheDocument();
      });
    });

    it('should contain highlighted HTML from shiki', async () => {
      render(<CodeBlock code="const x = 1;" language="typescript" />);
      // Wait for async highlighting to complete
      await waitFor(() => {
        const spans = screen.getByTestId('code-block').querySelectorAll('span.line');
        expect(spans.length).toBeGreaterThan(0);
      });
    });
  });

  describe('className Prop', () => {
    it('should accept custom className', () => {
      render(
        <CodeBlock
          code="const x = 1;"
          language="typescript"
          className="custom-class"
        />
      );
      const block = screen.getByTestId('code-block');
      expect(block).toHaveClass('custom-class');
    });
  });

  describe('Line Numbers', () => {
    it('should optionally show line numbers', async () => {
      const multilineCode = `const a = 1;
const b = 2;
const c = 3;`;
      render(
        <CodeBlock
          code={multilineCode}
          language="typescript"
          showLineNumbers
        />
      );
      // Wait for async highlighting to complete, then check line numbers
      await waitFor(() => {
        const lineNumbers = screen.getByTestId('code-block').querySelectorAll('[data-line-number]');
        expect(lineNumbers.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should not show line numbers by default', async () => {
      render(
        <CodeBlock
          code="const a = 1;\nconst b = 2;"
          language="typescript"
        />
      );
      // Wait for async highlighting to complete
      await waitFor(() => {
        const block = screen.getByTestId('code-block');
        expect(block.querySelector('.shiki')).toBeInTheDocument();
      });
      // Then verify no line numbers
      const lineNumbers = screen.getByTestId('code-block').querySelectorAll('[data-line-number]');
      expect(lineNumbers.length).toBe(0);
    });
  });
});
