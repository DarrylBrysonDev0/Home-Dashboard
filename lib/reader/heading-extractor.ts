/**
 * Heading Extractor Utility
 *
 * Extracts headings from markdown content for generating a table of contents.
 * Supports ATX-style headings (# prefix) with automatic ID generation.
 *
 * @see specs/005-markdown-reader/spec.md User Story 4
 */

import type { DocumentHeading } from "@/types/reader";

/**
 * Tree node representation of a heading with nested children
 */
export interface HeadingTreeNode {
  heading: DocumentHeading;
  children: HeadingTreeNode[];
}

/**
 * Generate a URL-safe ID from heading text
 *
 * Converts text to lowercase kebab-case, removing special characters
 *
 * @param text - The heading text to convert
 * @returns A kebab-case ID suitable for use as an anchor
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove markdown formatting characters
    .replace(/[*_`\[\]()]/g, "")
    // Replace special characters with nothing
    .replace(/[^\w\s-]/g, "")
    // Replace whitespace with hyphens
    .replace(/\s+/g, "-")
    // Remove multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Strip markdown formatting from text
 *
 * Removes bold, italic, code, and link formatting to get plain text
 *
 * @param text - Text potentially containing markdown formatting
 * @returns Plain text without formatting
 */
function stripMarkdown(text: string): string {
  return (
    text
      // Remove bold/italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Trim whitespace
      .trim()
  );
}

/**
 * Check if a line is inside a code block
 *
 * Tracks code fence state to skip headings inside code blocks
 */
function createCodeBlockTracker() {
  let inCodeBlock = false;

  return (line: string): boolean => {
    // Check for code fence (``` or ~~~)
    if (/^```|^~~~/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
    }
    return inCodeBlock;
  };
}

/**
 * Extract all headings from markdown content
 *
 * Parses markdown to find ATX-style headings (# prefix) and generates
 * unique IDs for each. Ignores headings inside code blocks.
 *
 * @param markdown - The markdown content to parse
 * @returns Array of DocumentHeading objects
 */
export function extractHeadings(markdown: string): DocumentHeading[] {
  if (!markdown || !markdown.trim()) {
    return [];
  }

  const headings: DocumentHeading[] = [];
  const idCounts = new Map<string, number>();
  const isInCodeBlock = createCodeBlockTracker();

  const lines = markdown.split("\n");

  for (const line of lines) {
    // Update code block state
    if (isInCodeBlock(line)) {
      continue;
    }

    // Match ATX-style headings (# to ######)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
    const rawText = match[2].trim();
    const text = stripMarkdown(rawText);

    // Generate unique ID
    const baseId = generateHeadingId(text);
    const count = idCounts.get(baseId) ?? 0;
    idCounts.set(baseId, count + 1);

    const id = count === 0 ? baseId : `${baseId}-${count}`;

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Build a hierarchical tree structure from flat headings
 *
 * Converts a flat array of headings into a nested tree where
 * each heading contains its child headings based on level.
 *
 * @param headings - Flat array of DocumentHeading objects
 * @returns Array of root-level HeadingTreeNode objects
 */
export function buildHeadingTree(
  headings: DocumentHeading[]
): HeadingTreeNode[] {
  if (!headings.length) {
    return [];
  }

  const root: HeadingTreeNode[] = [];
  const stack: HeadingTreeNode[] = [];

  for (const heading of headings) {
    const node: HeadingTreeNode = {
      heading,
      children: [],
    };

    // Pop items from stack until we find a parent with lower level
    while (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top.heading.level < heading.level) {
        // Found a parent - add as child
        top.children.push(node);
        stack.push(node);
        break;
      }
      stack.pop();
    }

    // If stack is empty, this is a root-level heading
    if (stack.length === 0) {
      root.push(node);
      stack.push(node);
    }
  }

  return root;
}
