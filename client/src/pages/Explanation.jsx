import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const styleSheet = `@keyframes blink { 50% { opacity: 0; } }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.3); } }
.explanation-layout { display: flex; gap: 24px; height: calc(100vh - 64px); }
.history-panel { flex: 0 0 22%; overflow-y: auto; display: flex; flex-direction: column; padding: 20px; }
.context-panel { flex: 0 0 25%; overflow-y: auto; display: flex; flex-direction: column; }
.chat-panel { flex: 1; display: flex; flex-direction: column; padding: 0; }
@media (max-width: 1024px) {
  .explanation-layout { flex-direction: column; height: auto; min-height: calc(100vh - 64px); }
  .history-panel { flex: none; height: 250px; }
  .context-panel { flex: none; height: 250px; }
  .chat-panel { flex: none; min-height: 60vh; }
}`;

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
  const [activeTab, setActiveTab] = useState('context');
  const chatEndRef = useRef(null);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceHelper, setVoiceHelper] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const recognitionRef = useRef(null);

  // Conversation history state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleReadAloud = (text) => {
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load conversation history
  useEffect(() => {
    axios.get('/api/explanation/history').then(r => setConversations(r.data)).catch(() => {});
  }, []);

  const saveMessage = async (convId, role, content) => {
    try { await axios.put(`/api/explanation/history/${convId}`, { role, content }); } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const question = inputText;
    setMessages(m => [...m, { role: 'user', content: question }]);
    setInputText('');
    setVoiceHelper('');
    setIsStreaming(true);

    // Create conversation if needed
    let convId = activeConvId;
    if (!convId) {
      try {
        const { data } = await axios.post('/api/explanation/history', { topic: activeContext.topic, subject: activeContext.subject });
        convId = data._id;
        setActiveConvId(convId);
      } catch {}
    }

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
          try { const parsed = JSON.parse(data); fullText += parsed.content; setMessages(m => { const u = [...m]; u[u.length - 1] = { role: 'assistant', content: fullText }; return u; }); } catch {}
        }
      }
      // Save messages to conversation sequentially to guarantee order
      if (convId) {
        await saveMessage(convId, 'user', question);
        await saveMessage(convId, 'assistant', fullText);
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: t('sorry_error', lang) }]);
    } finally {
      setIsStreaming(false);
      axios.get('/api/explanation/history').then(r => setConversations(r.data)).catch(() => {});
    }
  };

  const [activeContext, setActiveContext] = useState({ topic, subject, unit });
  useEffect(() => { setActiveContext({ topic, subject, unit }); }, [topic, subject, unit]);
  const handleSelectTopic = (topName, subjName, unitName) => { setActiveContext({ topic: topName, subject: subjName, unit: unitName }); };
  const [expandedNodes, setExpandedNodes] = useState({});
  const toggleNode = (id) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  const currentTopic = activeContext.topic || '';
  const activeSyllabus = user?.syllabi?.find(s => s._id === user.activeSyllabusId) || user?.syllabi?.[0] || user?.syllabus;
  const subjects = activeSyllabus?.subjects || [];

  // Voice input handlers
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(lang === 'hi' ? 'इस ब्राउज़र में वॉयस इनपुट उपलब्ध नहीं है। Chrome आज़माएं।' : 'Voice input is not supported in this browser. Try Chrome.');
      setTimeout(() => setVoiceError(''), 3000);
      return;
    }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); setInputText(''); setVoiceStatus(''); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceStatus(lang === 'hi' ? '🎙 सुन रहे हैं... अपना प्रश्न बोलें' : '🎙 Listening... speak your question');
    };
    recognition.onresult = (event) => {
      let interim = '', final = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInputText(final || interim);
    };
    recognition.onend = () => {
      setIsRecording(false);
      setVoiceStatus('');
      setVoiceHelper(lang === 'hi' ? '✎ जरूरत हो तो सुधारें, फिर भेजें' : '✎ Edit if needed, then press Send');
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setVoiceStatus('');
      setVoiceError(lang === 'hi' ? 'ऑडियो समझ नहीं आया। कृपया पुनः प्रयास करें।' : 'Could not understand audio. Please try again.');
      setTimeout(() => setVoiceError(''), 3000);
    };
    recognition.start();
  };

  // Load a conversation from history
  const loadConversation = async (convId) => {
    try {
      const { data } = await axios.get(`/api/explanation/history/${convId}`);
      setMessages(data.messages || []);
      setActiveConvId(convId);
      if (data.topic) setActiveContext(prev => ({ ...prev, topic: data.topic, subject: data.subject || '' }));
    } catch {}
  };

  const deleteConversation = async (convId) => {
    try {
      await axios.delete(`/api/explanation/history/${convId}`);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
      setDeleteConfirm(null);
    } catch {}
  };

  const deleteMessage = async (msgIdx) => {
    if (!activeConvId) return;
    try {
      await axios.delete(`/api/explanation/history/${activeConvId}/message/${msgIdx}`);
      setMessages(prev => prev.filter((_, i) => i !== msgIdx));
    } catch {}
  };

  const newChat = () => { setActiveConvId(null); setMessages([]); setInputText(''); };

  const filteredConversations = conversations.filter(c =>
    !historySearch || c.topic?.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="explanation-layout">
      <style>{styleSheet}</style>

      {/* LEFT PANEL — History */}
      <div className="card history-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', margin: 0 }}>{lang === 'hi' ? 'पिछली बातचीत' : 'Past Conversations'}</h3>
          <button onClick={newChat} className="btn-primary" style={{ padding: '4px 12px', fontSize: 'var(--text-xs)' }}>＋ {lang === 'hi' ? 'नई चैट' : 'New Chat'}</button>
        </div>
        <input type="text" placeholder={lang === 'hi' ? 'विषय खोजें...' : 'Search topics...'} value={historySearch} onChange={e => setHistorySearch(e.target.value)} style={{ marginBottom: '12px', padding: '8px 12px', fontSize: 'var(--text-sm)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {filteredConversations.map(c => (
            <div key={c._id} onClick={() => loadConversation(c._id)}
              style={{ padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', background: activeConvId === c._id ? 'var(--accent-light)' : 'transparent', borderLeft: activeConvId === c._id ? '3px solid var(--accent)' : '3px solid transparent', transition: 'all 250ms ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.topic}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.preview}</div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{new Date(c.updated_at).toLocaleDateString()}</div>
              </div>
              {deleteConfirm === c._id ? (
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => deleteConversation(c._id)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>Yes</button>
                  <button onClick={() => setDeleteConfirm(null)} style={{ background: 'var(--border)', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer' }}>No</button>
                </div>
              ) : (
                <span onClick={e => { e.stopPropagation(); setDeleteConfirm(c._id); }} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', flexShrink: 0, marginLeft: '8px' }} title="Delete">🗑</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MIDDLE PANEL — Context */}
      <div className="card context-panel">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setActiveTab('context')} style={{ flex: 1, padding: '8px', background: 'none', border: 'none', borderBottom: activeTab === 'context' ? '2px solid var(--accent)' : 'none', color: activeTab === 'context' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'context' ? '600' : '400', cursor: 'pointer', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>{t('context', lang)}</button>
          <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '8px', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : 'none', color: activeTab === 'history' ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: activeTab === 'history' ? '600' : '400', cursor: 'pointer', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>{t('history', lang)}</button>
        </div>
        {activeTab === 'context' ? (
          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{t('syllabus_context', lang)}</h3>
            {subjects.length > 0 ? (
              <div>{subjects.map((subj, i) => {
                const subjId = `subj-${i}`;
                const isSubjOpen = expandedNodes[subjId];
                return (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div onClick={() => toggleNode(subjId)} style={{ fontWeight: '600', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{subj.name}</span>
                      <span style={{ fontSize: '12px', transition: 'transform 0.3s', transform: isSubjOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                    {isSubjOpen && subj.units.map((u, j) => {
                      const unitId = `unit-${i}-${j}`;
                      const isUnitOpen = expandedNodes[unitId];
                      return (
                        <div key={j} style={{ paddingLeft: '16px', marginBottom: '8px' }}>
                          <div onClick={() => toggleNode(unitId)} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{u.name}</span>
                            <span style={{ fontSize: '10px', transition: 'transform 0.3s', transform: isUnitOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                          </div>
                          {isUnitOpen && (<ul style={{ paddingLeft: '16px', margin: 0, listStyle: 'none' }}>{u.topics.map((tp, k) => (
                            <li key={k} style={{ marginBottom: '4px' }}>
                              <button style={{ background: 'none', border: 'none', padding: 0, color: currentTopic === tp.name ? 'var(--accent)' : 'var(--text-muted)', fontSize: 'var(--text-sm)', cursor: 'pointer', textAlign: 'left', fontWeight: currentTopic === tp.name ? '600' : '400' }} onClick={() => handleSelectTopic(tp.name, subj.name, u.name)}>{tp.name}</button>
                            </li>
                          ))}</ul>)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}</div>
            ) : (<div style={{ color: 'var(--text-muted)' }}>{t('upload_syllabus_strict', lang)}</div>)}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>{t('recent_queries', lang)}</h3>
            {user?.explanation_history?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user.explanation_history.map((h, i) => (
                  <div key={i} className="card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setInputText(h.question)}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>{h.question}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{h.topic} • {new Date(h.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (<div style={{ color: 'var(--text-muted)' }}>{t('no_recent_queries', lang)}</div>)}
          </div>
        )}
      </div>

      {/* RIGHT PANEL — Chat */}
      <div className="card chat-panel">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{currentTopic || t('ask_anything', lang)}</h2>
            {activeContext.subject && (<div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>{activeContext.subject} › {activeContext.unit}</div>)}
          </div>
          <span className="tag" style={{ background: 'var(--accent)', color: 'white', border: 'none' }}>{t('ai_tutor', lang)}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{msg.role === 'user' ? user?.name : t('gyaansetu_ai', lang)}</div>
              <div style={{ position: 'relative', background: msg.role === 'user' ? 'var(--accent-light)' : 'var(--surface)', border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none', padding: '12px 16px', borderRadius: '6px', maxWidth: '80%', whiteSpace: 'pre-wrap' }}>
                {msg.content}
                {msg.role === 'assistant' && msg.content && (
                  <button onClick={() => handleReadAloud(msg.content)} style={{ position: 'absolute', top: '8px', right: '-40px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)' }} title="Read Aloud">🔊</button>
                )}
                {/* Per-message delete */}
                <button onClick={() => deleteMessage(idx)} style={{ position: 'absolute', top: '4px', right: msg.role === 'assistant' ? '-60px' : '4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', opacity: 0.5 }} title="Delete message"
                  onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>×</button>
              </div>
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('gyaansetu_ai', lang)}</div>
              <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Voice status bar */}
        {voiceStatus && (
          <div style={{ padding: '8px 14px', margin: '0 24px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', transition: 'opacity 250ms' }}>{voiceStatus}</div>
        )}

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          {voiceError && <div style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>{voiceError}</div>}
          <form style={{ display: 'flex', gap: '12px' }} onSubmit={handleSend}>
            <input type="text" placeholder={t('ask_question_placeholder', lang)} value={inputText} onChange={e => setInputText(e.target.value)} disabled={isStreaming} style={{ flex: 1, color: isRecording ? 'var(--text-muted)' : 'var(--text-primary)' }} />
            {/* Mic button */}
            <button type="button" onClick={startRecording} title={lang === 'hi' ? 'अपनी आवाज़ से पूछें' : 'Ask with your voice'}
              style={{ background: isRecording ? 'var(--accent-light)' : 'transparent', border: `1px solid ${isRecording ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '12px', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 250ms ease' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isRecording ? 'var(--danger)' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              {isRecording && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 1.2s ease-in-out infinite' }} />}
            </button>
            <button type="submit" className="btn-primary" disabled={isStreaming || !inputText.trim()}>{t('send', lang)}</button>
          </form>
          {voiceHelper && <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '6px' }}>{voiceHelper}</div>}
        </div>
      </div>
    </div>
  );
};

export default Explanation;
