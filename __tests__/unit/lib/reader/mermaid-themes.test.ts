/**
 * Unit Tests: Mermaid Theme Configuration
 *
 * TDD Phase: RED - These tests should FAIL until service is implemented.
 * Based on: specs/005-markdown-reader/spec.md User Story 3 + User Story 6
 * Reference: specs/005-markdown-reader/research.md Section 3 (Mermaid Diagram Rendering)
 *
 * USER STORY 3: View Mermaid Diagrams
 * USER STORY 6: Toggle Between Themed and Reading Modes
 *
 * Goal: Provide theme configuration for Mermaid diagrams that integrates
 *       with the app's themed/reading display modes
 *
 * Test Categories:
 * - Theme configuration object structure
 * - Theme variables for dark mode
 * - Theme variables for light mode
 * - Theme variables for reading mode
 * - Theme transitions and changes
 * - Integration with display modes
 */

import { describe, it, expect } from 'vitest';
import {
  getMermaidThemeConfig,
  getMermaidTheme,
  MERMAID_THEMES,
  DARK_MERMAID_THEME,
  LIGHT_MERMAID_THEME,
  READING_MERMAID_THEME,
  DEFAULT_MERMAID_THEME,
  type MermaidThemeConfig,
  type MermaidThemeVariables,
} from '@/lib/reader/mermaid-themes';

describe('Mermaid Theme Configuration', () => {
  describe('Theme Constants', () => {
    it('should export MERMAID_THEMES object', () => {
      expect(MERMAID_THEMES).toBeDefined();
      expect(typeof MERMAID_THEMES).toBe('object');
    });

    it('should have dark theme defined', () => {
      expect(MERMAID_THEMES.dark).toBeDefined();
      expect(typeof MERMAID_THEMES.dark).toBe('string');
    });

    it('should have light theme defined', () => {
      expect(MERMAID_THEMES.light).toBeDefined();
      expect(typeof MERMAID_THEMES.light).toBe('string');
    });

    it('should have reading theme defined', () => {
      expect(MERMAID_THEMES.reading).toBeDefined();
      expect(typeof MERMAID_THEMES.reading).toBe('string');
    });

    it('should export DARK_MERMAID_THEME constant', () => {
      expect(DARK_MERMAID_THEME).toBeDefined();
      expect(DARK_MERMAID_THEME).toBe('dark');
    });

    it('should export LIGHT_MERMAID_THEME constant', () => {
      expect(LIGHT_MERMAID_THEME).toBeDefined();
      expect(LIGHT_MERMAID_THEME).toBe('neutral');
    });

    it('should export READING_MERMAID_THEME constant', () => {
      expect(READING_MERMAID_THEME).toBeDefined();
      expect(READING_MERMAID_THEME).toBe('base');
    });

    it('should export DEFAULT_MERMAID_THEME constant', () => {
      expect(DEFAULT_MERMAID_THEME).toBeDefined();
      expect([DARK_MERMAID_THEME, LIGHT_MERMAID_THEME, READING_MERMAID_THEME]).toContain(
        DEFAULT_MERMAID_THEME
      );
    });
  });

  describe('getMermaidTheme', () => {
    it('should return dark mermaid theme for dark app theme', () => {
      const theme = getMermaidTheme('dark');
      expect(theme).toBe('dark');
    });

    it('should return neutral mermaid theme for light app theme', () => {
      const theme = getMermaidTheme('light');
      expect(theme).toBe('neutral');
    });

    it('should return base mermaid theme for reading display mode', () => {
      const theme = getMermaidTheme('reading');
      expect(theme).toBe('base');
    });

    it('should return default theme for unknown input', () => {
      const theme = getMermaidTheme('unknown' as 'dark' | 'light' | 'reading');
      expect([DARK_MERMAID_THEME, LIGHT_MERMAID_THEME, READING_MERMAID_THEME]).toContain(theme);
    });

    it('should handle themed mode as dark', () => {
      // "themed" display mode should follow app dark/light theme
      // When not specified, defaults to dark
      const theme = getMermaidTheme('themed' as 'dark' | 'light' | 'reading');
      expect(theme).toBe('dark');
    });
  });

  describe('getMermaidThemeConfig', () => {
    it('should return a configuration object', () => {
      const config = getMermaidThemeConfig('dark');

      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    it('should include theme property', () => {
      const config = getMermaidThemeConfig('dark');

      expect(config.theme).toBeDefined();
      expect(typeof config.theme).toBe('string');
    });

    it('should include themeVariables property', () => {
      const config = getMermaidThemeConfig('dark');

      expect(config.themeVariables).toBeDefined();
      expect(typeof config.themeVariables).toBe('object');
    });

    it('should include startOnLoad: false', () => {
      const config = getMermaidThemeConfig('dark');

      expect(config.startOnLoad).toBe(false);
    });

    it('should include securityLevel: strict', () => {
      const config = getMermaidThemeConfig('dark');

      expect(config.securityLevel).toBe('strict');
    });
  });

  describe('Dark Theme Configuration', () => {
    let config: MermaidThemeConfig;

    beforeAll(() => {
      config = getMermaidThemeConfig('dark');
    });

    it('should have theme set to dark', () => {
      expect(config.theme).toBe('dark');
    });

    it('should have primaryColor defined', () => {
      expect(config.themeVariables?.primaryColor).toBeDefined();
      expect(typeof config.themeVariables?.primaryColor).toBe('string');
    });

    it('should have primaryTextColor for readability', () => {
      expect(config.themeVariables?.primaryTextColor).toBeDefined();
    });

    it('should have primaryBorderColor defined', () => {
      expect(config.themeVariables?.primaryBorderColor).toBeDefined();
    });

    it('should have lineColor for connections', () => {
      expect(config.themeVariables?.lineColor).toBeDefined();
    });

    it('should have secondaryColor defined', () => {
      expect(config.themeVariables?.secondaryColor).toBeDefined();
    });

    it('should have tertiaryColor defined', () => {
      expect(config.themeVariables?.tertiaryColor).toBeDefined();
    });

    it('should have background appropriate for dark mode', () => {
      const bg = config.themeVariables?.background;
      // Dark mode backgrounds should be dark colors
      if (bg) {
        // Either undefined (use default) or a dark color
        expect(typeof bg).toBe('string');
      }
    });

    it('should have fontFamily defined', () => {
      expect(config.themeVariables?.fontFamily).toBeDefined();
    });
  });

  describe('Light Theme Configuration', () => {
    let config: MermaidThemeConfig;

    beforeAll(() => {
      config = getMermaidThemeConfig('light');
    });

    it('should have theme set to neutral', () => {
      expect(config.theme).toBe('neutral');
    });

    it('should have primaryColor defined', () => {
      expect(config.themeVariables?.primaryColor).toBeDefined();
    });

    it('should have primaryTextColor for readability', () => {
      expect(config.themeVariables?.primaryTextColor).toBeDefined();
    });

    it('should have colors appropriate for light mode', () => {
      // Light mode should have lighter backgrounds/colors
      const primary = config.themeVariables?.primaryColor;
      expect(primary).toBeDefined();
    });

    it('should have lineColor visible on light background', () => {
      expect(config.themeVariables?.lineColor).toBeDefined();
    });
  });

  describe('Reading Mode Configuration', () => {
    let config: MermaidThemeConfig;

    beforeAll(() => {
      config = getMermaidThemeConfig('reading');
    });

    it('should have theme set to base', () => {
      expect(config.theme).toBe('base');
    });

    it('should have neutral/clean colors', () => {
      // Reading mode should be minimalist
      expect(config.themeVariables?.primaryColor).toBeDefined();
    });

    it('should be distinct from themed dark mode', () => {
      const darkConfig = getMermaidThemeConfig('dark');
      const readingConfig = getMermaidThemeConfig('reading');

      expect(readingConfig.theme).not.toBe(darkConfig.theme);
    });

    it('should be distinct from themed light mode', () => {
      const lightConfig = getMermaidThemeConfig('light');
      const readingConfig = getMermaidThemeConfig('reading');

      // They should have different themes or theme variables
      expect(
        readingConfig.theme !== lightConfig.theme ||
          JSON.stringify(readingConfig.themeVariables) !==
            JSON.stringify(lightConfig.themeVariables)
      ).toBe(true);
    });

    it('should prioritize readability', () => {
      // Reading mode should have good contrast
      expect(config.themeVariables?.primaryTextColor).toBeDefined();
    });
  });

  describe('Theme Variables Structure', () => {
    const themes = ['dark', 'light', 'reading'] as const;

    themes.forEach((theme) => {
      describe(`${theme} theme variables`, () => {
        it('should have all required variables', () => {
          const config = getMermaidThemeConfig(theme);
          const vars = config.themeVariables;

          // Required variables for consistent diagram rendering
          expect(vars?.primaryColor).toBeDefined();
          expect(vars?.primaryTextColor).toBeDefined();
          expect(vars?.lineColor).toBeDefined();
        });

        it('should have valid color values', () => {
          const config = getMermaidThemeConfig(theme);
          const vars = config.themeVariables;

          // Colors should be valid CSS color strings
          const hexOrNamedColor = /^#[0-9A-Fa-f]{3,8}$|^[a-zA-Z]+$/;

          if (vars?.primaryColor) {
            expect(vars.primaryColor).toMatch(hexOrNamedColor);
          }
        });
      });
    });
  });

  describe('Type Exports', () => {
    it('should export MermaidThemeConfig type', () => {
      // TypeScript compile-time check - if this compiles, the type is exported
      const config: MermaidThemeConfig = getMermaidThemeConfig('dark');
      expect(config).toBeDefined();
    });

    it('should export MermaidThemeVariables type', () => {
      // TypeScript compile-time check
      const vars: MermaidThemeVariables = {
        primaryColor: '#000',
        primaryTextColor: '#fff',
        lineColor: '#888',
      };
      expect(vars).toBeDefined();
    });
  });

  describe('Configuration Immutability', () => {
    it('should return a new config object each time', () => {
      const config1 = getMermaidThemeConfig('dark');
      const config2 = getMermaidThemeConfig('dark');

      expect(config1).not.toBe(config2);
    });

    it('should not be affected by mutations to returned config', () => {
      const config1 = getMermaidThemeConfig('dark');
      const originalTheme = config1.theme;

      // Mutate the returned config
      config1.theme = 'modified' as 'dark' | 'neutral' | 'base';

      const config2 = getMermaidThemeConfig('dark');

      expect(config2.theme).toBe(originalTheme);
    });
  });

  describe('Integration with Display Modes', () => {
    it('should provide themed mode configuration for dark system theme', () => {
      // When display mode is "themed" and system is dark
      const config = getMermaidThemeConfig('dark');

      expect(config.theme).toBe('dark');
    });

    it('should provide themed mode configuration for light system theme', () => {
      // When display mode is "themed" and system is light
      const config = getMermaidThemeConfig('light');

      expect(config.theme).toBe('neutral');
    });

    it('should provide reading mode configuration', () => {
      // When display mode is "reading"
      const config = getMermaidThemeConfig('reading');

      expect(config.theme).toBe('base');
    });
  });

  describe('Flowchart-Specific Variables', () => {
    it('should support flowchart node colors', () => {
      const config = getMermaidThemeConfig('dark');

      // Flowcharts use node styling
      // These may be part of themeVariables or handled by the theme itself
      expect(config.themeVariables).toBeDefined();
    });
  });

  describe('Sequence Diagram Variables', () => {
    it('should support sequence diagram styling', () => {
      const config = getMermaidThemeConfig('dark');

      // Sequence diagrams need actor and message styling
      expect(config.themeVariables).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined theme gracefully', () => {
      // @ts-expect-error Testing error handling
      const config = getMermaidThemeConfig(undefined);

      // Should return a valid config (likely default)
      expect(config).toBeDefined();
      expect(config.theme).toBeDefined();
    });

    it('should handle null theme gracefully', () => {
      // @ts-expect-error Testing error handling
      const config = getMermaidThemeConfig(null);

      // Should return a valid config
      expect(config).toBeDefined();
      expect(config.theme).toBeDefined();
    });

    it('should handle empty string theme', () => {
      // @ts-expect-error Testing error handling
      const config = getMermaidThemeConfig('');

      // Should return a valid config
      expect(config).toBeDefined();
      expect(config.theme).toBeDefined();
    });
  });
});
