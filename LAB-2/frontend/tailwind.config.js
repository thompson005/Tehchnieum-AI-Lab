/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bank-navy':   '#FF6B00',
        'bank-gold':   '#FFB800',
        'tech-yellow': '#FFB800',
        'tech-orange': '#FF6B00',
        'tech-black':  '#111827',
        'tech-surface':'#F9FAFB',
        'tech-card':   '#FFFFFF',
        'tech-border': '#E5E7EB',
        'tech-muted':  '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
