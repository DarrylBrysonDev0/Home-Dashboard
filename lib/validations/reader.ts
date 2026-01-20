import { z } from 'zod';

/**
 * Zod validation schemas for the Markdown Reader API
 *
 * These schemas provide runtime validation for API requests and responses,
 * ensuring type safety at the boundaries of the application.
 *
 * @see specs/005-markdown-reader/data-model.md
 * @see specs/005-markdown-reader/contracts/reader-api.yaml
 */

// =============================================================================
// Core Entity Schemas
// =============================================================================

/**
 * FileNode schema with recursive type for directories
 */
export const fileNodeSchema: z.ZodType<{
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: z.infer<typeof fileNodeSchema>[];
  modifiedAt?: string;
  size?: number;
  isLoaded?: boolean;
  hasChildren?: boolean;
}> = z.object({
  name: z.string().min(1),
  path: z.string(),
  type: z.enum(['file', 'directory']),
  extension: z.string().optional(),
  children: z.lazy(() => z.array(fileNodeSchema)).optional(),
  modifiedAt: z.string().datetime().optional(),
  size: z.number().int().nonnegative().optional(),
  isLoaded: z.boolean().optional(),
  hasChildren: z.boolean().optional(),
});

export type FileNodeSchema = z.infer<typeof fileNodeSchema>;

/**
 * Supported file extensions for documents
 */
export const documentExtensionSchema = z.enum(['.md', '.mmd', '.txt']);
export type DocumentExtension = z.infer<typeof documentExtensionSchema>;

/**
 * Supported file extensions for images
 */
export const imageExtensionSchema = z.enum([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
]);
export type ImageExtension = z.infer<typeof imageExtensionSchema>;

/**
 * FileContent schema for loaded file data
 */
export const fileContentSchema = z.object({
  path: z.string(),
  name: z.string().min(1),
  content: z.string(),
  extension: documentExtensionSchema,
  modifiedAt: z.string().datetime(),
  size: z.number().int().nonnegative(),
});

export type FileContent = z.infer<typeof fileContentSchema>;

/**
 * Favorite bookmark schema
 */
export const favoriteSchema = z.object({
  path: z.string(),
  name: z.string().min(1),
  addedAt: z.string().datetime(),
});

export type Favorite = z.infer<typeof favoriteSchema>;

/**
 * RecentFile schema
 */
export const recentFileSchema = z.object({
  path: z.string(),
  name: z.string().min(1),
  viewedAt: z.string().datetime(),
});

export type RecentFile = z.infer<typeof recentFileSchema>;

/**
 * Display mode schema (themed or reading)
 */
export const displayModeSchema = z.enum(['themed', 'reading']);
export type DisplayMode = z.infer<typeof displayModeSchema>;

/**
 * ReaderPreferences schema for stored preferences
 */
export const readerPreferencesSchema = z.object({
  version: z.literal(1),
  favorites: z.array(favoriteSchema),
  recents: z.array(recentFileSchema).max(10),
  displayMode: displayModeSchema,
});

export type ReaderPreferences = z.infer<typeof readerPreferencesSchema>;

/**
 * DocumentHeading schema for TOC entries
 */
export const documentHeadingSchema = z.object({
  id: z.string(),
  text: z.string(),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
});

export type DocumentHeading = z.infer<typeof documentHeadingSchema>;

// =============================================================================
// API Request Validation Schemas
// =============================================================================

/**
 * Query params for GET /api/reader/tree
 */
export const treeQuerySchema = z.object({
  path: z.string().optional().default('/'),
});

export type TreeQuery = z.infer<typeof treeQuerySchema>;

/**
 * Query params for GET /api/reader/file
 */
export const fileQuerySchema = z.object({
  path: z.string().min(1, 'Path is required'),
});

export type FileQuery = z.infer<typeof fileQuerySchema>;

/**
 * Query params for GET /api/reader/search
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Query params for GET /api/reader/image
 */
export const imageQuerySchema = z.object({
  path: z.string().min(1, 'Image path is required'),
});

export type ImageQuery = z.infer<typeof imageQuerySchema>;

/**
 * Request body for PUT /api/reader/preferences
 */
export const preferencesUpdateSchema = z.object({
  favorites: z.array(favoriteSchema).optional(),
  recents: z.array(recentFileSchema).optional(),
  displayMode: displayModeSchema.optional(),
});

export type PreferencesUpdate = z.infer<typeof preferencesUpdateSchema>;

// =============================================================================
// API Response Schemas
// =============================================================================

/**
 * Success response for GET /api/reader/tree
 */
export const treeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    path: z.string(),
    children: z.array(fileNodeSchema),
  }),
});

export type TreeResponse = z.infer<typeof treeResponseSchema>;

/**
 * Success response for GET /api/reader/file
 */
export const fileResponseSchema = z.object({
  success: z.literal(true),
  data: fileContentSchema,
});

export type FileResponse = z.infer<typeof fileResponseSchema>;

/**
 * Success response for GET /api/reader/search
 */
export const searchResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(fileNodeSchema),
  query: z.string(),
  total: z.number().int().nonnegative(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

/**
 * Success response for GET/PUT /api/reader/preferences
 */
export const preferencesResponseSchema = z.object({
  success: z.literal(true),
  data: readerPreferencesSchema,
});

export type PreferencesResponse = z.infer<typeof preferencesResponseSchema>;

/**
 * Error response for all reader API routes
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// =============================================================================
// Path Validation Utilities
// =============================================================================

/**
 * Allowed document extensions
 */
export const DOCUMENT_EXTENSIONS = ['.md', '.mmd', '.txt'] as const;

/**
 * Allowed image extensions
 */
export const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
] as const;

/**
 * Check if a path contains directory traversal patterns
 */
export function containsPathTraversal(path: string): boolean {
  return path.includes('..');
}

/**
 * Check if a file extension is a supported document type
 */
export function isDocumentExtension(ext: string): ext is DocumentExtension {
  return DOCUMENT_EXTENSIONS.includes(ext.toLowerCase() as DocumentExtension);
}

/**
 * Check if a file extension is a supported image type
 */
export function isImageExtension(ext: string): ext is ImageExtension {
  return IMAGE_EXTENSIONS.includes(ext.toLowerCase() as ImageExtension);
}
