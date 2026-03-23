'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated, getUserFromToken } from '@/lib/auth';
import { getMyProgress } from '@/lib/api';
import { NavBar } from '@/components/NavBar';
import { useTheme } from '@/components/ThemeProvider';

interface StatCard {
  label: string;
  value: string | number;
  color: string;
}

interface ProgressData {
  total_points: number;
  completed: string[];
  submissions: { flag_id: string; points: number; submitted_at: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#f87171',
  supervisor: '#fb923c',
  clerk: '#fbbf24',
  citizen: '#4ade80',
};

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const stats: StatCard[] = [
    { label: 'Active Sessions', value: 42, color: '#FF6A00' },
    { label: 'Citizens Registered', value: 10, color: '#4ade80' },
    { label: 'MCP Servers', value: 9, color: '#FFC107' },
    { label: 'Flags Available', value: 14, color: '#fb923c' },
    { label: 'Total Points Pool', value: 4400, color: '#a78bfa' },
    { label: 'Audit Log Entries', value: '—', color: '#60a5fa' },
  ];

  const mockSessions = [
    { id: 'sess-a9x2m1', user: 'citizen1', role: 'citizen', started: '2025-03-17 09:12', msgs: 14 },
    { id: 'sess-b3q7r8', user: 'clerk1', role: 'clerk', started: '2025-03-17 09:45', msgs: 7 },
    { id: 'sess-c5t1k4', user: 'admin', role: 'admin', started: '2025-03-17 10:00', msgs: 22 },
    { id: 'sess-d8n9w2', user: 'citizen2', role: 'citizen', started: '2025-03-17 10:30', msgs: 3 },
  ];

  const mockUsers = [
    { username: 'citizen1', role: 'citizen', citizen_id: 'CIT-00001', active: true },
    { username: 'citizen2', role: 'citizen', citizen_id: 'CIT-00002', active: true },
    { username: 'clerk1', role: 'clerk', citizen_id: 'CIT-00008', active: true },
    { username: 'supervisor1', role: 'supervisor', citizen_id: null, active: true },
    { username: 'admin', role: 'admin', citizen_id: null, active: true },
  ];

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    const t = getToken();
    if (t) {
      setUser(getUserFromToken(t));
      loadProgress(t);
    }
  }, [router]);

  const loadProgress = async (t: string) => {
    try {
      const data = await getMyProgress(t);
      setProgress(data);
    } catch { /* silently fail */ }
  };

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

  // Styles derived from theme
  const bg = isDark ? '#0B0B0D' : '#F3F4F6';
  const surface = isDark ? '#111217' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const textPrimary = isDark ? '#E3E1E9' : '#111827';
  const textMuted = isDark ? '#71717a' : '#6B7280';
  const textDim = isDark ? '#52525b' : '#9CA3AF';

  const roleColor = ROLE_COLORS[user.role] || '#71717a';
  const roleBg = isDark ? `rgba(${user.role === 'admin' ? '239,68,68' : user.role === 'supervisor' ? '234,88,12' : user.role === 'clerk' ? '217,119,6' : '22,163,74'},0.12)` : '#FFF7ED';
  const roleBorder = isDark ? `rgba(${user.role === 'admin' ? '239,68,68' : user.role === 'supervisor' ? '234,88,12' : user.role === 'clerk' ? '217,119,6' : '22,163,74'},0.25)` : '#FDBA74';

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

      <div style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: textPrimary,
                    fontFamily: "'Inter', sans-serif",
                    margin: 0,
                  }}
                >
                  Admin Panel
                </h1>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#FF6A00',
                    padding: '3px 8px',
                    backgroundColor: 'rgba(255,106,0,0.1)',
                    border: '1px solid rgba(255,106,0,0.25)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  RESTRICTED
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: textDim,
                  letterSpacing: '0.06em',
                  margin: 0,
                }}
              >
                GovConnect AI Platform Administration
              </p>
            </div>
            <div
              style={{
                backgroundColor: roleBg,
                border: `1px solid ${roleBorder}`,
                borderRadius: '6px',
                padding: '10px 16px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: roleColor,
              }}
            >
              // {user.username} &nbsp;<strong>[{user.role.toUpperCase()}]</strong>
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '28px',
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: surface,
                  border: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${stat.color}`,
                  borderRadius: '8px',
                  padding: '18px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: stat.color,
                    marginBottom: '6px',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: textMuted,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Progress tracker */}
          {progress && (
            <div
              style={{
                backgroundColor: surface,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  height: '3px',
                  background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                }}
              />
              <div style={{ padding: '20px 24px' }}>
                <h2
                  style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700',
                    color: textMuted,
                    marginBottom: '16px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  // MY LAB PROGRESS
                </h2>
                <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: textDim }}>
                      Total Points:{' '}
                    </span>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#FF6A00',
                      }}
                    >
                      {progress.total_points}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: textDim }}>
                      Flags Captured:{' '}
                    </span>
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#4ade80',
                      }}
                    >
                      {progress.completed.length} / 14
                    </span>
                  </div>
                </div>
                {progress.submissions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {progress.submissions.map((sub) => (
                      <span
                        key={sub.flag_id}
                        style={{
                          backgroundColor: 'rgba(74,222,128,0.08)',
                          border: '1px solid rgba(74,222,128,0.2)',
                          borderRadius: '3px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          color: '#4ade80',
                          fontFamily: "'JetBrains Mono', monospace",
                          letterSpacing: '0.04em',
                        }}
                      >
                        {sub.flag_id} (+{sub.points}pts)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tables grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Active Sessions */}
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
                    fontWeight: '700',
                    color: textMuted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  // Active Sessions
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#4ade80',
                  }}
                >
                  {mockSessions.length} LIVE
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                      {['Session ID', 'User', 'Role', 'Started', 'Msgs'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '8px 12px',
                            fontFamily: "'JetBrains Mono', monospace",
                            color: textDim,
                            fontWeight: '400',
                            fontSize: '9px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockSessions.map((s) => (
                      <tr
                        key={s.id}
                        style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB'}` }}
                      >
                        <td
                          style={{
                            padding: '8px 12px',
                            color: '#FF6A00',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                          }}
                        >
                          {s.id}
                        </td>
                        <td style={{ padding: '8px 12px', color: textPrimary, fontSize: '11px' }}>{s.user}</td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: ROLE_COLORS[s.role] || textMuted,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                          }}
                        >
                          {s.role}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: textDim,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                          }}
                        >
                          {s.started}
                        </td>
                        <td style={{ padding: '8px 12px', color: textPrimary, fontSize: '11px' }}>{s.msgs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Accounts */}
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
                    fontWeight: '700',
                    color: textMuted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  // User Accounts
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#FFC107',
                  }}
                >
                  {mockUsers.length} REGISTERED
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                      {['Username', 'Role', 'Citizen ID', 'Status'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '8px 12px',
                            fontFamily: "'JetBrains Mono', monospace",
                            color: textDim,
                            fontWeight: '400',
                            fontSize: '9px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((u) => (
                      <tr
                        key={u.username}
                        style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB'}` }}
                      >
                        <td
                          style={{
                            padding: '8px 12px',
                            color: textPrimary,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '11px',
                          }}
                        >
                          {u.username}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              color: ROLE_COLORS[u.role] || textMuted,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: '700',
                              fontSize: '10px',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            color: textDim,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                          }}
                        >
                          {u.citizen_id || '—'}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <span
                            style={{
                              padding: '2px 7px',
                              backgroundColor: u.active
                                ? 'rgba(74,222,128,0.08)'
                                : 'rgba(239,68,68,0.08)',
                              border: `1px solid ${u.active ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
                              color: u.active ? '#4ade80' : '#f87171',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '9px',
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {u.active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
