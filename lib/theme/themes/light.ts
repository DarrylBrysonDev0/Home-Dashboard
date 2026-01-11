/**
 * Light Theme Configuration
 *
 * Defines the complete color palette, shadows, and radius tokens for the light theme.
 * Values align with the Cemdash design system for professional financial dashboards.
 *
 * @module lib/theme/themes/light
 */

import type { ThemeConfig } from '../types';

export const lightTheme: ThemeConfig = {
  name: 'light',
  label: 'Light',
  colors: {
    bg: {
      page: '#F2F4F7',
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F2F4F7',
      hover: '#E5E7EB',
      active: '#D1D5DB',
    },
    text: {
      primary: '#101828',
      secondary: '#344054',
      tertiary: '#667085',
      muted: '#9CA3AF',
      inverse: '#FFFFFF',
    },
    accent: {
      coral: '#F97066',
      coralHover: '#EF4444',
      mint: '#12B76A',
      mintHover: '#059669',
      teal: '#14B8A6',
      cyan: '#22D3EE',
    },
    semantic: {
      positive: '#12B76A',
      negative: '#F97066',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    border: {
      subtle: '#E5E7EB',
      default: '#D0D5DD',
      emphasis: '#9CA3AF',
    },
    chart: [
      '#F97066', // Coral - Expenses
      '#12B76A', // Mint - Income
      '#3B82F6', // Blue
      '#F59E0B', // Amber
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#14B8A6', // Teal
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
    ],
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
    account: {
      jointChecking: '#12B76A',
      jointSavings: '#14B8A6',
      user1Checking: '#F59E0B',
      user1Savings: '#F97316',
      user2Checking: '#8B5CF6',
      user2Savings: '#EC4899',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
    glow: {
      coral: 'none',
      mint: 'none',
      teal: 'none',
      cyan: 'none',
      white: 'none',
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
