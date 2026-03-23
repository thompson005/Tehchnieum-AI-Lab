'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMcpTools, invokeMcpTool, getMcpAuditLog } from '@/lib/api';
import { getToken, isAuthenticated } from '@/lib/auth';
import { NavBar } from '@/components/NavBar';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  // Theme-aware style tokens
  const bg = isDark ? '#0B0B0D' : '#F3F4F6';
  const surface = isDark ? '#111217' : '#FFFFFF';
  const surfaceLow = isDark ? '#181A20' : '#F9FAFB';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const textPrimary = isDark ? '#E3E1E9' : '#111827';
  const textMuted = isDark ? '#71717a' : '#6B7280';
  const textDim = isDark ? '#52525b' : '#9CA3AF';

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: isDark ? '#181A20' : '#F9FAFB',
    border: '0',
    borderBottom: `1px solid ${isDark ? '#3f3f46' : '#E5E7EB'}`,
    padding: '10px 12px',
    color: textPrimary,
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bg,
        backgroundImage: isDark
          ? 'linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <NavBar />

      <div style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: textPrimary,
                  fontFamily: "'Inter', sans-serif",
                  margin: 0,
                }}
              >
                MCP Debug Console
              </h1>
              <span
                style={{
                  backgroundColor: 'rgba(255,106,0,0.1)',
                  border: '1px solid rgba(255,106,0,0.25)',
                  color: '#FF6A00',
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700',
                  padding: '3px 10px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                DEV TOOL
              </span>
            </div>
            <p style={{ color: textMuted, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
              Inspect MCP servers, list tools, invoke tools directly, and view audit logs.{' '}
              <span style={{ color: '#f87171' }}>
                [LAB NOTE: This page is intentionally accessible to all users — it should be admin-only.]
              </span>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            {/* MCP Servers list */}
            <div
              style={{
                backgroundColor: surface,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: `1px solid ${borderColor}`,
                  backgroundColor: isDark ? '#181A20' : '#F9FAFB',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700',
                    color: textMuted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  // MCP SERVERS
                </span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto' }}>
                {MCP_SERVERS.map((server) => (
                  <div
                    key={server.name}
                    style={{
                      backgroundColor: surfaceLow,
                      border: `1px solid ${borderColor}`,
                      borderRadius: '6px',
                      padding: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '12px',
                            color: '#FF6A00',
                            fontWeight: '600',
                          }}
                        >
                          {server.name}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: textDim,
                            marginTop: '2px',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {server.description}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '10px',
                            color: textDim,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          :{server.port}
                        </div>
                        <div
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#4ade80',
                            marginLeft: 'auto',
                            marginTop: '4px',
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => listTools(server.name)}
                      disabled={loadingTools === server.name}
                      style={{
                        backgroundColor: isDark ? 'rgba(255,106,0,0.08)' : '#F3F4F6',
                        border: `1px solid ${isDark ? 'rgba(255,106,0,0.2)' : '#E5E7EB'}`,
                        color: isDark ? '#FF6A00' : '#374151',
                        borderRadius: '3px',
                        padding: '4px 12px',
                        fontSize: '9px',
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: loadingTools === server.name ? 'not-allowed' : 'pointer',
                        marginBottom: tools[server.name] ? '8px' : '0',
                        transition: 'all 0.2s',
                      }}
                    >
                      {loadingTools === server.name ? '// Loading...' : 'List Tools'}
                    </button>
                    {tools[server.name] && (
                      <pre
                        style={{
                          backgroundColor: isDark ? '#0d0e13' : '#F3F4F6',
                          border: `1px solid ${borderColor}`,
                          borderRadius: '3px',
                          padding: '8px',
                          fontSize: '10px',
                          color: isDark ? '#4ade80' : '#374151',
                          overflow: 'auto',
                          maxHeight: '120px',
                          fontFamily: "'JetBrains Mono', monospace",
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {JSON.stringify(tools[server.name], null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Direct tool invoke */}
            <div
              style={{
                backgroundColor: surface,
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: `1px solid ${borderColor}`,
                  backgroundColor: isDark ? '#181A20' : '#F9FAFB',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700',
                    color: textMuted,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  // DIRECT TOOL INVOCATION
                </span>
              </div>
              <div style={{ padding: '20px' }}>
                <p
                  style={{
                    fontSize: '10px',
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#f87171',
                    marginBottom: '20px',
                    letterSpacing: '0.04em',
                  }}
                >
                  Calls POST /api/mcp/invoke — authentication check only, no authorization enforcement.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700',
                      color: textMuted,
                      marginBottom: '8px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    MCP Server
                  </label>
                  <select
                    value={invokeServer}
                    onChange={(e) => setInvokeServer(e.target.value)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#FF6A00')}
                    onBlur={(e) => (e.target.style.borderBottomColor = isDark ? '#3f3f46' : '#E5E7EB')}
                  >
                    {MCP_SERVERS.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700',
                      color: textMuted,
                      marginBottom: '8px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Tool Name
                  </label>
                  <input
                    type="text"
                    value={invokeTool}
                    onChange={(e) => setInvokeTool(e.target.value)}
                    placeholder="e.g. get_citizen, lookup_vehicle, get_tax_record"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#FF6A00')}
                    onBlur={(e) => (e.target.style.borderBottomColor = isDark ? '#3f3f46' : '#E5E7EB')}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700',
                      color: textMuted,
                      marginBottom: '8px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Arguments (JSON)
                  </label>
                  <textarea
                    value={invokeArgs}
                    onChange={(e) => setInvokeArgs(e.target.value)}
                    rows={5}
                    placeholder='{"citizen_id": "CIT-00001"}'
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                    onFocus={(e) => (e.target.style.borderBottomColor = '#FF6A00')}
                    onBlur={(e) => (e.target.style.borderBottomColor = isDark ? '#3f3f46' : '#E5E7EB')}
                  />
                </div>

                <button
                  onClick={handleInvoke}
                  disabled={invokeLoading}
                  style={{
                    width: '100%',
                    background: invokeLoading
                      ? 'rgba(255,106,0,0.3)'
                      : 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                    color: invokeLoading ? 'rgba(0,0,0,0.4)' : '#000',
                    border: 'none',
                    padding: '12px',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: '700',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: invokeLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '16px',
                    transition: 'all 0.2s',
                  }}
                >
                  {invokeLoading ? '// Executing...' : 'Execute Tool →'}
                </button>

                {invokeError && (
                  <div
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '4px',
                      padding: '10px 14px',
                      color: '#f87171',
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      marginBottom: '10px',
                    }}
                  >
                    ERROR: {invokeError}
                  </div>
                )}
                {invokeResult && (
                  <div>
                    <div
                      style={{
                        fontSize: '9px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: textMuted,
                        marginBottom: '6px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Result:
                    </div>
                    <pre
                      style={{
                        backgroundColor: isDark ? 'rgba(74,222,128,0.05)' : '#F0FDF4',
                        border: `1px solid ${isDark ? 'rgba(74,222,128,0.12)' : '#BBF7D0'}`,
                        borderRadius: '4px',
                        padding: '10px',
                        color: '#4ade80',
                        fontSize: '11px',
                        fontFamily: "'JetBrains Mono', monospace",
                        overflow: 'auto',
                        maxHeight: '200px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {invokeResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit log */}
          <div
            style={{
              backgroundColor: surface,
              border: `1px solid ${borderColor}`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#181A20' : '#F9FAFB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700',
                  color: textMuted,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                // MCP AUDIT LOG
              </span>
              <button
                onClick={() => loadAuditLog(token)}
                style={{
                  backgroundColor: isDark ? 'rgba(255,106,0,0.08)' : '#F3F4F6',
                  border: `1px solid ${isDark ? 'rgba(255,106,0,0.2)' : '#E5E7EB'}`,
                  color: isDark ? '#FF6A00' : '#374151',
                  borderRadius: '3px',
                  padding: '4px 12px',
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Refresh
              </button>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              {auditLoading ? (
                <div
                  style={{
                    padding: '24px 0',
                    color: textMuted,
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace',",
                  }}
                >
                  // Loading audit log...
                </div>
              ) : auditLog.length === 0 ? (
                <div
                  style={{
                    padding: '24px 0',
                    color: textDim,
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  No audit entries found.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                        {['ID', 'Session', 'Server', 'Tool', 'Args', 'Called At'].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: 'left',
                              padding: '10px 10px',
                              fontFamily: "'JetBrains Mono', monospace",
                              color: textDim,
                              fontWeight: '400',
                              fontSize: '9px',
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((entry) => (
                        <tr
                          key={entry.id}
                          style={{
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB'}`,
                          }}
                        >
                          <td
                            style={{
                              padding: '8px 10px',
                              color: textDim,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '10px',
                            }}
                          >
                            {entry.id}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: textMuted,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '10px',
                              maxWidth: '120px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {entry.session_id}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: '#FFC107',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '10px',
                            }}
                          >
                            {entry.mcp_server}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: '#FF6A00',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '10px',
                            }}
                          >
                            {entry.tool_name}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: textMuted,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '10px',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {JSON.stringify(entry.tool_args)}
                          </td>
                          <td
                            style={{
                              padding: '8px 10px',
                              color: textDim,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: '10px',
                            }}
                          >
                            {new Date(entry.called_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
