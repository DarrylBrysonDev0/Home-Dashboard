/**
 * Contract Tests: GET /api/reader/tree
 *
 * TDD Phase: RED - These tests should FAIL until the API route is implemented.
 * Based on: specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * USER STORY 1: Browse and View Documentation
 * Goal: Navigate documentation folder structure with lazy loading
 *
 * Test Categories:
 * - Response shape validation
 * - Root directory listing
 * - Subdirectory lazy loading
 * - Path validation and security
 * - Error handling
 *
 * API Contract:
 * Query Params: path (string, optional, defaults to "/")
 * Response: {
 *   success: true,
 *   data: {
 *     path: string,
 *     children: FileNode[]
 *   }
 * }
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdir, writeFile, rm } from 'fs/promises';
import path from 'path';
import os from 'os';

// Dynamic import for the route after env vars are set
let GET: typeof import('@/app/api/reader/tree/route').GET;

describe('GET /api/reader/tree', () => {
  let testDocsRoot: string;

  beforeAll(async () => {
    // Create temporary directory for test docs
    testDocsRoot = path.join(os.tmpdir(), `reader-test-${Date.now()}`);
    await mkdir(testDocsRoot, { recursive: true });

    // Set DOCS_ROOT for tests
    vi.stubEnv('DOCS_ROOT', testDocsRoot);

    // Clear module cache and reimport route after env vars are set
    vi.resetModules();
    const routeModule = await import('@/app/api/reader/tree/route');
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
      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
    });

    it('should return path and children in data object', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data).toHaveProperty('path');
      expect(json.data).toHaveProperty('children');
      expect(Array.isArray(json.data.children)).toBe(true);
    });

    it('should return default path as "/" when no path parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.path).toBe('/');
    });
  });

  describe('Root Directory Listing', () => {
    it('should list markdown files in root directory', async () => {
      // Create test files
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'notes.md'), '# Notes');

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.children).toHaveLength(2);
      const names = json.data.children.map((c: any) => c.name);
      expect(names).toContain('readme.md');
      expect(names).toContain('notes.md');
    });

    it('should list directories in root', async () => {
      await mkdir(path.join(testDocsRoot, 'projects'));
      await mkdir(path.join(testDocsRoot, 'notes'));

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const dirs = json.data.children.filter((c: any) => c.type === 'directory');
      expect(dirs).toHaveLength(2);
      const names = dirs.map((d: any) => d.name);
      expect(names).toContain('projects');
      expect(names).toContain('notes');
    });

    it('should include both files and directories sorted alphabetically', async () => {
      await mkdir(path.join(testDocsRoot, 'beta'));
      await writeFile(path.join(testDocsRoot, 'alpha.md'), '# Alpha');
      await mkdir(path.join(testDocsRoot, 'gamma'));

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      // Directories first, then files, both alphabetically
      expect(json.data.children[0].name).toBe('beta');
      expect(json.data.children[1].name).toBe('gamma');
      expect(json.data.children[2].name).toBe('alpha.md');
    });

    it('should only include supported file types (.md, .mmd, .txt)', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');
      await writeFile(path.join(testDocsRoot, 'diagram.mmd'), 'graph TD');
      await writeFile(path.join(testDocsRoot, 'notes.txt'), 'Notes');
      await writeFile(path.join(testDocsRoot, 'script.js'), 'console.log()');
      await writeFile(path.join(testDocsRoot, 'data.json'), '{}');

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.children).toHaveLength(3);
      const names = json.data.children.map((c: any) => c.name);
      expect(names).toContain('readme.md');
      expect(names).toContain('diagram.mmd');
      expect(names).toContain('notes.txt');
      expect(names).not.toContain('script.js');
      expect(names).not.toContain('data.json');
    });
  });

  describe('FileNode Structure', () => {
    it('should return file nodes with required properties', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Test');

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const file = json.data.children[0];
      expect(file).toHaveProperty('name', 'readme.md');
      expect(file).toHaveProperty('path', '/readme.md');
      expect(file).toHaveProperty('type', 'file');
      expect(file).toHaveProperty('extension', '.md');
    });

    it('should return directory nodes with required properties', async () => {
      await mkdir(path.join(testDocsRoot, 'projects'));
      await writeFile(
        path.join(testDocsRoot, 'projects', 'readme.md'),
        '# Project'
      );

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const dir = json.data.children.find((c: any) => c.name === 'projects');
      expect(dir).toHaveProperty('name', 'projects');
      expect(dir).toHaveProperty('path', '/projects');
      expect(dir).toHaveProperty('type', 'directory');
      expect(dir).toHaveProperty('hasChildren', true);
    });

    it('should set hasChildren to false for empty directories', async () => {
      await mkdir(path.join(testDocsRoot, 'empty'));

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const dir = json.data.children.find((c: any) => c.name === 'empty');
      expect(dir).toHaveProperty('hasChildren', false);
    });

    it('should not include children for directories (lazy loading)', async () => {
      await mkdir(path.join(testDocsRoot, 'projects'));
      await writeFile(
        path.join(testDocsRoot, 'projects', 'readme.md'),
        '# Project'
      );

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const dir = json.data.children.find((c: any) => c.name === 'projects');
      expect(dir.children).toBeUndefined();
    });
  });

  describe('Subdirectory Loading (Lazy Load)', () => {
    it('should return contents of specified subdirectory', async () => {
      await mkdir(path.join(testDocsRoot, 'projects'));
      await writeFile(
        path.join(testDocsRoot, 'projects', 'project-a.md'),
        '# Project A'
      );
      await writeFile(
        path.join(testDocsRoot, 'projects', 'project-b.md'),
        '# Project B'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=/projects'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.path).toBe('/projects');
      expect(json.data.children).toHaveLength(2);
      const names = json.data.children.map((c: any) => c.name);
      expect(names).toContain('project-a.md');
      expect(names).toContain('project-b.md');
    });

    it('should handle nested subdirectory paths', async () => {
      await mkdir(path.join(testDocsRoot, 'docs', 'api'), { recursive: true });
      await writeFile(
        path.join(testDocsRoot, 'docs', 'api', 'endpoints.md'),
        '# API Endpoints'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=/docs/api'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(json.data.path).toBe('/docs/api');
      expect(json.data.children[0].name).toBe('endpoints.md');
      expect(json.data.children[0].path).toBe('/docs/api/endpoints.md');
    });
  });

  describe('Path Validation and Security', () => {
    it('should reject path traversal attempts', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=/../etc'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/traversal/i);
    });

    it('should reject encoded path traversal', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=%2e%2e%2fetc'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
    });

    it('should handle paths with spaces', async () => {
      await mkdir(path.join(testDocsRoot, 'my folder'));
      await writeFile(
        path.join(testDocsRoot, 'my folder', 'notes.md'),
        '# Notes'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=/my folder'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.children[0].name).toBe('notes.md');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent directory', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=/nonexistent'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/not found|does not exist/i);
    });

    it('should return 400 when path points to a file instead of directory', async () => {
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');

      const request = new NextRequest(
        'http://localhost:3000/api/reader/tree?path=/readme.md'
      );
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toHaveProperty('success', false);
      expect(json.error).toMatch(/not a directory|is a file/i);
    });
  });

  describe('Empty Directory', () => {
    it('should return empty array for directory with no supported files', async () => {
      await writeFile(path.join(testDocsRoot, 'script.js'), 'code');
      await writeFile(path.join(testDocsRoot, 'data.json'), '{}');

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.children).toEqual([]);
    });

    it('should return empty array for completely empty directory', async () => {
      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.children).toEqual([]);
    });
  });

  describe('Hidden Files', () => {
    it('should exclude hidden files (starting with dot)', async () => {
      await writeFile(path.join(testDocsRoot, '.hidden.md'), '# Hidden');
      await writeFile(path.join(testDocsRoot, 'visible.md'), '# Visible');

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const names = json.data.children.map((c: any) => c.name);
      expect(names).not.toContain('.hidden.md');
      expect(names).toContain('visible.md');
    });

    it('should exclude hidden directories', async () => {
      await mkdir(path.join(testDocsRoot, '.git'));
      await mkdir(path.join(testDocsRoot, 'visible'));

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const names = json.data.children.map((c: any) => c.name);
      expect(names).not.toContain('.git');
      expect(names).toContain('visible');
    });

    it('should exclude .reader-prefs.json from listing', async () => {
      await writeFile(
        path.join(testDocsRoot, '.reader-prefs.json'),
        '{"version":1}'
      );
      await writeFile(path.join(testDocsRoot, 'readme.md'), '# Readme');

      const request = new NextRequest('http://localhost:3000/api/reader/tree');
      const response = await GET(request);
      const json = await response.json();

      const names = json.data.children.map((c: any) => c.name);
      expect(names).not.toContain('.reader-prefs.json');
      expect(names).toContain('readme.md');
    });
  });
});
