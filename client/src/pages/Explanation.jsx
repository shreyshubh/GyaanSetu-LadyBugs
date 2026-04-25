import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const styleSheet = `
  @keyframes blink {
    50% { opacity: 0; }
  }
`;

const Explanation = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';

  const [messages, setMessages] = useState([
    { role: 'user', content: 'Explain Binary Search Tree to me' },
    { role: 'assistant', content: 'A Binary Search Tree (BST) is a hierarchical data structure where each node has at most two children...' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([...messages, { role: 'user', content: inputText }]);
    setInputText('');
    setIsStreaming(true);

    // Mock stream timeout
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', content: 'This is a mocked explanation stream response...' }]);
      setIsStreaming(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)' }}>
      <style>{styleSheet}</style>
      
      {/* Context Panel (30%) */}
      <div className="card" style={{ flex: '0 0 30%', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Current Topic Context</h3>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>Binary Search Tree</h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
          Data Structures / Unit 2: Trees
        </div>
        <div className="tag tag-weak">Weak</div>
      </div>

      {/* Chat Panel (70%) */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)' }}>{t('explanation', lang)}</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' 
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {msg.role === 'user' ? user?.name : 'GyaanSetu AI'}
              </div>
              <div style={{ 
                background: msg.role === 'user' ? 'var(--accent-light)' : 'var(--surface)',
                border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                padding: '12px 16px',
                borderRadius: '6px',
                maxWidth: '80%'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
               <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                GyaanSetu AI
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <form style={{ display: 'flex', gap: '12px' }} onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Ask a clarifying question..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isStreaming}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" disabled={isStreaming || !inputText.trim()}>
              Send
            </button>
          </form>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button className="btn-secondary">{t('take_quiz', lang)}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explanation;
