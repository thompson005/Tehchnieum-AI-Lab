import React from 'react';

export default function TransactionList({ transactions }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTransactionConfig = (type) => {
    switch (type) {
      case 'transfer':
        return { label: 'TFR', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' };
      case 'debit':
        return { label: 'DEB', color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)' };
      case 'credit':
        return { label: 'CRD', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' };
      default:
        return { label: 'TXN', color: 'var(--text-muted)', bg: 'var(--surface-low)', border: 'var(--border)' };
    }
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--border)' }}>
              {['Date', 'Description', 'Type', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  padding: '0.75rem 1.25rem',
                  textAlign: i === 3 ? 'right' : 'left',
                  fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, rowIdx) => {
              const cfg = getTransactionConfig(tx.type);
              return (
                <tr key={tx.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: rowIdx % 2 === 0 ? 'transparent' : 'var(--surface-low)',
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,106,0,0.04)'}
                  onMouseOut={e => e.currentTarget.style.background = rowIdx % 2 === 0 ? 'transparent' : 'var(--surface-low)'}
                >
                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.78rem', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                    {formatDate(tx.created_at)}
                  </td>
                  <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.82rem', color: 'var(--text)' }}>
                    <div>
                      <p>{tx.description}</p>
                      {tx.note && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>{tx.note}</p>}
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1.25rem', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        padding: '0.15rem 0.45rem', borderRadius: '0.25rem',
                        fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                        color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                      }}>{cfg.label}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tx.type}</span>
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontSize: '0.82rem', fontWeight: 600,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: tx.type === 'credit' ? '#22C55E' : 'var(--text)',
                    }}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
