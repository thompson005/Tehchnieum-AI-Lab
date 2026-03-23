import React, { useState } from 'react';
import { transactionsAPI } from '../services/api';

export default function SmartTransfer({ onTransferComplete }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTransfer = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await transactionsAPI.smartTransfer(message);
      setResult(response.data);
      if (response.data.success) {
        setMessage('');
        setTimeout(() => {
          onTransferComplete();
        }, 1000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data?.detail || 'Transfer failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
          background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" fill="none" stroke="#000" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.1rem' }}>Smart Transfer</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>Natural language money transfers</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{
            display: 'block', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-muted)', marginBottom: '0.4rem',
          }}>
            Transfer Instruction
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., Send $50 to account 1001234568 for dinner"
            disabled={loading}
            rows={3}
            style={{
              width: '100%', background: 'var(--surface-low)',
              border: 'none', borderBottom: '1px solid var(--border-solid)',
              padding: '0.65rem 0.25rem', fontSize: '0.82rem', color: 'var(--text)',
              outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif',
              transition: 'border-color 0.2s', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderBottomColor = '#FF6A00'}
            onBlur={e => e.target.style.borderBottomColor = 'var(--border-solid)'}
          />
        </div>

        <button
          onClick={handleTransfer}
          disabled={loading || !message.trim()}
          style={{
            width: '100%', background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
            border: 'none', cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
            padding: '0.7rem 1rem', color: '#000', fontWeight: 700,
            fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            opacity: loading || !message.trim() ? 0.55 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => { if (!loading && message.trim()) e.currentTarget.style.opacity = '0.88'; }}
          onMouseOut={e => { if (!loading && message.trim()) e.currentTarget.style.opacity = '1'; }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : 'Execute Transfer'}
        </button>

        {result && (
          <div style={{
            padding: '0.875rem 1rem', borderRadius: '0.5rem',
            ...(result.success
              ? { background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }
              : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }),
          }}>
            <p style={{
              fontSize: '0.82rem', fontWeight: 500,
              color: result.success ? '#22C55E' : '#F87171',
            }}>
              {result.success ? '✓ ' : '✗ '}
              {result.message || result.error}
            </p>
          </div>
        )}

        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
          Note: AI-powered feature. Verify details before confirming.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
