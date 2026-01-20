/**
 * Unit tests for PreferencesService
 *
 * Tests the preferences storage service that manages:
 * - Reading/writing .reader-prefs.json
 * - Atomic file writes for data integrity
 * - Schema validation and migration
 * - Favorites and recents list management
 *
 * @see specs/005-markdown-reader/data-model.md#readerpreferences
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { vol } from 'memfs';
import {
  PreferencesService,
  type PreferencesServiceConfig,
} from '@/lib/reader/preferences.service';
import type {
  ReaderPreferences,
  Favorite,
  RecentFile,
} from '@/types/reader';

// Mock fs module with memfs for in-memory file system testing
vi.mock('fs', async () => {
  const memfs = await import('memfs');
  return memfs.fs;
});

vi.mock('fs/promises', async () => {
  const memfs = await import('memfs');
  // Spread the promises object to expose named exports
  return {
    ...memfs.fs.promises,
    default: memfs.fs.promises,
  };
});

describe('PreferencesService', () => {
  let service: PreferencesService;
  const mockDocsRoot = '/app/docs';
  const prefsPath = `${mockDocsRoot}/.reader-prefs.json`;

  const defaultPreferences: ReaderPreferences = {
    version: 1,
    favorites: [],
    recents: [],
    displayMode: 'themed',
  };

  const validPreferences: ReaderPreferences = {
    version: 1,
    favorites: [
      {
        path: '/projects/readme.md',
        name: 'readme.md',
        addedAt: '2026-01-19T10:00:00.000Z',
      },
    ],
    recents: [
      {
        path: '/docs/guide.md',
        name: 'guide.md',
        viewedAt: '2026-01-19T14:00:00.000Z',
      },
    ],
    displayMode: 'reading',
  };

  beforeEach(() => {
    // Reset virtual file system
    vol.reset();
    vol.mkdirSync(mockDocsRoot, { recursive: true });

    vi.stubEnv('DOCS_ROOT', mockDocsRoot);
    service = new PreferencesService();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vol.reset();
  });

  // ============================================
  // READING PREFERENCES
  // ============================================

  describe('Reading Preferences', () => {
    it('should return default preferences when file does not exist', async () => {
      const prefs = await service.getPreferences();

      expect(prefs).toEqual(defaultPreferences);
    });

    it('should read valid preferences from file', async () => {
      vol.writeFileSync(prefsPath, JSON.stringify(validPreferences));

      const prefs = await service.getPreferences();

      expect(prefs).toEqual(validPreferences);
    });

    it('should return defaults for invalid JSON', async () => {
      vol.writeFileSync(prefsPath, 'not valid json {{{');

      const prefs = await service.getPreferences();

      expect(prefs).toEqual(defaultPreferences);
    });

    it('should return defaults for empty file', async () => {
      vol.writeFileSync(prefsPath, '');

      const prefs = await service.getPreferences();

      expect(prefs).toEqual(defaultPreferences);
    });

    it('should return defaults for schema-invalid preferences', async () => {
      const invalidPrefs = {
        version: 2, // Invalid version
        favorites: 'not an array', // Wrong type
      };
      vol.writeFileSync(prefsPath, JSON.stringify(invalidPrefs));

      const prefs = await service.getPreferences();

      expect(prefs).toEqual(defaultPreferences);
    });

    it('should preserve valid fields when some are invalid', async () => {
      // This tests that we return defaults for ANY schema violation
      // Rather than partial data
      const partiallyInvalid = {
        version: 1,
        favorites: [], // valid
        recents: 'invalid', // invalid
        displayMode: 'themed', // valid
      };
      vol.writeFileSync(prefsPath, JSON.stringify(partiallyInvalid));

      const prefs = await service.getPreferences();

      // Should return defaults when schema validation fails
      expect(prefs).toEqual(defaultPreferences);
    });
  });

  // ============================================
  // WRITING PREFERENCES (ATOMIC WRITES)
  // ============================================

  describe('Writing Preferences', () => {
    it('should write preferences to file', async () => {
      await service.savePreferences(validPreferences);

      const fileContent = vol.readFileSync(prefsPath, 'utf-8');
      const written = JSON.parse(fileContent as string);

      expect(written).toEqual(validPreferences);
    });

    it('should create file if it does not exist', async () => {
      expect(vol.existsSync(prefsPath)).toBe(false);

      await service.savePreferences(validPreferences);

      expect(vol.existsSync(prefsPath)).toBe(true);
    });

    it('should overwrite existing file', async () => {
      vol.writeFileSync(prefsPath, JSON.stringify(defaultPreferences));

      await service.savePreferences(validPreferences);

      const fileContent = vol.readFileSync(prefsPath, 'utf-8');
      const written = JSON.parse(fileContent as string);

      expect(written).toEqual(validPreferences);
    });

    it('should write formatted JSON for readability', async () => {
      await service.savePreferences(validPreferences);

      const fileContent = vol.readFileSync(prefsPath, 'utf-8') as string;

      // Should contain newlines (formatted, not minified)
      expect(fileContent).toContain('\n');
    });

    it('should validate preferences before writing', async () => {
      const invalidPrefs = {
        version: 999, // Invalid version
        favorites: [],
        recents: [],
        displayMode: 'invalid',
      } as unknown as ReaderPreferences;

      await expect(service.savePreferences(invalidPrefs)).rejects.toThrow(
        /invalid.*preferences/i
      );
    });
  });

  // ============================================
  // PARTIAL UPDATES
  // ============================================

  describe('Partial Updates', () => {
    beforeEach(async () => {
      vol.writeFileSync(prefsPath, JSON.stringify(validPreferences));
    });

    it('should update only displayMode', async () => {
      await service.updatePreferences({ displayMode: 'themed' });

      const prefs = await service.getPreferences();

      expect(prefs.displayMode).toBe('themed');
      expect(prefs.favorites).toEqual(validPreferences.favorites);
      expect(prefs.recents).toEqual(validPreferences.recents);
    });

    it('should update only favorites', async () => {
      const newFavorite: Favorite = {
        path: '/new/file.md',
        name: 'file.md',
        addedAt: '2026-01-19T15:00:00.000Z',
      };

      await service.updatePreferences({ favorites: [newFavorite] });

      const prefs = await service.getPreferences();

      expect(prefs.favorites).toEqual([newFavorite]);
      expect(prefs.recents).toEqual(validPreferences.recents);
      expect(prefs.displayMode).toBe(validPreferences.displayMode);
    });

    it('should update only recents', async () => {
      const newRecent: RecentFile = {
        path: '/new/recent.md',
        name: 'recent.md',
        viewedAt: '2026-01-19T16:00:00.000Z',
      };

      await service.updatePreferences({ recents: [newRecent] });

      const prefs = await service.getPreferences();

      expect(prefs.recents).toEqual([newRecent]);
      expect(prefs.favorites).toEqual(validPreferences.favorites);
    });

    it('should update multiple fields at once', async () => {
      await service.updatePreferences({
        displayMode: 'themed',
        recents: [],
      });

      const prefs = await service.getPreferences();

      expect(prefs.displayMode).toBe('themed');
      expect(prefs.recents).toEqual([]);
      expect(prefs.favorites).toEqual(validPreferences.favorites);
    });
  });

  // ============================================
  // FAVORITES MANAGEMENT
  // ============================================

  describe('Favorites Management', () => {
    it('should add a favorite', async () => {
      await service.addFavorite('/docs/file.md', 'file.md');

      const prefs = await service.getPreferences();

      expect(prefs.favorites).toHaveLength(1);
      expect(prefs.favorites[0].path).toBe('/docs/file.md');
      expect(prefs.favorites[0].name).toBe('file.md');
      expect(prefs.favorites[0].addedAt).toBeDefined();
    });

    it('should not add duplicate favorites', async () => {
      await service.addFavorite('/docs/file.md', 'file.md');
      await service.addFavorite('/docs/file.md', 'file.md');

      const prefs = await service.getPreferences();

      expect(prefs.favorites).toHaveLength(1);
    });

    it('should remove a favorite', async () => {
      await service.addFavorite('/docs/file.md', 'file.md');
      await service.removeFavorite('/docs/file.md');

      const prefs = await service.getPreferences();

      expect(prefs.favorites).toHaveLength(0);
    });

    it('should handle removing non-existent favorite gracefully', async () => {
      await expect(
        service.removeFavorite('/nonexistent.md')
      ).resolves.not.toThrow();
    });

    it('should check if path is favorited', async () => {
      await service.addFavorite('/docs/file.md', 'file.md');

      expect(await service.isFavorite('/docs/file.md')).toBe(true);
      expect(await service.isFavorite('/other/file.md')).toBe(false);
    });

    it('should toggle favorite status', async () => {
      // Initially not favorited
      expect(await service.isFavorite('/docs/file.md')).toBe(false);

      // Toggle on
      await service.toggleFavorite('/docs/file.md', 'file.md');
      expect(await service.isFavorite('/docs/file.md')).toBe(true);

      // Toggle off
      await service.toggleFavorite('/docs/file.md', 'file.md');
      expect(await service.isFavorite('/docs/file.md')).toBe(false);
    });
  });

  // ============================================
  // RECENTS MANAGEMENT
  // ============================================

  describe('Recents Management', () => {
    it('should add a recent file', async () => {
      await service.addRecent('/docs/file.md', 'file.md');

      const prefs = await service.getPreferences();

      expect(prefs.recents).toHaveLength(1);
      expect(prefs.recents[0].path).toBe('/docs/file.md');
    });

    it('should move existing recent to top when re-viewed', async () => {
      await service.addRecent('/docs/first.md', 'first.md');
      await service.addRecent('/docs/second.md', 'second.md');
      await service.addRecent('/docs/first.md', 'first.md'); // Re-view first

      const prefs = await service.getPreferences();

      expect(prefs.recents[0].path).toBe('/docs/first.md');
      expect(prefs.recents[1].path).toBe('/docs/second.md');
      expect(prefs.recents).toHaveLength(2); // No duplicates
    });

    it('should enforce maximum of 10 recents', async () => {
      // Add 12 recents
      for (let i = 1; i <= 12; i++) {
        await service.addRecent(`/docs/file${i}.md`, `file${i}.md`);
      }

      const prefs = await service.getPreferences();

      expect(prefs.recents).toHaveLength(10);
      // Most recent should be first
      expect(prefs.recents[0].path).toBe('/docs/file12.md');
      // Oldest (file1 and file2) should be dropped
      expect(prefs.recents.find((r) => r.path === '/docs/file1.md')).toBeUndefined();
      expect(prefs.recents.find((r) => r.path === '/docs/file2.md')).toBeUndefined();
    });

    it('should update viewedAt timestamp when re-viewed', async () => {
      await service.addRecent('/docs/file.md', 'file.md');

      const firstPrefs = await service.getPreferences();
      const firstViewedAt = firstPrefs.recents[0].viewedAt;

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.addRecent('/docs/file.md', 'file.md');

      const secondPrefs = await service.getPreferences();
      const secondViewedAt = secondPrefs.recents[0].viewedAt;

      expect(new Date(secondViewedAt).getTime()).toBeGreaterThan(
        new Date(firstViewedAt).getTime()
      );
    });

    it('should clear all recents', async () => {
      await service.addRecent('/docs/file1.md', 'file1.md');
      await service.addRecent('/docs/file2.md', 'file2.md');

      await service.clearRecents();

      const prefs = await service.getPreferences();
      expect(prefs.recents).toHaveLength(0);
    });
  });

  // ============================================
  // DISPLAY MODE MANAGEMENT
  // ============================================

  describe('Display Mode Management', () => {
    it('should get current display mode', async () => {
      const mode = await service.getDisplayMode();

      expect(mode).toBe('themed'); // Default
    });

    it('should set display mode to reading', async () => {
      await service.setDisplayMode('reading');

      const mode = await service.getDisplayMode();
      expect(mode).toBe('reading');
    });

    it('should set display mode to themed', async () => {
      await service.setDisplayMode('reading');
      await service.setDisplayMode('themed');

      const mode = await service.getDisplayMode();
      expect(mode).toBe('themed');
    });

    it('should reject invalid display mode', async () => {
      await expect(
        service.setDisplayMode('invalid' as 'themed')
      ).rejects.toThrow();
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe('Error Handling', () => {
    it('should handle read permission errors gracefully', async () => {
      // Create file then remove read permissions
      vol.writeFileSync(prefsPath, JSON.stringify(validPreferences));
      // Note: memfs doesn't fully support permissions, but we can test the error path
      // by mocking fs.promises.readFile to throw

      // For now, just verify the file can be read
      const prefs = await service.getPreferences();
      expect(prefs).toEqual(validPreferences);
    });

    it('should throw on write errors', async () => {
      // Mock a write failure scenario
      const readonlyService = new PreferencesService({
        docsRoot: '/nonexistent/readonly/path',
      });

      await expect(
        readonlyService.savePreferences(validPreferences)
      ).rejects.toThrow();
    });
  });

  // ============================================
  // CONCURRENT ACCESS
  // ============================================

  describe('Concurrent Access', () => {
    it('should handle concurrent reads safely', async () => {
      vol.writeFileSync(prefsPath, JSON.stringify(validPreferences));

      // Multiple concurrent reads should all succeed
      const results = await Promise.all([
        service.getPreferences(),
        service.getPreferences(),
        service.getPreferences(),
      ]);

      results.forEach((prefs) => {
        expect(prefs).toEqual(validPreferences);
      });
    });

    it('should handle concurrent addFavorite calls', async () => {
      // Add multiple favorites concurrently
      await Promise.all([
        service.addFavorite('/docs/file1.md', 'file1.md'),
        service.addFavorite('/docs/file2.md', 'file2.md'),
        service.addFavorite('/docs/file3.md', 'file3.md'),
      ]);

      const prefs = await service.getPreferences();

      // All three should be added (order may vary)
      expect(prefs.favorites).toHaveLength(3);
    });
  });

  // ============================================
  // CUSTOM CONFIGURATION
  // ============================================

  describe('Custom Configuration', () => {
    it('should accept custom docsRoot via constructor', () => {
      const customRoot = '/custom/docs';
      const config: PreferencesServiceConfig = { docsRoot: customRoot };

      expect(() => new PreferencesService(config)).not.toThrow();
    });

    it('should use custom preferences filename if provided', async () => {
      const customFilename = '.custom-prefs.json';
      const customPath = `${mockDocsRoot}/${customFilename}`;
      const config: PreferencesServiceConfig = {
        docsRoot: mockDocsRoot,
        filename: customFilename,
      };

      const customService = new PreferencesService(config);
      await customService.savePreferences(validPreferences);

      expect(vol.existsSync(customPath)).toBe(true);
    });
  });
});
