import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const Profile = () => {
  const { user, logout } = useAuth();
  const lang = user?.language || 'en';
  
  const initials = user?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const mockBadges = [
    { id: 'first_step', name: 'First Step', icon: '🌱', description: 'Study your first topic', earned: true },
    { id: 'week_warrior', name: 'Week Warrior', icon: '⚡', description: '7 day streak', earned: true },
    { id: 'month_master', name: 'Month Master', icon: '💎', description: '30 day streak', earned: false, hint: 'Build a 30 day streak' },
    { id: 'quiz_master', name: 'Quiz Master', icon: '🧠', description: 'Complete 10 quizzes', earned: false, hint: 'Take 5 more quizzes' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', 
            background: 'var(--accent-light)', color: 'var(--accent)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)'
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)' }}>{user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary">Log Out</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>🔥 {user?.gamification?.current_streak}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('streak', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{user?.gamification?.longest_streak}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Longest Streak</div>
        </div>
         <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{user?.gamification?.total_topics_studied}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('topics_studied', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{user?.gamification?.total_quizzes_taken}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('quizzes_taken', lang)}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>{t('badges', lang)}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
        {mockBadges.map(badge => (
          <div key={badge.id} className="card" style={{ 
            opacity: badge.earned ? 1 : 0.5,
            filter: badge.earned ? 'none' : 'grayscale(100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
          }} title={badge.earned ? badge.description : badge.hint}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{badge.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', marginBottom: '4px' }}>{badge.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {badge.earned ? 'Earned!' : badge.hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
