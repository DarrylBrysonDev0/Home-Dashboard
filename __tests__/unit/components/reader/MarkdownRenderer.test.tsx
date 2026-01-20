/**
 * Unit Tests: MarkdownRenderer Component
 *
 * TDD Phase: RED - These tests should FAIL until component is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 1
 *
 * USER STORY 1: Browse and View Documentation
 * Goal: Render markdown files with proper formatting
 *
 * Test Categories:
 * - Basic markdown rendering
 * - GFM (GitHub Flavored Markdown) support
 * - Link handling (internal vs external)
 * - Image handling
 * - Code blocks (basic, syntax highlighting added in Phase 4)
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkdownRenderer } from '@/components/reader/content/MarkdownRenderer';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Markdown Rendering', () => {
    it('should render headings correctly', () => {
      const content = '# Heading 1\n## Heading 2\n### Heading 3';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Heading 1'
      );
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'Heading 2'
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Heading 3'
      );
    });

    it('should render paragraphs', () => {
      const content = 'This is a paragraph.\n\nThis is another paragraph.';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
      expect(screen.getByText('This is another paragraph.')).toBeInTheDocument();
    });

    it('should render unordered lists', () => {
      const content = '- Item 1\n- Item 2\n- Item 3';

      render(<MarkdownRenderer content={content} />);

      const list = screen.getByRole('list');
      expect(list.tagName).toBe('UL');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('should render ordered lists', () => {
      const content = '1. First\n2. Second\n3. Third';

      render(<MarkdownRenderer content={content} />);

      const list = screen.getByRole('list');
      expect(list.tagName).toBe('OL');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('should render bold text', () => {
      const content = 'This is **bold** text.';

      render(<MarkdownRenderer content={content} />);

      const bold = screen.getByText('bold');
      expect(bold.tagName).toBe('STRONG');
    });

    it('should render italic text', () => {
      const content = 'This is *italic* text.';

      render(<MarkdownRenderer content={content} />);

      const italic = screen.getByText('italic');
      expect(italic.tagName).toBe('EM');
    });

    it('should render blockquotes', () => {
      const content = '> This is a quote.';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('This is a quote.')).toBeInTheDocument();
      const quote = screen.getByText('This is a quote.').closest('blockquote');
      expect(quote).toBeInTheDocument();
    });

    it('should render horizontal rules', () => {
      const content = 'Before\n\n---\n\nAfter';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('separator')).toBeInTheDocument();
    });

    it('should render inline code', () => {
      const content = 'Use the `console.log()` function.';

      render(<MarkdownRenderer content={content} />);

      const code = screen.getByText('console.log()');
      expect(code.tagName).toBe('CODE');
    });
  });

  describe('GFM (GitHub Flavored Markdown)', () => {
    it('should render tables', () => {
      const content = `
| Name | Age |
|------|-----|
| John | 30  |
| Jane | 25  |
`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 data rows
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should render strikethrough text', () => {
      const content = 'This is ~~deleted~~ text.';

      render(<MarkdownRenderer content={content} />);

      const deleted = screen.getByText('deleted');
      expect(deleted.tagName).toBe('DEL');
    });

    it('should render task lists', () => {
      const content = '- [x] Done task\n- [ ] Pending task';

      render(<MarkdownRenderer content={content} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('should render autolinks', () => {
      const content = 'Visit https://example.com for more info.';

      render(<MarkdownRenderer content={content} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('Link Handling', () => {
    it('should render external links with target="_blank"', () => {
      const content = '[External](https://example.com)';

      render(<MarkdownRenderer content={content} currentPath="/docs/readme.md" />);

      const link = screen.getByRole('link', { name: 'External' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should render internal doc links without target="_blank"', () => {
      const content = '[Internal](./other.md)';

      render(<MarkdownRenderer content={content} currentPath="/docs/readme.md" />);

      const link = screen.getByRole('link', { name: 'Internal' });
      expect(link).not.toHaveAttribute('target', '_blank');
    });

    it('should handle relative links to sibling files', async () => {
      const user = userEvent.setup();
      const content = '[Sibling](./sibling.md)';

      render(<MarkdownRenderer content={content} currentPath="/docs/readme.md" />);

      const link = screen.getByRole('link', { name: 'Sibling' });
      await user.click(link);

      expect(mockPush).toHaveBeenCalledWith('/reader/docs/sibling.md');
    });

    it('should handle relative links to parent directory', async () => {
      const user = userEvent.setup();
      const content = '[Parent](../index.md)';

      render(<MarkdownRenderer content={content} currentPath="/docs/api/readme.md" />);

      const link = screen.getByRole('link', { name: 'Parent' });
      await user.click(link);

      expect(mockPush).toHaveBeenCalledWith('/reader/docs/index.md');
    });

    it('should handle absolute paths from docs root', async () => {
      const user = userEvent.setup();
      const content = '[Root](/readme.md)';

      render(<MarkdownRenderer content={content} currentPath="/docs/readme.md" />);

      const link = screen.getByRole('link', { name: 'Root' });
      await user.click(link);

      expect(mockPush).toHaveBeenCalledWith('/reader/readme.md');
    });

    it('should open mailto links normally', () => {
      const content = '[Email](mailto:test@example.com)';

      render(<MarkdownRenderer content={content} currentPath="/readme.md" />);

      const link = screen.getByRole('link', { name: 'Email' });
      expect(link).toHaveAttribute('href', 'mailto:test@example.com');
    });

    it('should add external link indicator icon', () => {
      const content = '[External](https://example.com)';

      render(<MarkdownRenderer content={content} currentPath="/readme.md" />);

      const link = screen.getByRole('link', { name: /external/i });
      expect(
        link.querySelector('[data-icon="external-link"]')
      ).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    it('should render images with relative paths', () => {
      const content = '![Alt Text](./images/photo.png)';

      render(<MarkdownRenderer content={content} currentPath="/docs/readme.md" />);

      const img = screen.getByRole('img', { name: 'Alt Text' });
      // Implementation uses encodeURIComponent which encodes slashes
      expect(img).toHaveAttribute(
        'src',
        '/api/reader/image?path=%2Fdocs%2Fimages%2Fphoto.png'
      );
    });

    it('should render images with absolute paths from docs root', () => {
      const content = '![Logo](/images/logo.png)';

      render(<MarkdownRenderer content={content} currentPath="/readme.md" />);

      const img = screen.getByRole('img', { name: 'Logo' });
      // Implementation uses encodeURIComponent which encodes slashes
      expect(img).toHaveAttribute('src', '/api/reader/image?path=%2Fimages%2Flogo.png');
    });

    it('should NOT render images with external URLs', () => {
      const content = '![External](https://example.com/image.png)';

      render(<MarkdownRenderer content={content} currentPath="/readme.md" />);

      // Should not render an img tag for external URLs
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      // Should show placeholder or warning
      expect(screen.getByText(/external images.*not supported/i)).toBeInTheDocument();
    });

    it('should preserve alt text for accessibility', () => {
      const content = '![Descriptive alt text](./image.png)';

      render(<MarkdownRenderer content={content} currentPath="/readme.md" />);

      expect(
        screen.getByRole('img', { name: 'Descriptive alt text' })
      ).toBeInTheDocument();
    });
  });

  describe('Code Blocks', () => {
    it('should render fenced code blocks', () => {
      const content = '```\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} />);

      const codeBlock = screen.getByText('const x = 1;');
      expect(codeBlock.closest('pre')).toBeInTheDocument();
    });

    it('should preserve code block language annotation', () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} />);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveAttribute('data-language', 'javascript');
    });

    it('should render multiple code blocks independently', () => {
      const content = '```js\nconst a = 1;\n```\n\n```python\nx = 1\n```';

      render(<MarkdownRenderer content={content} />);

      const codeBlocks = screen.getAllByTestId('code-block');
      expect(codeBlocks).toHaveLength(2);
      expect(codeBlocks[0]).toHaveAttribute('data-language', 'js');
      expect(codeBlocks[1]).toHaveAttribute('data-language', 'python');
    });

    it('should handle code blocks without language', () => {
      const content = '```\nplain code\n```';

      render(<MarkdownRenderer content={content} />);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveAttribute('data-language', '');
    });
  });

  describe('Mermaid Code Blocks', () => {
    it('should NOT render mermaid blocks as code (delegated to MermaidRenderer)', () => {
      const content = '```mermaid\ngraph TD\n    A --> B\n```';

      render(<MarkdownRenderer content={content} />);

      // Mermaid blocks should be handled differently
      expect(screen.getByTestId('mermaid-block')).toBeInTheDocument();
      expect(screen.queryByTestId('code-block')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading structure', () => {
      const content = '# Main Title\n## Section\n### Subsection';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should have proper table semantics', () => {
      const content = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getAllByRole('columnheader')).toHaveLength(2);
      expect(screen.getAllByRole('cell')).toHaveLength(2);
    });

    it('should announce code blocks appropriately', () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} />);

      const codeBlock = screen.getByTestId('code-block');
      // Use exact match - implementation format is "language code block"
      expect(codeBlock).toHaveAttribute('aria-label', 'javascript code block');
    });

    it('should have descriptive link text', () => {
      const content = '[Learn more about JavaScript](https://example.com)';

      render(<MarkdownRenderer content={content} currentPath="/readme.md" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName('Learn more about JavaScript');
    });
  });

  describe('Heading IDs', () => {
    it('should generate ids for headings (for TOC navigation)', () => {
      const content = '# Getting Started\n## Installation';

      render(<MarkdownRenderer content={content} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });

      expect(h1).toHaveAttribute('id', 'getting-started');
      expect(h2).toHaveAttribute('id', 'installation');
    });

    it('should handle special characters in heading ids', () => {
      const content = "# What's New in v2.0?";

      render(<MarkdownRenderer content={content} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('id', 'whats-new-in-v20');
    });

    it('should handle duplicate headings with unique ids', () => {
      const content = '# Introduction\n## Introduction\n### Introduction';

      render(<MarkdownRenderer content={content} />);

      const headings = screen.getAllByText('Introduction');
      const ids = headings.map((h) => h.getAttribute('id'));

      // Each should have unique id
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('onHeadingsExtracted Callback', () => {
    it('should call onHeadingsExtracted with heading data', () => {
      const mockOnHeadings = vi.fn();
      const content = '# Title\n## Section 1\n## Section 2';

      render(
        <MarkdownRenderer content={content} onHeadingsExtracted={mockOnHeadings} />
      );

      expect(mockOnHeadings).toHaveBeenCalledWith([
        { id: 'title', text: 'Title', level: 1 },
        { id: 'section-1', text: 'Section 1', level: 2 },
        { id: 'section-2', text: 'Section 2', level: 2 },
      ]);
    });
  });

  describe('Display Modes', () => {
    it('should apply themed mode styles by default', () => {
      const content = '# Test';

      render(<MarkdownRenderer content={content} />);

      const container = screen.getByTestId('markdown-renderer');
      expect(container).toHaveAttribute('data-mode', 'themed');
    });

    it('should apply reading mode styles when specified', () => {
      const content = '# Test';

      render(<MarkdownRenderer content={content} displayMode="reading" />);

      const container = screen.getByTestId('markdown-renderer');
      expect(container).toHaveAttribute('data-mode', 'reading');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content gracefully', () => {
      render(<MarkdownRenderer content="" />);

      const container = screen.getByTestId('markdown-renderer');
      expect(container).toBeInTheDocument();
    });

    it('should handle null/undefined content', () => {
      // @ts-expect-error Testing error handling
      render(<MarkdownRenderer content={null} />);

      const container = screen.getByTestId('markdown-renderer');
      expect(container).toBeInTheDocument();
    });
  });
});
