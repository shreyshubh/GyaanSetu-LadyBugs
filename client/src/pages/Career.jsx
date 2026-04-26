import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCareerSocket } from '../hooks/useCareerSocket';
import { t } from '../utils/i18n';
import axios from 'axios';

const Career = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [resources, setResources] = useState([]);
  const [strongTopics, setStrongTopics] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [higherEd, setHigherEd] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [activeSection, setActiveSection] = useState('roles');

  const token = localStorage.getItem('token');

  // WebSocket for real-time career updates
  useCareerSocket(token, (payload) => {
    if (payload.roles) setRoles(payload.roles);
    if (payload.higher_education) setHigherEd(payload.higher_education);
    if (payload.scholarships) setScholarships(payload.scholarships);
  });

  const fetchGuidance = async (refresh = false) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/career/guidance${refresh ? '?refresh=true' : ''}`);
      setRoles(data.roles || []);
      setResources(data.resources || []);
      setStrongTopics(data.strongTopics || []);
      setWeakTopics(data.weakTopics || []);
      setHigherEd(data.higher_education || []);
      setScholarships(data.scholarships || []);
    } catch (err) {
      console.error('Career fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuidance(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}>🔍</div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('analyzing_profile', lang)}</p>
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'roles', label: lang === 'hi' ? '💼 करियर' : '💼 Roles' },
    { key: 'education', label: lang === 'hi' ? '🎓 उच्च शिक्षा' : '🎓 Higher Ed' },
    { key: 'scholarships', label: lang === 'hi' ? '🏅 छात्रवृत्ति' : '🏅 Scholarships' },
    { key: 'resources', label: lang === 'hi' ? '📚 संसाधन' : '📚 Resources' },
  ];

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--section-gap)', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 16px)' }}>
        <h1 style={{ margin: 0 }}>{t('career_guidance', lang)}</h1>
        <button className="btn-primary" onClick={() => fetchGuidance(true)} disabled={loading}>
          {t('recalculate_career_map', lang)}
        </button>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)',
              background: activeSection === s.key ? 'var(--accent)' : 'var(--surface)',
              color: activeSection === s.key ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeSection === s.key ? '0 4px 12px rgba(255,107,87,0.2)' : 'none',
              transition: 'all 250ms ease' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* === ROLES SECTION === */}
      {activeSection === 'roles' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {roles.map((role, idx) => (
            <div key={idx} className="card" style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 16px)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', margin: '0 0 4px 0' }}>{role.title}</h3>
                  <span className="tag" style={{ background: role.status === 'ready' ? 'var(--success)' : 'var(--warning)', color: '#fff', border: 'none', fontSize: 'var(--text-xs)' }}>
                    {role.status === 'ready' ? '✓ Ready' : '◔ Partial'}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--accent)' }}>{role.readiness}%</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{t('readiness', lang)}</div>
                </div>
              </div>

              {/* Readiness bar */}
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', marginBottom: '16px' }}>
                <div style={{ height: '100%', borderRadius: '3px', width: `${role.readiness}%`, background: role.readiness >= 70 ? 'var(--success)' : role.readiness >= 40 ? 'var(--warning)' : 'var(--danger)', transition: 'width 500ms ease' }} />
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.6 }}>{role.description}</p>

              {/* Salary data */}
              {role.avg_lpa && (
                <div style={{ background: 'var(--bg)', borderRadius: '12px', padding: 'clamp(8px, 2vw, 12px) clamp(12px, 2vw, 16px)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 16px)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {lang === 'hi' ? '💰 वेतन (भारत)' : '💰 Salary (India)'}
                    </span>
                    <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{role.min_lpa}L – ₹{role.max_lpa}L / {lang === 'hi' ? 'वर्ष' : 'year'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--success)' }}>₹{role.avg_lpa}L</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{lang === 'hi' ? 'औसत' : 'avg'}</div>
                  </div>
                </div>
              )}

              {/* Skill gaps */}
              <div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>{t('skill_gaps', lang)}</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(role.gaps || []).map((gap, gi) => (
                    <span key={gi} className="tag tag-weak">{gap}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === HIGHER EDUCATION SECTION === */}
      {activeSection === 'education' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{lang === 'hi' ? '🎓 उच्च शिक्षा मार्ग' : '🎓 Higher Education Pathways'}</h2>
          {higherEd.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {lang === 'hi' ? 'करियर मैप की पुनर्गणना करें' : 'Recalculate career map to see education pathways'}
            </div>
          ) : higherEd.map((path, idx) => (
            <div key={idx} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-md)', margin: '0 0 4px' }}>{path.degree}</h3>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{path.institution_type}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent)' }}>{path.readiness_score || '—'}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{lang === 'hi' ? 'तैयारी' : 'readiness'}</div>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '8px' }}>{path.relevance}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span className="tag" style={{ background: 'var(--bg)' }}>📝 {path.entrance_exam}</span>
                <span className="tag" style={{ background: 'var(--bg)' }}>💰 {path.avg_fees_inr}</span>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600 }}>↗ {path.career_boost}</p>
              {path.resources && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {path.resources.map((r, ri) => (
                    <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>{r.label}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* === SCHOLARSHIPS SECTION === */}
      {activeSection === 'scholarships' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{lang === 'hi' ? '🏅 छात्रवृत्ति अनुशंसाएं' : '🏅 Scholarship Recommendations'}</h2>
          {scholarships.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {lang === 'hi' ? 'करियर मैप की पुनर्गणना करें' : 'Recalculate career map to see scholarships'}
            </div>
          ) : scholarships.map((s, idx) => (
            <div key={idx} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-md)', margin: '0 0 4px' }}>{s.name}</h3>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{s.provider}</span>
                </div>
                <span className="tag" style={{ background: s.category === 'government' ? 'var(--accent-light)' : s.category === 'international' ? '#E8F5E9' : '#FFF3E0', color: s.category === 'government' ? 'var(--accent)' : s.category === 'international' ? 'var(--success)' : 'var(--warning)', border: 'none', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                  {s.category === 'government' ? '🏛 Govt' : s.category === 'international' ? '🌍 Intl' : '🏢 Private'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <div style={{ fontSize: 'var(--text-sm)' }}><strong>💰 {s.amount}</strong></div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>📅 {s.deadline}</div>
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>{s.eligibility}</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, marginBottom: '8px' }}>{s.relevance_note}</p>
              {s.apply_url && <a href={s.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }}>{lang === 'hi' ? 'आवेदन करें →' : 'Apply →'}</a>}
            </div>
          ))}
        </div>
      )}

      {/* === RESOURCES SECTION === */}
      {activeSection === 'resources' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>{t('recommended_resources', lang)}</h2>
          {resources.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {lang === 'hi' ? 'कोई संसाधन नहीं मिले' : 'No resources found yet'}
            </div>
          ) : resources.map((r, idx) => (
            <div key={idx} className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', marginBottom: '12px' }}>{r.topic}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(r.videos || []).map((vid, vi) => (
                  <a key={vi} href={vid.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', alignItems: 'center', padding: '8px', borderRadius: '12px', background: 'var(--bg)', textDecoration: 'none', color: 'var(--text-primary)', transition: 'all 250ms ease', flexWrap: 'wrap' }}>
                    {vid.thumbnail && <img src={vid.thumbnail} alt="" style={{ width: 'clamp(60px, 15vw, 80px)', height: 'auto', aspectRatio: '16/9', borderRadius: '6px', objectFit: 'cover' }} />}
                    <div>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{vid.title}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{vid.channelTitle}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Career;
