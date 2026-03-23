'use client';

import { useEffect, useRef, useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { chat } from '@/lib/api';
import { getToken, isAuthenticated, getUserFromToken } from '@/lib/auth';
import { NavBar } from '@/components/NavBar';
import { useTheme } from '@/components/ThemeProvider';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface McpToolCall {
  server: string;
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: string;
}

interface ChatResponse {
  response: string;
  session_id: string;
  mcp_calls?: McpToolCall[];
}

function generateSessionId() {
  return 'sess-' + Math.random().toString(36).substr(2, 12);
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = searchParams.get('context');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [mcpCalls, setMcpCalls] = useState<McpToolCall[]>([]);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/'); return; }
    const t = getToken();
    setTokenState(t);
    if (t) setUser(getUserFromToken(t));
    const sid = generateSessionId();
    setSessionId(sid);

    const contextLabels: Record<string, string> = {
      citizen_records: 'Citizen Records', dmv: 'DMV Services', tax: 'Tax Authority',
      permit: 'Permit Office', health: 'Health Registry', docs: 'Internal Documents',
      notify: 'Notifications', files: 'File Storage',
    };
    const contextLabel = context ? contextLabels[context] : null;

    setMessages([{
      role: 'assistant',
      content: contextLabel
        ? `Welcome to GovConnect AI. I am your AI assistant with access to the ${contextLabel} system. How can I help you today?`
        : `Welcome to GovConnect AI. I am your AI assistant for the City of Neo Meridian. I have access to multiple government service systems including Citizen Records, DMV, Tax Authority, Permit Office, Health Registry, Internal Documents, Notifications, and File Storage. How can I assist you today?`,
      timestamp: new Date().toISOString(),
    }]);
  }, [router, context]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !token) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }]);
    setLoading(true);

    try {
      const data: ChatResponse = await chat(userMessage, sessionId, token);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response, timestamp: new Date().toISOString() }]);
      if (data.mcp_calls && data.mcp_calls.length > 0) {
        setMcpCalls((prev) => [...prev, ...data.mcp_calls!]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${message}`, timestamp: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const clearHistory = () => {
    setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I assist you?', timestamp: new Date().toISOString() }]);
    setMcpCalls([]);
    setSessionId(generateSessionId());
  };

  // Theme-aware style tokens
  const bg = isDark ? '#0B0B0D' : '#F3F4F6';
  const surface = isDark ? '#111217' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const textPrimary = isDark ? '#E3E1E9' : '#111827';
  const textMuted = isDark ? '#71717a' : '#6B7280';
  const textDim = isDark ? '#52525b' : '#9CA3AF';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bg,
        backgroundImage: isDark
          ? 'linear-gradient(to right, rgba(227,225,233,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(227,225,233,0.03) 1px, transparent 1px)'
          : 'none',
        backgroundSize: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <NavBar username={user?.username} role={user?.role} />

      {/* Chat sub-header */}
      <div
        style={{
          backgroundColor: surface,
          borderBottom: `1px solid ${borderColor}`,
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            🤖
          </div>
          <div>
            <div
              style={{
                fontWeight: '600',
                color: textPrimary,
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              GovConnect AI Assistant
            </div>
            <div
              style={{
                fontSize: '10px',
                color: textDim,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.04em',
              }}
            >
              Session: {sessionId}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={clearHistory}
            style={{
              backgroundColor: isDark ? '#181A20' : '#F9FAFB',
              border: `1px solid ${borderColor}`,
              color: textMuted,
              borderRadius: '4px',
              padding: '5px 12px',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Clear History
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: isDark ? '#181A20' : '#F9FAFB',
              border: `1px solid ${borderColor}`,
              color: textMuted,
              borderRadius: '4px',
              padding: '5px 12px',
              fontSize: '10px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Main content: chat + MCP panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          height: 'calc(100vh - 130px)',
        }}
      >
        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                {msg.role === 'assistant' && (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    🤖
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '70%',
                    backgroundColor: msg.role === 'user'
                      ? 'rgba(255,106,0,0.15)'
                      : surface,
                    border: msg.role === 'user'
                      ? '1px solid rgba(255,106,0,0.3)'
                      : `1px solid ${borderColor}`,
                    borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                    padding: '12px 16px',
                    color: msg.role === 'user' ? '#FF6A00' : textPrimary,
                    fontSize: '13px',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                  {msg.timestamp && (
                    <div
                      style={{
                        fontSize: '10px',
                        color: textDim,
                        marginTop: '6px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      backgroundColor: isDark ? 'rgba(255,193,7,0.1)' : '#DBEAFE',
                      border: `1px solid ${isDark ? 'rgba(255,193,7,0.2)' : '#BFDBFE'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  🤖
                </div>
                <div
                  style={{
                    backgroundColor: surface,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '10px 10px 10px 2px',
                    padding: '14px 18px',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#FF6A00',
                        display: 'inline-block',
                        animation: `pulse-dot 1.2s ease-in-out ${idx * 0.2}s infinite`,
                      }}
                    />
                  ))}
                  <style>{`
                    @keyframes pulse-dot {
                      0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                      40% { opacity: 1; transform: scale(1); }
                    }
                  `}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: `1px solid ${borderColor}`,
              padding: '16px 24px',
              backgroundColor: surface,
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about citizen services, records, permits, tax info... (Enter to send, Shift+Enter for newline)"
                rows={2}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#181A20' : '#F9FAFB',
                  border: '0',
                  borderBottom: `1px solid ${isDark ? '#3f3f46' : '#E5E7EB'}`,
                  padding: '10px 14px',
                  color: textPrimary,
                  fontSize: '13px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.5,
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#FF6A00')}
                onBlur={(e) => (e.target.style.borderBottomColor = isDark ? '#3f3f46' : '#E5E7EB')}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  background: loading || !input.trim()
                    ? 'rgba(255,106,0,0.3)'
                    : 'linear-gradient(135deg, #FF6A00 0%, #FFC107 100%)',
                  color: loading || !input.trim() ? 'rgba(0,0,0,0.5)' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 20px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  height: '58px',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? '...' : 'Send →'}
              </button>
            </form>
          </div>
        </div>

        {/* MCP Tool Call Transparency Panel */}
        <div
          style={{
            width: '320px',
            borderLeft: `1px solid ${borderColor}`,
            backgroundColor: isDark ? '#0d0e13' : '#F9FAFB',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${borderColor}`,
              backgroundColor: surface,
            }}
          >
            <div
              style={{
                fontWeight: '700',
                color: '#FF6A00',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              // MCP TOOL CALL TRANSPARENCY
            </div>
            <div
              style={{
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                color: textDim,
                marginTop: '2px',
              }}
            >
              Live view of AI tool invocations
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {mcpCalls.length === 0 ? (
              <div
                style={{
                  color: textDim,
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  textAlign: 'center',
                  padding: '32px 12px',
                  lineHeight: 1.7,
                }}
              >
                No MCP tool calls yet.
                <br />
                Send a message to see AI tool invocations appear here in real-time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mcpCalls.map((call, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: surface,
                      border: `1px solid ${borderColor}`,
                      borderLeft: '2px solid #FF6A00',
                      borderRadius: '4px',
                      padding: '10px',
                      fontSize: '11px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          color: '#FF6A00',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: '600',
                          fontSize: '10px',
                        }}
                      >
                        {call.server}
                      </span>
                      <span
                        style={{
                          color: textDim,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '9px',
                        }}
                      >
                        {new Date(call.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div
                      style={{
                        color: '#FFC107',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: '6px',
                        fontSize: '11px',
                      }}
                    >
                      {call.tool}()
                    </div>
                    <div style={{ color: textMuted, marginBottom: '4px', fontSize: '9px', letterSpacing: '0.06em' }}>
                      ARGS:
                    </div>
                    <pre
                      style={{
                        color: textPrimary,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        backgroundColor: isDark ? '#181A20' : '#F3F4F6',
                        padding: '6px',
                        borderRadius: '2px',
                        overflow: 'auto',
                        maxHeight: '80px',
                        marginBottom: '6px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {JSON.stringify(call.args, null, 2)}
                    </pre>
                    <div style={{ color: textMuted, marginBottom: '4px', fontSize: '9px', letterSpacing: '0.06em' }}>
                      RESULT:
                    </div>
                    <pre
                      style={{
                        color: '#4ade80',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        backgroundColor: isDark ? 'rgba(74,222,128,0.05)' : '#F0FDF4',
                        border: `1px solid ${isDark ? 'rgba(74,222,128,0.1)' : '#BBF7D0'}`,
                        padding: '6px',
                        borderRadius: '2px',
                        overflow: 'auto',
                        maxHeight: '80px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              borderTop: `1px solid ${borderColor}`,
              padding: '8px 12px',
              fontSize: '9px',
              fontFamily: "'JetBrains Mono', monospace",
              color: textDim,
              backgroundColor: surface,
              letterSpacing: '0.06em',
            }}
          >
            {mcpCalls.length} TOOL CALL{mcpCalls.length !== 1 ? 'S' : ''} THIS SESSION
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#0B0B0D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            color: '#52525b',
            fontSize: '12px',
          }}
        >
          // LOADING...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
