import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen flex" style={{ background: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #FF6B00 0%, #FFB800 100%)' }}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-sm"
              style={{ background: 'rgba(255,255,255,0.2)' }}>T</div>
            <span className="font-black tracking-widest text-sm text-white">TECHNIEUM</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>AI Security Research Labs · LAB-2</p>
        </div>
        <div>
          <div className="mb-8">
            <div className="font-mono text-xs mb-4" style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>// Architecture</p>
              <p className="mt-2">React → FastAPI</p>
              <p>Eva Bot (RAG + ChromaDB)</p>
              <p>Smart Transfer Agent</p>
              <p>Loan Underwriter (PDF)</p>
              <p>PostgreSQL + Redis</p>
            </div>
          </div>
          <h1 className="text-4xl font-black mb-3 text-white" style={{ lineHeight: 1.1 }}>
            SecureBank<br/>
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>AI Security Lab</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            A production-grade banking simulation. Exploit AI agents, RAG systems, and payment flows across 4 escalating scenarios.
          </p>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>
          ⚠ Intentionally vulnerable — authorized training only
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12" style={{ background: '#F3F4F6' }}>
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <p className="font-black tracking-widest text-lg"
              style={{ background: 'linear-gradient(135deg,#FF6B00,#FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              TECHNIEUM
            </p>
            <p style={{ color: '#6B7280', fontSize: '0.75rem' }}>SecureBank AI · LAB-2</p>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>Sign In</h2>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Access your SecureBank account</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>
                  Username
                </label>
                <input
                  type="text" required value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#FF6B00'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B7280' }}>
                  Password
                </label>
                <input
                  type="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#FF6B00'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>
              <button
                type="submit" disabled={loading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#FF6B00,#FFB800)', color: '#FFFFFF', fontWeight: 700, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Signing in...' : 'Access Account →'}
              </button>
            </form>

            <div className="mt-6 pt-5" style={{ borderTop: '1px solid #E5E7EB' }}>
              <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Test credentials:</p>
              <div className="space-y-1">
                {[['john.doe','SecureBank123!','Customer'],['attacker','SecureBank123!','Attacker (Start here)']].map(([u,p,role]) => (
                  <button key={u} onClick={() => { setUsername(u); setPassword(p); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', cursor: 'pointer' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#FF6B00'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                    <span className="font-mono" style={{ color: '#FF6B00' }}>{u}</span>
                    <span style={{ color: '#6B7280' }}>{role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <a href="http://localhost:5555" className="text-xs font-semibold"
              style={{ color: '#FF6B00', textDecoration: 'none' }}>
              ← Back to Technieum Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
