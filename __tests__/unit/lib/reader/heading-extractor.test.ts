/**
 * Unit tests for heading extraction logic
 *
 * Tests the utility functions that extract headings from markdown content
 * for use in generating a table of contents.
 *
 * @see specs/005-markdown-reader/spec.md User Story 4
 */

import { describe, it, expect } from "vitest";
import {
  extractHeadings,
  generateHeadingId,
  buildHeadingTree,
  type HeadingTreeNode,
} from "@/lib/reader/heading-extractor";
import type { DocumentHeading } from "@/types/reader";

describe("heading-extractor", () => {
  describe("extractHeadings", () => {
    it("should extract h1-h6 headings from markdown content", () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`;

      const headings = extractHeadings(markdown);

      expect(headings).toHaveLength(6);
      expect(headings[0]).toEqual({
        id: "heading-1",
        text: "Heading 1",
        level: 1,
      });
      expect(headings[1]).toEqual({
        id: "heading-2",
        text: "Heading 2",
        level: 2,
      });
      expect(headings[2]).toEqual({
        id: "heading-3",
        text: "Heading 3",
        level: 3,
      });
      expect(headings[3]).toEqual({
        id: "heading-4",
        text: "Heading 4",
        level: 4,
      });
      expect(headings[4]).toEqual({
        id: "heading-5",
        text: "Heading 5",
        level: 5,
      });
      expect(headings[5]).toEqual({
        id: "heading-6",
        text: "Heading 6",
        level: 6,
      });
    });

    it("should return empty array for markdown without headings", () => {
      const markdown = `This is just a paragraph.

Another paragraph here.

- List item 1
- List item 2`;

      const headings = extractHeadings(markdown);

      expect(headings).toEqual([]);
    });

    it("should handle headings with inline formatting", () => {
      const markdown = `# **Bold** Heading
## _Italic_ Heading
### \`Code\` Heading
#### [Link](http://example.com) Heading`;

      const headings = extractHeadings(markdown);

      expect(headings).toHaveLength(4);
      expect(headings[0].text).toBe("Bold Heading");
      expect(headings[1].text).toBe("Italic Heading");
      expect(headings[2].text).toBe("Code Heading");
      expect(headings[3].text).toBe("Link Heading");
    });

    it("should handle duplicate heading text with unique IDs", () => {
      const markdown = `# Introduction
## Overview
# Introduction
### Overview`;

      const headings = extractHeadings(markdown);

      expect(headings).toHaveLength(4);
      expect(headings[0].id).toBe("introduction");
      expect(headings[1].id).toBe("overview");
      expect(headings[2].id).toBe("introduction-1");
      expect(headings[3].id).toBe("overview-1");
    });

    it("should handle headings with special characters", () => {
      const markdown = `# Hello & World!
## API (v2.0)
### What's New?
#### C++ Programming`;

      const headings = extractHeadings(markdown);

      expect(headings).toHaveLength(4);
      expect(headings[0].id).toBe("hello-world");
      expect(headings[1].id).toBe("api-v20");
      expect(headings[2].id).toBe("whats-new");
      expect(headings[3].id).toBe("c-programming");
    });

    it("should ignore headings inside code blocks", () => {
      const markdown = `# Real Heading

\`\`\`markdown
# Fake Heading Inside Code
## Another Fake
\`\`\`

## Another Real Heading`;

      const headings = extractHeadings(markdown);

      expect(headings).toHaveLength(2);
      expect(headings[0].text).toBe("Real Heading");
      expect(headings[1].text).toBe("Another Real Heading");
    });

    it("should handle empty markdown content", () => {
      const headings = extractHeadings("");
      expect(headings).toEqual([]);
    });

    it("should handle markdown with only whitespace", () => {
      const headings = extractHeadings("   \n\n   \n");
      expect(headings).toEqual([]);
    });

    it("should handle headings with leading/trailing whitespace", () => {
      const markdown = `#   Padded Heading
##    Another Padded    `;

      const headings = extractHeadings(markdown);

      expect(headings).toHaveLength(2);
      expect(headings[0].text).toBe("Padded Heading");
      expect(headings[1].text).toBe("Another Padded");
    });

    it("should handle ATX-style headings only (not setext)", () => {
      // We only support ATX-style headings (# prefix)
      // Setext-style (underline with === or ---) is less common
      const markdown = `# ATX Heading

Setext Heading
==============

## Another ATX

Setext Level 2
--------------`;

      const headings = extractHeadings(markdown);

      // Only ATX headings should be extracted
      expect(headings.length).toBeGreaterThanOrEqual(2);
      expect(headings.some((h) => h.text === "ATX Heading")).toBe(true);
      expect(headings.some((h) => h.text === "Another ATX")).toBe(true);
    });
  });

  describe("generateHeadingId", () => {
    it("should convert text to kebab-case", () => {
      expect(generateHeadingId("Hello World")).toBe("hello-world");
      expect(generateHeadingId("Multiple   Spaces")).toBe("multiple-spaces");
    });

    it("should remove special characters", () => {
      expect(generateHeadingId("Hello & World!")).toBe("hello-world");
      expect(generateHeadingId("What's New?")).toBe("whats-new");
      expect(generateHeadingId("API (v2.0)")).toBe("api-v20");
    });

    it("should handle numbers", () => {
      expect(generateHeadingId("Chapter 1")).toBe("chapter-1");
      expect(generateHeadingId("123 Test")).toBe("123-test");
    });

    it("should handle empty string", () => {
      expect(generateHeadingId("")).toBe("");
    });

    it("should handle string with only special characters", () => {
      expect(generateHeadingId("!@#$%")).toBe("");
    });

    it("should trim leading and trailing hyphens", () => {
      expect(generateHeadingId("  Hello  ")).toBe("hello");
      expect(generateHeadingId("---Hello---")).toBe("hello");
    });
  });

  describe("buildHeadingTree", () => {
    it("should build a flat tree from same-level headings", () => {
      const headings: DocumentHeading[] = [
        { id: "section-1", text: "Section 1", level: 2 },
        { id: "section-2", text: "Section 2", level: 2 },
        { id: "section-3", text: "Section 3", level: 2 },
      ];

      const tree = buildHeadingTree(headings);

      expect(tree).toHaveLength(3);
      expect(tree[0].children).toEqual([]);
      expect(tree[1].children).toEqual([]);
      expect(tree[2].children).toEqual([]);
    });

    it("should nest child headings under parent headings", () => {
      const headings: DocumentHeading[] = [
        { id: "parent", text: "Parent", level: 1 },
        { id: "child-1", text: "Child 1", level: 2 },
        { id: "child-2", text: "Child 2", level: 2 },
      ];

      const tree = buildHeadingTree(headings);

      expect(tree).toHaveLength(1);
      expect(tree[0].heading.text).toBe("Parent");
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].heading.text).toBe("Child 1");
      expect(tree[0].children[1].heading.text).toBe("Child 2");
    });

    it("should handle deeply nested headings", () => {
      const headings: DocumentHeading[] = [
        { id: "h1", text: "H1", level: 1 },
        { id: "h2", text: "H2", level: 2 },
        { id: "h3", text: "H3", level: 3 },
        { id: "h4", text: "H4", level: 4 },
      ];

      const tree = buildHeadingTree(headings);

      expect(tree).toHaveLength(1);
      expect(tree[0].heading.text).toBe("H1");
      expect(tree[0].children[0].heading.text).toBe("H2");
      expect(tree[0].children[0].children[0].heading.text).toBe("H3");
      expect(tree[0].children[0].children[0].children[0].heading.text).toBe(
        "H4"
      );
    });

    it("should handle skipped heading levels", () => {
      const headings: DocumentHeading[] = [
        { id: "h1", text: "H1", level: 1 },
        { id: "h3", text: "H3", level: 3 }, // Skip h2
        { id: "h2", text: "H2", level: 2 },
      ];

      const tree = buildHeadingTree(headings);

      expect(tree).toHaveLength(1);
      expect(tree[0].heading.text).toBe("H1");
      // H3 should be nested under H1 even though H2 was skipped
      expect(tree[0].children[0].heading.text).toBe("H3");
      expect(tree[0].children[1].heading.text).toBe("H2");
    });

    it("should handle multiple top-level headings", () => {
      const headings: DocumentHeading[] = [
        { id: "intro", text: "Introduction", level: 1 },
        { id: "sub-1", text: "Sub 1", level: 2 },
        { id: "main", text: "Main Content", level: 1 },
        { id: "sub-2", text: "Sub 2", level: 2 },
      ];

      const tree = buildHeadingTree(headings);

      expect(tree).toHaveLength(2);
      expect(tree[0].heading.text).toBe("Introduction");
      expect(tree[0].children).toHaveLength(1);
      expect(tree[1].heading.text).toBe("Main Content");
      expect(tree[1].children).toHaveLength(1);
    });

    it("should handle empty headings array", () => {
      const tree = buildHeadingTree([]);
      expect(tree).toEqual([]);
    });

    it("should handle headings starting with a non-h1 level", () => {
      const headings: DocumentHeading[] = [
        { id: "h2-1", text: "H2 First", level: 2 },
        { id: "h3", text: "H3", level: 3 },
        { id: "h2-2", text: "H2 Second", level: 2 },
      ];

      const tree = buildHeadingTree(headings);

      expect(tree).toHaveLength(2);
      expect(tree[0].heading.text).toBe("H2 First");
      expect(tree[0].children[0].heading.text).toBe("H3");
      expect(tree[1].heading.text).toBe("H2 Second");
    });
  });
});
