import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import axios from 'axios';

const Career = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState('');

  const fetchGuidance = async (force = false) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/career/guidance${force ? '?refresh=true' : ''}`);
      setRoles(data.roles || []);
      setResources(data.resources || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load career guidance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuidance();
  }, []);

  if (loading) return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing your profile...</div>;
  if (error) return <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{t('career_guidance', lang)}</h1>
        <button className="btn-secondary" onClick={() => fetchGuidance(true)}>Recalculate Career Map</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '48px' }}>
        {roles.map((role, idx) => (
          <div key={idx} className="card">
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>{role.title}</h2>
            {role.description && <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>{role.description}</p>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>Readiness</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)' }}>{role.readiness}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--border)', marginBottom: '24px' }}>
              <div style={{ height: '100%', width: `${role.readiness}%`, background: role.status === 'ready' ? 'var(--success)' : 'var(--warning)' }} />
            </div>
            {role.gaps?.length > 0 && (
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Skill Gaps:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {role.gaps.map((gap, i) => <span key={i} className="tag tag-weak">{gap}</span>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {resources.length > 0 && (
        <>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>Recommended Resources</h2>
          {resources.map((res, idx) => (
            <div key={idx} style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', marginBottom: '16px' }}><span className="tag tag-weak">{res.topic}</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {res.videos?.map((vid, i) => (
                  <a key={i} href={vid.url} target="_blank" rel="noreferrer" className="card" style={{ display: 'block', color: 'inherit' }}>
                    {vid.thumbnail ? (
                      <img src={vid.thumbnail} alt={vid.title} style={{ width: '100%', height: '160px', objectFit: 'cover', marginBottom: '16px', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '160px', background: 'var(--border)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '32px' }}>▶️</span></div>
                    )}
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{vid.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{vid.channel}</div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default Career;
