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
    { user: 'alice', pass: 'password123', role: 'Citizen' },
    { user: 'bob', pass: 'password123', role: 'Citizen' },
    { user: 'clerk_johnson', pass: 'clerk2024!', role: 'Clerk' },
    { user: 'supervisor_chen', pass: 'super2024!', role: 'Supervisor' },
    { user: 'sysadmin', pass: 'GovConnect@2024', role: 'Admin' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B0B0D',
      backgroundImage: 'linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
            // TECHNIEUM AI SECURITY LABS //
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', flexShrink: 0,
            }}>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#000', lineHeight: 1 }}>NM</div>
              <div style={{ fontSize: '6px', color: 'rgba(0,0,0,0.6)', letterSpacing: '0.1em', marginTop: '2px' }}>EST. 2089</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#FF6A00', letterSpacing: '-0.03em', margin: 0, fontFamily: "'Inter', sans-serif" }}>
                GOVCONNECT<span style={{ color: '#E3E1E9' }}> AI</span>
              </h1>
              <p style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.15em', margin: 0, textTransform: 'uppercase' }}>
                City of Neo Meridian — Citizen Portal
              </p>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div style={{
          backgroundColor: '#111217',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Gradient accent bar */}
          <div style={{ height: '3px', background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)' }} />

          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#E3E1E9', marginBottom: '4px', margin: 0 }}>
                  Citizen Authentication
                </h2>
                <p style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', marginTop: '4px' }}>
                  Enter credentials to access government services
                </p>
              </div>
              <div style={{
                fontSize: '9px', fontFamily: "'JetBrains Mono', monospace",
                color: '#FFC107', padding: '3px 8px',
                backgroundColor: 'rgba(255,193,7,0.1)',
                border: '1px solid rgba(255,193,7,0.2)',
              }}>
                SEC_LEVEL: CITIZEN
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '6px', padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '11px', fontFamily: "'JetBrains Mono', monospace",
                color: '#f87171',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block', fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700', color: '#71717a',
                  marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>
                  Operator UID <span style={{ color: '#FF6A00' }}>*</span>
                </label>
                <input
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username" required
                  style={{
                    width: '100%', backgroundColor: '#181A20',
                    border: '0', borderBottom: '1px solid #3f3f46',
                    padding: '10px 12px', color: '#E3E1E9',
                    fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#FF6A00')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#3f3f46')}
                />
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block', fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700', color: '#71717a',
                  marginBottom: '8px', letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>
                  Security Key <span style={{ color: '#FF6A00' }}>*</span>
                </label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password" required
                  style={{
                    width: '100%', backgroundColor: '#181A20',
                    border: '0', borderBottom: '1px solid #3f3f46',
                    padding: '10px 12px', color: '#E3E1E9',
                    fontSize: '13px', fontFamily: "'JetBrains Mono', monospace",
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#FF6A00')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#3f3f46')}
                />
              </div>
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? 'rgba(255,106,0,0.4)' : 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                  color: '#000', border: 'none', borderRadius: '0',
                  padding: '14px', fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  transition: 'opacity 0.2s',
                }}>
                {loading ? '// AUTHENTICATING...' : 'Access Portal →'}
              </button>
            </form>
          </div>

          {/* Footer meta */}
          <div style={{
            padding: '12px 32px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFC107', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', textTransform: 'uppercase' }}>
                AES-256 Active
              </span>
            </div>
            <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46' }}>
              VER: 2.4.1-GOLD
            </span>
          </div>
        </div>

        {/* Test accounts */}
        <div style={{
          marginTop: '20px',
          backgroundColor: '#111217',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#FF6A00', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              LAB TEST CREDENTIALS
            </span>
            <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.06em' }}>
              (FOR TRAINING USE)
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 20px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', fontWeight: '400', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Username</th>
                  <th style={{ textAlign: 'left', padding: '6px 20px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', fontWeight: '400', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</th>
                  <th style={{ textAlign: 'left', padding: '6px 20px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', fontWeight: '400', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td
                      style={{ padding: '6px 20px', color: '#FF6A00', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
                      onClick={() => setUsername(acc.user)}
                    >{acc.user}</td>
                    <td
                      style={{ padding: '6px 20px', color: '#71717a', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
                      onClick={() => setPassword(acc.pass)}
                    >{acc.pass}</td>
                    <td style={{ padding: '6px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: acc.role === 'Admin' ? 'rgba(239,68,68,0.1)' : acc.role === 'Supervisor' ? 'rgba(234,88,12,0.1)' : acc.role === 'Clerk' ? 'rgba(217,119,6,0.1)' : 'rgba(22,163,74,0.1)',
                        color: acc.role === 'Admin' ? '#f87171' : acc.role === 'Supervisor' ? '#fb923c' : acc.role === 'Clerk' ? '#fbbf24' : '#4ade80',
                        border: `1px solid ${acc.role === 'Admin' ? 'rgba(239,68,68,0.2)' : acc.role === 'Supervisor' ? 'rgba(234,88,12,0.2)' : acc.role === 'Clerk' ? 'rgba(217,119,6,0.2)' : 'rgba(22,163,74,0.2)'}`,
                        borderRadius: '2px',
                        fontSize: '9px',
                        letterSpacing: '0.06em',
                      }}>
                        {acc.role.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 20px 12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <p style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', margin: 0 }}>
              Click username or password to autofill. Credential exposure is intentional — LAB-5 training vulnerability.
            </p>
          </div>
        </div>

        <p style={{
          textAlign: 'center', fontSize: '9px',
          fontFamily: "'JetBrains Mono', monospace",
          color: '#27272a', marginTop: '20px', letterSpacing: '0.06em'
        }}>
          Neo Meridian Department of Digital Services | GovConnect v2.4.1
        </p>
      </div>
    </div>
  );
}
