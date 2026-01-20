/**
 * CodeBlock Component
 *
 * Renders syntax-highlighted code blocks using Shiki.
 * Supports theme switching, copy to clipboard, and line numbers.
 *
 * Security Note: dangerouslySetInnerHTML is safe here because:
 * 1. Shiki generates the HTML from our controlled code content
 * 2. Shiki properly escapes all code content during highlighting
 * 3. Content comes from sandboxed documentation files (DOCS_ROOT)
 *
 * @see specs/005-markdown-reader/spec.md User Story 2
 */

'use client';

import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightCode, DARK_THEME, LIGHT_THEME } from '@/lib/reader/shiki-highlighter';

export interface CodeBlockProps {
  /** The code content to highlight */
  code: string;
  /** Programming language for syntax highlighting */
  language: string;
  /** Color theme: 'light' or 'dark' */
  theme?: 'light' | 'dark';
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * CodeBlock component for syntax-highlighted code display
 */
export function CodeBlock({
  code,
  language,
  theme = 'dark',
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const shikiTheme = theme === 'light' ? LIGHT_THEME : DARK_THEME;

  // Highlight code on mount and when dependencies change
  React.useEffect(() => {
    let mounted = true;

    async function highlight() {
      try {
        const html = await highlightCode(code, language, shikiTheme);
        if (mounted) {
          setHighlightedHtml(html);
        }
      } catch {
        // Fallback to plain text on error
        if (mounted) {
          const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          setHighlightedHtml(
            `<pre class="shiki ${shikiTheme}"><code><span class="line">${escaped}</span></code></pre>`
          );
        }
      }
    }

    highlight();

    return () => {
      mounted = false;
    };
  }, [code, language, shikiTheme]);

  // Handle copy to clipboard
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      console.error('Failed to copy to clipboard');
    }
  }, [code]);

  // Add line numbers if enabled
  const processedHtml = React.useMemo(() => {
    if (!showLineNumbers || !highlightedHtml) {
      return highlightedHtml;
    }

    // Parse the HTML and add line number data attributes
    const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    if (!parser) return highlightedHtml;

    const doc = parser.parseFromString(highlightedHtml, 'text/html');
    const lines = doc.querySelectorAll('.line');
    lines.forEach((line, index) => {
      line.setAttribute('data-line-number', String(index + 1));
    });

    return doc.body.innerHTML;
  }, [highlightedHtml, showLineNumbers]);

  return (
    <div
      data-testid="code-block"
      data-language={language}
      data-theme={shikiTheme}
      aria-label={language ? `${language} code block` : 'code block'}
      className={cn(
        'relative group overflow-x-auto rounded-md',
        className
      )}
    >
      {/* Language label */}
      {language && (
        <div
          data-testid="code-block-language"
          className="absolute top-2 left-3 text-xs text-muted-foreground opacity-70"
        >
          {language}
        </div>
      )}

      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied!' : 'Copy code'}
        className={cn(
          'absolute top-2 right-2 p-1.5 rounded-md',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'bg-background/80 hover:bg-background border border-border',
          'text-muted-foreground hover:text-foreground'
        )}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>

      {/* Highlighted code - Shiki output is safe as it escapes all content */}
      {processedHtml ? (
        <div
          className="[&_pre]:p-4 [&_pre]:pt-8 [&_pre]:overflow-x-auto [&_code]:text-sm"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      ) : (
        // Fallback while loading
        <pre className="p-4 pt-8 overflow-x-auto">
          <code className="text-sm">{code}</code>
        </pre>
      )}
    </div>
  );
}
