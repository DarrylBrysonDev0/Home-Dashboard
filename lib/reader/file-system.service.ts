/**
 * FileSystemService - Sandboxed file access for the Markdown Reader
 *
 * Provides secure file system operations within DOCS_ROOT:
 * - Path traversal prevention
 * - Extension allowlisting
 * - Path resolution and validation
 *
 * @see specs/005-markdown-reader/data-model.md#path-validation
 */

import path from 'path';
import {
  DOCUMENT_EXTENSIONS,
  IMAGE_EXTENSIONS,
} from '@/lib/validations/reader';

export interface FileSystemServiceConfig {
  docsRoot?: string;
}

/**
 * Service for secure, sandboxed file system access within DOCS_ROOT.
 * All paths are validated to prevent traversal attacks and ensure
 * operations stay within the documentation directory.
 */
export class FileSystemService {
  private readonly docsRoot: string;

  constructor(config?: FileSystemServiceConfig) {
    const root = config?.docsRoot ?? process.env.DOCS_ROOT;
    if (!root) {
      throw new Error('DOCS_ROOT environment variable is not configured');
    }
    this.docsRoot = root;
  }

  /**
   * Validate a path for security concerns (path traversal, null bytes, etc.)
   * @throws Error if path contains security violations
   */
  validatePath(inputPath: string): void {
    // Check for empty path
    if (!inputPath || inputPath.trim() === '') {
      throw new Error('Invalid path: path cannot be empty');
    }

    // Check for null byte injection
    if (inputPath.includes('\x00')) {
      throw new Error('Invalid path: null bytes not allowed');
    }

    // Check for path traversal (.. anywhere in the path)
    // This catches: "..", "../", "/path/../", "path/..%2F"
    const decodedPath = decodeURIComponent(inputPath);
    if (this.containsPathTraversal(decodedPath) || this.containsPathTraversal(inputPath)) {
      throw new Error('Path traversal detected: ".." is not allowed');
    }
  }

  /**
   * Check if a string contains path traversal patterns
   *
   * Security note: We reject paths containing exactly ".." (two dots)
   * but allow "..." (three or more dots). This catches path traversal
   * while allowing legitimate filenames with ellipsis characters.
   * Filenames like "my..file.md" with exactly two dots are still rejected
   * as they could be used for obfuscated traversal attacks.
   */
  private containsPathTraversal(str: string): boolean {
    // Match exactly two dots that are NOT part of three or more dots
    // Uses negative lookbehind (?<!\.) and negative lookahead (?!\.)
    const exactTwoDots = /(?<!\.)\.\.(?!\.)/;
    return exactTwoDots.test(str);
  }

  /**
   * Resolve a relative path to an absolute path within DOCS_ROOT
   */
  resolvePath(relativePath: string): string {
    // Validate first
    this.validatePath(relativePath);

    // Normalize the path
    const normalized = this.normalizePath(relativePath);

    // Handle root path
    if (normalized === '' || normalized === '/') {
      return this.docsRoot;
    }

    // Remove leading slash for path.join
    const cleanPath = normalized.startsWith('/') ? normalized.slice(1) : normalized;

    // Join with docs root
    const resolved = path.join(this.docsRoot, cleanPath);

    // Defense in depth: verify resolved path is within DOCS_ROOT
    const normalizedResolved = path.normalize(resolved);
    const normalizedDocsRoot = path.normalize(this.docsRoot);

    if (!normalizedResolved.startsWith(normalizedDocsRoot)) {
      throw new Error('Path traversal detected: resolved path outside DOCS_ROOT');
    }

    return resolved;
  }

  /**
   * Check if a path is a valid document (allowed extension)
   */
  isValidDocumentPath(filePath: string): boolean {
    const ext = this.getExtension(filePath).toLowerCase();
    if (!ext) return false;

    // Only check the final extension to prevent double-extension bypass
    return DOCUMENT_EXTENSIONS.includes(ext as typeof DOCUMENT_EXTENSIONS[number]);
  }

  /**
   * Check if a path is a valid image (allowed extension)
   */
  isValidImagePath(filePath: string): boolean {
    const ext = this.getExtension(filePath).toLowerCase();
    if (!ext) return false;

    return IMAGE_EXTENSIONS.includes(ext as typeof IMAGE_EXTENSIONS[number]);
  }

  /**
   * Get file extension from path (includes the dot)
   */
  getExtension(filePath: string): string {
    const filename = this.getFilename(filePath);
    const lastDot = filename.lastIndexOf('.');

    // No extension or hidden file without extension (e.g., ".gitignore" -> ".gitignore")
    if (lastDot === -1 || lastDot === 0) {
      return '';
    }

    return filename.slice(lastDot);
  }

  /**
   * Get filename from path
   */
  getFilename(filePath: string): string {
    const normalized = this.normalizePath(filePath);
    const segments = normalized.split('/').filter(Boolean);
    return segments.length > 0 ? segments[segments.length - 1] : '';
  }

  /**
   * Get directory from path
   */
  getDirectory(filePath: string): string {
    const normalized = this.normalizePath(filePath);
    const lastSlash = normalized.lastIndexOf('/');

    if (lastSlash === -1) {
      return '/';
    }

    const dir = normalized.slice(0, lastSlash);
    return dir || '/';
  }

  /**
   * Normalize path separators and remove redundant slashes
   */
  normalizePath(inputPath: string): string {
    // Replace backslashes with forward slashes (Windows compatibility)
    let normalized = inputPath.replace(/\\/g, '/');

    // Remove consecutive slashes (but preserve leading slash)
    normalized = normalized.replace(/\/+/g, '/');

    // Remove trailing slash (unless it's the root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Get the DOCS_ROOT path
   */
  getDocsRoot(): string {
    return this.docsRoot;
  }
}
