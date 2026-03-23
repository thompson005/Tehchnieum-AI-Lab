import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsAPI, transactionsAPI } from '../services/api';
import ChatWidget from '../components/ChatWidget';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import SmartTransfer from '../components/SmartTransfer';
import TransactionAnalyzer from '../components/TransactionAnalyzer';
import NavBar from '../components/NavBar';

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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2.5rem', height: '2.5rem', borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: '#FF6A00',
            animation: 'spin 0.8s linear infinite', margin: '0 auto',
          }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading dashboard...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* NavBar */}
      <NavBar user={user} sessionTimeout={sessionTimeout} onLogout={handleLogout} />

      {/* Main content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* AI banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,106,0,0.07), rgba(255,193,7,0.04))',
          border: '1px solid rgba(255,106,0,0.2)', borderRadius: '0.75rem',
          padding: '1.25rem 1.5rem', marginBottom: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}>
              AI-Powered Banking Features
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Intelligent assistants for transfers, analysis, and support
            </p>
          </div>
          <span style={{
            background: 'rgba(255,106,0,0.1)', color: '#FF6A00',
            border: '1px solid rgba(255,106,0,0.25)', borderRadius: '9999px',
            padding: '0.25rem 0.75rem', fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>BETA · LAB TARGET</span>
        </div>

        {/* Accounts */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>// Accounts</span>
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem', display: 'none' }}>Your Accounts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </section>

        {/* Smart Transfer + Analyzer */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <SmartTransfer onTransferComplete={refreshTransactions} />
            <TransactionAnalyzer transactions={transactions} />
          </div>
        </section>

        {/* Transactions */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>// Transaction Ledger</span>
          </div>
          <TransactionList transactions={transactions} />
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '1.25rem 1.5rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>
            © 2025{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF6A00,#FFC107)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>
              Technieum
            </span>
            {' '}— Authorized security training only
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace' }}>SecureBank AI · LAB-2</span>
        </div>
      </footer>

      {/* Eva Chat Widget */}
      <ChatWidget />
    </div>
  );
}
