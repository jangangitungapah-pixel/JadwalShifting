import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { queryOllama } from '../utils/ollamaEngine';
import { sounds } from '../utils/soundService';

const AIChatbot = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Halo! 👋 Saya **ShiftBot**, asisten AI cerdas ShiftSync.\n\nSaya terhubung langsung ke seluruh data aplikasi Anda. Tanyakan apa saja seputar jadwal, karyawan, cuti, atau analisis shift!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    if (!isOpen) sounds.modalOpen();
    else sounds.modalClose();
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    sounds.success();
    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await queryOllama(userMsg, context);
      sounds.notification();
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Maaf, terjadi kesalahan: ' + error.message }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Simple markdown bold rendering
  const renderText = (text) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="animate-fade-in-up chatbot-toggle"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-deep), var(--color-secondary))',
            border: '2px solid rgba(255,255,255,0.15)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            cursor: 'pointer',
            zIndex: 9999,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12) rotate(-5deg)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.55), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) rotate(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
        >
          <Sparkles size={26} />
        </button>
      )}

      {isOpen && (
        <div
          className="animate-fade-in-up chatbot-window"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '380px',
            height: '540px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            borderRadius: '1.5rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
            background: 'var(--bg-deep)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '1.1rem 1.25rem', 
            background: 'linear-gradient(135deg, var(--color-primary-deep), var(--color-primary), var(--color-secondary))', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>ShiftBot AI</h3>
                <p style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Powered by Gemini</p>
              </div>
            </div>
            <button onClick={toggleChat} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', padding: '0.4rem', transition: 'all 0.2s', position: 'relative' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            ><X size={16} /></button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--bg-main)' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', animation: 'fadeInUp 0.3s ease-out' }}>
                {msg.sender === 'bot' && <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-primary)', border: '1px solid rgba(129,140,248,0.15)' }}><Sparkles size={14} /></div>}
                <div style={{
                  padding: '0.8rem 1rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--color-primary-deep), var(--color-primary))' : 'var(--bg-elevated)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.82rem',
                  lineHeight: '1.55',
                  boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(99,102,241,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                  whiteSpace: 'pre-wrap',
                  border: msg.sender === 'bot' ? '1px solid var(--glass-border)' : 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-secondary-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', border: '1px solid rgba(129,140,248,0.15)' }}><Sparkles size={14} /></div>
                <div style={{ padding: '0.8rem 1.2rem', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--glass-border)' }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-primary)', opacity: 0.6, animation: `breathe 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '0.85rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="input"
              placeholder="Tanya ShiftBot..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isTyping}
              style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '999px', opacity: isTyping ? 0.5 : 1, fontSize: '0.82rem' }}
            />
            <button type="submit" disabled={isTyping || !input.trim()} className="btn btn-primary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isTyping || !input.trim() ? 0.4 : 1, flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
