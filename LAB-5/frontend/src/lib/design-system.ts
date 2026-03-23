export const COLORS = {
  dark: {
    background: '#0B0B0D',
    surface: '#111217',
    surfaceLow: '#181A20',
    surfaceHigh: '#1F222A',
    surfaceLowest: '#0d0e13',
    primary: '#FF6A00',
    secondary: '#FFC107',
    text: '#E3E1E9',
    textMuted: '#71717A',
    border: 'rgba(63, 63, 70, 0.3)',
  },
  light: {
    background: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceLow: '#F9FAFB',
    surfaceHigh: '#F3F4F6',
    surfaceLowest: '#E5E7EB',
    primary: '#FF6A00',
    secondary: '#D97706',
    text: '#111827',
    textMuted: '#6B7280',
    border: '#E5E7EB',
  },
} as const;

export const GRADIENTS = {
  ignition: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
  cyberGrid: `
    linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)
  `.trim(),
} as const;

export const FONTS = {
  ui: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin: { label: 'ADMIN', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  supervisor: { label: 'SUPERVISOR', color: '#fb923c', bg: 'rgba(234,88,12,0.12)', border: 'rgba(234,88,12,0.25)' },
  clerk: { label: 'CLERK', color: '#fbbf24', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.25)' },
  citizen: { label: 'CITIZEN', color: '#4ade80', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.25)' },
};
