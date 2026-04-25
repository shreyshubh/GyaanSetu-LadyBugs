import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const Dashboard = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const g = user?.gamification || {};
  const quizHistory = user?.quiz_history || [];

  const activeSyllabus = user?.syllabi?.find(s => s._id === user.activeSyllabusId) || user?.syllabi?.[0] || user?.syllabus;
  const allTopics = activeSyllabus?.subjects?.flatMap(s => s.units.flatMap(u => u.topics)) || [];
  
  const strongTopics = allTopics.filter(t => t.studied && t.score >= 90);
  const growthTopics = allTopics.filter(t => t.studied && t.score < 60);

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>
        {t('welcome', lang)}, {user?.name?.split(' ')[0]}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="card" style={{ background: '#FFF0EE' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: 'var(--accent)' }}>
            🔥 {g.current_streak || 0}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {t('streak', lang)}
          </div>
        </div>
        
        <div className="card" style={{ background: '#EAF9F4' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: 'var(--success)' }}>
            {g.total_topics_studied || 0}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {t('topics_studied', lang)}
          </div>
        </div>

        <div className="card" style={{ background: '#FFF7EB' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: 'var(--warning)' }}>
            {g.total_quizzes_taken || 0}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {t('quizzes_taken', lang)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px', color: 'var(--success)' }}>Your Strengths (90%+)</h2>
          <div className="card" style={{ minHeight: '100px' }}>
            {strongTopics.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Keep studying and testing to build your strengths!</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {strongTopics.map((t, i) => (
                  <span key={i} style={{ background: '#E6F4ED', color: 'var(--success)', padding: '4px 12px', borderRadius: '4px', fontSize: 'var(--text-sm)', border: '1px solid #C4E9D5' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px', color: 'var(--danger)' }}>{'Areas for Growth (<60%)'}</h2>
          <div className="card" style={{ minHeight: '100px' }}>
            {growthTopics.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No major gaps found! Keep up the good work.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {growthTopics.map((t, i) => (
                  <span key={i} style={{ background: '#FDECEA', color: 'var(--danger)', padding: '4px 12px', borderRadius: '4px', fontSize: 'var(--text-sm)', border: '1px solid #F9D0CB' }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>Recent Quizzes</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <th style={{ padding: '12px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>Subject</th>
              <th style={{ padding: '12px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>Score</th>
              <th style={{ padding: '12px 24px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {quizHistory.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent quizzes. Upload a syllabus to begin!
                </td>
              </tr>
            ) : (
              quizHistory.slice(-10).reverse().map((q, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 24px' }}>{q.subject}</td>
                  <td style={{ padding: '12px 24px', fontFamily: 'var(--font-mono)', color: q.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>{q.score}%</td>
                  <td style={{ padding: '12px 24px', color: 'var(--text-secondary)' }}>{new Date(q.date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
