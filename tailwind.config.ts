import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors with shades
        coral: {
          DEFAULT: '#F97066',
          500: '#F97066',
          600: '#DC4A40',
          light: '#FD8A7C',
        },
        mint: {
          DEFAULT: '#12B76A',
          500: '#12B76A',
          600: '#0E9A57',
          light: '#3DD68D',
        },
        teal: {
          DEFAULT: '#0D9488',
          500: '#0D9488',
          600: '#0A7B71',
          light: '#14B8A6',
        },

        // Neutral Colors
        'near-black': '#101828',
        'dark-gray': '#344054',
        'medium-gray': '#667085',
        'light-gray': '#D0D5DD',
        'off-white': '#F2F4F7',

        // Extended Chart Colors
        'chart-pink': '#FDA4AF',
        'chart-purple': '#C4B5FD',
        'chart-teal': '#5EEAD4',
        'chart-blue': '#60A5FA',
        'chart-orange': '#FDBA74',
        'chart-yellow': '#FCD34D',
        'chart-indigo': '#818CF8',
        'dark-slate': '#1E293B',

        // Semantic Colors for data visualization
        positive: '#12B76A',
        neutral: '#60A5FA',
        negative: '#F97066',
        warning: '#FDBA74',
        info: '#818CF8',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        '4.5': '1.125rem',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}

export default config
