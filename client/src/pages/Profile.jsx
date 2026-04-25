import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import axios from 'axios';

const Profile = () => {
  const { user, logout } = useAuth();
  const lang = user?.language || 'en';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const { data } = await axios.get('/api/badges');
        setBadges(data.badges || []);
        // Mark unseen badges as seen
        for (const b of (data.unseen || [])) {
          axios.put('/api/badges/seen', { badgeId: b }).catch(() => {});
        }
      } catch (err) { console.error('Badges error:', err); }
    };
    fetchBadges();
  }, []);

  const g = user?.gamification || {};

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>{initials}</div>
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)' }}>{user?.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-secondary">Log Out</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>🔥 {g.current_streak || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('streak', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{g.longest_streak || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Longest Streak</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{g.total_topics_studied || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('topics_studied', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{g.total_quizzes_taken || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('quizzes_taken', lang)}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '16px' }}>{t('badges', lang)}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
        {badges.map(badge => (
          <div key={badge.id} className="card" style={{ opacity: badge.earned ? 1 : 0.5, filter: badge.earned ? 'none' : 'grayscale(100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>{badge.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-md)', marginBottom: '4px' }}>{badge.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{badge.earned ? 'Earned!' : badge.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
