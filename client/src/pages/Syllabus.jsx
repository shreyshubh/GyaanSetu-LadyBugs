import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { cacheQuiz, cacheExplanation, removeFromCache, getAllCachedTopics } from '../utils/indexedDB';

const Syllabus = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const lang = user?.language || 'en';
  const fileInputRef = useRef(null);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedTopics, setParsedTopics] = useState(null);
  const [rawText, setRawText] = useState('');
  const [syllabusName, setSyllabusName] = useState('');
  const [syllabi, setSyllabi] = useState([]);
  const [activeSyllabusId, setActiveSyllabusId] = useState('');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [cachedTopics, setCachedTopics] = useState([]);
  const [cachingStatus, setCachingStatus] = useState({}); // { topicName: 'loading' | 'done' | 'error' }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null | 'all' | subjectName
  const [deleting, setDeleting] = useState(false);

  const toggleNode = (id) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));

  // Fetch syllabus on mount
  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const { data: res } = await axios.get('/api/syllabus');
        if (res.subjects) {
          setData(res.subjects);
          setSyllabi(res.syllabi || []);
          setActiveSyllabusId(res.activeSyllabusId || '');
        }
        // Load cached topics
        const cached = await getAllCachedTopics();
        setCachedTopics(cached);
      } catch (err) {
        console.error('Fetch syllabus error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();
  }, []);

  // Handle file upload
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: res } = await axios.post('/api/syllabus/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setParsedTopics(res.topics);
      setRawText(res.rawText);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Save parsed topics as structured syllabus
  const handleSave = async () => {
    if (!parsedTopics || parsedTopics.length === 0) return;
    setSaving(true);
    try {
      // Ensure all topics have default tracking fields
      const subjects = parsedTopics.map(subj => ({
        ...subj,
        units: subj.units?.map(unit => ({
          ...unit,
          topics: unit.topics?.map(topic => ({
            name: topic.name || topic,
            confidence: 'neutral',
            studied: false
          })) || []
        })) || []
      }));
      
      const { data: res } = await axios.post('/api/syllabus/save', { subjects, name: syllabusName });
      setData(res.subjects);
      setSyllabi(res.syllabi);
      setActiveSyllabusId(res.activeSyllabusId);
      setParsedTopics(null);
      setSyllabusName('');
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Handle study toggle (Optimistic Update)
  const handleTick = useCallback(async (subject, unit, topic, studied) => {
    // 1. Optimistic UI update
    setData(prevData => prevData.map(s => s.name === subject ? {
      ...s, units: s.units.map(u => u.name === unit ? {
        ...u, topics: u.topics.map(t => t.name === topic ? { ...t, studied } : t)
      } : u)
    } : s));

    // 2. Background API call
    try {
      await axios.put('/api/tracker/tick', { subject, unit, topic, studied });
      // Refresh user silently for gamification stats
      refreshUser();
    } catch (err) {
      console.error('Tick error:', err);
      // Revert is complex without saving full history, so we'll just alert
      alert(t('sync_failed', lang));
    }
  }, [refreshUser, lang]);

  // Switch active syllabus
  const handleSwitchSyllabus = useCallback(async (id) => {
    try {
      setLoading(true);
      const { data: res } = await axios.put('/api/syllabus/active', { syllabusId: id });
      setData(res.subjects);
      setActiveSyllabusId(res.activeSyllabusId);
      refreshUser();
    } catch (err) {
      console.error('Switch error:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  // Handle confidence change (Optimistic Update)
  const handleConfidence = useCallback(async (subject, unit, topic, confidence) => {
    // 1. Optimistic UI update
    setData(prevData => prevData.map(s => s.name === subject ? {
      ...s, units: s.units.map(u => u.name === unit ? {
        ...u, topics: u.topics.map(t => t.name === topic ? { ...t, confidence } : t)
      } : u)
    } : s));

    // 2. Background API call
    try {
      await axios.put('/api/tracker/confidence', { subject, unit, topic, confidence });
    } catch (err) {
      console.error('Confidence error:', err);
      alert(t('sync_failed', lang));
    }
  }, [lang]);

  const handleOfflineToggle = useCallback(async (topic, subjectName, unitName) => {
    if (cachedTopics.includes(topic)) {
      await removeFromCache(topic);
      setCachedTopics(prev => prev.filter(t => t !== topic));
      return;
    }

    if (cachedTopics.length >= 5) {
      alert(t('offline_sync_limit', lang));
      return;
    }

    setCachingStatus(prev => ({ ...prev, [topic]: 'loading' }));
    try {
      // 1. Mark as studied first so backend allows quiz generation
      await axios.put('/api/tracker/tick', { subject: subjectName, unit: unitName, topic, studied: true });
      
      // 2. Pre-fetch quiz (10 questions)
      const { data: quizRes } = await axios.post('/api/quiz/generate', { 
        topic, 
        count: 10,
        subject: subjectName
      });
      // Optimization: Strip metadata before caching to IndexedDB
      const strippedQuestions = quizRes.questions.map(q => ({
        type: q.type, question: q.question, options: q.options, 
        correctIndex: q.correctIndex, correctAnswer: q.correctAnswer, topic: q.topic
      }));
      await cacheQuiz(topic, strippedQuestions);

      // 3. Pre-fetch explanation (Skip streaming endpoint for now, use placeholder)
      await cacheExplanation(topic, "Offline summary generated. Connect to internet for deep-dive chat.");

      setCachedTopics(prev => [...prev, topic]);
      setCachingStatus(prev => ({ ...prev, [topic]: 'done' }));
    } catch (err) {
      console.error('Caching error:', err);
      setCachingStatus(prev => ({ ...prev, [topic]: 'error' }));
      alert(t('failed_to_cache', lang));
    }
  }, [cachedTopics, lang]);

  if (loading) {
    return <div style={{ padding: 'clamp(2rem, 8vw, 4rem)', textAlign: 'center', color: 'var(--text-muted)' }}>{t('loading', lang)}</div>;
  }

  // Show parsed syllabus for review before saving
  if (parsedTopics) {
    return (
      <div>
        <h1 style={{ marginBottom: '16px' }}>{t('syllabus', lang)}</h1>
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>{t('confirm_syllabus', lang)}</h2>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{t('syllabus_name', lang)}</label>
          <input 
            type="text" 
            className="input" 
            placeholder={t('syllabus_name_placeholder', lang)}
            value={syllabusName}
            onChange={e => setSyllabusName(e.target.value)}
            style={{ width: '100%', maxWidth: '400px' }}
          />
        </div>
        <div style={{ maxHeight: '500px', overflowY: 'auto', background: 'var(--bg)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          {parsedTopics.map((subj, sIdx) => {
            const subjId = `preview-subj-${sIdx}`;
            const isOpen = expandedNodes[subjId];
            return (
              <div key={sIdx} style={{ marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div 
                  onClick={() => toggleNode(subjId)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 700 }}
                >
                  <span>{subj.name}</span>
                  <span style={{ fontSize: '12px', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </div>
                {isOpen && (
                  <div style={{ paddingLeft: '16px', marginTop: '8px' }}>
                    {subj.units?.map((unit, uIdx) => {
                      const unitId = `preview-unit-${sIdx}-${uIdx}`;
                      const isUnitOpen = expandedNodes[unitId];
                      return (
                        <div key={uIdx} style={{ marginTop: '8px' }}>
                          <div 
                            onClick={() => toggleNode(unitId)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
                          >
                            <span>{unit.name}</span>
                            <span style={{ fontSize: '10px', transform: isUnitOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                          </div>
                          {isUnitOpen && (
                            <ul style={{ paddingLeft: '20px', margin: '4px 0', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                              {unit.topics?.map((topic, tIdx) => (
                                <li key={tIdx}>{topic.name || topic}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t('saving', lang) : t('save_start_learning', lang)}
          </button>
          <button className="btn-secondary" onClick={() => setParsedTopics(null)}>{t('cancel', lang)}</button>
        </div>
      </div>
      </div>
    );
  }

  // Show upload zone if no syllabus
  if (!data || data.length === 0) {
    return (
      <div>
        <h1 style={{ marginBottom: 'var(--section-gap)' }}>{t('syllabus', lang)}</h1>
        <input type="file" ref={fileInputRef} accept=".pdf,.docx" style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files[0])} />
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]); }}
          style={{ 
            border: '2px dashed var(--border)', borderRadius: '6px', 
            padding: 'clamp(2rem, 8vw, 4rem) clamp(1rem, 4vw, 2rem)', textAlign: 'center', cursor: 'pointer',
            background: 'var(--surface)', opacity: uploading ? 0.5 : 1
          }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>
            {uploading ? t('parsing', lang) : t('upload_syllabus', lang)}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>{t('click_drag_pdf', lang)}</p>
        </div>
      </div>
    );
  }

  // Show syllabus tree

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--section-gap)', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 16px)' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0 }}>{t('syllabus', lang)}</h1>
          {syllabi.length > 0 && (
            <select 
              className="input" 
              style={{ marginTop: '8px', padding: '4px 8px', fontSize: 'var(--text-sm)', width: 'auto' }}
              value={activeSyllabusId}
              onChange={(e) => handleSwitchSyllabus(e.target.value)}
            >
              {syllabi.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => { setData(null); }}>{t('upload_new_syllabus', lang)}</button>
          <button className="btn-secondary" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setDeleteConfirm('all')} disabled={deleting}>
            {lang === 'hi' ? '🗑 सब हटाएं' : '🗑 Delete All'}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="card" style={{ marginBottom: '16px', padding: '16px', background: '#FFF5F5', border: '1px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--danger)', fontWeight: 600 }}>
            {deleteConfirm === 'all'
              ? (lang === 'hi' ? '⚠ क्या आप पूरा पाठ्यक्रम हटाना चाहते हैं?' : '⚠ Delete the entire syllabus and all embeddings?')
              : (lang === 'hi' ? `⚠ "${deleteConfirm}" हटाएं?` : `⚠ Delete "${deleteConfirm}"?`)
            }
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ background: 'var(--danger)', padding: '6px 14px', fontSize: 'var(--text-sm)' }}
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  if (deleteConfirm === 'all') {
                    await axios.delete('/api/syllabus');
                    setData([]);
                  } else {
                    const { data: res } = await axios.delete(`/api/syllabus/subject/${encodeURIComponent(deleteConfirm)}`);
                    setData(res.subjects || []);
                  }
                  await refreshUser();
                } catch (err) { console.error('Delete error:', err); }
                finally { setDeleting(false); setDeleteConfirm(null); }
              }}>
              {deleting ? '...' : (lang === 'hi' ? 'हाँ, हटाएं' : 'Yes, Delete')}
            </button>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 'var(--text-sm)' }} onClick={() => setDeleteConfirm(null)}>
              {t('cancel', lang)}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--accent-light)', border: '1px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>💾</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t('offline_mode_ready', lang)}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{t('offline_mode_desc', lang)}</div>
          </div>
        </div>
        <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{cachedTopics.length} / 5 Topics</div>
      </div>
      
      {data.map((subject, sIdx) => {
        const subjId = `subj-${sIdx}`;
        const isSubjOpen = expandedNodes[subjId];
        return (
          <div key={sIdx} className="card" style={{ marginBottom: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <div onClick={() => toggleNode(subjId)} style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{subject.name}</h2>
                <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isSubjOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(subject.name); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-muted)', marginLeft: '12px', padding: '4px' }}
                title={lang === 'hi' ? 'इस विषय को हटाएं' : 'Delete this subject'}>🗑</button>
            </div>
            
            {isSubjOpen && (
              <div style={{ paddingLeft: '16px', marginTop: '24px', borderLeft: '2px solid var(--border)' }}>
                {subject.units.map((unit, uIdx) => {
                  const unitId = `unit-${sIdx}-${uIdx}`;
                  const isUnitOpen = expandedNodes[unitId];
                  return (
                    <div key={uIdx} style={{ marginBottom: '16px' }}>
                      <div 
                        onClick={() => toggleNode(unitId)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0' }}
                      >
                        <h3 style={{ fontSize: 'var(--text-md)', margin: 0 }}>{unit.name}</h3>
                        <span style={{ fontSize: '16px', color: 'var(--text-secondary)', transition: 'transform 0.3s', transform: isUnitOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                      </div>
                      
                      {isUnitOpen && (
                        <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                          {unit.topics.map((topic, tIdx) => (
                            <TopicRow 
                              key={tIdx} 
                              topic={topic} 
                              subjectName={subject.name} 
                              unitName={unit.name}
                              lang={lang}
                              handleTick={handleTick}
                              handleConfidence={handleConfidence}
                              handleOfflineToggle={handleOfflineToggle}
                              isCached={cachedTopics.includes(topic.name)}
                              cachingStatus={cachingStatus[topic.name]}
                              navigate={navigate}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Optimization: Memoize TopicRow to prevent massive re-renders of the syllabus tree
const TopicRow = memo(({ topic, subjectName, unitName, lang, handleTick, handleConfidence, handleOfflineToggle, isCached, cachingStatus, navigate }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(6px, 1.5vw, 8px)', background: 'var(--bg)', borderRadius: '8px', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', minWidth: 0 }}>
        <input type="checkbox" checked={topic.studied || false}
          onChange={e => handleTick(subjectName, unitName, topic.name, e.target.checked)}
          style={{ width: '20px', height: '20px', margin: 0, cursor: 'pointer', flexShrink: 0 }} />
        <span style={{ fontWeight: 500, fontSize: 'clamp(0.8rem, 2vw, 0.95rem)', overflowWrap: 'anywhere', minWidth: 0 }}>{topic.name}</span>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', alignItems: 'center', flexWrap: 'wrap' }}>
        {['confident', 'neutral', 'weak'].map(c => (
          <span key={c} className={`tag tag-${c}`}
            style={{ opacity: topic.confidence === c ? 1 : 0.3, cursor: 'pointer', minHeight: '32px', display: 'inline-flex', alignItems: 'center' }}
            onClick={() => handleConfidence(subjectName, unitName, topic.name, c)}>
            {t(c, lang)}
          </span>
        ))}
        
        <div 
          onClick={() => handleOfflineToggle(topic.name, subjectName, unitName)}
          style={{ 
            cursor: 'pointer', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)',
            background: isCached ? 'var(--accent)' : 'transparent',
            color: isCached ? 'white' : 'var(--text-muted)',
            border: `1px solid ${isCached ? 'var(--accent)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
            minHeight: '32px'
          }}
        >
          {cachingStatus === 'loading' ? '⌛' : '💾'} 
          {isCached ? t('saved', lang) : t('save_offline', lang)}
        </div>

        <button onClick={() => navigate(`/notes?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(subjectName)}&unit=${encodeURIComponent(unitName)}`)}
          className="btn-secondary" style={{ padding: '4px 8px', fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', minHeight: '32px' }}>
          {t('generate_notes', lang)}
        </button>
      </div>
    </div>
  );
});

export default Syllabus;
