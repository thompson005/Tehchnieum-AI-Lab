import React from 'react';
import { useTheme } from '../context/ThemeContext';

const PORTAL_URL = `http://${window.location.hostname}:5555`;

export default function NavBar({ user, sessionTimeout, onLogout }) {
  const { isDark, toggleTheme } = useTheme();

  const s = {
    nav: {
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: '3.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    left: { display: 'flex', alignItems: 'center', gap: '1rem' },
    brandWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    brandIcon: {
      width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem',
      background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, color: '#000', fontSize: '0.75rem',
    },
    brandText: {
      fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.12em',
      background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    divider: { color: 'var(--border-solid)', margin: '0 0.25rem' },
    labLabel: { color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' },
    navLinks: { display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' },
    navLink: {
      color: 'var(--text-muted)', fontSize: '0.75rem',
      fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
      letterSpacing: '0.06em', padding: '0.3rem 0.65rem',
      borderRadius: '0.25rem', textDecoration: 'none',
      transition: 'color 0.15s, background 0.15s',
    },
    right: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    flagBtn: {
      fontSize: '0.7rem', color: '#FF6A00', textDecoration: 'none',
      border: '1px solid rgba(255,106,0,0.3)', borderRadius: '0.375rem',
      padding: '0.3rem 0.65rem', background: 'rgba(255,106,0,0.06)',
      fontFamily: 'JetBrains Mono, monospace',
    },
    sessionBadge: {
      fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace',
      color: 'var(--text-muted)', border: '1px solid var(--border)',
      borderRadius: '0.375rem', padding: '0.25rem 0.5rem',
      background: 'var(--surface-low)',
    },
    userLabel: { color: 'var(--text)', fontSize: '0.8rem', fontWeight: 500 },
    themeBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: 'var(--text-muted)', fontSize: '1.1rem',
      padding: '0.3rem', borderRadius: '0.375rem',
      transition: 'color 0.15s',
      lineHeight: 1,
    },
    logoutBtn: {
      background: 'none', border: '1px solid var(--border)',
      color: 'var(--text-muted)', padding: '0.3rem 0.75rem',
      borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem',
      fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase',
      letterSpacing: '0.04em', transition: 'all 0.2s',
    },
  };

  return (
    <nav style={s.nav}>
      <div style={s.left}>
        <div style={s.brandWrap}>
          <div style={s.brandIcon}>T</div>
          <span style={s.brandText}>TECHNIEUM AI SECURITY LABS</span>
        </div>
        <span style={s.divider}>|</span>
        <span style={s.labLabel}>SecureBank AI — LAB-2</span>
        <div style={s.navLinks}>
          <a href="#" style={s.navLink}
            onMouseOver={e => { e.currentTarget.style.color = '#FF6A00'; e.currentTarget.style.background = 'rgba(255,106,0,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            Dashboard
          </a>
          <a href="{PORTAL_URL}" style={s.navLink}
            onMouseOver={e => { e.currentTarget.style.color = '#FF6A00'; e.currentTarget.style.background = 'rgba(255,106,0,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            Scoreboard
          </a>
        </div>
      </div>
      <div style={s.right}>
        <a href="{PORTAL_URL}" style={s.flagBtn}>Submit Flag</a>
        <span style={s.sessionBadge}>Session: {sessionTimeout}m</span>
        {user && <span style={s.userLabel}>{user.full_name || user.username}</span>}
        <button
          style={s.themeBtn}
          onClick={toggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onMouseOver={e => e.currentTarget.style.color = '#FF6A00'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {isDark ? '☀' : '🌙'}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            style={s.logoutBtn}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
