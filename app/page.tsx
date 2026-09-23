'use client';

import React, { useState } from 'react';

interface Message {
  role: string;
  content: string;
  responseTime?: number;
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'User', content: input };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const startTime = Date.now();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (data.reply) {
        setMessages([
          ...updatedMessages, 
          { role: 'Agent', content: data.reply, responseTime: Number(duration) }
        ]);
      } else {
        setMessages([
          ...updatedMessages, 
          { role: 'Agent', content: `Error: ${data.error}`, responseTime: Number(duration) }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <main style={{ maxWidth: '700px', margin: '30px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Retail Data Agent</h2>
        <button 
          onClick={clearChat}
          style={{ background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
        >
          ðŸ—‘ï¸ Clear chat
        </button>
      </div>

      <div style={{ border: '1px solid #ddd', height: '450px', overflowY: 'scroll', padding: '15px', marginBottom: '20px', background: '#fafafa', borderRadius: '8px' }}>
        {messages.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', marginTop: '150px' }}>Ask a question to test the data agent's response</p>
        )}
        
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '15px 0', textAlign: m.role === 'User' ? 'right' : 'left' }}>
            <strong style={{ fontSize: '13px', color: '#555' }}>{m.role}:</strong>
            <div style={{ 
              background: m.role === 'User' ? '#e1ffd6' : '#fff', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              display: 'inline-block', 
              maxWidth: '85%', 
              textAlign: 'left',
              border: m.role === 'Agent' ? '1px solid #e0e0e0' : 'none',
              boxShadow: m.role === 'Agent' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              marginTop: '4px'
            }}>
              {/* Preserves line breaks and lists returned by Fabric */}
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                {m.content}
              </p>
              
              {m.role === 'Agent' && m.responseTime !== undefined && (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px', textAlign: 'right' }}>
                  â±ï¸ Response time: {m.responseTime} sec
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <p style={{ color: '#666', fontStyle: 'italic' }}>Agent is thinking...</p>}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your retail data..."
          style={{ flex: 1, padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px 20px', fontSize: '15px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </main>
  );
}
