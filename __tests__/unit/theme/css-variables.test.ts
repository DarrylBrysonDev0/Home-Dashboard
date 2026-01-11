/**
 * CSS Variable Utilities - Unit Tests
 *
 * Tests for the theme CSS variable utility functions.
 * @module __tests__/unit/theme/css-variables.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCssVariable,
  setCssVariable,
  getCssVariables,
  cssVar,
  cssVarWithFallback,
  textOnBackground,
  isAccessibleCombination,
  getAccessibleTextColors,
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  VALID_COMBINATIONS,
} from '@/lib/theme/utils/css-variables';

describe('CSS Variable Utilities', () => {
  describe('cssVar', () => {
    it('returns a CSS var() function string', () => {
      expect(cssVar('color-bg-primary')).toBe('var(--color-bg-primary)');
    });

    it('handles text color variables', () => {
      expect(cssVar('color-text-primary')).toBe('var(--color-text-primary)');
    });

    it('handles accent color variables', () => {
      expect(cssVar('color-accent-coral')).toBe('var(--color-accent-coral)');
    });
  });

  describe('cssVarWithFallback', () => {
    it('returns a CSS var() function with fallback', () => {
      expect(cssVarWithFallback('color-bg-primary', '#FFFFFF')).toBe(
        'var(--color-bg-primary, #FFFFFF)'
      );
    });

    it('handles complex fallback values', () => {
      expect(cssVarWithFallback('color-text-primary', 'rgba(0,0,0,0.9)')).toBe(
        'var(--color-text-primary, rgba(0,0,0,0.9))'
      );
    });
  });

  describe('textOnBackground', () => {
    it('returns a style object with color and backgroundColor', () => {
      const result = textOnBackground('color-text-primary', 'color-bg-secondary');
      expect(result).toEqual({
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--color-bg-secondary)',
      });
    });

    it('handles inverse text on active background', () => {
      const result = textOnBackground('color-text-inverse', 'color-bg-active');
      expect(result).toEqual({
        color: 'var(--color-text-inverse)',
        backgroundColor: 'var(--color-bg-active)',
      });
    });
  });

  describe('hexToRgb', () => {
    it('parses a hex color with # prefix', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('parses a hex color without # prefix', () => {
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('parses a mixed case hex color', () => {
      expect(hexToRgb('#F97066')).toEqual({ r: 249, g: 112, b: 102 });
    });

    it('parses lowercase hex colors', () => {
      expect(hexToRgb('#12b76a')).toEqual({ r: 18, g: 183, b: 106 });
    });

    it('returns null for invalid hex colors', () => {
      expect(hexToRgb('#GGG')).toBeNull();
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#12')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(hexToRgb('')).toBeNull();
    });
  });

  describe('relativeLuminance', () => {
    it('returns 1 for white', () => {
      expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 2);
    });

    it('returns 0 for black', () => {
      expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 2);
    });

    it('returns intermediate values for gray', () => {
      const luminance = relativeLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });

    it('gives higher weight to green', () => {
      const redLuminance = relativeLuminance(255, 0, 0);
      const greenLuminance = relativeLuminance(0, 255, 0);
      const blueLuminance = relativeLuminance(0, 0, 255);
      expect(greenLuminance).toBeGreaterThan(redLuminance);
      expect(greenLuminance).toBeGreaterThan(blueLuminance);
    });
  });

  describe('contrastRatio', () => {
    it('returns 21 for black on white', () => {
      expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    });

    it('returns 21 for white on black', () => {
      expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    });

    it('returns 1 for same colors', () => {
      expect(contrastRatio('#F97066', '#F97066')).toBeCloseTo(1, 2);
    });

    it('calculates contrast for Cemdash light theme primary text on primary bg', () => {
      // Light theme: text-primary (#101828) on bg-primary (#FFFFFF)
      const ratio = contrastRatio('#FFFFFF', '#101828');
      expect(ratio).toBeGreaterThan(15); // Should exceed AA requirements by a lot
    });

    it('calculates contrast for Cemdash dark theme primary text on primary bg', () => {
      // Dark theme: text-primary (#FFFFFF) on bg-primary (#0A0A0A)
      const ratio = contrastRatio('#0A0A0A', '#FFFFFF');
      expect(ratio).toBeGreaterThan(17);
    });

    it('returns 0 for invalid colors', () => {
      expect(contrastRatio('#FFFFFF', 'invalid')).toBe(0);
      expect(contrastRatio('invalid', '#FFFFFF')).toBe(0);
    });
  });

  describe('meetsWcagAA', () => {
    it('returns true for black on white', () => {
      expect(meetsWcagAA('#000000', '#FFFFFF')).toBe(true);
    });

    it('returns true for Cemdash light theme primary text', () => {
      expect(meetsWcagAA('#101828', '#FFFFFF')).toBe(true);
    });

    it('returns true for Cemdash light theme secondary text', () => {
      expect(meetsWcagAA('#344054', '#FFFFFF')).toBe(true);
    });

    it('returns false for light gray on white', () => {
      expect(meetsWcagAA('#AAAAAA', '#FFFFFF')).toBe(false);
    });

    it('returns true for dark theme primary text on dark bg', () => {
      expect(meetsWcagAA('#FFFFFF', '#0A0A0A')).toBe(true);
    });
  });

  describe('meetsWcagAAA', () => {
    it('returns true for black on white', () => {
      expect(meetsWcagAAA('#000000', '#FFFFFF')).toBe(true);
    });

    it('returns true for high contrast combinations', () => {
      expect(meetsWcagAAA('#101828', '#FFFFFF')).toBe(true);
    });

    it('returns false for medium contrast combinations', () => {
      // This should pass AA but not AAA
      expect(meetsWcagAAA('#667085', '#F9FAFB')).toBe(false);
    });
  });

  describe('isAccessibleCombination', () => {
    it('returns true for primary text on primary bg', () => {
      expect(isAccessibleCombination('color-text-primary', 'color-bg-primary')).toBe(true);
    });

    it('returns true for secondary text on page bg', () => {
      expect(isAccessibleCombination('color-text-secondary', 'color-bg-page')).toBe(true);
    });

    it('returns true for tertiary text on primary bg', () => {
      expect(isAccessibleCombination('color-text-tertiary', 'color-bg-primary')).toBe(true);
    });

    it('returns false for muted text on active bg', () => {
      expect(isAccessibleCombination('color-text-muted', 'color-bg-active')).toBe(false);
    });
  });

  describe('getAccessibleTextColors', () => {
    it('returns accessible text colors for page background', () => {
      const colors = getAccessibleTextColors('color-bg-page');
      expect(colors).toContain('color-text-primary');
      expect(colors).toContain('color-text-secondary');
      expect(colors.indexOf('color-text-primary')).toBeLessThan(
        colors.indexOf('color-text-secondary')
      );
    });

    it('returns accessible text colors for primary background', () => {
      const colors = getAccessibleTextColors('color-bg-primary');
      expect(colors.length).toBeGreaterThan(0);
      expect(colors[0]).toBe('color-text-primary'); // Highest contrast first
    });

    it('returns fewer options for active background', () => {
      const pageColors = getAccessibleTextColors('color-bg-page');
      const activeColors = getAccessibleTextColors('color-bg-active');
      expect(activeColors.length).toBeLessThanOrEqual(pageColors.length);
    });

    it('returns colors sorted by contrast ratio (highest first)', () => {
      const colors = getAccessibleTextColors('color-bg-secondary');
      // Primary should come before secondary
      if (colors.includes('color-text-primary') && colors.includes('color-text-secondary')) {
        expect(colors.indexOf('color-text-primary')).toBeLessThan(
          colors.indexOf('color-text-secondary')
        );
      }
    });
  });

  describe('VALID_COMBINATIONS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(VALID_COMBINATIONS)).toBe(true);
      expect(VALID_COMBINATIONS.length).toBeGreaterThan(0);
    });

    it('all combinations have contrast ratio >= 4.5', () => {
      for (const combo of VALID_COMBINATIONS) {
        expect(combo.contrastRatio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('includes primary text on all background levels', () => {
      const primaryTextCombos = VALID_COMBINATIONS.filter(
        (c) => c.text === 'color-text-primary'
      );
      expect(primaryTextCombos.length).toBeGreaterThanOrEqual(5);
    });
  });
});

describe('CSS Variable DOM Functions', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  beforeEach(() => {
    // Mock document.documentElement
    const mockElement = {
      style: {
        setProperty: vi.fn(),
      },
    } as unknown as HTMLElement;

    // Mock getComputedStyle
    const mockComputedStyle = {
      getPropertyValue: vi.fn((prop: string) => {
        const values: Record<string, string> = {
          '--color-bg-primary': '#FFFFFF',
          '--color-text-primary': '#101828',
          '--color-accent-coral': '#F97066',
        };
        return values[prop] || '';
      }),
    } as unknown as CSSStyleDeclaration;

    vi.stubGlobal('window', {});
    vi.stubGlobal('document', {
      documentElement: mockElement,
    });
    vi.stubGlobal('getComputedStyle', () => mockComputedStyle);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalWindow === undefined) {
      // @ts-expect-error - Cleaning up mock
      delete global.window;
    }
    if (originalDocument === undefined) {
      // @ts-expect-error - Cleaning up mock
      delete global.document;
    }
  });

  describe('getCssVariable', () => {
    it('returns the computed CSS variable value', () => {
      const value = getCssVariable('color-bg-primary');
      expect(value).toBe('#FFFFFF');
    });

    it('returns trimmed value', () => {
      const value = getCssVariable('color-text-primary');
      expect(value).toBe('#101828');
    });
  });

  describe('setCssVariable', () => {
    it('sets a CSS variable on document.documentElement', () => {
      setCssVariable('color-accent-coral', '#FF5555');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--color-accent-coral',
        '#FF5555'
      );
    });
  });

  describe('getCssVariables', () => {
    it('returns multiple CSS variable values', () => {
      const values = getCssVariables(['color-bg-primary', 'color-text-primary']);
      expect(values).toEqual({
        'color-bg-primary': '#FFFFFF',
        'color-text-primary': '#101828',
      });
    });
  });
});

describe('Server-side rendering compatibility', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Simulate server environment
    // @ts-expect-error - Simulating SSR
    delete global.window;
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
      global.window = originalWindow;
    }
  });

  it('getCssVariable returns empty string on server', () => {
    expect(getCssVariable('color-bg-primary')).toBe('');
  });

  it('getCssVariables returns empty strings on server', () => {
    const values = getCssVariables(['color-bg-primary', 'color-text-primary']);
    expect(values).toEqual({
      'color-bg-primary': '',
      'color-text-primary': '',
    });
  });

  it('setCssVariable does not throw on server', () => {
    expect(() => setCssVariable('color-bg-primary', '#FFFFFF')).not.toThrow();
  });
});
