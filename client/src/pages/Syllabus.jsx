import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

  // Handle study toggle
  const handleTick = async (subject, unit, topic, studied) => {
    try {
      await axios.put('/api/tracker/tick', { subject, unit, topic, studied });
      // Refresh syllabus data
      const { data: res } = await axios.get('/api/syllabus');
      setData(res.subjects);
      refreshUser();
    } catch (err) {
      console.error('Tick error:', err);
    }
  };

  // Switch active syllabus
  const handleSwitchSyllabus = async (id) => {
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
  };

  // Handle confidence change
  const handleConfidence = async (subject, unit, topic, confidence) => {
    try {
      await axios.put('/api/tracker/confidence', { subject, unit, topic, confidence });
      const { data: res } = await axios.get('/api/syllabus');
      setData(res.subjects);
    } catch (err) {
      console.error('Confidence error:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  // Show parsed syllabus for review before saving
  if (parsedTopics) {
    return (
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '16px' }}>{t('syllabus', lang)}</h1>
      <div className="card" style={{ padding: '32px' }}>
        <h2 style={{ marginBottom: '24px' }}>Confirm Syllabus Structure</h2>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Syllabus Name</label>
          <input 
            type="text" 
            className="input" 
            placeholder="e.g., Semester 1 Physics"
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save & Start Learning'}
          </button>
          <button className="btn-secondary" onClick={() => setParsedTopics(null)}>Cancel</button>
        </div>
      </div>
      </div>
    );
  }

  // Show upload zone if no syllabus
  if (!data || data.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('syllabus', lang)}</h1>
        <input type="file" ref={fileInputRef} accept=".pdf,.docx" style={{ display: 'none' }}
          onChange={e => handleUpload(e.target.files[0])} />
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files[0]); }}
          style={{ 
            border: '2px dashed var(--border)', borderRadius: '6px', 
            padding: '64px 32px', textAlign: 'center', cursor: 'pointer',
            background: 'var(--surface)', opacity: uploading ? 0.5 : 1
          }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>📄</div>
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>
            {uploading ? 'Parsing...' : t('upload_syllabus', lang)}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>Click or drag a PDF/DOCX file here</p>
        </div>
      </div>
    );
  }

  // Show syllabus tree

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{t('syllabus', lang)}</h1>
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
        <button className="btn-secondary" onClick={() => { setData(null); }}>Upload New Syllabus</button>
      </div>
      
      {data.map((subject, sIdx) => {
        const subjId = `subj-${sIdx}`;
        const isSubjOpen = expandedNodes[subjId];
        return (
          <div key={sIdx} className="card" style={{ marginBottom: '16px', padding: '24px' }}>
            <div 
              onClick={() => toggleNode(subjId)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{subject.name}</h2>
              <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isSubjOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
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
                            <div key={tIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'var(--bg)', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="checkbox" checked={topic.studied || false}
                                  onChange={e => handleTick(subject.name, unit.name, topic.name, e.target.checked)}
                                  style={{ width: '18px', height: '18px', margin: 0, cursor: 'pointer' }} />
                                <span style={{ fontWeight: 500 }}>{topic.name}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {['confident', 'neutral', 'weak'].map(c => (
                                  <span key={c} className={`tag tag-${c}`}
                                    style={{ opacity: topic.confidence === c ? 1 : 0.3, cursor: 'pointer' }}
                                    onClick={() => handleConfidence(subject.name, unit.name, topic.name, c)}>
                                    {t(c, lang)}
                                  </span>
                                ))}
                                <button onClick={() => navigate(`/notes?topic=${encodeURIComponent(topic.name)}&subject=${encodeURIComponent(subject.name)}&unit=${encodeURIComponent(unit.name)}`)}
                                  className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', marginLeft: '8px' }}>
                                  {t('generate_notes', lang)}
                                </button>
                              </div>
                            </div>
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

export default Syllabus;
