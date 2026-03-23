import React, { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(userMessage, sessionId);
      setSessionId(response.data.session_id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I apologize, but I encountered an error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            width: '3.5rem', height: '3.5rem', borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(255,106,0,0.35)', zIndex: 50,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(255,106,0,0.5)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,106,0,0.35)'; }}
          title="Chat with Eva"
        >
          <svg width="22" height="22" fill="none" stroke="#000" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem',
          width: '24rem', height: '38rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', zIndex: 50,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--surface-high)', padding: '1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, color: '#000', fontSize: '0.75rem',
              }}>E</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text)' }}>Chat with Eva</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>Online · AI Banking Assistant</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '0.375rem', transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg)' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.75rem', fontWeight: 900, color: '#000', fontSize: '1rem',
                }}>E</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: '0.35rem', fontWeight: 600 }}>Hi, I'm Eva!</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your AI banking assistant.</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ask about accounts, rates, or policies!</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  padding: '0.65rem 0.9rem', fontSize: '0.82rem',
                  ...(msg.role === 'user'
                    ? { background: 'linear-gradient(135deg,#FF6A00,#FFC107)', color: '#000', fontWeight: 500 }
                    : { background: 'var(--surface-low)', border: '1px solid var(--border)', color: 'var(--text)' }),
                }}>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: 'var(--surface-low)', border: '1px solid var(--border)',
                  borderRadius: '1rem 1rem 1rem 0.25rem', padding: '0.65rem 0.9rem',
                }}>
                  <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: '0.45rem', height: '0.45rem', borderRadius: '50%',
                        background: 'var(--text-muted)', display: 'inline-block',
                        animation: `bounce 1s infinite ${i * 0.15}s`,
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'JetBrains Mono, monospace' }}>Eva is thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                style={{
                  flex: 1, background: 'var(--surface-low)',
                  border: 'none', borderBottom: '1px solid var(--border-solid)',
                  padding: '0.5rem 0.25rem', fontSize: '0.82rem', color: 'var(--text)',
                  outline: 'none', fontFamily: 'Inter, sans-serif',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderBottomColor = '#FF6A00'}
                onBlur={e => e.target.style.borderBottomColor = 'var(--border-solid)'}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={{
                  background: 'linear-gradient(135deg,#FF6A00,#FFC107)',
                  border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  padding: '0.5rem 0.875rem', color: '#000', fontWeight: 700,
                  fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
                  opacity: loading || !input.trim() ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                Send
              </button>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
              AI generated. Not financial advice.
            </p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
