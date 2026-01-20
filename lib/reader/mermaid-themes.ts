/**
 * Mermaid Theme Configuration
 *
 * Provides theme configuration for Mermaid diagrams that integrates with
 * the app's themed/reading display modes.
 *
 * Based on: specs/005-markdown-reader/spec.md User Story 3 + User Story 6
 * Reference: specs/005-markdown-reader/research.md Section 3
 */

/**
 * Mermaid theme variable configuration for diagram styling
 */
export interface MermaidThemeVariables {
  primaryColor?: string;
  primaryTextColor?: string;
  primaryBorderColor?: string;
  lineColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  background?: string;
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  mainBkg?: string;
  nodeBorder?: string;
  clusterBkg?: string;
  clusterBorder?: string;
  titleColor?: string;
  edgeLabelBackground?: string;
}

/**
 * Complete Mermaid initialization configuration
 */
export interface MermaidThemeConfig {
  theme: 'dark' | 'neutral' | 'base' | 'default' | 'forest';
  themeVariables?: MermaidThemeVariables;
  startOnLoad: boolean;
  securityLevel: 'strict' | 'loose' | 'antiscript' | 'sandbox';
}

/**
 * Mermaid theme identifiers for each display mode
 */
export const MERMAID_THEMES = {
  dark: 'dark',
  light: 'neutral',
  reading: 'base',
} as const;

/** Mermaid theme for dark app theme */
export const DARK_MERMAID_THEME = 'dark' as const;

/** Mermaid theme for light app theme */
export const LIGHT_MERMAID_THEME = 'neutral' as const;

/** Mermaid theme for reading display mode */
export const READING_MERMAID_THEME = 'base' as const;

/** Default Mermaid theme when no preference specified */
export const DEFAULT_MERMAID_THEME = DARK_MERMAID_THEME;

/**
 * Theme variables for dark mode diagrams
 * Optimized for dark backgrounds with good contrast
 */
const darkThemeVariables: MermaidThemeVariables = {
  primaryColor: '#818CF8', // Indigo-400
  primaryTextColor: '#F3F4F6', // Gray-100
  primaryBorderColor: '#6366F1', // Indigo-500
  lineColor: '#9CA3AF', // Gray-400
  secondaryColor: '#312E81', // Indigo-900
  tertiaryColor: '#1F2937', // Gray-800
  background: '#111827', // Gray-900
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  textColor: '#F3F4F6',
  mainBkg: '#1F2937',
  nodeBorder: '#6366F1',
  clusterBkg: '#1E1B4B',
  clusterBorder: '#4338CA',
  titleColor: '#F3F4F6',
  edgeLabelBackground: '#374151',
};

/**
 * Theme variables for light mode diagrams
 * Optimized for light backgrounds with clear contrast
 */
const lightThemeVariables: MermaidThemeVariables = {
  primaryColor: '#4F46E5', // Indigo-600
  primaryTextColor: '#1F2937', // Gray-800
  primaryBorderColor: '#6366F1', // Indigo-500
  lineColor: '#6B7280', // Gray-500
  secondaryColor: '#E0E7FF', // Indigo-100
  tertiaryColor: '#F3F4F6', // Gray-100
  background: '#FFFFFF',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  textColor: '#1F2937',
  mainBkg: '#F9FAFB',
  nodeBorder: '#6366F1',
  clusterBkg: '#EEF2FF',
  clusterBorder: '#A5B4FC',
  titleColor: '#111827',
  edgeLabelBackground: '#F3F4F6',
};

/**
 * Theme variables for reading mode diagrams
 * Clean, neutral styling for distraction-free reading
 */
const readingThemeVariables: MermaidThemeVariables = {
  primaryColor: '#6B7280', // Gray-500
  primaryTextColor: '#374151', // Gray-700
  primaryBorderColor: '#9CA3AF', // Gray-400
  lineColor: '#9CA3AF', // Gray-400
  secondaryColor: '#E5E7EB', // Gray-200
  tertiaryColor: '#F9FAFB', // Gray-50
  background: '#FFFFFF',
  fontFamily: 'ui-serif, Georgia, serif',
  textColor: '#374151',
  mainBkg: '#FAFAFA',
  nodeBorder: '#D1D5DB',
  clusterBkg: '#F3F4F6',
  clusterBorder: '#E5E7EB',
  titleColor: '#1F2937',
  edgeLabelBackground: '#F9FAFB',
};

/**
 * Map app theme to Mermaid theme identifier
 *
 * @param appTheme - Application theme ('dark', 'light', 'reading', or 'themed')
 * @returns Mermaid theme identifier
 */
export function getMermaidTheme(
  appTheme: 'dark' | 'light' | 'reading' | string | undefined | null
): 'dark' | 'neutral' | 'base' {
  if (!appTheme) {
    return DEFAULT_MERMAID_THEME;
  }

  switch (appTheme) {
    case 'dark':
    case 'themed': // themed mode follows app dark theme by default
      return 'dark';
    case 'light':
      return 'neutral';
    case 'reading':
      return 'base';
    default:
      return DEFAULT_MERMAID_THEME;
  }
}

/**
 * Get complete Mermaid configuration for a given theme
 *
 * @param appTheme - Application theme ('dark', 'light', 'reading')
 * @returns Complete Mermaid configuration object
 */
export function getMermaidThemeConfig(
  appTheme: 'dark' | 'light' | 'reading' | string | undefined | null
): MermaidThemeConfig {
  const theme = getMermaidTheme(appTheme);

  let themeVariables: MermaidThemeVariables;
  switch (theme) {
    case 'dark':
      themeVariables = { ...darkThemeVariables };
      break;
    case 'neutral':
      themeVariables = { ...lightThemeVariables };
      break;
    case 'base':
      themeVariables = { ...readingThemeVariables };
      break;
    default:
      themeVariables = { ...darkThemeVariables };
  }

  return {
    theme,
    themeVariables,
    startOnLoad: false,
    securityLevel: 'strict',
  };
}
