'use client';

import Link from 'next/link';
import { useTheme } from './ThemeProvider';

interface NavBarProps {
  username?: string;
  role?: string;
}

const ROLE_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  admin: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  supervisor: { color: '#fb923c', bg: 'rgba(234,88,12,0.12)', border: 'rgba(234,88,12,0.25)' },
  clerk: { color: '#fbbf24', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.25)' },
  citizen: { color: '#4ade80', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.25)' },
};

export function NavBar({ username, role }: NavBarProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const rc = role ? (ROLE_STYLES[role] || { color: '#71717a', bg: 'rgba(113,113,122,0.12)', border: 'rgba(113,113,122,0.25)' }) : null;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '64px',
        backgroundColor: isDark ? '#111217' : '#FFFFFF',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
    >
      {/* Left: Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '900',
              color: '#FF6A00',
              letterSpacing: '-0.02em',
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
            }}
          >
            TECHNIEUM AI SECURITY LABS
          </span>
        </Link>
        <span
          style={{
            fontSize: '9px',
            fontFamily: "'JetBrains Mono', monospace",
            color: isDark ? '#3f3f46' : '#9CA3AF',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          // LAB-5 // GovConnect AI
        </span>
      </div>

      {/* Center: Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'AI Chat', href: '/chat' },
          { label: 'MCP Debug', href: '/mcp-debug' },
          { label: 'Admin', href: '/admin' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: isDark ? '#71717a' : '#6B7280',
              textDecoration: 'none',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#FF6A00')}
            onMouseOut={(e) => ((e.target as HTMLElement).style.color = isDark ? '#71717a' : '#6B7280')}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right: User info + theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            background: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
            borderRadius: '6px',
            padding: '5px 8px',
            cursor: 'pointer',
            color: isDark ? '#71717a' : '#6B7280',
            fontSize: '16px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF6A00';
            (e.currentTarget as HTMLButtonElement).style.color = '#FF6A00';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
            (e.currentTarget as HTMLButtonElement).style.color = isDark ? '#71717a' : '#6B7280';
          }}
        >
          {isDark ? '☀' : '☽'}
        </button>

        {/* Role badge */}
        {rc && role && (
          <span
            style={{
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700',
              color: rc.color,
              padding: '3px 8px',
              backgroundColor: rc.bg,
              border: `1px solid ${rc.border}`,
              letterSpacing: '0.08em',
            }}
          >
            {role.toUpperCase()}
          </span>
        )}

        {/* Username */}
        {username && (
          <span
            style={{
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              color: isDark ? '#71717a' : '#6B7280',
            }}
          >
            // {username}
          </span>
        )}

        {/* Systems online indicator */}
        {!username && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              color: '#4ade80',
              backgroundColor: isDark ? 'rgba(74,222,128,0.08)' : '#F0FDF4',
              border: `1px solid ${isDark ? 'rgba(74,222,128,0.2)' : '#BBF7D0'}`,
              padding: '3px 10px',
              letterSpacing: '0.06em',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                display: 'inline-block',
              }}
            />
            SYSTEMS ONLINE
          </div>
        )}
      </div>
    </header>
  );
}
