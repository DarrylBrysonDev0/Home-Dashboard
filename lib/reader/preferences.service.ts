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
 * Service for managing reader preferences stored in a JSON file.
 * Provides atomic writes and schema validation for data integrity.
 */
export class PreferencesService {
  private readonly docsRoot: string;
  private readonly filename: string;
  private readonly prefsPath: string;

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

    // Write atomically: write to temp file then rename
    const tempPath = `${this.prefsPath}.tmp`;
    const content = JSON.stringify(result.data, null, 2);

    await writeFile(tempPath, content, 'utf-8');
    await rename(tempPath, this.prefsPath);
  }

  /**
   * Update specific preference fields (merges with existing)
   */
  async updatePreferences(
    update: Partial<Omit<ReaderPreferences, 'version'>>
  ): Promise<void> {
    const current = await this.getPreferences();
    const updated: ReaderPreferences = {
      ...current,
      ...update,
      version: 1, // Always keep version at 1
    };
    await this.savePreferences(updated);
  }

  /**
   * Add a file to favorites
   */
  async addFavorite(filePath: string, name: string): Promise<void> {
    const prefs = await this.getPreferences();

    // Check for duplicates
    if (prefs.favorites.some((f) => f.path === filePath)) {
      return; // Already favorited
    }

    prefs.favorites.push({
      path: filePath,
      name,
      addedAt: new Date().toISOString(),
    });

    await this.savePreferences(prefs);
  }

  /**
   * Remove a file from favorites
   */
  async removeFavorite(filePath: string): Promise<void> {
    const prefs = await this.getPreferences();
    prefs.favorites = prefs.favorites.filter((f) => f.path !== filePath);
    await this.savePreferences(prefs);
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
    const isFav = await this.isFavorite(filePath);
    if (isFav) {
      await this.removeFavorite(filePath);
    } else {
      await this.addFavorite(filePath, name);
    }
  }

  /**
   * Add a file to recents (moves to top if already exists, enforces max 10)
   */
  async addRecent(filePath: string, name: string): Promise<void> {
    const prefs = await this.getPreferences();

    // Remove if already exists (will be added to top)
    prefs.recents = prefs.recents.filter((r) => r.path !== filePath);

    // Add to beginning
    prefs.recents.unshift({
      path: filePath,
      name,
      viewedAt: new Date().toISOString(),
    });

    // Enforce max limit
    if (prefs.recents.length > MAX_RECENTS) {
      prefs.recents = prefs.recents.slice(0, MAX_RECENTS);
    }

    await this.savePreferences(prefs);
  }

  /**
   * Clear all recents
   */
  async clearRecents(): Promise<void> {
    await this.updatePreferences({ recents: [] });
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
