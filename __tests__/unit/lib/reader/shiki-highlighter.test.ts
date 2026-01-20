/**
 * Unit Tests: Shiki Highlighter Service
 *
 * TDD Phase: RED - These tests should FAIL until service is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 2
 * Reference: specs/005-markdown-reader/research.md Section 2 (Syntax Highlighting)
 *
 * USER STORY 2: Syntax-Highlighted Code Blocks
 * Goal: Provide VS Code-quality syntax highlighting via shiki
 *
 * Test Categories:
 * - Highlighter initialization (singleton pattern)
 * - Language support detection
 * - Code highlighting with themes
 * - Error handling for unsupported languages
 * - Theme configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock shiki module before importing the highlighter
vi.mock('shiki', () => {
  const mockHighlighter = {
    codeToHtml: vi.fn((code: string, options: { lang: string; theme: string }) => {
      return `<pre class="shiki ${options.theme}" style="background-color:#24292e"><code><span class="line"><span style="color:#F97583">const</span><span style="color:#E1E4E8"> x = </span><span style="color:#79B8FF">1</span></span></code></pre>`;
    }),
    getLoadedLanguages: vi.fn(() => [
      'typescript', 'javascript', 'python', 'bash', 'sql',
      'json', 'yaml', 'markdown', 'css', 'html', 'tsx', 'jsx',
      'go', 'rust', 'java', 'c', 'cpp'
    ]),
    getLoadedThemes: vi.fn(() => ['github-dark', 'github-light', 'one-dark-pro']),
    loadLanguage: vi.fn().mockResolvedValue(undefined),
    loadTheme: vi.fn().mockResolvedValue(undefined),
  };

  return {
    createHighlighter: vi.fn().mockResolvedValue(mockHighlighter),
    bundledLanguages: {
      typescript: {},
      javascript: {},
      python: {},
      bash: {},
      sql: {},
      json: {},
      yaml: {},
      markdown: {},
      css: {},
      html: {},
      tsx: {},
      jsx: {},
      go: {},
      rust: {},
    },
    bundledThemes: {
      'github-dark': {},
      'github-light': {},
      'one-dark-pro': {},
    },
  };
});

// Import after mocking
import {
  getHighlighter,
  highlightCode,
  isLanguageSupported,
  getSupportedLanguages,
  resetHighlighter,
  SUPPORTED_THEMES,
  DEFAULT_THEME,
  LIGHT_THEME,
  DARK_THEME,
} from '@/lib/reader/shiki-highlighter';

describe('Shiki Highlighter Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton state between tests
    resetHighlighter?.();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getHighlighter', () => {
    it('should return a highlighter instance', async () => {
      const highlighter = await getHighlighter();

      expect(highlighter).toBeDefined();
      expect(highlighter.codeToHtml).toBeDefined();
    });

    it('should return the same instance on multiple calls (singleton)', async () => {
      const highlighter1 = await getHighlighter();
      const highlighter2 = await getHighlighter();

      expect(highlighter1).toBe(highlighter2);
    });

    it('should initialize with configured languages', async () => {
      const highlighter = await getHighlighter();
      const languages = highlighter.getLoadedLanguages();

      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('bash');
      expect(languages).toContain('json');
    });

    it('should initialize with configured themes', async () => {
      const highlighter = await getHighlighter();
      const themes = highlighter.getLoadedThemes();

      expect(themes).toContain('github-dark');
      expect(themes).toContain('github-light');
    });
  });

  describe('highlightCode', () => {
    it('should return highlighted HTML for valid code', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, 'typescript');

      expect(result).toContain('<pre');
      expect(result).toContain('shiki');
      expect(result).toContain('<code');
    });

    it('should apply specified theme', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, 'typescript', 'github-light');

      expect(result).toContain('github-light');
    });

    it('should use default dark theme when theme not specified', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, 'typescript');

      expect(result).toContain('github-dark');
    });

    it('should handle TypeScript code', async () => {
      const code = 'const x: number = 1;';
      const result = await highlightCode(code, 'typescript');

      expect(result).toContain('<pre');
      expect(result).toContain('shiki');
    });

    it('should handle JavaScript code', async () => {
      const code = 'const x = 1;';
      const result = await highlightCode(code, 'javascript');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle Python code', async () => {
      const code = 'def hello():\n    print("Hello")';
      const result = await highlightCode(code, 'python');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle bash code', async () => {
      const code = 'echo "Hello World"';
      const result = await highlightCode(code, 'bash');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle SQL code', async () => {
      const code = 'SELECT * FROM users WHERE id = 1;';
      const result = await highlightCode(code, 'sql');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle JSON code', async () => {
      const code = '{"key": "value", "number": 42}';
      const result = await highlightCode(code, 'json');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle YAML code', async () => {
      const code = 'key: value\nlist:\n  - item1\n  - item2';
      const result = await highlightCode(code, 'yaml');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle CSS code', async () => {
      const code = '.class { color: red; }';
      const result = await highlightCode(code, 'css');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle HTML code', async () => {
      const code = '<div class="container"><p>Hello</p></div>';
      const result = await highlightCode(code, 'html');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle TSX code', async () => {
      const code = 'const App: FC = () => <div>Hello</div>;';
      const result = await highlightCode(code, 'tsx');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle JSX code', async () => {
      const code = 'const App = () => <div>Hello</div>;';
      const result = await highlightCode(code, 'jsx');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle empty code', async () => {
      const result = await highlightCode('', 'typescript');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle multiline code', async () => {
      const code = `function hello() {
  console.log("Hello");
  return true;
}`;
      const result = await highlightCode(code, 'javascript');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle code with special characters', async () => {
      const code = 'const regex = /[a-z]+/g;';
      const result = await highlightCode(code, 'javascript');

      expect(result).toBeDefined();
    });

    it('should handle code with unicode', async () => {
      const code = 'const emoji = "🎉";';
      const result = await highlightCode(code, 'javascript');

      expect(result).toBeDefined();
    });
  });

  describe('Unsupported Languages', () => {
    it('should return plain code wrapped in pre/code for unsupported languages', async () => {
      const code = 'some random code';
      const result = await highlightCode(code, 'unknown-language');

      // Should still return valid HTML, possibly without highlighting
      expect(result).toContain('<pre');
      expect(result).toContain('code');
    });

    it('should handle text/plain language', async () => {
      const code = 'plain text content';
      const result = await highlightCode(code, 'text');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });

    it('should handle empty language string', async () => {
      const code = 'some code';
      const result = await highlightCode(code, '');

      expect(result).toBeDefined();
      expect(result).toContain('<pre');
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('typescript')).toBe(true);
      expect(isLanguageSupported('javascript')).toBe(true);
      expect(isLanguageSupported('python')).toBe(true);
      expect(isLanguageSupported('bash')).toBe(true);
      expect(isLanguageSupported('json')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('unknown-lang')).toBe(false);
      expect(isLanguageSupported('gibberish')).toBe(false);
    });

    it('should handle common aliases', () => {
      // Common aliases that should be supported
      expect(isLanguageSupported('ts')).toBe(true);
      expect(isLanguageSupported('js')).toBe(true);
      expect(isLanguageSupported('py')).toBe(true);
      expect(isLanguageSupported('sh')).toBe(true);
      expect(isLanguageSupported('shell')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isLanguageSupported('TypeScript')).toBe(true);
      expect(isLanguageSupported('JAVASCRIPT')).toBe(true);
      expect(isLanguageSupported('Python')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isLanguageSupported('')).toBe(false);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const languages = getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    it('should include common programming languages', () => {
      const languages = getSupportedLanguages();

      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('python');
      expect(languages).toContain('bash');
      expect(languages).toContain('sql');
      expect(languages).toContain('json');
      expect(languages).toContain('yaml');
      expect(languages).toContain('css');
      expect(languages).toContain('html');
    });

    it('should include markdown', () => {
      const languages = getSupportedLanguages();

      expect(languages).toContain('markdown');
    });
  });

  describe('Theme Constants', () => {
    it('should export SUPPORTED_THEMES', () => {
      expect(SUPPORTED_THEMES).toBeDefined();
      expect(Array.isArray(SUPPORTED_THEMES)).toBe(true);
      expect(SUPPORTED_THEMES).toContain('github-dark');
      expect(SUPPORTED_THEMES).toContain('github-light');
    });

    it('should export DEFAULT_THEME', () => {
      expect(DEFAULT_THEME).toBeDefined();
      expect(typeof DEFAULT_THEME).toBe('string');
    });

    it('should export LIGHT_THEME', () => {
      expect(LIGHT_THEME).toBeDefined();
      expect(LIGHT_THEME).toBe('github-light');
    });

    it('should export DARK_THEME', () => {
      expect(DARK_THEME).toBeDefined();
      expect(DARK_THEME).toBe('github-dark');
    });

    it('should have DEFAULT_THEME match one of DARK or LIGHT', () => {
      expect([DARK_THEME, LIGHT_THEME]).toContain(DEFAULT_THEME);
    });
  });

  describe('Error Handling', () => {
    it('should not throw for invalid language', async () => {
      await expect(
        highlightCode('code', 'invalid-language-xyz')
      ).resolves.toBeDefined();
    });

    it('should not throw for invalid theme', async () => {
      await expect(
        highlightCode('code', 'typescript', 'invalid-theme')
      ).resolves.toBeDefined();
    });

    it('should handle null/undefined gracefully', async () => {
      // @ts-expect-error Testing error handling
      await expect(highlightCode(null, 'typescript')).resolves.toBeDefined();

      // @ts-expect-error Testing error handling
      await expect(highlightCode('code', null)).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should cache highlighter instance', async () => {
      const { createHighlighter } = await import('shiki');

      // Call getHighlighter multiple times
      await getHighlighter();
      await getHighlighter();
      await getHighlighter();

      // createHighlighter should only be called once (singleton)
      expect(createHighlighter).toHaveBeenCalledTimes(1);
    });

    it('should highlight multiple snippets efficiently', async () => {
      const snippets = [
        { code: 'const a = 1;', lang: 'typescript' },
        { code: 'const b = 2;', lang: 'javascript' },
        { code: 'print("hi")', lang: 'python' },
      ];

      const results = await Promise.all(
        snippets.map(s => highlightCode(s.code, s.lang))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toContain('<pre');
      });
    });
  });

  describe('Language Aliases', () => {
    it('should map ts to typescript', async () => {
      const result = await highlightCode('const x = 1;', 'ts');
      expect(result).toBeDefined();
    });

    it('should map js to javascript', async () => {
      const result = await highlightCode('const x = 1;', 'js');
      expect(result).toBeDefined();
    });

    it('should map py to python', async () => {
      const result = await highlightCode('x = 1', 'py');
      expect(result).toBeDefined();
    });

    it('should map sh to bash', async () => {
      const result = await highlightCode('echo "hi"', 'sh');
      expect(result).toBeDefined();
    });

    it('should map shell to bash', async () => {
      const result = await highlightCode('echo "hi"', 'shell');
      expect(result).toBeDefined();
    });

    it('should map yml to yaml', async () => {
      const result = await highlightCode('key: value', 'yml');
      expect(result).toBeDefined();
    });
  });
});
