/**
 * Contract Tests: GET /api/reader/file
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * USER STORY 1: Browse and View Documentation
 * Goal: Load file content for rendering in the markdown viewer
 *
 * Test Categories:
 * - Response shape validation
 * - File content loading
 * - Path validation and security
 * - Error handling
 * - Metadata extraction
 *
 * API Contract:
 * Query Params: path (string, required)
 * Response: {
 *   success: true,
 *   data: {
 *     path: string,
 *     name: string,
 *     content: string,
 *     extension: ".md" | ".mmd" | ".txt",
 *     modifiedAt: string (ISO 8601),
 *     size: number
 *   }
 * }
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdir, writeFile, rm, utimes } from 'fs/promises';
import path from 'path';
import os from 'os';

// Dynamic import for the route after env vars are set
let GET: typeof import('@/app/api/reader/file/route').GET;

describe('GET /api/reader/file', () => {
  let testDocsRoot: string;

  beforeAll(async () => {
    // Create temporary directory for test docs
    testDocsRoot = path.join(os.tmpdir(), `reader-file-test-${Date.now()}`);
    await mkdir(testDocsRoot, { recursive: true });

    // Set DOCS_ROOT for tests
    vi.stubEnv('DOCS_ROOT', testDocsRoot);

    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import('@/app/api/reader/file/route');
    GET = routeModule.GET;
  });

  afterAll(async () => {
    // Cleanup temp directory
    await rm(testDocsRoot, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    // Clear test directory before each test
    await rm(testDocsRoot, { recursive: true, force: true });
    await mkdir(testDocsRoot, { recursive: true });
  });

  describe('Response Structure', () => {
    it('should return success response with data object', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Hello');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/readme.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
    });

    it('should return FileContent object with all required fields', async () => {
      const content = '# Test File\n\nThis is a test.';
      await writeFile(path.join(testDocsRoot, 'test.md'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/test.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveProperty('path', '/test.md');
      expect(json.data).toHaveProperty('name', 'test.md');
      expect(json.data).toHaveProperty('content', content);
      expect(json.data).toHaveProperty('extension', '.md');
      expect(json.data).toHaveProperty('modifiedAt');
      expect(json.data).toHaveProperty('size');
    });
  });

  describe('File Content Loading', () => {
    it('should load markdown file content', async () => {
      const content = '# Welcome\n\nThis is a markdown file.';
      await writeFile(path.join(testDocsRoot, 'welcome.md'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/welcome.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.content).toBe(content);
    });

    it('should load mermaid file content', async () => {
      const content = 'graph TD\n    A --> B\n    B --> C';
      await writeFile(path.join(testDocsRoot, 'diagram.mmd'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/diagram.mmd'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.content).toBe(content);
      expect(json.data.extension).toBe('.mmd');
    });

    it('should load txt file content', async () => {
      const content = 'Plain text notes\nLine 2';
      await writeFile(path.join(testDocsRoot, 'notes.txt'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/notes.txt'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.content).toBe(content);
      expect(json.data.extension).toBe('.txt');
    });

    it('should load files from nested directories', async () => {
      await mkdir(path.join(testDocsRoot, 'projects', 'web'), {
        recursive: true,
      });
      const content = '# Web Project';
      await writeFile(
        path.join(testDocsRoot, 'projects', 'web', 'readme.md'),
        content
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/projects/web/readme.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.path).toBe('/projects/web/readme.md');
      expect(json.data.content).toBe(content);
    });

    it('should handle UTF-8 content correctly', async () => {
      const content = '# 日本語ドキュメント\n\nこれはテストです。';
      await writeFile(path.join(testDocsRoot, 'japanese.md'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/japanese.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.content).toBe(content);
    });

    it('should handle emoji content correctly', async () => {
      const content = '# Todo List 📝\n\n- Task 1 ✅\n- Task 2 ⏳';
      await writeFile(path.join(testDocsRoot, 'todo.md'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/todo.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.content).toBe(content);
    });
  });

  describe('Metadata Extraction', () => {
    it('should return correct file size in bytes', async () => {
      const content = 'Hello World'; // 11 bytes
      await writeFile(path.join(testDocsRoot, 'size-test.txt'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/size-test.txt'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.size).toBe(11);
    });

    it('should return modifiedAt as ISO 8601 timestamp', async () => {
      await writeFile(path.join(testDocsRoot, 'dated.md'), '# Test');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/dated.md'
      );
      const response = await GET(request);
      const json = await response.json();

      // Should be valid ISO 8601 date
      const date = new Date(json.data.modifiedAt);
      expect(date.toISOString()).toBe(json.data.modifiedAt);
    });

    it('should return correct filename from path', async () => {
      await mkdir(path.join(testDocsRoot, 'docs'));
      await writeFile(path.join(testDocsRoot, 'docs', 'api-guide.md'), '# API');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/docs/api-guide.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.name).toBe('api-guide.md');
    });
  });

  describe('Path Validation and Security', () => {
    it('should reject path traversal attempts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/../etc/passwd'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/traversal/i);
    });

    it('should reject encoded path traversal', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=%2e%2e%2fetc%2fpasswd'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should reject unsupported file extensions', async () => {
      await writeFile(path.join(testDocsRoot, 'script.js'), 'code');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/script.js'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/unsupported|not allowed|invalid/i);
    });

    it('should reject attempt to read .reader-prefs.json', async () => {
      await writeFile(
        path.join(testDocsRoot, '.reader-prefs.json'),
        '{"version":1}'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/.reader-prefs.json'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should handle paths with spaces', async () => {
      await mkdir(path.join(testDocsRoot, 'my docs'));
      await writeFile(
        path.join(testDocsRoot, 'my docs', 'my file.md'),
        '# My File'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/my docs/my file.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.content).toBe('# My File');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 when path parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/file');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/path.*required|missing.*path/i);
    });

    it('should return 404 for non-existent file', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/nonexistent.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/not found|does not exist/i);
    });

    it('should return 400 when path points to a directory', async () => {
      await mkdir(path.join(testDocsRoot, 'mydir'));

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/mydir'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      // Implementation returns "Unsupported file type" for directories
      expect(json.error).toMatch(/is a directory|not a file|unsupported file type/i);
    });
  });

  describe('Large File Handling', () => {
    it('should handle moderately large files (100KB)', async () => {
      const content = 'x'.repeat(100 * 1024); // 100KB
      await writeFile(path.join(testDocsRoot, 'large.txt'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/large.txt'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.content.length).toBe(100 * 1024);
      expect(json.data.size).toBe(100 * 1024);
    });

    it('should still work for 1MB files', async () => {
      const content = 'y'.repeat(1024 * 1024); // 1MB
      await writeFile(path.join(testDocsRoot, 'megabyte.md'), content);

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/megabyte.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.size).toBe(1024 * 1024);
    });
  });

  describe('Empty Files', () => {
    it('should handle empty file correctly', async () => {
      await writeFile(path.join(testDocsRoot, 'empty.md'), '');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/empty.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.content).toBe('');
      expect(json.data.size).toBe(0);
    });
  });

  describe('Special Characters in Paths', () => {
    it('should handle files with special characters in name', async () => {
      await writeFile(
        path.join(testDocsRoot, 'file-with_special.chars.md'),
        '# Special'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/file?path=/file-with_special.chars.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.name).toBe('file-with_special.chars.md');
    });

    it('should handle files with unicode names', async () => {
      await writeFile(path.join(testDocsRoot, 'ドキュメント.md'), '# Japanese');

      const request = new NextRequest(
        `http://localhost:3000/api/reader/file?path=${encodeURIComponent('/ドキュメント.md')}`
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.content).toBe('# Japanese');
    });
  });
});
