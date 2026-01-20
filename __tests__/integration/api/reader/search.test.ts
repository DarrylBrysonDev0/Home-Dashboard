/**
 * Contract Tests: GET /api/reader/search
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * USER STORY 5: Search for Files
 * Goal: Search files by name to quickly find documents without manual browsing
 *
 * Test Categories:
 * - Response shape validation
 * - Search query matching
 * - Result sorting (exact matches first)
 * - Limit parameter
 * - Path validation and security
 * - Error handling
 *
 * API Contract:
 * Query Params:
 *   - q (string, required, min 1 char): Search query
 *   - limit (integer, optional, default 20, max 100): Result limit
 * Response: {
 *   success: true,
 *   data: FileNode[],
 *   query: string,
 *   total: number
 * }
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdir, writeFile, rm } from 'fs/promises';
import path from 'path';
import os from 'os';

// Dynamic import for the route after env vars are set
let GET: typeof import('@/app/api/reader/search/route').GET;

describe('GET /api/reader/search', () => {
  let testDocsRoot: string;

  beforeAll(async () => {
    // Create temporary directory for test docs
    testDocsRoot = path.join(os.tmpdir(), `reader-search-test-${Date.now()}`);
    await mkdir(testDocsRoot, { recursive: true });

    // Set DOCS_ROOT for tests
    vi.stubEnv('DOCS_ROOT', testDocsRoot);

    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import('@/app/api/reader/search/route');
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
    it('should return success response with data array', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(Array.isArray(json.data)).toBe(true);
    });

    it('should return query and total in response', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json).toHaveProperty('query', 'readme');
      expect(json).toHaveProperty('total');
      expect(typeof json.total).toBe('number');
    });
  });

  describe('Search Query Matching', () => {
    it('should find files with exact name match', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'notes.md'), '# Notes');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('readme.md');
      expect(json.total).toBe(1);
    });

    it('should find files with partial name match', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'project-readme.md'), '# Project Readme');
      await writeFile(path.join(testDocsRoot, 'notes.md'), '# Notes');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=read');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
      const names = json.data.map((f: any) => f.name);
      expect(names).toContain('readme.md');
      expect(names).toContain('project-readme.md');
    });

    it('should perform case-insensitive search', async () => {
      await writeFile(path.join(testDocsRoot, 'README.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'Readme.txt'), 'Readme');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
    });

    it('should search files in subdirectories', async () => {
      await mkdir(path.join(testDocsRoot, 'projects'));
      await writeFile(path.join(testDocsRoot, 'projects', 'project-readme.md'), '# Project');
      await mkdir(path.join(testDocsRoot, 'docs', 'api'), { recursive: true });
      await writeFile(path.join(testDocsRoot, 'docs', 'api', 'readme.md'), '# API');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(2);
      const paths = json.data.map((f: any) => f.path);
      expect(paths).toContain('/projects/project-readme.md');
      expect(paths).toContain('/docs/api/readme.md');
    });

    it('should return empty results for non-matching query', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'notes.md'), '# Notes');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=xyz123');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
      expect(json.total).toBe(0);
    });

    it('should only return supported file types (.md, .mmd, .txt)', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'readme.txt'), 'Readme');
      await writeFile(path.join(testDocsRoot, 'readme.mmd'), 'graph TD');
      await writeFile(path.join(testDocsRoot, 'readme.js'), 'console.log()');
      await writeFile(path.join(testDocsRoot, 'readme.json'), '{}');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(3);
      const names = json.data.map((f: any) => f.name);
      expect(names).toContain('readme.md');
      expect(names).toContain('readme.txt');
      expect(names).toContain('readme.mmd');
      expect(names).not.toContain('readme.js');
      expect(names).not.toContain('readme.json');
    });
  });

  describe('Result Sorting', () => {
    it('should prioritize exact name matches', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'project-readme.md'), '# Project');
      await writeFile(path.join(testDocsRoot, 'readme-guide.md'), '# Guide');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      // Exact match "readme.md" should come first
      expect(json.data[0].name).toBe('readme.md');
    });

    it('should sort results alphabetically for same relevance', async () => {
      await writeFile(path.join(testDocsRoot, 'c-readme.md'), '# C');
      await writeFile(path.join(testDocsRoot, 'a-readme.md'), '# A');
      await writeFile(path.join(testDocsRoot, 'b-readme.md'), '# B');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data[0].name).toBe('a-readme.md');
      expect(json.data[1].name).toBe('b-readme.md');
      expect(json.data[2].name).toBe('c-readme.md');
    });
  });

  describe('Limit Parameter', () => {
    it('should default to 20 results', async () => {
      // Create 25 files
      for (let i = 0; i < 25; i++) {
        await writeFile(path.join(testDocsRoot, `readme-${i.toString().padStart(2, '0')}.md`), `# ${i}`);
      }

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(20);
      expect(json.total).toBe(25);
    });

    it('should respect custom limit parameter', async () => {
      // Create 10 files
      for (let i = 0; i < 10; i++) {
        await writeFile(path.join(testDocsRoot, `readme-${i}.md`), `# ${i}`);
      }

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme&limit=5');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(5);
      expect(json.total).toBe(10);
    });

    it('should cap limit at 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme&limit=200');
      const response = await GET(request);
      const json = await response.json();

      // Should either cap at 100 or return 400 error
      expect([200, 400]).toContain(response.status);
    });

    it('should handle limit=1', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'notes.md'), '# Notes');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=md&limit=1');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
    });
  });

  describe('FileNode Structure', () => {
    it('should return FileNode properties for search results', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      const file = json.data[0];
      expect(file).toHaveProperty('name', 'readme.md');
      expect(file).toHaveProperty('path', '/readme.md');
      expect(file).toHaveProperty('type', 'file');
      expect(file).toHaveProperty('extension', '.md');
    });

    it('should include full path for nested files', async () => {
      await mkdir(path.join(testDocsRoot, 'docs', 'api'), { recursive: true });
      await writeFile(path.join(testDocsRoot, 'docs', 'api', 'readme.md'), '# API');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data[0].path).toBe('/docs/api/readme.md');
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/search');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/query|required|missing/i);
    });

    it('should return 400 for empty query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/search?q=');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should return 400 for invalid limit parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/search?q=test&limit=abc');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should return 400 for negative limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/search?q=test&limit=-5');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });
  });

  describe('Hidden Files', () => {
    it('should exclude hidden files from search results', async () => {
      await writeFile(path.join(testDocsRoot, '.hidden-readme.md'), '# Hidden');
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Visible');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=readme');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('readme.md');
    });

    it('should exclude .reader-prefs.json from search results', async () => {
      await writeFile(path.join(testDocsRoot, '.reader-prefs.json'), '{}');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=reader');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveLength(0);
    });
  });

  describe('Special Characters in Query', () => {
    it('should handle query with spaces', async () => {
      await writeFile(path.join(testDocsRoot, 'my notes.md'), '# Notes');
      await writeFile(path.join(testDocsRoot, 'other file.md'), '# Other');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=my notes');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle query with special regex characters', async () => {
      await writeFile(path.join(testDocsRoot, 'file(1).md'), '# File 1');
      await writeFile(path.join(testDocsRoot, 'file[2].md'), '# File 2');

      const request = new NextRequest('http://localhost:3000/api/reader/search?q=file(1)');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      // Should not crash and should find matching file
    });
  });

  describe('Empty Directory', () => {
    it('should return empty results for empty directory', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/search?q=anything');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
      expect(json.total).toBe(0);
    });
  });
});
