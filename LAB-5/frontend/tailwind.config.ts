import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // TECHNIEUM dark tokens
        'tech-bg': '#0B0B0D',
        'tech-surface': '#111217',
        'tech-surface-low': '#181A20',
        'tech-surface-high': '#1F222A',
        'tech-surface-lowest': '#0d0e13',
        'tech-primary': '#FF6A00',
        'tech-secondary': '#FFC107',
        'tech-text': '#E3E1E9',
        'tech-muted': '#71717A',
        // Legacy aliases kept for backward compat
        'gov-navy': '#0a1628',
        'gov-navy-light': '#0f2040',
        'gov-navy-mid': '#162035',
        'gov-blue': '#1e90ff',
        'gov-blue-dark': '#1565c0',
        'gov-accent': '#00d4ff',
        'gov-border': '#1e3a5f',
        'gov-muted': '#4a7fa5',
        'gov-success': '#00c853',
        'gov-warning': '#ffd600',
        'gov-danger': '#ff1744',
      },
      backgroundImage: {
        'ignition': 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
        'cyber-grid': `
          linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        headline: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
