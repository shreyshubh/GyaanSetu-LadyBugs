import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const Dashboard = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';

  return (
    <div>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: '32px' }}>
        {t('welcome', lang)}, {user?.name.split(' ')[0]}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div className="card" style={{ background: '#FFF0EE' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: 'var(--accent)' }}>
            🔥 {user?.gamification?.current_streak}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {t('streak', lang)}
          </div>
        </div>
        
        <div className="card" style={{ background: '#EAF9F4' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: 'var(--success)' }}>
            {user?.gamification?.total_topics_studied}
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            {t('topics_studied', lang)}
          </div>
        </div>

        <div className="card" style={{ background: '#FFF7EB' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', color: 'var(--warning)' }}>
            {user?.gamification?.total_quizzes_taken}
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
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 24px' }}>Data Structures</td>
              <td style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)' }}>85%</td>
              <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Today</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '16px 24px' }}>Algorithms</td>
              <td style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>60%</td>
              <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Yesterday</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 24px' }}>Operating Systems</td>
              <td style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)' }}>92%</td>
              <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>Apr 22</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
