'use client';

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#F3F4F6', color: '#111827' }}>
        {/* Top nav bar */}
        <header
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div
            style={{
              maxWidth: '1400px',
              margin: '0 auto',
              padding: '0 1.5rem',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo and name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                NM
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827', lineHeight: 1.1 }}>
                  GovConnect AI
                </div>
                <div style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.08em' }}>
                  CITY OF NEO MERIDIAN
                </div>
              </div>
            </div>

            {/* Nav links */}
            <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <a
                href="/dashboard"
                style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#1D4ED8')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.color = '#6B7280')}
              >
                Dashboard
              </a>
              <a
                href="/chat"
                style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#1D4ED8')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.color = '#6B7280')}
              >
                AI Assistant
              </a>
              <a
                href="/mcp-debug"
                style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#1D4ED8')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.color = '#6B7280')}
              >
                MCP Debug
              </a>
              <a
                href="/admin"
                style={{ color: '#6B7280', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.color = '#1D4ED8')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.color = '#6B7280')}
              >
                Admin
              </a>
            </nav>

            {/* Status badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#16A34A',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                padding: '4px 10px',
                borderRadius: '20px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#16A34A',
                  display: 'inline-block',
                }}
              />
              SYSTEMS ONLINE
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>{children}</main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid #E5E7EB',
            background: '#FFFFFF',
            padding: '20px 24px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: 'auto',
          }}
        >
          <p>City of Neo Meridian — GovConnect AI Platform v2.4.1</p>
          <p style={{ marginTop: '4px' }}>
            OFFICIAL GOVERNMENT USE ONLY | Unauthorized access is prohibited and subject to prosecution under NM Code 18-2441
          </p>
          <p style={{ marginTop: '4px', color: '#FF6B00', fontSize: '11px' }}>
            LAB-5: AI Security Training Environment — All vulnerabilities are intentional for educational purposes
          </p>
        </footer>
      </body>
    </html>
  );
}
