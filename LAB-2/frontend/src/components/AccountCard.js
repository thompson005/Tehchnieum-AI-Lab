import React from 'react';

export default function AccountCard({ account }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.currency || 'USD',
    }).format(amount);
  };

  const getAccountTypeConfig = (type) => {
    switch (type) {
      case 'checking':
        return { label: 'CHK', borderColor: '#3B82F6', glowColor: 'rgba(59,130,246,0.2)' };
      case 'savings':
        return { label: 'SAV', borderColor: '#22C55E', glowColor: 'rgba(34,197,94,0.2)' };
      case 'credit':
        return { label: 'CRD', borderColor: '#A855F7', glowColor: 'rgba(168,85,247,0.2)' };
      default:
        return { label: 'ACC', borderColor: '#FF6A00', glowColor: 'rgba(255,106,0,0.2)' };
    }
  };

  const config = getAccountTypeConfig(account.type);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderTop: `3px solid ${config.borderColor}`,
      borderRadius: '0.75rem',
      padding: '1.5rem',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      boxShadow: `0 0 0 transparent`,
    }}
      onMouseOver={e => e.currentTarget.style.boxShadow = `0 4px 20px ${config.glowColor}`}
      onMouseOut={e => e.currentTarget.style.boxShadow = '0 0 0 transparent'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <p style={{
            fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
            textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)',
            marginBottom: '0.25rem',
          }}>
            {account.type} Account
          </p>
          <p style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
            {account.account_number}
          </p>
        </div>
        <div style={{
          width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
          background: `linear-gradient(135deg, ${config.borderColor}22, ${config.borderColor}11)`,
          border: `1px solid ${config.borderColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, color: config.borderColor,
          fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace',
        }}>
          {config.label}
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{
          fontSize: '1.875rem', fontWeight: 800,
          color: '#FFC107',
          fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em',
        }}>
          {formatCurrency(account.balance)}
        </p>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
          Available Balance
        </p>
      </div>

      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.65rem',
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, textTransform: 'uppercase',
          ...(account.status === 'active'
            ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }
            : { background: 'rgba(113,113,122,0.12)', color: 'var(--text-muted)', border: '1px solid var(--border)' }),
        }}>
          <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: account.status === 'active' ? '#22C55E' : 'var(--text-muted)', display: 'inline-block' }} />
          {account.status}
        </span>
      </div>
    </div>
  );
}
