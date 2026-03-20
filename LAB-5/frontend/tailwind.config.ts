import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gov-gradient': 'linear-gradient(135deg, #0a1628 0%, #162035 50%, #0a1628 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
