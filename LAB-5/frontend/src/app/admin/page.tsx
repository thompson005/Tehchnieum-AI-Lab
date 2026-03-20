'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated, getUserFromToken } from '@/lib/auth';
import { getMyProgress } from '@/lib/api';

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

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  const stats: StatCard[] = [
    { label: 'Active Sessions', value: 42, color: '#1D4ED8' },
    { label: 'Citizens Registered', value: 10, color: '#16A34A' },
    { label: 'MCP Servers', value: 9, color: '#0891B2' },
    { label: 'Flags Available', value: 14, color: '#FF6B00' },
    { label: 'Total Points Pool', value: 4400, color: '#7C3AED' },
    { label: 'Audit Log Entries', value: '—', color: '#EA580C' },
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
      <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6B7280', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  const roleColors: Record<string, string> = { admin: '#DC2626', supervisor: '#EA580C', clerk: '#D97706', citizen: '#16A34A' };
  const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Admin Panel</h1>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>GovConnect AI Platform Administration</p>
          </div>
          <div style={{ backgroundColor: user.role === 'admin' ? '#FEF2F2' : '#FFF7ED', border: `1px solid ${user.role === 'admin' ? '#FECACA' : '#FDBA74'}`, borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: user.role === 'admin' ? '#DC2626' : '#EA580C' }}>
            Logged in as <strong>{user.username}</strong> ({user.role})
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderTop: `2px solid ${stat.color}`, borderRadius: '10px', padding: '18px', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color, marginBottom: '6px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress tracker */}
        {progress && (
          <div style={{ ...cardStyle, marginBottom: '24px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '16px', letterSpacing: '0.05em' }}>MY LAB PROGRESS</h2>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Total Points: </span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#FF6B00' }}>{progress.total_points}</span>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Flags Captured: </span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#16A34A' }}>{progress.completed.length} / 14</span>
              </div>
            </div>
            {progress.submissions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {progress.submissions.map((sub) => (
                  <span key={sub.flag_id} style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', color: '#16A34A', fontFamily: 'monospace' }}>
                    {sub.flag_id} (+{sub.points}pts)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Active Sessions */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '16px', letterSpacing: '0.05em' }}>ACTIVE SESSIONS</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {['Session ID', 'User', 'Role', 'Started', 'Msgs'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#9CA3AF', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockSessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '6px 8px', color: '#1D4ED8', fontFamily: 'monospace' }}>{s.id}</td>
                    <td style={{ padding: '6px 8px', color: '#374151' }}>{s.user}</td>
                    <td style={{ padding: '6px 8px', color: '#6B7280' }}>{s.role}</td>
                    <td style={{ padding: '6px 8px', color: '#9CA3AF', fontFamily: 'monospace' }}>{s.started}</td>
                    <td style={{ padding: '6px 8px', color: '#374151' }}>{s.msgs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User management */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '16px', letterSpacing: '0.05em' }}>USER ACCOUNTS</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                  {['Username', 'Role', 'Citizen ID', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#9CA3AF', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((u) => (
                  <tr key={u.username} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '6px 8px', color: '#374151', fontFamily: 'monospace' }}>{u.username}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ color: roleColors[u.role] || '#6B7280', fontWeight: '600', fontSize: '11px' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '6px 8px', color: '#9CA3AF', fontFamily: 'monospace' }}>{u.citizen_id || '—'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <span style={{ color: u.active ? '#16A34A' : '#DC2626', fontSize: '11px' }}>{u.active ? 'active' : 'disabled'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
