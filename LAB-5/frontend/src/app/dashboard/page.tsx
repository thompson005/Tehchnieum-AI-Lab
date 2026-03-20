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
}

const SERVICE_TILES: ServiceTile[] = [
  { title: 'Citizen Records', description: 'View and manage citizen profiles, personal details, and account status.', icon: '👤', href: '/chat?context=citizen_records', color: '#1D4ED8' },
  { title: 'DMV Services', description: 'Vehicle registration, plate lookup, and traffic violation history.', icon: '🚗', href: '/chat?context=dmv', color: '#0891B2' },
  { title: 'Tax Authority', description: 'Tax filings, refund status, audit flags, and penalty management.', icon: '💼', href: '/chat?context=tax', color: '#0D9488' },
  { title: 'Permit Office', description: 'Submit, track, and manage construction and renovation permits.', icon: '📋', href: '/chat?context=permit', color: '#16A34A' },
  { title: 'Health Registry', description: 'Vaccination records, health status, and communicable disease monitoring.', icon: '🏥', href: '/chat?context=health', color: '#2563EB' },
  { title: 'Internal Documents', description: 'Access classified memos, policy documents, and internal reports.', icon: '🔒', href: '/chat?context=docs', minRole: 'clerk', color: '#DC2626' },
  { title: 'Notifications', description: 'Send SMS and email notifications to citizens.', icon: '📬', href: '/chat?context=notify', color: '#7C3AED' },
  { title: 'File Storage', description: 'Access and manage government file storage system.', icon: '📁', href: '/chat?context=files', color: '#EA580C' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string; sub: string } | null>(null);
  const [currentTime, setCurrentTime] = useState('');

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
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: '#DC2626',
    supervisor: '#EA580C',
    clerk: '#D97706',
    citizen: '#16A34A',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Welcome banner */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px 32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>Welcome back, {user.username}</h1>
              <span style={{ backgroundColor: roleColors[user.role] || '#6B7280', color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                {user.role}
              </span>
            </div>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>City of Neo Meridian — GovConnect AI Citizen Services Portal</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Last Login</div>
            <div style={{ fontSize: '13px', color: '#374151', fontFamily: 'monospace' }}>{currentTime}</div>
          </div>
        </div>

        {/* Primary action buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={() => router.push('/chat')}
            style={{ flex: 1, background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', color: 'white', border: 'none', borderRadius: '10px', padding: '20px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <div style={{ textAlign: 'left' }}>
              <div>Start AI Chat</div>
              <div style={{ fontSize: '12px', fontWeight: '400', opacity: 0.85 }}>Ask the GovConnect AI assistant about city services</div>
            </div>
          </button>
          <button
            onClick={() => router.push('/mcp-debug')}
            style={{ flex: 1, background: '#FFFFFF', color: '#FF6B00', border: '2px solid #FF6B00', borderRadius: '10px', padding: '20px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔧</span>
            <div style={{ textAlign: 'left' }}>
              <div>MCP Debug Console</div>
              <div style={{ fontSize: '12px', fontWeight: '400', opacity: 0.7 }}>Inspect MCP tools, audit logs, and direct invocations</div>
            </div>
          </button>
        </div>

        {/* Services grid */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280', marginBottom: '16px', letterSpacing: '0.05em' }}>AVAILABLE SERVICES</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {SERVICE_TILES.map((tile) => (
              <div
                key={tile.title}
                onClick={() => router.push(tile.href)}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderLeft: `3px solid ${tile.color}`, borderRadius: '10px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {tile.minRole && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                    {tile.minRole.toUpperCase()}+
                  </span>
                )}
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{tile.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>{tile.title}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{tile.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System status panel */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', marginBottom: '16px', letterSpacing: '0.06em' }}>MCP SERVER STATUS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { name: 'citizen-records-mcp', port: 8110 },
              { name: 'dmv-mcp', port: 8111 },
              { name: 'tax-authority-mcp', port: 8112 },
              { name: 'permit-office-mcp', port: 8113 },
              { name: 'health-registry-mcp', port: 8114 },
              { name: 'internal-docs-mcp', port: 8115 },
              { name: 'notification-mcp', port: 8116 },
              { name: 'filesystem-mcp', port: 8117 },
              { name: 'civic-feedback-mcp', port: 8118 },
            ].map((server) => (
              <div key={server.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A', flexShrink: 0 }} />
                <span style={{ color: '#374151', fontFamily: 'monospace' }}>{server.name}</span>
                <span style={{ color: '#D1D5DB', marginLeft: 'auto' }}>:{server.port}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
