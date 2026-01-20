/**
 * Shiki Highlighter Service
 *
 * Provides syntax highlighting for code blocks using Shiki.
 * Uses a singleton pattern to avoid reinitializing the highlighter.
 *
 * @see specs/005-markdown-reader/spec.md User Story 2
 * @see specs/005-markdown-reader/research.md Section 2
 */

import { createHighlighter, type Highlighter, type BundledLanguage, type BundledTheme } from 'shiki';

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

// Language aliases for common shorthand forms
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
};

// Singleton highlighter instance
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Resolve language alias to canonical name
 */
function resolveLanguage(language: string): string {
  if (!language) return 'text';
  const normalized = language.toLowerCase();
  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * Get or create the singleton highlighter instance
 */
export async function getHighlighter(): Promise<Highlighter> {
  // Return existing instance if available
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Wait for pending initialization if in progress
  if (highlighterPromise) {
    return highlighterPromise;
  }

  // Initialize new highlighter
  highlighterPromise = createHighlighter({
    themes: SUPPORTED_THEMES as unknown as BundledTheme[],
    langs: SUPPORTED_LANGUAGES as unknown as BundledLanguage[],
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

/**
 * Highlight code with the specified language and theme
 */
export async function highlightCode(
  code: string,
  language: string,
  theme: string = DEFAULT_THEME
): Promise<string> {
  // Handle null/undefined code gracefully
  const safeCode = code ?? '';

  // Resolve language alias and theme
  const resolvedLang = resolveLanguage(language);
  const resolvedTheme = SUPPORTED_THEMES.includes(theme as typeof SUPPORTED_THEMES[number])
    ? theme
    : DEFAULT_THEME;

  try {
    const highlighter = await getHighlighter();

    // Check if language is supported, fallback to 'text' if not
    const loadedLangs = highlighter.getLoadedLanguages();
    const finalLang = loadedLangs.includes(resolvedLang) ? resolvedLang : 'text';

    return highlighter.codeToHtml(safeCode, {
      lang: finalLang,
      theme: resolvedTheme,
    });
  } catch {
    // Fallback: return plain HTML wrapper if highlighting fails
    const escaped = safeCode
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="shiki ${resolvedTheme}"><code><span class="line">${escaped}</span></code></pre>`;
  }
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
  highlighterPromise = null;
}
