'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUserFromToken, isAuthenticated } from '@/lib/auth';

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
  { title: 'Citizen Records', description: 'View and manage citizen profiles, personal details, and account status.', icon: 'person', href: '/chat?context=citizen_records', color: '#1D4ED8', accentColor: 'rgba(29,78,216,0.15)' },
  { title: 'DMV Services', description: 'Vehicle registration, plate lookup, and traffic violation history.', icon: 'directions_car', href: '/chat?context=dmv', color: '#0891B2', accentColor: 'rgba(8,145,178,0.15)' },
  { title: 'Tax Authority', description: 'Tax filings, refund status, audit flags, and penalty management.', icon: 'business_center', href: '/chat?context=tax', color: '#0D9488', accentColor: 'rgba(13,148,136,0.15)' },
  { title: 'Permit Office', description: 'Submit, track, and manage construction and renovation permits.', icon: 'assignment', href: '/chat?context=permit', color: '#16A34A', accentColor: 'rgba(22,163,74,0.15)' },
  { title: 'Health Registry', description: 'Vaccination records, health status, and communicable disease monitoring.', icon: 'local_hospital', href: '/chat?context=health', color: '#2563EB', accentColor: 'rgba(37,99,235,0.15)' },
  { title: 'Internal Documents', description: 'Access classified memos, policy documents, and internal reports.', icon: 'lock', href: '/chat?context=docs', minRole: 'clerk', color: '#DC2626', accentColor: 'rgba(220,38,38,0.15)' },
  { title: 'Notifications', description: 'Send SMS and email notifications to citizens.', icon: 'mail', href: '/chat?context=notify', color: '#7C3AED', accentColor: 'rgba(124,58,237,0.15)' },
  { title: 'File Storage', description: 'Access and manage government file storage system.', icon: 'folder', href: '/chat?context=files', color: '#EA580C', accentColor: 'rgba(234,88,12,0.15)' },
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

const roleConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin: { label: 'ADMIN', color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  supervisor: { label: 'SUPERVISOR', color: '#fb923c', bg: 'rgba(234,88,12,0.12)', border: 'rgba(234,88,12,0.25)' },
  clerk: { label: 'CLERK', color: '#fbbf24', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.25)' },
  citizen: { label: 'CITIZEN', color: '#4ade80', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.25)' },
};

export default function DashboardPage() {
  const router = useRouter();
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

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0B0B0D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '16px', height: '16px', borderRadius: '50%',
            border: '2px solid rgba(255,106,0,0.2)',
            borderTopColor: '#FF6A00',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b' }}>
            AUTHENTICATING...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const rc = roleConfig[user.role] || { label: user.role.toUpperCase(), color: '#71717a', bg: 'rgba(113,113,122,0.12)', border: 'rgba(113,113,122,0.25)' };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B0B0D',
      backgroundImage: 'linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Fixed Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 50,
        backgroundColor: '#111217',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#FF6A00', letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>
            TECHNIEUM AI SECURITY LABS
          </span>
          <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            // LAB-5 // GovConnect AI
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
            color: rc.color, padding: '3px 10px',
            backgroundColor: rc.bg, border: `1px solid ${rc.border}`,
            letterSpacing: '0.08em',
          }}>
            {rc.label}
          </span>
          <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a' }}>
            // {user.username}
          </span>
          <button
            onClick={() => { localStorage.removeItem('token'); router.push('/'); }}
            style={{
              fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
              color: '#52525b', background: 'none', border: '1px solid rgba(255,255,255,0.06)',
              padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', left: 0, top: '64px',
        width: '256px', height: 'calc(100vh - 64px)',
        backgroundColor: '#0B0B0D',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column',
        padding: '16px 0', zIndex: 40,
      }}>
        {/* COMMAND DECK */}
        <div style={{ padding: '0 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '14px', color: '#FF6A00' }}>⚡</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#E3E1E9', fontFamily: "'Inter', sans-serif" }}>COMMAND DECK</span>
          </div>
          <p style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Active Session
          </p>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {[
            { icon: '🏛', label: 'Dashboard', active: true, onClick: () => {} },
            { icon: '🤖', label: 'AI Chat', active: false, onClick: () => router.push('/chat') },
            { icon: '🔧', label: 'MCP Debug', active: false, onClick: () => router.push('/mcp-debug') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', width: '100%', border: 'none',
                background: item.active ? 'rgba(255,106,0,0.1)' : 'transparent',
                borderRight: item.active ? '2px solid #FF6A00' : '2px solid transparent',
                color: item.active ? '#FF6A00' : '#71717a',
                cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                borderRadius: '2px',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ padding: '0 16px', marginTop: 'auto' }}>
          <button
            onClick={() => router.push('/chat')}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
              color: '#000', border: 'none', padding: '10px',
              fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
              fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', marginBottom: '12px',
            }}
          >
            New Instance
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '256px', paddingTop: '64px', padding: '64px 0 0 256px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px' }}>

          {/* Welcome banner */}
          <div style={{
            backgroundColor: '#111217',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '28px',
          }}>
            <div style={{ height: '3px', background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)' }} />
            <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#E3E1E9', margin: 0, fontFamily: "'Inter', sans-serif" }}>
                    Welcome back, <span style={{ color: '#FF6A00' }}>{user.username}</span>
                  </h1>
                  <span style={{
                    fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700', padding: '3px 8px',
                    backgroundColor: rc.bg, color: rc.color,
                    border: `1px solid ${rc.border}`,
                    letterSpacing: '0.06em',
                  }}>
                    {rc.label}
                  </span>
                </div>
                <p style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', margin: 0 }}>
                  City of Neo Meridian — GovConnect AI Citizen Services Portal
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Session Time
                </div>
                <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a' }}>
                  {currentTime}
                </div>
              </div>
            </div>
          </div>

          {/* Primary action buttons */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
            <button
              onClick={() => router.push('/chat')}
              style={{
                flex: 1, background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                color: '#000', border: 'none', borderRadius: '6px',
                padding: '18px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <span style={{ fontSize: '22px' }}>🤖</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>Start AI Chat</div>
                <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", opacity: 0.7, marginTop: '2px' }}>
                  Ask the GovConnect AI assistant about city services
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push('/mcp-debug')}
              style={{
                flex: 1, backgroundColor: '#111217', color: '#FF6A00',
                border: '1px solid rgba(255,106,0,0.35)', borderRadius: '6px',
                padding: '18px 24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '12px',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#FF6A00'; e.currentTarget.style.backgroundColor = 'rgba(255,106,0,0.06)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,106,0,0.35)'; e.currentTarget.style.backgroundColor = '#111217'; }}
            >
              <span style={{ fontSize: '22px' }}>🔧</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', fontFamily: "'Inter', sans-serif" }}>MCP Debug Console</div>
                <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', marginTop: '2px' }}>
                  Inspect MCP tools, audit logs, and direct invocations
                </div>
              </div>
            </button>
          </div>

          {/* Services grid */}
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              // Available Services
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {SERVICE_TILES.map((tile) => (
                <div
                  key={tile.title}
                  onClick={() => router.push(tile.href)}
                  onMouseOver={() => setHoveredTile(tile.title)}
                  onMouseOut={() => setHoveredTile(null)}
                  style={{
                    backgroundColor: hoveredTile === tile.title ? '#181A20' : '#111217',
                    border: `1px solid ${hoveredTile === tile.title ? `${tile.color}40` : 'rgba(255,255,255,0.05)'}`,
                    borderLeft: `3px solid ${tile.color}`,
                    borderRadius: '6px', padding: '18px',
                    cursor: 'pointer', position: 'relative',
                    transition: 'all 0.15s',
                  }}
                >
                  {tile.minRole && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      backgroundColor: 'rgba(220,38,38,0.12)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      color: '#f87171',
                      fontSize: '8px', fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700', padding: '2px 6px',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      {tile.minRole.toUpperCase()}+
                    </span>
                  )}
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: tile.accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '12px',
                    border: `1px solid ${tile.color}20`,
                  }}>
                    <span style={{ fontSize: '18px' }}>
                      {tile.href.includes('citizen_records') ? '👤' :
                       tile.href.includes('dmv') ? '🚗' :
                       tile.href.includes('tax') ? '💼' :
                       tile.href.includes('permit') ? '📋' :
                       tile.href.includes('health') ? '🏥' :
                       tile.href.includes('docs') ? '🔒' :
                       tile.href.includes('notify') ? '📬' : '📁'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#E3E1E9', marginBottom: '6px', fontFamily: "'Inter', sans-serif" }}>
                    {tile.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>
                    {tile.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MCP Server Status */}
          <div style={{
            backgroundColor: '#111217',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '8px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              backgroundColor: '#181A20',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                // MCP Server Status
              </span>
              <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#4ade80' }}>
                ALL ONLINE
              </span>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {MCP_SERVERS.map((server) => (
                <div key={server.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#4ade80', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: '#52525b', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{server.name}</span>
                  <span style={{ color: '#3f3f46', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>:{server.port}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
