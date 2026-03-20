'use client';

import { useEffect, useRef, useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { chat, getChatHistory } from '@/lib/api';
import { getToken, isAuthenticated, getUserFromToken } from '@/lib/auth';

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

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
          <div>
            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>GovConnect AI Assistant</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>Session: {sessionId}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user && <span style={{ fontSize: '12px', color: '#6B7280' }}>Logged in as: <span style={{ color: '#1D4ED8', fontWeight: '600' }}>{user.username}</span></span>}
          <button onClick={clearHistory} style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>Clear History</button>
          <button onClick={() => router.push('/dashboard')} style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>Dashboard</button>
        </div>
      </div>

      {/* Main content: chat + MCP panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: 'calc(100vh - 130px)' }}>
        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '10px' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>🤖</div>
                )}
                <div style={{ maxWidth: '70%', backgroundColor: msg.role === 'user' ? '#1D4ED8' : '#FFFFFF', border: msg.role === 'user' ? 'none' : '1px solid #E5E7EB', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '12px 16px', color: msg.role === 'user' ? 'white' : '#111827', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
                  {msg.content}
                  {msg.timestamp && (
                    <div style={{ fontSize: '10px', color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : '#9CA3AF', marginTop: '6px' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>👤</div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>🤖</div>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px 12px 12px 2px', padding: '14px 18px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#3B82F6', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                  <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 24px', backgroundColor: '#FFFFFF' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask about citizen services, records, permits, tax info... (Enter to send, Shift+Enter for newline)"
                rows={2}
                style={{ flex: 1, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', color: '#111827', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
              <button
                type="submit" disabled={loading || !input.trim()}
                style={{ background: loading || !input.trim() ? '#93C5FD' : 'linear-gradient(135deg, #1D4ED8, #3B82F6)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', height: '58px' }}>
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* MCP Tool Call Transparency Panel */}
        <div style={{ width: '340px', borderLeft: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
            <div style={{ fontWeight: '600', color: '#FF6B00', fontSize: '12px', letterSpacing: '0.06em' }}>MCP TOOL CALL TRANSPARENCY</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>Live view of AI tool invocations</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {mcpCalls.length === 0 ? (
              <div style={{ color: '#D1D5DB', fontSize: '12px', textAlign: 'center', padding: '24px 12px', lineHeight: 1.6 }}>
                No MCP tool calls yet. Send a message to see AI tool invocations appear here in real-time.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mcpCalls.map((call, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderLeft: '3px solid #1D4ED8', borderRadius: '6px', padding: '10px', fontSize: '11px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#1D4ED8', fontWeight: '600' }}>{call.server}</span>
                      <span style={{ color: '#9CA3AF' }}>{new Date(call.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: '#3B82F6', fontFamily: 'monospace', marginBottom: '6px' }}>{call.tool}()</div>
                    <div style={{ color: '#6B7280', marginBottom: '4px' }}>Args:</div>
                    <pre style={{ color: '#374151', fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#F3F4F6', padding: '6px', borderRadius: '4px', overflow: 'auto', maxHeight: '80px', marginBottom: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(call.args, null, 2)}
                    </pre>
                    <div style={{ color: '#6B7280', marginBottom: '4px' }}>Result:</div>
                    <pre style={{ color: '#16A34A', fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px', borderRadius: '4px', overflow: 'auto', maxHeight: '80px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #E5E7EB', padding: '10px 12px', fontSize: '10px', color: '#9CA3AF', backgroundColor: '#FFFFFF' }}>
            {mcpCalls.length} tool call{mcpCalls.length !== 1 ? 's' : ''} this session
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ color: '#6B7280', padding: '2rem' }}>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
