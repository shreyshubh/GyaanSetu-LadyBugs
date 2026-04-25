import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import axios from 'axios';

const badgeImages = import.meta.glob('../assets/BADGES/*.webp', { eager: true, import: 'default' });

const badgeDescriptions = {
  "FIRST STEP": "You studied your very first topic. Every expert started exactly here.",
  "3 DAY STREAK": "Three days of consistent study. The habit is beginning to form.",
  "WEEK WARRIOR": "Seven days straight. You've proven you can show up, even on hard days.",
  "FORTNIGHT": "Two solid weeks. You're not just studying — you're building discipline.",
  "MONTH MASTER": "30 days in a row. You are now in the top 1% of consistent learners.",
  "SHARP SHOOTER": "You scored 90% or above on your very first attempt at a topic quiz.",
  "QUIZ MASTER": "You've completed 10 quizzes. Practice is becoming your superpower.",
  "BOOKWORM": "50 topics marked as studied. Your syllabus doesn't intimidate you anymore.",
  "SPEED DEMON": "10 questions answered in under 15 seconds each. Your mind is sharp.",
  "MULTILINGUAL": "You switched the app to Hindi. Learning in your own language is power.",
  "COMEBACK KID": "You retook a quiz and improved your score by 30% or more. Resilience.",
  "SYLLABUS SLAYER": "Every single topic in a subject is ticked. You owned that subject.",
  "SYNC STAR": "You synced offline progress 3 times. You studied even without the internet.",
  "CAREER READY": "You completed your career guidance. You now know your path forward."
};

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
        <button onClick={logout} className="btn-secondary">{t('log_out', lang)}</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>🔥 {g.current_streak || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('streak', lang)}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)' }}>{g.longest_streak || 0}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('longest_streak', lang)}</div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
        {badges.map(badge => {
          const badgePath = `../assets/BADGES/${badge.name.toUpperCase()}.webp`;
          const badgeImg = badgeImages[badgePath];
          const desc = badgeDescriptions[badge.name.toUpperCase()] || badge.description;
          
          return (
            <div 
              key={badge.id} 
              className="badge-card" 
              data-description={desc}
            >
              {!badge.earned && <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '12px', opacity: 0.4 }}>🔒</div>}
              <div style={{ marginBottom: '12px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: badge.earned ? 1 : 0.25, filter: badge.earned ? 'none' : 'grayscale(100%)' }}>
                {badgeImg ? (
                  <img src={badgeImg} alt={badge.name} style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
                ) : (
                  <span className="badge-icon">{badge.icon}</span>
                )}
              </div>
              <div className={`badge-name ${!badge.earned ? 'unearned' : ''}`}>{badge.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Profile;
