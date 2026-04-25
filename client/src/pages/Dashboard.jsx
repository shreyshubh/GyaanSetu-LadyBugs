import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const Dashboard = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const g = user?.gamification || {};
  const quizHistory = user?.quiz_history || [];

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
