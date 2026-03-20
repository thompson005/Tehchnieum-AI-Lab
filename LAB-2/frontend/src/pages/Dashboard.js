import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI } from '../services/api';
import ChatWidget from '../components/ChatWidget';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import SmartTransfer from '../components/SmartTransfer';
import TransactionAnalyzer from '../components/TransactionAnalyzer';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadDashboardData();

    // Session timeout warning (corporate realism)
    const timer = setInterval(() => {
      setSessionTimeout((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [handleLogout]);

  const loadDashboardData = async () => {
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        accountsAPI.getAccounts(),
        transactionsAPI.getTransactions(10),
      ]);
      setAccounts(accountsRes.data.accounts);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = () => {
    loadDashboardData();
  };

  const styles = {
    page: { minHeight: '100vh', background: '#F3F4F6', color: '#111827', fontFamily: 'Inter, sans-serif' },
    header: { background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '0 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    headerInner: { maxWidth: '80rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '3.5rem' },
    brandWrap: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    brandIcon: { width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem', background: 'linear-gradient(135deg,#FF6B00,#FFB800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#FFFFFF', fontSize: '0.75rem' },
    brandText: { fontWeight: 900, fontSize: '0.875rem', letterSpacing: '0.15em', background: 'linear-gradient(135deg,#FF6B00,#FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    sessionBadge: { fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem', background: '#F9FAFB' },
    logoutBtn: { background: 'none', border: '1px solid #E5E7EB', color: '#6B7280', padding: '0.375rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' },
    main: { maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' },
    sectionTitle: { fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' },
    aiBanner: { background: 'linear-gradient(135deg, rgba(255,107,0,0.06), rgba(255,184,0,0.04))', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    betaBadge: { background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.25)', borderRadius: '9999px', padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 700 },
    footer: { borderTop: '1px solid #E5E7EB', background: '#FFFFFF', padding: '1.5rem 1rem', marginTop: '3rem' },
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#FF6B00', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#6B7280', fontSize: '0.875rem' }}>Loading your dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.brandWrap}>
            <div style={styles.brandIcon}>T</div>
            <span style={styles.brandText}>TECHNIEUM</span>
            <span style={{ color: '#E5E7EB', margin: '0 0.25rem' }}>|</span>
            <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>SecureBank AI — LAB-2</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a href="http://localhost:5555" style={{ fontSize: '0.75rem', color: '#FF6B00', textDecoration: 'none', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', background: '#FFF7ED' }}>
              Submit Flag
            </a>
            <span style={styles.sessionBadge}>Session: {sessionTimeout}m</span>
            <span style={{ color: '#374151', fontSize: '0.8rem' }}>
              {user?.full_name || user?.username}
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#6B7280'; }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Accounts */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={styles.sectionTitle}>Your Accounts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </section>

        {/* AI Features */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={styles.aiBanner}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111827' }}>
                AI-Powered Banking Features
              </h2>
              <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                Intelligent assistants for transfers, analysis, and support
              </p>
            </div>
            <span style={styles.betaBadge}>BETA · LAB TARGET</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <SmartTransfer onTransferComplete={refreshTransactions} />
            <TransactionAnalyzer transactions={transactions} />
          </div>
        </section>

        {/* Transactions */}
        <section>
          <h2 style={styles.sectionTitle}>Recent Transactions</h2>
          <TransactionList transactions={transactions} />
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
            © 2025 <span style={{ background: 'linear-gradient(135deg,#FF6B00,#FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Technieum</span> — Authorized security training only
          </span>
          <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontFamily: 'monospace' }}>SecureBank AI · LAB-2</span>
        </div>
      </footer>

      {/* Chat Widget (Eva) */}
      <ChatWidget />
    </div>
  );
}
