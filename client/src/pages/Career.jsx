import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const Career = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';

  const mockRoles = [
    { title: 'Software Engineer', readiness: 85, status: 'ready', gaps: ['System Design'] },
    { title: 'Backend Developer', readiness: 65, status: 'partial', gaps: ['Node.js', 'Databases'] }
  ];

  const mockResources = [
    {
      topic: 'System Design',
      videos: [
        { title: 'System Design Interview Prep', url: '#', channel: 'freeCodeCamp' },
        { title: 'What is System Design?', url: '#', channel: 'Tech Dummies' }
      ]
    }
  ];

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>{t('career_guidance', lang)}</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '48px' }}>
        {mockRoles.map((role, idx) => (
          <div key={idx} className="card">
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>{role.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)' }}>Readiness</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)' }}>{role.readiness}%</span>
            </div>
            
            {/* Flat Progress Bar */}
            <div style={{ width: '100%', height: '4px', background: 'var(--border)', marginBottom: '24px' }}>
              <div style={{ 
                height: '100%', 
                width: `${role.readiness}%`, 
                background: role.status === 'ready' ? 'var(--success)' : 'var(--warning)' 
              }} />
            </div>

            {role.gaps.length > 0 && (
              <div>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginRight: '8px' }}>Skill Gaps:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {role.gaps.map((gap, gIdx) => (
                    <span key={gIdx} className="tag tag-weak">{gap}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>Recommended Resources</h2>
      {mockResources.map((res, idx) => (
        <div key={idx} style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="tag tag-weak">{res.topic}</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {res.videos.map((vid, vIdx) => (
              <a key={vIdx} href={vid.url} className="card" style={{ display: 'block', color: 'inherit' }}>
                <div style={{ width: '100%', height: '160px', background: 'var(--border)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '32px' }}>▶️</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: '4px' }}>{vid.title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{vid.channel}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Career;
