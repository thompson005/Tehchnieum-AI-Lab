'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMcpTools, invokeMcpTool, getMcpAuditLog } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';

interface McpServer {
  name: string;
  url: string;
  port: number;
  description: string;
}

interface AuditEntry {
  id: number;
  session_id: string;
  user_id: number;
  mcp_server: string;
  tool_name: string;
  tool_args: Record<string, unknown>;
  tool_result: unknown;
  called_at: string;
}

const MCP_SERVERS: McpServer[] = [
  { name: 'citizen-records-mcp', url: 'http://mcp-citizen:8110', port: 8110, description: 'Citizen personal records and profiles' },
  { name: 'dmv-mcp', url: 'http://mcp-dmv:8111', port: 8111, description: 'DMV vehicle and violation records' },
  { name: 'tax-authority-mcp', url: 'http://mcp-tax:8112', port: 8112, description: 'Tax records, audits, and penalties' },
  { name: 'permit-office-mcp', url: 'http://mcp-permit:8113', port: 8113, description: 'Construction and renovation permits' },
  { name: 'health-registry-mcp', url: 'http://mcp-health:8114', port: 8114, description: 'Citizen health and vaccination records' },
  { name: 'internal-docs-mcp', url: 'http://mcp-docs:8115', port: 8115, description: 'Classified internal government documents' },
  { name: 'notification-mcp', url: 'http://mcp-notify:8116', port: 8116, description: 'Email and SMS notification system' },
  { name: 'filesystem-mcp', url: 'http://mcp-files:8117', port: 8117, description: 'Government file storage system' },
  { name: 'civic-feedback-mcp', url: 'http://mcp-civic:8118', port: 8118, description: 'Citizen feedback and RAG system' },
];

export default function McpDebugPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tools, setTools] = useState<Record<string, unknown[]>>({});
  const [loadingTools, setLoadingTools] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [invokeServer, setInvokeServer] = useState(MCP_SERVERS[0].name);
  const [invokeTool, setInvokeTool] = useState('');
  const [invokeArgs, setInvokeArgs] = useState('{}');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [invokeLoading, setInvokeLoading] = useState(false);
  const [invokeError, setInvokeError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    const t = getToken();
    setToken(t);
    loadAuditLog(t);
  }, [router]);

  const loadAuditLog = async (t: string | null) => {
    if (!t) return;
    setAuditLoading(true);
    try {
      const data = await getMcpAuditLog(t);
      setAuditLog(data.entries || []);
    } catch { /* silently fail */ } finally { setAuditLoading(false); }
  };

  const listTools = async (serverName: string) => {
    if (!token) return;
    setLoadingTools(serverName);
    try {
      const data = await getMcpTools(token);
      setTools((prev) => ({ ...prev, [serverName]: data[serverName] || [] }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to list tools';
      setTools((prev) => ({ ...prev, [serverName]: [{ error: message }] as unknown[] }));
    } finally { setLoadingTools(null); }
  };

  const handleInvoke = async () => {
    if (!token || !invokeTool.trim()) return;
    setInvokeLoading(true);
    setInvokeResult(null);
    setInvokeError(null);

    let parsedArgs: Record<string, unknown> = {};
    try { parsedArgs = JSON.parse(invokeArgs); } catch {
      setInvokeError('Invalid JSON in arguments field.');
      setInvokeLoading(false);
      return;
    }

    try {
      const result = await invokeMcpTool(invokeServer, invokeTool, parsedArgs, token);
      setInvokeResult(JSON.stringify(result, null, 2));
      loadAuditLog(token);
    } catch (err: unknown) {
      setInvokeError(err instanceof Error ? err.message : 'Invocation failed');
    } finally { setInvokeLoading(false); }
  };

  const cardStyle = { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' };
  const inputStyle = { width: '100%', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px 12px', color: '#111827', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' as const };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>MCP Debug Console</h1>
            <span style={{ backgroundColor: '#FFF7ED', border: '1px solid #FDBA74', color: '#FF6B00', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.05em' }}>DEV TOOL</span>
          </div>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Inspect MCP servers, list tools, invoke tools directly, and view audit logs.
            <span style={{ color: '#DC2626', marginLeft: '8px' }}>[LAB NOTE: This page is intentionally accessible to all users — it should be admin-only.]</span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* MCP Servers list */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '16px', letterSpacing: '0.05em' }}>MCP SERVERS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MCP_SERVERS.map((server) => (
                <div key={server.name} style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1D4ED8', fontWeight: '600' }}>{server.name}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{server.description}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#D1D5DB', fontFamily: 'monospace' }}>:{server.port}</div>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A', marginLeft: 'auto', marginTop: '4px' }} />
                    </div>
                  </div>
                  <button
                    onClick={() => listTools(server.name)}
                    disabled={loadingTools === server.name}
                    style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', marginBottom: tools[server.name] ? '8px' : '0' }}>
                    {loadingTools === server.name ? 'Loading...' : 'List Tools'}
                  </button>
                  {tools[server.name] && (
                    <pre style={{ backgroundColor: '#F3F4F6', borderRadius: '4px', padding: '8px', fontSize: '10px', color: '#374151', overflow: 'auto', maxHeight: '120px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(tools[server.name], null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Direct tool invoke */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', marginBottom: '6px', letterSpacing: '0.05em' }}>DIRECT TOOL INVOCATION</h2>
            <p style={{ fontSize: '11px', color: '#DC2626', marginBottom: '16px' }}>Calls POST /api/mcp/invoke — authentication check only, no authorization enforcement.</p>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>MCP Server</label>
              <select value={invokeServer} onChange={(e) => setInvokeServer(e.target.value)} style={inputStyle}>
                {MCP_SERVERS.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Tool Name</label>
              <input type="text" value={invokeTool} onChange={(e) => setInvokeTool(e.target.value)} placeholder="e.g. get_citizen, lookup_vehicle, get_tax_record" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Arguments (JSON)</label>
              <textarea value={invokeArgs} onChange={(e) => setInvokeArgs(e.target.value)} rows={5} placeholder='{"citizen_id": "CIT-00001"}' style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' as const }} />
            </div>

            <button
              onClick={handleInvoke} disabled={invokeLoading}
              style={{ width: '100%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', color: 'white', border: 'none', borderRadius: '6px', padding: '10px', fontSize: '14px', fontWeight: '600', cursor: invokeLoading ? 'not-allowed' : 'pointer', marginBottom: '14px', opacity: invokeLoading ? 0.7 : 1 }}>
              {invokeLoading ? 'Invoking...' : 'Execute Tool'}
            </button>

            {invokeError && (
              <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', padding: '10px', color: '#DC2626', fontSize: '12px', marginBottom: '10px' }}>
                Error: {invokeError}
              </div>
            )}
            {invokeResult && (
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Result:</div>
                <pre style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '10px', color: '#16A34A', fontSize: '11px', fontFamily: 'monospace', overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {invokeResult}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280', letterSpacing: '0.05em' }}>MCP AUDIT LOG</h2>
            <button onClick={() => loadAuditLog(token)} style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}>Refresh</button>
          </div>
          {auditLoading ? (
            <div style={{ color: '#6B7280', fontSize: '13px' }}>Loading audit log...</div>
          ) : auditLog.length === 0 ? (
            <div style={{ color: '#D1D5DB', fontSize: '13px' }}>No audit entries found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                    {['ID', 'Session', 'Server', 'Tool', 'Args', 'Called At'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6B7280', fontWeight: '600', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '7px 10px', color: '#9CA3AF', fontFamily: 'monospace' }}>{entry.id}</td>
                      <td style={{ padding: '7px 10px', color: '#6B7280', fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.session_id}</td>
                      <td style={{ padding: '7px 10px', color: '#0891B2', fontFamily: 'monospace' }}>{entry.mcp_server}</td>
                      <td style={{ padding: '7px 10px', color: '#1D4ED8', fontFamily: 'monospace' }}>{entry.tool_name}</td>
                      <td style={{ padding: '7px 10px', color: '#374151', fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(entry.tool_args)}</td>
                      <td style={{ padding: '7px 10px', color: '#9CA3AF', fontFamily: 'monospace' }}>{new Date(entry.called_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
