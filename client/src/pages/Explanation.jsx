import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const styleSheet = `@keyframes blink { 50% { opacity: 0; } }`;

const Explanation = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const subject = searchParams.get('subject') || '';
  const unit = searchParams.get('unit') || '';

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTab, setActiveTab] = useState('context'); // 'context' or 'history'
  const chatEndRef = useRef(null);

  const handleReadAloud = (text) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const question = inputText;
    setMessages(m => [...m, { role: 'user', content: question }]);
    setInputText('');
    setIsStreaming(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/explanation/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ question, topic: activeContext.topic })
      });

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      setMessages(m => [...m, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            fullText += parsed.content;
            setMessages(m => { const updated = [...m]; updated[updated.length - 1] = { role: 'assistant', content: fullText }; return updated; });
          } catch {}
        }
      }
    } catch (err) {
      console.error('Explanation error:', err);
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const [activeContext, setActiveContext] = useState({ topic, subject, unit });

  useEffect(() => {
    setActiveContext({ topic, subject, unit });
  }, [topic, subject, unit]);

  const handleSelectTopic = (topName, subjName, unitName) => {
    setActiveContext({ topic: topName, subject: subjName, unit: unitName });
  };

  const [expandedNodes, setExpandedNodes] = useState({});
  const toggleNode = (id) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));

  const currentTopic = activeContext.topic || '';
  
  const activeSyllabus = user?.syllabi?.find(s => s._id === user.activeSyllabusId) || user?.syllabi?.[0] || user?.syllabus;
  const subjects = activeSyllabus?.subjects || [];

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 64px)' }}>
      <style>{styleSheet}</style>
      <div className="card" style={{ flex: '0 0 30%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('context')}
            style={{ flex: 1, padding: '8px', background: 'none', border: 'none', borderBottom: activeTab === 'context' ? '2px solid var(--accent)' : 'none', color: activeTab === 'context' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'context' ? '600' : '400', cursor: 'pointer', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}
          >
            Context
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ flex: 1, padding: '8px', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : 'none', color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'history' ? '600' : '400', cursor: 'pointer', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}
          >
            History
          </button>
        </div>

        {activeTab === 'context' ? (
          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Syllabus Context</h3>
            {subjects.length > 0 ? (
              <div>
                {subjects.map((subj, i) => {
                  const subjId = `subj-${i}`;
                  const isSubjOpen = expandedNodes[subjId];
                  return (
                    <div key={i} style={{ marginBottom: '16px' }}>
                      <div 
                        onClick={() => toggleNode(subjId)}
                        style={{ fontWeight: '600', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span>{subj.name}</span>
                        <span style={{ fontSize: '12px', transition: 'transform 0.3s', transform: isSubjOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </div>
                      {isSubjOpen && subj.units.map((u, j) => {
                        const unitId = `unit-${i}-${j}`;
                        const isUnitOpen = expandedNodes[unitId];
                        return (
                          <div key={j} style={{ paddingLeft: '16px', marginBottom: '8px' }}>
                            <div 
                              onClick={() => toggleNode(unitId)}
                              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                              <span>{u.name}</span>
                              <span style={{ fontSize: '10px', transition: 'transform 0.3s', transform: isUnitOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                            </div>
                            {isUnitOpen && (
                              <ul style={{ paddingLeft: '16px', margin: 0, listStyle: 'none' }}>
                                {u.topics.map((t, k) => (
                                  <li key={k} style={{ marginBottom: '4px' }}>
                                    <button 
                                      style={{ background: 'none', border: 'none', padding: 0, color: currentTopic === t.name ? 'var(--accent)' : 'var(--text-muted)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTopic === t.name ? '600' : '400' }}
                                      onClick={() => handleSelectTopic(t.name, subj.name, u.name)}
                                    >
                                      {t.name}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>Upload a syllabus to get strict topic context.</div>
            )}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Recent Queries</h3>
            {user?.explanation_history?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user.explanation_history.map((h, i) => (
                  <div key={i} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setInputText(h.question)}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>{h.question}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{h.topic} • {new Date(h.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No recent questions yet.</div>
            )}
          </div>
        )}
      </div>
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{currentTopic || 'Ask anything'}</h2>
            {activeContext.subject && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                {activeContext.subject} &rsaquo; {activeContext.unit}
              </div>
            )}
          </div>
          <span className="tag" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>AI Tutor</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{msg.role === 'user' ? user?.name : 'GyaanSetu AI'}</div>
              <div style={{ position: 'relative', background: msg.role === 'user' ? 'var(--accent-light)' : 'var(--surface)', border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none', padding: '12px 16px', borderRadius: '6px', maxWidth: '80%', whiteSpace: 'pre-wrap' }}>
                {msg.content}
                {msg.role === 'assistant' && msg.content && (
                  <button 
                    onClick={() => handleReadAloud(msg.content)}
                    style={{ position: 'absolute', top: '8px', right: '-40px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }}
                    title="Read Aloud"
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>GyaanSetu AI</div>
              <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <form style={{ display: 'flex', gap: '12px' }} onSubmit={handleSend}>
            <input type="text" placeholder="Ask a question..." value={inputText} onChange={e => setInputText(e.target.value)} disabled={isStreaming} style={{ flex: 1 }} />
            <button type="submit" className="btn-primary" disabled={isStreaming || !inputText.trim()}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Explanation;
