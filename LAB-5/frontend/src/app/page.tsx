'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      setToken(data.access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Check credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const accounts = [
    { user: 'citizen1', pass: 'citizen123', role: 'Citizen' },
    { user: 'citizen2', pass: 'citizen456', role: 'Citizen' },
    { user: 'clerk1', pass: 'clerk456', role: 'Clerk' },
    { user: 'supervisor1', pass: 'super999', role: 'Supervisor' },
    { user: 'admin', pass: 'admin789', role: 'Admin' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* City seal header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', border: '4px solid #DBEAFE', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: 'white', lineHeight: 1 }}>NM</div>
            <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', marginTop: '2px' }}>EST. 2089</div>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>GovConnect AI</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', letterSpacing: '0.08em' }}>CITY OF NEO MERIDIAN — CITIZEN PORTAL</p>
          <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '6px' }}>Integrated Smart City Services Platform</p>
        </div>

        {/* Login card */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '36px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Citizen Authentication</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '28px' }}>Enter your credentials to access government services</p>

          {error && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px', letterSpacing: '0.05em' }}>USERNAME</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username" required
                style={{ width: '100%', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px', color: '#111827', fontSize: '14px', outline: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px', letterSpacing: '0.05em' }}>PASSWORD</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password" required
                style={{ width: '100%', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 14px', color: '#111827', fontSize: '14px', outline: 'none' }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', color: 'white', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'AUTHENTICATING...' : 'ACCESS PORTAL'}
            </button>
          </form>
        </div>

        {/* Test accounts */}
        <div style={{ marginTop: '24px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '11px', color: '#FF6B00', fontWeight: '600', marginBottom: '12px', letterSpacing: '0.08em' }}>
            LAB TEST CREDENTIALS (FOR TRAINING USE)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px', color: '#6B7280' }}>Username</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', color: '#6B7280' }}>Password</th>
                <th style={{ textAlign: 'left', padding: '4px 8px', color: '#6B7280' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F9FAFB' }}>
                  <td style={{ padding: '5px 8px', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'monospace' }} onClick={() => setUsername(acc.user)}>{acc.user}</td>
                  <td style={{ padding: '5px 8px', color: '#6B7280', cursor: 'pointer', fontFamily: 'monospace' }} onClick={() => setPassword(acc.pass)}>{acc.pass}</td>
                  <td style={{ padding: '5px 8px', color: '#9CA3AF' }}>{acc.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '10px', fontSize: '11px', color: '#9CA3AF' }}>
            Click a username or password to autofill. This credential exposure is an intentional vulnerability for LAB-5 training.
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#D1D5DB', marginTop: '20px' }}>
          Neo Meridian Department of Digital Services | GovConnect v2.4.1
        </p>
      </div>
    </div>
  );
}
