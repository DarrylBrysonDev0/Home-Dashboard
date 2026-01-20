/**
 * CodeBlock Component
 *
 * Renders syntax-highlighted code blocks using Shiki.
 * This is a stub file for TDD - implementation pending.
 *
 * @see specs/005-markdown-reader/spec.md User Story 2
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

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
 * TODO: Implement with actual Shiki highlighting
 */
export function CodeBlock({
  code,
  language,
  theme = 'dark',
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  // Stub implementation - will be replaced with actual Shiki integration
  return (
    <div
      data-testid="code-block"
      data-language={language}
      data-theme={theme === 'light' ? 'github-light' : 'github-dark'}
      aria-label={language ? `${language} code block` : 'code block'}
      className={cn('overflow-x-auto', className)}
    >
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
