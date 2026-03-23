import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'GovConnect AI — City of Neo Meridian',
  description: 'TECHNIEUM AI Security Labs — LAB-5: GovConnect AI Citizen Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            {/* Page content — each page renders its own header where needed */}
            <main style={{ flex: 1 }}>{children}</main>

            {/* Footer */}
            <footer
              style={{
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                padding: '16px 24px',
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--text-muted)',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              <p>City of Neo Meridian — GovConnect AI Platform v2.4.1</p>
              <p style={{ marginTop: '4px', fontSize: '10px', opacity: 0.6 }}>
                OFFICIAL GOVERNMENT USE ONLY &nbsp;|&nbsp; Unauthorized access is prohibited and subject to prosecution under NM Code 18-2441
              </p>
              <p
                style={{
                  marginTop: '4px',
                  color: '#FF6A00',
                  fontSize: '10px',
                }}
              >
                LAB-5: AI Security Training Environment — All vulnerabilities are intentional for educational purposes
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
