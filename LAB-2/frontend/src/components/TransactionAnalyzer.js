import React, { useState } from 'react';
import { transactionsAPI } from '../services/api';

export default function TransactionAnalyzer({ transactions }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [limit, setLimit] = useState(5);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis('');

    try {
      const response = await transactionsAPI.analyzeTransactions(limit);
      setAnalysis(response.data.analysis);
    } catch (error) {
      setAnalysis('<p style="color:#F87171">Failed to analyze transactions.</p>');
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.1rem' }}>Transaction Analyzer</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>AI-powered spending insights</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{
            display: 'block', fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--text-muted)', marginBottom: '0.4rem',
          }}>
            Transactions to Analyze
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            disabled={loading}
            style={{
              width: '100%', background: 'var(--surface-low)',
              border: 'none', borderBottom: '1px solid var(--border-solid)',
              padding: '0.65rem 0.25rem', fontSize: '0.82rem', color: 'var(--text)',
              outline: 'none', fontFamily: 'JetBrains Mono, monospace',
              transition: 'border-color 0.2s', cursor: 'pointer',
              appearance: 'none',
            }}
            onFocus={e => e.target.style.borderBottomColor = '#FF6A00'}
            onBlur={e => e.target.style.borderBottomColor = 'var(--border-solid)'}
          >
            <option value={5}>Last 5 transactions</option>
            <option value={10}>Last 10 transactions</option>
            <option value={20}>Last 20 transactions</option>
          </select>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || transactions.length === 0}
          style={{
            width: '100%', background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
            border: 'none', cursor: loading || transactions.length === 0 ? 'not-allowed' : 'pointer',
            padding: '0.7rem 1rem', color: '#000', fontWeight: 700,
            fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            opacity: loading || transactions.length === 0 ? 0.55 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => { if (!loading && transactions.length > 0) e.currentTarget.style.opacity = '0.88'; }}
          onMouseOut={e => { if (!loading && transactions.length > 0) e.currentTarget.style.opacity = '1'; }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 0.8s linear infinite' }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Portfolio...
            </>
          ) : 'Analyze Transactions'}
        </button>

        {analysis && (
          <div style={{
            background: 'var(--surface-low)', border: '1px solid var(--border)',
            borderRadius: '0.5rem', padding: '1rem',
          }}>
            <p style={{
              fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FF6A00',
              marginBottom: '0.5rem',
            }}>// AI Analysis:</p>
            {/* VULNERABLE: Rendering HTML directly without sanitization */}
            <div
              style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: analysis }}
            />
          </div>
        )}

        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
          AI generated insights. Not financial advice.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
