/**
 * Dark Theme Configuration (Cemdash Palette)
 *
 * Defines the complete color palette, shadows, and radius tokens for the dark theme.
 * Uses the Cemdash "Abyss" dark palette with vibrant neon accents for charts
 * and glow effects for accent elements.
 *
 * Key differences from light theme:
 * - Deep black backgrounds (#050505 base) for high contrast
 * - Brighter semantic colors for visibility on dark surfaces
 * - Neon chart palette for maximum visual impact
 * - Glow shadows instead of drop shadows for depth
 *
 * @module lib/theme/themes/dark
 */

import type { ThemeConfig } from '../types';

export const darkTheme: ThemeConfig = {
  name: 'dark',
  label: 'Dark',
  colors: {
    bg: {
      page: '#050505',
      primary: '#0A0A0A',
      secondary: '#111111',
      tertiary: '#1A1A1A',
      hover: '#222222',
      active: '#2A2A2A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CCCCCC',
      tertiary: '#888888',
      muted: '#666666',
      inverse: '#101828',
    },
    accent: {
      coral: '#F97066',
      coralHover: '#FF8A80',
      mint: '#12B76A',
      mintHover: '#4ADE80',
      teal: '#14B8A6',
      cyan: '#22D3EE',
    },
    semantic: {
      positive: '#4ADE80', // Brighter green for dark backgrounds
      negative: '#F97066',
      warning: '#FBBF24', // Brighter amber for dark backgrounds
      info: '#60A5FA', // Brighter blue for dark backgrounds
    },
    border: {
      subtle: '#222222',
      default: '#333333',
      emphasis: '#444444',
    },
    // Neon palette for maximum visual impact on dark backgrounds
    chart: [
      '#FF4444', // Neon Red - Expenses
      '#00FF7F', // Neon Green - Income
      '#1E90FF', // Neon Blue
      '#FFD700', // Neon Yellow
      '#9370DB', // Neon Purple
      '#FF00FF', // Neon Magenta
      '#00CED1', // Neon Teal
      '#FF8C00', // Neon Orange
      '#00FFFF', // Neon Cyan
      '#ADFF2F', // Neon Lime
    ],
    // Category colors remain consistent for recognition
    category: {
      charity: '#60A5FA',
      daily: '#34D399',
      dining: '#FBBF24',
      entertainment: '#F97066',
      gifts: '#A78BFA',
      groceries: '#4ADE80',
      healthcare: '#FB7185',
      financing: '#38BDF8',
      shopping: '#C084FC',
      subscriptions: '#2DD4BF',
      transportation: '#FB923C',
      travel: '#FACC15',
      utilities: '#818CF8',
    },
    // Brighter account colors for dark theme visibility
    account: {
      jointChecking: '#4ADE80',
      jointSavings: '#22D3EE',
      user1Checking: '#FBBF24',
      user1Savings: '#FB923C',
      user2Checking: '#A78BFA',
      user2Savings: '#F472B6',
    },
  },
  shadows: {
    // Deeper shadows for dark theme
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.6)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.8)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
    // Glow effects unique to dark theme
    glow: {
      coral: '0 0 20px rgba(249, 112, 102, 0.4)',
      mint: '0 0 20px rgba(18, 183, 106, 0.4)',
      teal: '0 0 20px rgba(20, 184, 166, 0.4)',
      cyan: '0 0 20px rgba(34, 211, 238, 0.4)',
      white: '0 0 15px rgba(255, 255, 255, 0.2)',
    },
  },
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },
};
