/**
 * Contract Tests: GET/PUT /api/reader/preferences
 *
 * TDD Phase: RED - These tests should FAIL until the API routes are implemented.
 * Based on: specs/005-markdown-reader/contracts/reader-api.yaml
 *
 * USER STORY 7: Access Recent and Favorite Files
 * Goal: Persist user preferences (favorites, recents, display mode) across sessions
 *
 * Test Categories:
 * - GET: Retrieve current preferences
 * - PUT: Update preferences (favorites, recents, displayMode)
 * - Response shape validation
 * - Error handling
 *
 * API Contract:
 * GET /api/reader/preferences
 * Response: {
 *   success: true,
 *   data: ReaderPreferences
 * }
 *
 * PUT /api/reader/preferences
 * Body: Partial<ReaderPreferences> (favorites, recents, displayMode)
 * Response: {
 *   success: true,
 *   data: ReaderPreferences
 * }
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { mkdir, rm, writeFile, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

// Dynamic imports for the routes after env vars are set
let GET: typeof import('@/app/api/reader/preferences/route').GET;
let PUT: typeof import('@/app/api/reader/preferences/route').PUT;

describe('/api/reader/preferences', () => {
  let testDocsRoot: string;
  const prefsFilename = '.reader-prefs.json';

  beforeAll(async () => {
    // Create temporary directory for test docs
    testDocsRoot = path.join(os.tmpdir(), `reader-prefs-test-${Date.now()}`);
    await mkdir(testDocsRoot, { recursive: true });

    // Set DOCS_ROOT for tests
    vi.stubEnv('DOCS_ROOT', testDocsRoot);

    // Clear module cache and reimport routes after env vars are set
    vi.resetModules();
    const routeModule = await import('@/app/api/reader/preferences/route');
    GET = routeModule.GET;
    PUT = routeModule.PUT;
  });

  afterAll(async () => {
    // Cleanup temp directory
    await rm(testDocsRoot, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    // Clear prefs file before each test
    const prefsPath = path.join(testDocsRoot, prefsFilename);
    try {
      await rm(prefsPath);
    } catch {
      // File may not exist
    }
  });

  describe('GET /api/reader/preferences', () => {
    describe('Response Structure', () => {
      it('should return success response with data object', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences');
        const response = await GET(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json).toHaveProperty('success', true);
        expect(json).toHaveProperty('data');
      });

      it('should return valid ReaderPreferences structure', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences');
        const response = await GET(request);
        const json = await response.json();

        expect(json.data).toHaveProperty('version', 1);
        expect(json.data).toHaveProperty('favorites');
        expect(json.data).toHaveProperty('recents');
        expect(json.data).toHaveProperty('displayMode');
        expect(Array.isArray(json.data.favorites)).toBe(true);
        expect(Array.isArray(json.data.recents)).toBe(true);
        expect(['themed', 'reading']).toContain(json.data.displayMode);
      });
    });

    describe('Default Values', () => {
      it('should return default preferences when no prefs file exists', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences');
        const response = await GET(request);
        const json = await response.json();

        expect(json.data.version).toBe(1);
        expect(json.data.favorites).toEqual([]);
        expect(json.data.recents).toEqual([]);
        expect(json.data.displayMode).toBe('themed');
      });
    });

    describe('Existing Preferences', () => {
      it('should return existing preferences from file', async () => {
        // Write existing preferences
        const existingPrefs = {
          version: 1,
          favorites: [
            { path: '/docs/readme.md', name: 'readme.md', addedAt: '2024-01-01T00:00:00.000Z' }
          ],
          recents: [
            { path: '/docs/notes.md', name: 'notes.md', viewedAt: '2024-01-02T00:00:00.000Z' }
          ],
          displayMode: 'reading' as const,
        };
        await writeFile(
          path.join(testDocsRoot, prefsFilename),
          JSON.stringify(existingPrefs, null, 2)
        );

        const request = new NextRequest('http://localhost:3000/api/reader/preferences');
        const response = await GET(request);
        const json = await response.json();

        expect(json.data.favorites).toHaveLength(1);
        expect(json.data.favorites[0].path).toBe('/docs/readme.md');
        expect(json.data.recents).toHaveLength(1);
        expect(json.data.recents[0].path).toBe('/docs/notes.md');
        expect(json.data.displayMode).toBe('reading');
      });
    });
  });

  describe('PUT /api/reader/preferences', () => {
    describe('Update Display Mode', () => {
      it('should update display mode', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ displayMode: 'reading' }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data.displayMode).toBe('reading');
      });

      it('should persist display mode to file', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ displayMode: 'reading' }),
          headers: { 'Content-Type': 'application/json' },
        });
        await PUT(request);

        // Verify file was written
        const content = await readFile(path.join(testDocsRoot, prefsFilename), 'utf-8');
        const prefs = JSON.parse(content);
        expect(prefs.displayMode).toBe('reading');
      });
    });

    describe('Update Favorites', () => {
      it('should update favorites list', async () => {
        const favorites = [
          { path: '/docs/guide.md', name: 'guide.md', addedAt: new Date().toISOString() }
        ];

        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ favorites }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.favorites).toHaveLength(1);
        expect(json.data.favorites[0].path).toBe('/docs/guide.md');
      });
    });

    describe('Update Recents', () => {
      it('should update recents list', async () => {
        const recents = [
          { path: '/docs/api.md', name: 'api.md', viewedAt: new Date().toISOString() }
        ];

        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ recents }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(response.status).toBe(200);
        expect(json.data.recents).toHaveLength(1);
        expect(json.data.recents[0].path).toBe('/docs/api.md');
      });

      it('should limit recents to 10 items', async () => {
        const recents = Array.from({ length: 15 }, (_, i) => ({
          path: `/docs/file${i}.md`,
          name: `file${i}.md`,
          viewedAt: new Date().toISOString(),
        }));

        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ recents }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(json.data.recents.length).toBeLessThanOrEqual(10);
      });
    });

    describe('Partial Updates', () => {
      it('should preserve existing preferences when updating partially', async () => {
        // First set up initial preferences
        const initialPrefs = {
          version: 1,
          favorites: [
            { path: '/docs/readme.md', name: 'readme.md', addedAt: new Date().toISOString() }
          ],
          recents: [],
          displayMode: 'themed' as const,
        };
        await writeFile(
          path.join(testDocsRoot, prefsFilename),
          JSON.stringify(initialPrefs, null, 2)
        );

        // Update only displayMode
        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ displayMode: 'reading' }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        // Favorites should be preserved
        expect(json.data.favorites).toHaveLength(1);
        expect(json.data.displayMode).toBe('reading');
      });
    });

    describe('Validation', () => {
      it('should reject invalid display mode', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ displayMode: 'invalid' }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json).toHaveProperty('error');
      });

      it('should reject invalid favorites format', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: JSON.stringify({ favorites: [{ invalid: 'data' }] }),
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
      });

      it('should reject invalid JSON body', async () => {
        const request = new NextRequest('http://localhost:3000/api/reader/preferences', {
          method: 'PUT',
          body: 'not json',
          headers: { 'Content-Type': 'application/json' },
        });
        const response = await PUT(request);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.success).toBe(false);
      });
    });
  });
});
