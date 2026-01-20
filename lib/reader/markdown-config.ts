/**
 * Markdown Configuration
 *
 * Configuration for react-markdown with GFM support and custom components.
 * Provides the plugin setup and component mappings for the MarkdownRenderer.
 *
 * @see specs/005-markdown-reader/spec.md User Story 1
 */

import type { Options } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Remark plugins for markdown processing
 */
export const remarkPlugins: Options["remarkPlugins"] = [
  // GitHub Flavored Markdown: tables, strikethrough, task lists, autolinks
  remarkGfm,
];

/**
 * Rehype plugins for HTML processing
 * (Add plugins like rehype-slug for heading IDs here)
 */
export const rehypePlugins: Options["rehypePlugins"] = [];

/**
 * Generate a slug from heading text for anchor links
 */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .trim();
}

/**
 * Check if a URL is an external link
 */
export function isExternalLink(href: string): boolean {
  if (!href) return false;
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//")
  );
}

/**
 * Check if a URL is a mailto link
 */
export function isMailtoLink(href: string): boolean {
  if (!href) return false;
  return href.startsWith("mailto:");
}

/**
 * Check if a URL is an internal document link
 */
export function isDocumentLink(href: string): boolean {
  if (!href || isExternalLink(href) || isMailtoLink(href)) return false;

  // Check for document extensions
  const docExtensions = [".md", ".mmd", ".txt"];
  const lowerHref = href.toLowerCase();
  return docExtensions.some((ext) => lowerHref.endsWith(ext));
}

/**
 * Resolve a relative path against a base path
 */
export function resolveRelativePath(href: string, currentPath: string): string {
  if (!href || !currentPath) return href;

  // Absolute path from docs root
  if (href.startsWith("/")) {
    return href;
  }

  // Get the directory of the current file
  const currentDir = currentPath.includes("/")
    ? currentPath.substring(0, currentPath.lastIndexOf("/"))
    : "";

  // Handle ./ prefix
  const cleanHref = href.startsWith("./") ? href.slice(2) : href;

  // Handle ../ prefix
  if (cleanHref.startsWith("../")) {
    const parts = currentDir.split("/").filter(Boolean);
    let remainingHref = cleanHref;

    while (remainingHref.startsWith("../") && parts.length > 0) {
      parts.pop();
      remainingHref = remainingHref.slice(3);
    }

    const basePath = parts.length > 0 ? "/" + parts.join("/") : "";
    return `${basePath}/${remainingHref}`;
  }

  // Simple relative path
  return `${currentDir}/${cleanHref}`;
}

/**
 * Check if a URL is a relative image path (not external)
 */
export function isRelativeImagePath(src: string): boolean {
  if (!src || isExternalLink(src)) return false;

  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
  const lowerSrc = src.toLowerCase();
  return imageExtensions.some((ext) => lowerSrc.endsWith(ext));
}
