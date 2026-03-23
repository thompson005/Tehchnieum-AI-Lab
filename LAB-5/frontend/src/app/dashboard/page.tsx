'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUserFromToken, isAuthenticated } from '@/lib/auth';
import { NavBar } from '@/components/NavBar';
import { useTheme } from '@/components/ThemeProvider';

interface ServiceTile {
  title: string;
  description: string;
  icon: string;
  href: string;
  minRole?: string;
  color: string;
  accentColor: string;
}

const SERVICE_TILES: ServiceTile[] = [
  { title: 'Citizen Records', description: 'View and manage citizen profiles, personal details, and account status.', icon: '👤', href: '/chat?context=citizen_records', color: '#FF6A00', accentColor: 'rgba(255,106,0,0.12)' },
  { title: 'DMV Services', description: 'Vehicle registration, plate lookup, and traffic violation history.', icon: '🚗', href: '/chat?context=dmv', color: '#FFC107', accentColor: 'rgba(255,193,7,0.12)' },
  { title: 'Tax Authority', description: 'Tax filings, refund status, audit flags, and penalty management.', icon: '💼', href: '/chat?context=tax', color: '#60a5fa', accentColor: 'rgba(96,165,250,0.12)' },
  { title: 'Permit Office', description: 'Submit, track, and manage construction and renovation permits.', icon: '📋', href: '/chat?context=permit', color: '#4ade80', accentColor: 'rgba(74,222,128,0.12)' },
  { title: 'Health Registry', description: 'Vaccination records, health status, and communicable disease monitoring.', icon: '🏥', href: '/chat?context=health', color: '#a78bfa', accentColor: 'rgba(167,139,250,0.12)' },
  { title: 'Internal Documents', description: 'Access classified memos, policy documents, and internal reports.', icon: '🔒', href: '/chat?context=docs', minRole: 'clerk', color: '#f87171', accentColor: 'rgba(248,113,113,0.12)' },
  { title: 'Notifications', description: 'Send SMS and email notifications to citizens.', icon: '📬', href: '/chat?context=notify', color: '#e879f9', accentColor: 'rgba(232,121,249,0.12)' },
  { title: 'File Storage', description: 'Access and manage government file storage system.', icon: '📁', href: '/chat?context=files', color: '#fb923c', accentColor: 'rgba(251,146,60,0.12)' },
];

const MCP_SERVERS = [
  { name: 'citizen-records-mcp', port: 8110 },
  { name: 'dmv-mcp', port: 8111 },
  { name: 'tax-authority-mcp', port: 8112 },
  { name: 'permit-office-mcp', port: 8113 },
  { name: 'health-registry-mcp', port: 8114 },
  { name: 'internal-docs-mcp', port: 8115 },
  { name: 'notification-mcp', port: 8116 },
  { name: 'filesystem-mcp', port: 8117 },
  { name: 'civic-feedback-mcp', port: 8118 },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin: { label: 'ADMIN', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  supervisor: { label: 'SUPERVISOR', color: '#fb923c', bg: 'rgba(234,88,12,0.12)', border: 'rgba(234,88,12,0.25)' },
  clerk: { label: 'CLERK', color: '#fbbf24', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.25)' },
  citizen: { label: 'CITIZEN', color: '#4ade80', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.25)' },
};

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [user, setUser] = useState<{ username: string; role: string; sub: string } | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [hoveredTile, setHoveredTile] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }
    const token = getToken();
    if (token) {
      const userData = getUserFromToken(token);
      setUser(userData);
    }
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Theme-aware style tokens
  const bg = isDark ? '#0B0B0D' : '#F3F4F6';
  const surface = isDark ? '#111217' : '#FFFFFF';
  const surfaceLow = isDark ? '#181A20' : '#F9FAFB';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const textPrimary = isDark ? '#E3E1E9' : '#111827';
  const textMuted = isDark ? '#71717a' : '#6B7280';
  const textDim = isDark ? '#52525b' : '#9CA3AF';

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: isDark ? '#0B0B0D' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '2px solid rgba(255,106,0,0.2)',
              borderTopColor: '#FF6A00',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b' }}>
            AUTHENTICATING...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const rc = ROLE_CONFIG[user.role] || { label: user.role.toUpperCase(), color: '#71717a', bg: 'rgba(113,113,122,0.12)', border: 'rgba(113,113,122,0.25)' };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bg,
        backgroundImage: isDark
          ? 'linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <NavBar username={user.username} role={user.role} />

      {/* Fixed Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: '64px',
          width: '240px',
          height: 'calc(100vh - 64px)',
          backgroundColor: isDark ? '#0B0B0D' : '#FFFFFF',
          borderRight: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          zIndex: 40,
        }}
      >
        {/* Section label */}
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', color: '#FF6A00' }}>⚡</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: isDark ? '#E3E1E9' : '#111827',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '-0.01em',
              }}
            >
              COMMAND DECK
            </span>
          </div>
          <p
            style={{
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              color: textDim,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Active Session
          </p>
        </div>

        <nav style={{ flex: 1, padding: '0 10px' }}>
          {[
            { icon: '🏛', label: 'Dashboard', active: true, href: '/dashboard' },
            { icon: '🤖', label: 'AI Chat', active: false, href: '/chat' },
            { icon: '🔧', label: 'MCP Debug', active: false, href: '/mcp-debug' },
            { icon: '🔐', label: 'Admin', active: false, href: '/admin' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                width: '100%',
                border: 'none',
                background: item.active ? 'rgba(255,106,0,0.1)' : 'transparent',
                borderRight: item.active ? '2px solid #FF6A00' : '2px solid transparent',
                color: item.active ? '#FF6A00' : textMuted,
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'left',
                borderRadius: '2px',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '13px' }}>{item.icon}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ padding: '0 14px', marginTop: 'auto' }}>
          <button
            onClick={() => router.push('/chat')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
              color: '#000',
              border: 'none',
              padding: '10px',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            New Instance
          </button>
          <button
            onClick={() => { localStorage.removeItem('govconnect_token'); router.push('/'); }}
            style={{
              width: '100%',
              background: 'none',
              border: `1px solid ${borderColor}`,
              color: textDim,
              padding: '8px',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = textDim; e.currentTarget.style.borderColor = borderColor; }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', paddingTop: '64px', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>

          {/* Welcome banner */}
          <div
            style={{
              backgroundColor: surface,
              border: `1px solid ${borderColor}`,
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}
          >
            <div style={{ height: '3px', background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)' }} />
            <div
              style={{
                padding: '20px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '6px',
                  }}
                >
                  <h1
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: textPrimary,
                      margin: 0,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Welcome back,{' '}
                    <span style={{ color: '#FF6A00' }}>{user.username}</span>
                  </h1>
                  <span
                    style={{
                      fontSize: '9px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700',
                      padding: '3px 8px',
                      backgroundColor: rc.bg,
                      color: rc.color,
                      border: `1px solid ${rc.border}`,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {rc.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: textDim,
                    margin: 0,
                    letterSpacing: '0.04em',
                  }}
                >
                  City of Neo Meridian — GovConnect AI Citizen Services Portal
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '9px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: textDim,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  Session Time
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: textMuted,
                  }}
                >
                  {currentTime}
                </div>
              </div>
            </div>
          </div>

          {/* Primary action buttons */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
            <button
              onClick={() => router.push('/chat')}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '18px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontSize: '20px' }}>🤖</span>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Start AI Chat
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: 0.7,
                    marginTop: '2px',
                  }}
                >
                  Ask the GovConnect AI assistant about city services
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push('/mcp-debug')}
              style={{
                flex: 1,
                backgroundColor: surface,
                color: '#FF6A00',
                border: `1px solid ${isDark ? 'rgba(255,106,0,0.35)' : '#FCA572'}`,
                borderRadius: '6px',
                padding: '18px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#FF6A00';
                e.currentTarget.style.backgroundColor = 'rgba(255,106,0,0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = isDark ? 'rgba(255,106,0,0.35)' : '#FCA572';
                e.currentTarget.style.backgroundColor = surface;
              }}
            >
              <span style={{ fontSize: '20px' }}>🔧</span>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  MCP Debug Console
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: textDim,
                    marginTop: '2px',
                  }}
                >
                  Inspect MCP tools, audit logs, and direct invocations
                </div>
              </div>
            </button>
          </div>

          {/* Services grid */}
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '9px',
                fontFamily: "'JetBrains Mono', monospace",
                color: textDim,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              // Available Services
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '12px',
              }}
            >
              {SERVICE_TILES.map((tile) => (
                <div
                  key={tile.title}
                  onClick={() => router.push(tile.href)}
                  onMouseOver={() => setHoveredTile(tile.title)}
                  onMouseOut={() => setHoveredTile(null)}
                  style={{
                    backgroundColor: hoveredTile === tile.title ? surfaceLow : surface,
                    border: `1px solid ${hoveredTile === tile.title ? `${tile.color}40` : borderColor}`,
                    borderLeft: `3px solid ${tile.color}`,
                    borderRadius: '6px',
                    padding: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                  }}
                >
                  {tile.minRole && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        color: '#f87171',
                        fontSize: '8px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: '700',
                        padding: '2px 6px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {tile.minRole.toUpperCase()}+
                    </span>
                  )}
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '7px',
                      backgroundColor: tile.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      border: `1px solid ${tile.color}20`,
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{tile.icon}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: textPrimary,
                      marginBottom: '5px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {tile.title}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: textMuted,
                      lineHeight: 1.5,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {tile.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MCP Server Status */}
          <div
            style={{
              backgroundColor: surface,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#181A20' : '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: textDim,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                // MCP Server Status
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#4ade80',
                  letterSpacing: '0.06em',
                }}
              >
                ALL ONLINE
              </span>
            </div>
            <div
              style={{
                padding: '14px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}
            >
              {MCP_SERVERS.map((server) => (
                <div key={server.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      backgroundColor: '#4ade80',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      color: textDim,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                    }}
                  >
                    {server.name}
                  </span>
                  <span
                    style={{
                      color: isDark ? '#3f3f46' : '#D1D5DB',
                      marginLeft: 'auto',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                    }}
                  >
                    :{server.port}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
