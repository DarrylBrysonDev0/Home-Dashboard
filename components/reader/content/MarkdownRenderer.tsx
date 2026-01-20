"use client";

/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with GFM support, custom link handling,
 * and image routing through the API.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import {
  remarkPlugins,
  rehypePlugins,
  generateHeadingId,
  isExternalLink,
  isMailtoLink,
  isDocumentLink,
  resolveRelativePath,
  isRelativeImagePath,
} from "@/lib/reader/markdown-config";
import { CodeBlock } from "@/components/reader/content/CodeBlock";
import MermaidRenderer from "@/components/reader/content/MermaidRenderer";
import type { DocumentHeading, DisplayMode } from "@/types/reader";
import type { Components } from "react-markdown";

export interface MarkdownRendererProps {
  /** The markdown content to render */
  content: string;
  /** Current file path (for resolving relative links) */
  currentPath?: string;
  /** Display mode (themed or reading) */
  displayMode?: DisplayMode;
  /** Callback to receive extracted headings (for TOC) */
  onHeadingsExtracted?: (headings: DocumentHeading[]) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Track heading IDs to ensure uniqueness
 */
function useUniqueHeadingIds() {
  const usedIds = React.useRef<Map<string, number>>(new Map());

  const getUniqueId = React.useCallback((text: string): string => {
    const baseId = generateHeadingId(text);
    const count = usedIds.current.get(baseId) ?? 0;
    usedIds.current.set(baseId, count + 1);

    return count === 0 ? baseId : `${baseId}-${count}`;
  }, []);

  const reset = React.useCallback(() => {
    usedIds.current.clear();
  }, []);

  return { getUniqueId, reset };
}

export function MarkdownRenderer({
  content,
  currentPath = "/",
  displayMode = "themed",
  onHeadingsExtracted,
  className,
}: MarkdownRendererProps) {
  const router = useRouter();
  const { getUniqueId, reset } = useUniqueHeadingIds();
  const headingsRef = React.useRef<DocumentHeading[]>([]);
  const prevContentRef = React.useRef<string | null>(null);

  // Clear headings at render start when content changes (before ReactMarkdown)
  // This ensures headingsRef is empty before new headings are collected
  if (content !== prevContentRef.current) {
    reset();
    headingsRef.current = [];
    prevContentRef.current = content;
  }

  // Report headings after render completes
  React.useEffect(() => {
    if (onHeadingsExtracted && headingsRef.current.length > 0) {
      onHeadingsExtracted(headingsRef.current);
    }
  }, [content, onHeadingsExtracted]);

  // Handle internal document link clicks
  const handleInternalLinkClick = React.useCallback(
    (href: string, e: React.MouseEvent) => {
      e.preventDefault();
      const resolvedPath = resolveRelativePath(href, currentPath);
      router.push(`/reader${resolvedPath}`);
    },
    [currentPath, router]
  );

  // Create heading component factory
  const createHeadingComponent = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    const HeadingComponent: React.FC<
      React.HTMLAttributes<HTMLHeadingElement>
    > = ({ children, ...props }) => {
      const text = getTextContent(children);
      const id = getUniqueId(text);

      // Track heading for TOC
      if (headingsRef.current.findIndex((h) => h.id === id) === -1) {
        headingsRef.current.push({ id, text, level });
      }

      const Tag = `h${level}` as const;
      return (
        <Tag id={id} {...props}>
          {children}
        </Tag>
      );
    };
    HeadingComponent.displayName = `Heading${level}`;
    return HeadingComponent;
  };

  // Custom components for react-markdown
  const components: Components = {
    // Headings with IDs for TOC
    h1: createHeadingComponent(1),
    h2: createHeadingComponent(2),
    h3: createHeadingComponent(3),
    h4: createHeadingComponent(4),
    h5: createHeadingComponent(5),
    h6: createHeadingComponent(6),

    // Custom link handling
    a: ({ href, children, ...props }) => {
      if (!href) {
        return <span {...props}>{children}</span>;
      }

      // External links
      if (isExternalLink(href)) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5"
            {...props}
          >
            {children}
            <ExternalLinkIcon
              className="h-3 w-3 ml-0.5"
              data-icon="external-link"
            />
          </a>
        );
      }

      // Mailto links
      if (isMailtoLink(href)) {
        return (
          <a href={href} {...props}>
            {children}
          </a>
        );
      }

      // Internal document links
      if (isDocumentLink(href)) {
        return (
          <a
            href={href}
            onClick={(e) => handleInternalLinkClick(href, e)}
            {...props}
          >
            {children}
          </a>
        );
      }

      // Other links (anchors, etc.)
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },

    // Custom image handling
    img: ({ src, alt, ...props }) => {
      if (!src || typeof src !== "string") {
        return null;
      }

      // Block external images
      if (isExternalLink(src)) {
        return (
          <span className="inline-block text-sm text-muted-foreground italic">
            External images are not supported
          </span>
        );
      }

      // Resolve relative image path
      const resolvedSrc = isRelativeImagePath(src)
        ? `/api/reader/image?path=${encodeURIComponent(
            resolveRelativePath(src, currentPath)
          )}`
        : src;

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolvedSrc} alt={alt || ""} loading="lazy" {...props} />
      );
    },

    // Code blocks - use custom CodeBlock component for syntax highlighting
    pre: ({ children }) => {
      // Pass through children without wrapper - CodeBlock handles its own container
      return <>{children}</>;
    },

    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      // Check if this is a code block (inside pre) vs inline code
      const isBlock =
        props.node?.position?.start.line !== props.node?.position?.end.line ||
        className?.includes("language-");

      if (isBlock) {
        // Extract text content from children
        const codeContent = getTextContent(children);

        // Render mermaid diagrams with MermaidRenderer
        if (language === "mermaid") {
          // Determine theme based on display mode
          const mermaidTheme = displayMode === "reading" ? "light" : "dark";
          return (
            <MermaidRenderer
              code={codeContent}
              theme={mermaidTheme}
            />
          );
        }

        // Use CodeBlock for syntax-highlighted code
        return (
          <CodeBlock
            code={codeContent}
            language={language}
            theme={displayMode === "reading" ? "light" : "dark"}
          />
        );
      }

      // Inline code
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    // Tables with proper semantics
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),

    th: ({ children, ...props }) => (
      <th
        className="border border-border px-3 py-2 text-left font-semibold bg-muted"
        {...props}
      >
        {children}
      </th>
    ),

    td: ({ children, ...props }) => (
      <td className="border border-border px-3 py-2" {...props}>
        {children}
      </td>
    ),

    // Task list checkboxes
    input: ({ type, checked, ...props }) => {
      if (type === "checkbox") {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className="mr-2"
            {...props}
          />
        );
      }
      return <input type={type} {...props} />;
    },

    // Horizontal rule
    hr: (props) => <hr role="separator" {...props} />,
  };

  // Handle null/undefined content
  const safeContent = content ?? "";

  return (
    <div
      data-testid="markdown-renderer"
      data-mode={displayMode}
      className={cn(
        "prose prose-slate dark:prose-invert max-w-none",
        // Reading mode: more neutral styling
        displayMode === "reading" && [
          "prose-headings:text-foreground",
          "prose-p:text-foreground",
          "prose-a:text-foreground prose-a:underline",
        ],
        // Themed mode: use accent colors
        displayMode === "themed" && [
          "prose-headings:text-foreground",
          "prose-a:text-primary",
        ],
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Extract text content from React children
 */
function getTextContent(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(getTextContent).join("");
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    if (props.children) {
      return getTextContent(props.children);
    }
  }
  return "";
}
