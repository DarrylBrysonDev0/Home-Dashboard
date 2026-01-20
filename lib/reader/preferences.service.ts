/**
 * PreferencesService - User preferences storage for the Markdown Reader
 *
 * Manages .reader-prefs.json with:
 * - Atomic file writes for data integrity
 * - Schema validation
 * - Favorites and recents list management
 *
 * @see specs/005-markdown-reader/data-model.md#readerpreferences
 */

import { readFile, writeFile, rename } from 'fs/promises';
import path from 'path';
import type { ReaderPreferences, DisplayMode } from '@/types/reader';
import { defaultPreferences } from '@/types/reader';
import {
  readerPreferencesSchema,
  displayModeSchema,
} from '@/lib/validations/reader';

export interface PreferencesServiceConfig {
  docsRoot?: string;
  filename?: string;
}

const DEFAULT_FILENAME = '.reader-prefs.json';
const MAX_RECENTS = 10;

/**
 * Simple promise-based mutex for serializing file writes.
 * Prevents race conditions when multiple operations try to write concurrently.
 */
class WriteMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}

/**
 * Service for managing reader preferences stored in a JSON file.
 * Provides atomic writes and schema validation for data integrity.
 */
export class PreferencesService {
  private readonly docsRoot: string;
  private readonly filename: string;
  private readonly prefsPath: string;
  private readonly writeMutex = new WriteMutex();

  constructor(config?: PreferencesServiceConfig) {
    const root = config?.docsRoot ?? process.env.DOCS_ROOT;
    if (!root) {
      throw new Error('DOCS_ROOT environment variable is not configured');
    }
    this.docsRoot = root;
    this.filename = config?.filename ?? DEFAULT_FILENAME;
    this.prefsPath = path.join(this.docsRoot, this.filename);
  }

  /**
   * Get all preferences (returns defaults if file doesn't exist or is invalid)
   */
  async getPreferences(): Promise<ReaderPreferences> {
    try {
      const content = await readFile(this.prefsPath, 'utf-8');

      if (!content.trim()) {
        return { ...defaultPreferences };
      }

      const parsed = JSON.parse(content);
      const result = readerPreferencesSchema.safeParse(parsed);

      if (!result.success) {
        return { ...defaultPreferences };
      }

      return result.data;
    } catch {
      // File doesn't exist or read error - return defaults
      return { ...defaultPreferences };
    }
  }

  /**
   * Save complete preferences object
   * @throws Error if preferences are invalid or write fails
   */
  async savePreferences(prefs: ReaderPreferences): Promise<void> {
    // Validate before writing
    const result = readerPreferencesSchema.safeParse(prefs);
    if (!result.success) {
      throw new Error(`Invalid preferences: ${result.error.message}`);
    }

    // Acquire lock to prevent concurrent writes
    await this.writeMutex.acquire();

    try {
      // Write atomically: write to temp file then rename
      const tempPath = `${this.prefsPath}.tmp`;
      const content = JSON.stringify(result.data, null, 2);

      await writeFile(tempPath, content, 'utf-8');
      await rename(tempPath, this.prefsPath);
    } finally {
      this.writeMutex.release();
    }
  }

  /**
   * Update specific preference fields (merges with existing)
   */
  async updatePreferences(
    update: Partial<Omit<ReaderPreferences, 'version'>>
  ): Promise<void> {
    await this.atomicUpdate((current) => ({
      ...current,
      ...update,
      version: 1,
    }));
  }

  /**
   * Atomically read, modify, and write preferences.
   * The entire operation is protected by a mutex to prevent race conditions.
   */
  private async atomicUpdate(
    modifier: (current: ReaderPreferences) => ReaderPreferences
  ): Promise<void> {
    await this.writeMutex.acquire();

    try {
      const current = await this.getPreferences();
      const updated = modifier(current);

      // Validate before writing
      const result = readerPreferencesSchema.safeParse(updated);
      if (!result.success) {
        throw new Error(`Invalid preferences: ${result.error.message}`);
      }

      // Write atomically: write to temp file then rename
      const tempPath = `${this.prefsPath}.tmp`;
      const content = JSON.stringify(result.data, null, 2);

      await writeFile(tempPath, content, 'utf-8');
      await rename(tempPath, this.prefsPath);
    } finally {
      this.writeMutex.release();
    }
  }

  /**
   * Add a file to favorites
   */
  async addFavorite(filePath: string, name: string): Promise<void> {
    await this.atomicUpdate((prefs) => {
      // Check for duplicates
      if (prefs.favorites.some((f) => f.path === filePath)) {
        return prefs; // Already favorited, no change
      }

      return {
        ...prefs,
        favorites: [
          ...prefs.favorites,
          {
            path: filePath,
            name,
            addedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }

  /**
   * Remove a file from favorites
   */
  async removeFavorite(filePath: string): Promise<void> {
    await this.atomicUpdate((prefs) => ({
      ...prefs,
      favorites: prefs.favorites.filter((f) => f.path !== filePath),
    }));
  }

  /**
   * Check if a path is favorited
   */
  async isFavorite(filePath: string): Promise<boolean> {
    const prefs = await this.getPreferences();
    return prefs.favorites.some((f) => f.path === filePath);
  }

  /**
   * Toggle favorite status for a path
   */
  async toggleFavorite(filePath: string, name: string): Promise<void> {
    await this.atomicUpdate((prefs) => {
      const isFav = prefs.favorites.some((f) => f.path === filePath);

      if (isFav) {
        // Remove from favorites
        return {
          ...prefs,
          favorites: prefs.favorites.filter((f) => f.path !== filePath),
        };
      } else {
        // Add to favorites
        return {
          ...prefs,
          favorites: [
            ...prefs.favorites,
            {
              path: filePath,
              name,
              addedAt: new Date().toISOString(),
            },
          ],
        };
      }
    });
  }

  /**
   * Add a file to recents (moves to top if already exists, enforces max 10)
   */
  async addRecent(filePath: string, name: string): Promise<void> {
    await this.atomicUpdate((prefs) => {
      // Remove if already exists (will be added to top)
      const filteredRecents = prefs.recents.filter((r) => r.path !== filePath);

      // Add to beginning
      const newRecents = [
        {
          path: filePath,
          name,
          viewedAt: new Date().toISOString(),
        },
        ...filteredRecents,
      ].slice(0, MAX_RECENTS); // Enforce max limit

      return {
        ...prefs,
        recents: newRecents,
      };
    });
  }

  /**
   * Clear all recents
   */
  async clearRecents(): Promise<void> {
    await this.atomicUpdate((prefs) => ({
      ...prefs,
      recents: [],
    }));
  }

  /**
   * Get current display mode
   */
  async getDisplayMode(): Promise<DisplayMode> {
    const prefs = await this.getPreferences();
    return prefs.displayMode;
  }

  /**
   * Set display mode
   */
  async setDisplayMode(mode: DisplayMode): Promise<void> {
    // Validate mode
    const result = displayModeSchema.safeParse(mode);
    if (!result.success) {
      throw new Error(`Invalid display mode: ${mode}`);
    }

    await this.updatePreferences({ displayMode: result.data });
  }
}
