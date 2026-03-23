import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.375rem', padding: '0.4rem 0.65rem',
          cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem',
          transition: 'all 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.color = '#FF6A00'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        {isDark ? '☀' : '🌙'}
      </button>

      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #FF6A00 0%, #FFC107 100%)' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
              background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 900, color: '#fff', fontSize: '0.85rem',
            }}>T</div>
            <span style={{ fontWeight: 900, letterSpacing: '0.15em', fontSize: '0.85rem', color: '#fff' }}>TECHNIEUM</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>
            AI Security Research Labs · LAB-2
          </p>
        </div>

        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem',
            padding: '1rem', marginBottom: '2rem',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '0.5rem' }}>// Architecture</p>
            <p>React → FastAPI</p>
            <p>Eva Bot (RAG + ChromaDB)</p>
            <p>Smart Transfer Agent</p>
            <p>Loan Underwriter (PDF)</p>
            <p>PostgreSQL + Redis</p>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            SecureBank<br />
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>AI Security Lab</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', lineHeight: 1.65 }}>
            A production-grade banking simulation. Exploit AI agents, RAG systems, and payment flows across 4 escalating scenarios.
          </p>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace' }}>
          ⚠ Intentionally vulnerable — authorized training only
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: '26rem' }}>

          {/* Mobile brand */}
          <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{
              fontWeight: 900, letterSpacing: '0.15em', fontSize: '1.25rem',
              background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>TECHNIEUM</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>SecureBank AI · LAB-2</p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '1.25rem', overflow: 'hidden',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            {/* Orange top bar */}
            <div style={{ height: '3px', background: 'linear-gradient(135deg,#FF6A00,#FFC107)' }} />

            <div style={{ padding: '2rem' }}>
              {/* System status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem' }}>
                <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 6px #22C55E' }} />
                <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  SYSTEM ONLINE · ACCESS TERMINAL
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>Sign In</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Access your SecureBank account</p>

              {error && (
                <div style={{
                  marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#F87171', fontSize: '0.85rem',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Username
                  </label>
                  <input
                    type="text" required value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                    style={{
                      width: '100%', background: 'var(--surface-low)',
                      border: 'none', borderBottom: '1px solid var(--border-solid)',
                      padding: '0.65rem 0', fontSize: '0.875rem', color: 'var(--text)',
                      outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'JetBrains Mono, monospace', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderBottomColor = '#FF6A00'}
                    onBlur={e => e.target.style.borderBottomColor = 'var(--border-solid)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Password
                  </label>
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%', background: 'var(--surface-low)',
                      border: 'none', borderBottom: '1px solid var(--border-solid)',
                      padding: '0.65rem 0', fontSize: '0.875rem', color: 'var(--text)',
                      outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'JetBrains Mono, monospace', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderBottomColor = '#FF6A00'}
                    onBlur={e => e.target.style.borderBottomColor = 'var(--border-solid)'}
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
                    color: '#000', fontWeight: 700, padding: '0.75rem 1rem',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    opacity: loading ? 0.7 : 1, marginTop: '0.25rem',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseOut={e => { if (!loading) e.currentTarget.style.opacity = '1'; }}
                >
                  {loading ? 'Authenticating...' : 'ACCESS TERMINAL →'}
                </button>
              </form>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>
                  // Test credentials:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {[['john.doe', 'SecureBank123!', 'Customer'], ['attacker', 'SecureBank123!', 'Attacker (Start here)']].map(([u, p, role]) => (
                    <button
                      key={u}
                      onClick={() => { setUsername(u); setPassword(p); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem', background: 'var(--surface-low)',
                        border: '1px solid var(--border)', borderRadius: '0.375rem',
                        cursor: 'pointer', transition: 'border-color 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#FF6A00'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#FF6A00' }}>{u}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{role}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <a href="http://localhost:5555" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FF6A00', textDecoration: 'none' }}>
              ← Back to Technieum Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
