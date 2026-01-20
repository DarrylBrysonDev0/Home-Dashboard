/**
 * Shiki Highlighter Service
 *
 * Provides syntax highlighting for code blocks using Shiki.
 * This is a stub file for TDD - implementation pending.
 *
 * @see specs/005-markdown-reader/spec.md User Story 2
 * @see specs/005-markdown-reader/research.md Section 2
 */

// Theme constants
export const DARK_THEME = 'github-dark';
export const LIGHT_THEME = 'github-light';
export const DEFAULT_THEME = DARK_THEME;
export const SUPPORTED_THEMES = ['github-dark', 'github-light', 'one-dark-pro'] as const;

// Supported languages - from research.md
const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'python', 'bash', 'sql',
  'json', 'yaml', 'markdown', 'css', 'html', 'tsx', 'jsx',
  'go', 'rust', 'java', 'c', 'cpp',
] as const;

// Language aliases
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
};

// Singleton highlighter instance - stub for now
let highlighterInstance: unknown = null;

/**
 * Get or create the singleton highlighter instance
 * TODO: Implement with actual shiki initialization
 */
export async function getHighlighter(): Promise<{
  codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
  getLoadedLanguages: () => string[];
  getLoadedThemes: () => string[];
}> {
  // Stub implementation - will be replaced
  throw new Error('Not implemented: getHighlighter');
}

/**
 * Highlight code with the specified language and theme
 * TODO: Implement with actual shiki highlighting
 */
export async function highlightCode(
  code: string,
  language: string,
  theme: string = DEFAULT_THEME
): Promise<string> {
  // Stub implementation - will be replaced
  throw new Error('Not implemented: highlightCode');
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  if (!language) return false;
  const normalized = language.toLowerCase();
  const resolved = LANGUAGE_ALIASES[normalized] || normalized;
  return SUPPORTED_LANGUAGES.includes(resolved as typeof SUPPORTED_LANGUAGES[number]);
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages(): string[] {
  return [...SUPPORTED_LANGUAGES];
}

/**
 * Reset the highlighter singleton (for testing)
 */
export function resetHighlighter(): void {
  highlighterInstance = null;
}
